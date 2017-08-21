var http = require('http');
var path = require('path');
var express = require("express");
var bodyParser  = require('body-parser');
var RED = require("node-red");

// Set working directory
process.chdir(__dirname);

// Create an Express app
var app = express();

// Create a server
var server = http.createServer(app);

// Add a simple route for static content served from 'public'
app.use("/",express.static("public"));

// Body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    functionGlobalContext: {    // enables global context
        Mustache: require('mustache')
    },
    userDir: path.resolve(__dirname, "node-red"),
    nodesDir: path.resolve(__dirname, "node-red/nodes"),
    flowFilePretty: true,
    flowFile: 'flows.json',
};

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

server.listen(8081);

// Start the runtime
RED.start();