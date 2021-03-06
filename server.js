'use strict'
// {{{Modules}}}
const
    http = require('http'),
    path = require('path'),
    pkgjson = require('./package.json'),
    express = require("express"),
    bodyParser  = require('body-parser'),
    RED = require('node-red');

// {{{Config}}}
const config = {
    port: 8081,
    homePage: '/casual/index',
    dbStorePath: './model/database.json',
};

// {{{Node-RED settings}}}
const nodered = {
    settings: {
        httpAdminRoot:"/red",     // node-RED flow editor 
        httpNodeRoot: "/",        // node 'http in' root directory
        functionGlobalContext: {  // enable function nodes to reference our modules/objects
            db: require('./model/database')(config.dbStorePath) // Data store
        },
        userDir: path.resolve(__dirname, "node-red"), // Flow storage
        nodesDir: path.resolve(__dirname, "node-red/nodes"), // Custom nodes
        flowFilePretty: true,
        flowFile: 'flows.json',
        adminAuth: {
            type: "credentials",
            users: [{
                username: "poc2go",
                password: "$2a$08$.UeffE.1sGPsdxWprvnNmume26bW5kL2d/4.Nz1wRhMXJK21c9kIG",
                permissions: "*"
            }],
            default: {
                permissions: "read"
            }
        }
    }
};

// {{{Current working directory}}}
/* In some cases the runtime uses the current working dir as root
    and since server.js is in the project root directory
    set current working directory to project root */
process.chdir(__dirname);

// {{{Host Server}}}
// Create an Express app and server
var app = express();
var server = http.createServer(app);

// Body parser to accept JSON in the body
app.use(bodyParser.json({limit: '5mb'}));

// {{{Host Routes}}}
// Can use a blog post as the default page
app.get('/', (req, res, next) => {req.url = config.homePage ? config.homePage : '/'; next();});

// Replace slugs with the post id and continue down the route chain
const db = nodered.settings.functionGlobalContext.db;
app.all('/records/:slug', (req, res, next) => {db.permalink(req); next();});
app.all('/build/posts/:slug', (req, res, next) => {db.permalink(req); next();});
app.all('/build/comments/:slug', (req, res, next) => {db.permalink(req); next();});
app.get('/build/edit/:slug', (req, res, next) => {db.permalink(req); next();});

// Display code files
app.get('/code/server.js', (req, res) => {res.sendFile(path.resolve(__dirname, './server.js'));});
app.get('/code/database.js', (req, res) => {res.sendFile(path.resolve(__dirname, './model/database.js'));});

// Serve static content(css, js, etc) from site root ('public') directory
app.use("/", express.static("public"));

// {{{Node-RED}}}
// Initialize node-RED runtime
RED.init(server, nodered.settings);
// Serve the node-RED Editor and http-in node UIs
app.use(nodered.settings.httpAdminRoot, RED.httpAdmin);
app.use(nodered.settings.httpNodeRoot, RED.httpNode);
// Fire up our server
var port = config.port ? config.port : 8081;
server.listen(port);
console.log(pkgjson.name + ' version: ' + pkgjson.version + ' port: ' + port);

// {{{Start Node-RED runtime}}}
const embeddedStart = require('node-red-embedded-start');
RED.start().then(embeddedStart(RED)).then(result => {
    // result is whatever RED.start() resolved to 
    // RED.node.getFlows() etc are now ready to use 
}).catch(err => {
    if (/^timed out/.test(err.message)) {
        // embeddedStart() timed out 
        // the value that RED.start() resolved to is available as err.result 
    }
});
