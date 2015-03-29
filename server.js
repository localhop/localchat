/** 
 * Local Hop - Backend server "Caboose"
 * 
 * The backend server for Local Hop
 */

"use strict";

// config 
var dbPort = 6379,
    dbHost = '127.0.0.1';

var express = require('express.io'),
    app = express(),
    redis = require("node-redis"),
    client = redis.createClient(dbPort, dbHost /*no auth*/),
    bodyParser = require('body-parser'),
    _ = require('underscore'),
    colors = require('colors');

app.http().io();
app.set('port', 3001);
app.use(bodyParser.urlencoded({ extended: false }));

///////////////////////////////////////////////////////////////////////////////
/// Utility functions
///////////////////////////////////////////////////////////////////////////////

function error(e) { 
  console.error('error:'.bold.red, e); 
}

function warning(w) { 
  console.error('warning:'.bold.yellow, w); 
}

function debug(d) { 
  console.log('debug:'.bold.blue, d); 
}

function log(msg) { 
  console.log(msg); 
}

///////////////////////////////////////////////////////////////////////////////
/// Error handlers
///////////////////////////////////////////////////////////////////////////////

function handleRedisConnErr(err, res) {
  _error(err);
  res.statusCode = 200;
  res.type('json');
  res.send({text: '', error: err});
}

function handleRedisQueryErr(err, res) {
  _error(err);
  res.statusCode = 200;
  res.type('json');
  res.send({text: '', error: err});
}

///////////////////////////////////////////////////////////////////////////////
/// Server paths
///////////////////////////////////////////////////////////////////////////////

app.io.route('event', function(req) {
  debug(req.data);
  req.io.join(req.data);
  req.io.broadcast("announce", {
    message: "joined room:" + req.data
  });
});

app.io.route('message', {
  write: function(req) {
    debug("message:write" + req.data);
  },
  read: function(req) {
    debug("message:read" + req.data);
  }
});

// app.get('/message/:message', function(req, res) {
//   log("client routed to 'message'");
//   debug(req.data);
//   req.broadcast("HI");
//   res.send("HI\n");
// });

// app.io.get('messsages/:room', function(req, res) {
// }); 


app.listen(app.get('port'));
console.log("Server listening on port "+app.get('port')+"...");