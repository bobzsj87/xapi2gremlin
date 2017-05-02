'use strict';

const process = require('process');
const grex = require('grex');
const uuid = require('uuid/v4');

function assignProperty(name, source){
    return Object.assign({property: name}, source);
}

function parseStatement(s){
    let query = grex.gremlin();
    let g = grex.g;

    // actor
    let actor = query.var(g.addVertex(assignProperty("actor", s.actor)));

    // object
    let object;
    if (s.object.objectType && s.object.objectType == 'SubStatement'){
        return {error:"SubStatement not supported yet"};
    }
    else{
        object = query.var(g.addVertex(assignProperty("object", s.object)));
    }

    let verb = s.verb.display['en-US'];
    if (!verb){
        return {error:"en-US verb must be presented"};
    }
    query(g.addEdge(actor, object, verb, s.verb));

    // result
    if (s.result){
        let result = query.var(g.addVertex(assignProperty("result", s.result)));
        query(g.addEdge(object, result, "has", s.result));
    }

    if (s.attachment){
        let attachment = query.var(g.addVertex(s.attachment));
        query(g.addEdge(object, attachment, "has", s.attachment));
    }


    return {
        error: null,
        script: query.script
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
        else console.log(`${i}: \n${r.script}\n\n`)
    })
}
