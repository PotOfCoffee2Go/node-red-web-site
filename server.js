'use strict'
/* Runtime uses the current working dir as root - so */
//  set current working directory to project root
process.chdir(__dirname);

const
    http = require('http'),
    path = require('path'),
    express = require("express"),
    bodyParser  = require('body-parser'),
    RED = require('node-red');

/* Express Server */
// Create an Express app
var app = express();
// Create a server
var server = http.createServer(app);
// Add a route for static content served from 'public' directory
app.use("/",express.static("public"));
// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* Node-RED */
// Create the node-RED settings object
var settings = {
    httpAdminRoot:"/red",     // node-RED flow editor 
    httpNodeRoot: "/",        // node 'http in' root directory
    functionGlobalContext: {  // enable function nodes to reference our modules/objects
        db: require('./db/database') // Blog data store
    },
    userDir: path.resolve(__dirname, "node-red"), // Flow storage
    nodesDir: path.resolve(__dirname, "node-red/nodes"), // Custom nodes
    flowFilePretty: true,
    flowFile: 'flows.json',
};

/* Startup */
// Initialise the runtime with the server and settings
RED.init(server, settings);
// Serves the editor UI
app.use(settings.httpAdminRoot, RED.httpAdmin);
// Serves the http-in nodes UI
app.use(settings.httpNodeRoot, RED.httpNode);
// Fire up the server
server.listen(8081);
// Start the node-RED runtime
RED.start();
