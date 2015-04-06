/** 
 * Local Hop - Backend server "Caboose"
 * 
 * The backend server for Local Hop
 */

"use strict";

var redisPort = '6379', 
    redisHost = '127.0.0.1';

var express = require('express.io'),
    redis = require("redis"),
    bodyParser = require('body-parser'),
    _ = require('underscore'),
    colors = require('colors'),
    app = express(),
    client = redis.createClient(),

app.http().io();
app.set('port', 3001);
app.use(bodyParser.urlencoded({ extended: false }));

///////////////////////////////////////////////////////////////////////////////
/// Redis Client Setup
///////////////////////////////////////////////////////////////////////////////

client.on("error", handleRedisError);
client.on("ready", handleRedisReady);
client.on("end", handleRedisEnd);
client.on("drain", handleRedisDrain);

///////////////////////////////////////////////////////////////////////////////
/// Utility functions
///////////////////////////////////////////////////////////////////////////////

function handleRedisError(err) { error(err); }

/** 
 * Emitted when connection to server established and both are ready to receive 
 * commands.
 */
function handleRedisReady() {
  debug("Redis: client connected to server.");
  debug("Redis: server ready for commands.");
}

/** 
 * Emitted when an established Redis server connection has closed.
 */
function handleRedisEnd() {
  debug("Redis: connection to server lost.");
}

/** 
 * Emitted when the TCP connection to the Redis server has been buffering, but
 * is now writable. This event can be used to stream commands in to Redis and 
 * adapt to backpressure. Right now, you need to check 
 * client.command_queue.length to decide when to reduce your send rate. Then 
 * you can resume sending when you get drain.
 */
function handleRedisDrain() {
  debug("Redis: TCP connection writable.");
}

/** 
 * Emitted when there are no outstanding commands that are awaiting a response.
 */
function handleRedisIdle() {
  debug("Redis: idle");
}

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

// app.post('', function(req, res) {

// });


app.listen(app.get('port'));
console.log("Server listening on port "+app.get('port')+"...");