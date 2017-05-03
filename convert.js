'use strict';

const process = require('process');
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const getOrCreate = `def goc(v){nv=g.getVertex(v.id);if(nv==null){nv=g.addVertex(v.id,ElementHelper.getProperties(v))};nv}`;
const graph = 'graph';
const g = 'g'; //traversal

function parseDisplay(d){
    if (typeof d === "string") return d;
    if (typeof d === "object" && d.display) return d.display['en-US'];
    return d['en-US'];
}

function parseActor(actor, query=[], level=0, attachto=""){
    attachto = attachto || `statement${level}`;
    if (actor.objectType == "Agent"){
        query.push(`actor${level}=${g}.V().has("agent", "mbox", '${actor.mbox}')`);
        query.push(`if (!actor${level}.hasNext()) actor${level}=${graph}.addVertex(label, "agent", "mbox", '${actor.mbox}', "name", '${actor.name}')`);
    }
    else if (actor.objectType == "Group"){
        // it seems we need to add uuid to identify a group
        let uuid = uuidv4();
        query.push(`actor${level}=${g}.V().has("group", "id", '${actor.id}')`);
        query.push(`if (!actor${level}.hasNext()) actor${level}=${graph}.addVertex(label, "group", "id", '${uuid}', "name", '${actor.name}')`);
        // now members
        _.each(actor.member, v => {
            parseActor(v, query, level+1, `group${level}`);
        })

    }

    // link actor and statement
    query.push(`${attachto}.addEdge('has', actor${level});`)
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
    let param = [];
    _.forEach(r, (v, k) => {
        if (k == "score"){
            _.forEach(v, (vs, ks) => {
                param.push(`"score.${ks}"`, vs)
            })
        }
        else if (k != "extension"){
            // handle duration
            param.push(`"${k}"`, typeof v == "string"?`'${v}'`:v)
        }
    })

    query.push(`result${level}=${graph}.addVertex(label, "result", ${param.join(',')})`);
    query.push(`statement${level}.addEdge('has', result${level})`)
}

function parseContext(c, query=[], level=0){
    let param = [];
    _.forEach(['registration', 'revision', 'platform', 'language'], v => {
        if (c[v]){
            param.push(`"${v}"`, `'${c[v]}'`);
        }
    })
    query.push(`context${level}=${graph}.addVertex(label, "context", ${param.join(',')})`);

    if (c.instructor){
        parseActor(c.instructor, query, level+1, `context${level}`);
    }

    if (c.team){
        parseActor(c.team, query, level+1, `context${level}`);
    }

    if (c.statement && c.statement.objectType == "StatementRef"){
        query.push(`contextstatement${level}=${g}.V().has("statement", "id", '${c.statement.id}')`)
        query.push(`if (contextstatement${level}.hasNext()) context${level}.addEdge('has', contextstatement${level})`);
    }
    // more
    // contextactivity and extensions

    query.push(`statement${level}.addEdge('has', context${level})`)
}

function parseAttachments(attachments, query=[], level=0){
    attachments.forEach((att, idx) => {
        let param = [];
        // "length" property will break lodash foreach by  _.forEach(att, (v, k) => {
        _.forEach(Object.keys(att), (k) => {
            let v = att[k]
            if (typeof v == "object"){
                param.push(`"${k}"`, `'${parseDisplay(v)}'`);
            }
            else{
                param.push(`"${k}"`, typeof v == "string"?`'${v}'`:v);
            }
        })

        query.push(`attachment${level}${idx}=${graph}.addVertex(label, "attachment", ${param.join(',')})`);
        query.push(`statement${level}.addEdge('has', attachment${level}${idx})`)
    })
}

function parseStatement(s, query=[], level=0){
    // create or fetch statement
    if (s.id){
        query.push(`statement${level}=${g}.V().has("statement", "id", ${s.id});`)
    }
    else{
        let uuid = uuidv4();
        let timestamp = s.timestamp && Date.parse(s.timestamp) || Date.now();
        query.push(`statement${level}=${graph}.addVertex(label, "statement", "id", '${uuid}', "timestamp", ${timestamp})`)
    }


    // actor
    parseActor(s.actor, query, level);
    parseObject(s.object, query, level)
    parseVerb(s.verb, query, level);

    // result
    s.result && parseResult(s.result, query, level);
    s.context && parseContext(s.context, query, level);
    s.attachments && parseAttachments(s.attachments, query, level);

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
