/** 
 * Local Hop Chat server
 */

"use strict";

var redisPort = '6379', 
    redisHost = '127.0.0.1',
    SYSTEM_USER_ID = '0';

var express    = require('express'),
    app        = express(),
    redis      = require("redis"),
    bodyParser = require('body-parser'),
    _          = require('underscore'),
    colors     = require('colors'),
    chatRooms  = {},
    client = redis.createClient(redisPort, redisHost);

app.set('port', 3001);
app.use(bodyParser.urlencoded({ extended: false }));

///////////////////////////////////////////////////////////////////////////////
/// User Interface configuration
///////////////////////////////////////////////////////////////////////////////

function ChatWelcomeMessage(eventId) {
  return "Welcome to the "+eventId+" chat room!";
}

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
/// Message Marshalling
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
/// Server paths
///////////////////////////////////////////////////////////////////////////////


/** Called when a new chat room is created for an event */
app.post("/event/chatroom", function(req, res) {
  var theEvent = req.body.eventId,
      theEventClient;

  chatRooms[theEvent] = redis.createClient(redisPort, redisHost);
  theEventClient = chatRooms[theEvent];

  client.rpush("event:"+theEvent+":messages", ChatWelcomeMessage(theEvent));
  client.sadd("event:"+theEvent+":users", SYSTEM_USER_ID);

  debug("Chat room created for event "+theEvent);

  theEventClient.on("subscribe", function(channel, count) {
    debug("Chat room: "+channel+" listening for messages...");
  });

  theEventClient.on("message", function(channel, message) {
    debug("Chat room: "+channel+" received message");
    client.rpush(channel, message);
  });

  theEventClient.subscribe("event:"+theEvent+":channel");
  res.send("Chat room for "+theEvent+" created.");
});


/** Called when a client posts a message to a chat room */
app.post("/message", function(req, res) {
    var theEvent = req.body.eventId,
        user = req.body.userId,
        message = req.body.message;
    client.publish("event:"+theEvent+":channel", message);
    res.send('1');
});


/** Called when a client requests the messages from a chat room */
app.get("/messages/:eventId/:userId", function(req, res) {
  var theEvent = req.params.eventId,
      user = req.params.userId;
  debug("got message request");
  client.lrange("event:"+theEvent+":messages", "0", "-1", 
    function (err, reply) {
      if (err != null)
        error(err);
      res.send(reply);
  }); 
});


// /** Called when a user joins the chat room for the event */
// app.post("/event/chatuser/:eventId/:userId", function(req, res) {
//   var theEvent = req.body.eventId,
//       theUser = req.body.userId;

//   client.sadd("event:"+theEvent+":users", theUser);
// });


// /** Called when a client leaves the chat room for an event */
// app.delete("/event/chatuser/:eventId/:userId", function(req, res) {
//   var theEvent = req.body.eventId,
//       theUser = req.body.userId;

//   client.srem("event:"+theEvent+":users", theUser);
// });

app.listen(app.get('port'));
console.log("Server listening on port "+app.get('port')+"...");
