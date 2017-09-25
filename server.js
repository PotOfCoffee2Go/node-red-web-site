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

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* Routes */
// Can pick a post as a default page
app.get('/', function(req, res, next) {
  req.url = '/posts/8';
  next();
});

// Add a route for static content(css, js, etc) served from 'public' directory
app.use("/",express.static("public"));

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
// Initialize node-RED runtime with the server and settings
RED.init(server, settings);
// Serve the node-RED Editor and http-in node UIs
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);
// Fire up the server
server.listen(8081);
// Start node-RED runtime
RED.start();
