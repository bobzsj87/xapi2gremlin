This library tries to port xAPI towards a graph DB in Gremlin.

First `npm install` and to test, use `npm test`

It is still under development

#Test output
The test will output like the following. You can add more test files and use `node convert.js -s xxx.json`

```
0:
statement0=graph.addVertex(label, "statement", "id", 'da5c5561-3d1c-445b-bc54-6b6b5d2f1f66', "timestamp", 1493820996111)
actor0=g.V().has("agent", "mbox", 'mailto:student@ef.com')
if (!actor0.hasNext()) actor0=graph.addVertex(label, "agent", "mbox", 'mailto:student@ef.com', "name", 'Student')
statement0.addEdge('has', actor0);
object0=g.V().has("statement", "id", 'e05aa883-acaf-40ad-bf54-02c8ce485fb0')
if (object0.hasNext()) statement0.addEdge('has', object0)
actor0.addEdge('voided', object0)
result0=graph.addVertex(label, "result", "score.scale",0.1,"score.raw",10,"score.max",100,"response",'Wow, nice work!')
statement0.addEdge('has', result0)
context0=graph.addVertex(label, "context", "registration",'this is uuid',"platform",'offline')
actor1=g.V().has("agent", "mbox", 'mailto:teacher@ef.com')
if (!actor1.hasNext()) actor1=graph.addVertex(label, "agent", "mbox", 'mailto:teacher@ef.com', "name", 'Teacher')
context0.addEdge('has', actor1);
contextstatement0=g.V().has("statement", "id", 'e05aa883-acaf-40ad-bf54-02c8ce485fb0')
if (contextstatement0.hasNext()) context0.addEdge('has', contextstatement0)
statement0.addEdge('has', context0)
attachment00=graph.addVertex(label, "attachment", "display",'picture',"fileUrl",'http://google.com',"length",14)
statement0.addEdge('has', attachment00)
attachment01=graph.addVertex(label, "attachment", "display",'video',"fileUrl",'http://bing.com',"length",144344,"contentType",'video/mpeg',"sha2",'rgt834yutu4hgi3u4hgi934uhg3')
statement0.addEdge('has', attachment01)


1:
statement0=graph.addVertex(label, "statement", "id", 'af6eb60c-0f10-4e4b-a2df-7a2224e4a0bf', "timestamp", 1493820996112)
actor0=g.V().has("agent", "mbox", 'mailto:test@example.com')
if (!actor0.hasNext()) actor0=graph.addVertex(label, "agent", "mbox", 'mailto:test@example.com', "name", 'undefined')
statement0.addEdge('has', actor0);
statement1=graph.addVertex(label, "statement", "id", '8c699d8c-5403-434e-aa3b-6400e4e1cd85', "timestamp", 1493820996112)
actor1=g.V().has("agent", "mbox", 'mailto:test@example.com')
if (!actor1.hasNext()) actor1=graph.addVertex(label, "agent", "mbox", 'mailto:test@example.com', "name", 'undefined')
statement1.addEdge('has', actor1);
object1=g.V().has("activity", "id", 'http://example.com/website')
if (!object1.hasNext()) object1=graph.addVertex(label, "activity", "id", 'http://example.com/website', "name", 'Some Awesome Website')
statement1.addEdge('has', object1)
actor1.addEdge('will visit', object1)
statement0.addEdge('has', statement1)
object0=statement1
actor0.addEdge('planned', object0)
```
