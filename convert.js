'use strict';

const process = require('process');
const uuidv4 = require('uuid/v4');


const getOrCreate = `def goc(v){nv=g.getVertex(v.id);if(nv==null){nv=g.addVertex(v.id,ElementHelper.getProperties(v))};nv}`;
const graph = 'graph';
const g = 'g'; //traversal

function parseDisplay(d){
    if (typeof d === "string") return d;
    if (typeof d === "object" && d.display) return d.display['en-US'];
    return d['en-US'];
}

function parseActor(actor, query=[], level=0){
    if (actor.objectType == "Agent"){
        query.push(`actor${level}=${g}.V().has("agent", "mbox", '${actor.mbox}')`);
        query.push(`if (!actor${level}.hasNext()) actor${level}=${graph}.addVertex(label, "agent", "mbox", '${actor.mbox}', "name", '${actor.name}')`);
    }
    else if (actor.objectType == "Group"){
        // implement later
    }

    // link actor and statement
    query.push(`statement${level}.addEdge('has', actor${level});`)
}

function parseObject(object, query=[], level=0){
    if (object.objectType == "Activity"){
        query.push(`object${level}=${g}.V().has("activity", "id", '${object.id}')`);
        let name = parseDisplay(object.definition.name)
        query.push(`if (!object${level}.hasNext()) object${level}=${graph}.addVertex(label, "activity", "id", '${object.id}', "name", '${name}')`);
        query.push(`statement${level}.addEdge('has', object${level})`)
    }
    else if (object.objectType == "StatementRef"){
        query.push(`object${level}=${g}.V().has("statement", "id", '${object.id}')`)
        query.push(`if (object${level}.hasNext()) statement${level}.addEdge('has', object${level})`);
    }
    else if (object.objectType == "SubStatement"){
        parseStatement(object, query, level+1);
        query.push(`statement${level}.addEdge('has', statement${level+1})`);
        query.push(`object${level}=statement${level+1}`);
    }
}


function parseVerb(verb, query=[], level=0){
    verb = parseDisplay(verb);
    query.push(`actor${level}.addEdge('${verb}', object${level})`)
}

function parseResult(r, query=[], level=0){

}

function parseStatement(s, query=[], level=0){
    // create or fetch statement
    if (s.id){
        query.push(`statement${level}=${g}.V().has("statement", "id", ${s.id});`)
    }
    else{
        let uuid = uuidv4();
        let timestamp = s.timestamp && Date.parse(s.timestamp) || Date().now();
        query.push(`statement${level}=${graph}.addVertex(label, "statement", "id", '${uuid}', "timestamp", ${timestamp})`)
    }


    // actor
    parseActor(s.actor, query, level);
    parseObject(s.object, query, level)
    parseVerb(s.verb, query, level);

    // // result
    // if (s.result){
    //     let result = query.var(g.addVertex(assignProperty("result", s.result)));
    //     query(g.addEdge(object, result, "has", s.result));
    // }
    //
    // if (s.attachment){
    //     let attachment = query.var(g.addVertex(s.attachment));
    //     query(g.addEdge(object, attachment, "has", s.attachment));
    // }
    //
    // if (s.context){
    //     let context = query.var(g.addVertex(s.context));
    //     query(g.addEdge(object, context, "in", s.context));
    // }


    return {
        error: null,
        query: query
    };
}

if (require.main === module){
    let argv = require('minimist')(process.argv.slice(2));
    if (!argv.s) {
        console.error("You need to specify the statement file")
        process.exit();
    }

    let statement = require(argv.s);

    let statements = Array.isArray(statement) ? statement : [statement]
    let res = []
    statements.forEach((s) => {
        res.push(parseStatement(s));
    })
    res.forEach((r, i) => {
        if (r.error) console.log(`${i}: ERROR: \n ${r.error}\n\n`);
        else console.log(`${i}: \n${r.query.join("\n")}\n\n`)
    })
}
