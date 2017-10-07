'use strict'
const
    http = require('http'),
    path = require('path'),
    express = require("express"),
    bodyParser  = require('body-parser'),
    RED = require('node-red');

const config = {
    port: 8081,
    homePage: '/posts/6',
    // Node-RED settings
    settings: {
        httpAdminRoot:"/red",     // node-RED flow editor 
        httpNodeRoot: "/",        // node 'http in' root directory
        functionGlobalContext: {  // enable function nodes to reference our modules/objects
            db: require('./model/database') // Blog data store
        },
        userDir: path.resolve(__dirname, "node-red"), // Flow storage
        nodesDir: path.resolve(__dirname, "node-red/nodes"), // Custom nodes
        flowFilePretty: true,
        flowFile: 'flows.json',
        }
};

/* In some cases the runtime uses the current working dir as root - so */
//  since server.js is in the project root directory
//  set current working directory to project root
process.chdir(__dirname);

/* Express Server */
// Create an Express app
var app = express();
// Create a server
var server = http.createServer(app);

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* Routes */
// Use a post as the default page
app.get('/', function(req, res, next) {req.url = config.homePage ? config.homePage : '/'; next();});

// Serve static content(css, js, etc) from site root ('public') directory
app.use("/",express.static("public"));

/* Node-RED */
// Initialize node-RED runtime
RED.init(server, config.settings);
// Serve the node-RED Editor and http-in node UIs
app.use(config.settings.httpAdminRoot, RED.httpAdmin);
app.use(config.settings.httpNodeRoot, RED.httpNode);
// Fire up our server
server.listen(config.port ? config.port : 8081);

// Start node-RED runtime
const embeddedStart = require('node-red-embedded-start');
RED.start().then(embeddedStart(RED)).then((result) => {
    // result is whatever RED.start() resolved to 
    // RED.node.getFlows() etc are now ready to use 
}).catch((err) => {
    if (/^timed out/.test(err.message)) {
        // embeddedStart() timed out 
        // the value that RED.start() resolved to is available as err.result 
    }
});
