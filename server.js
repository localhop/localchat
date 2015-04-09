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
    chatStreamSubscribers  = {},
    client = redis.createClient(redisPort, redisHost);

app.set('port', 3001);
app.use(bodyParser.urlencoded({ extended: false }));

///////////////////////////////////////////////////////////////////////////////
/// User Interface configuration
///////////////////////////////////////////////////////////////////////////////

function getChatWelcomeMessage(eventId) {
  return "Welcome to the " + eventId + " chat room!";
}

function getChatUserLeftMessage(userId) {
  return userId + " joined the chat room.";
}

function getChatUserJoinedMessage(userId) {
  return userId + " left the chat room.";
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

function getChatStreamKey(eventId) {
  return "event:"+eventId+":chatStream";
}

function getChatMessageListKey(eventId) {
  return "event:"+eventId+":messages"; 
}

function getChatUserListKey(eventId) {
  return "event:"+eventId+":users";
}

///////////////////////////////////////////////////////////////////////////////
/// Debug utility functions
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

function dump_chat_stream(eventId) {
  var msgList = client.lrange(getChatMessageListKey(eventId), 0, -1);
  debug(msgList);
}

///////////////////////////////////////////////////////////////////////////////
/// Event handlers
///////////////////////////////////////////////////////////////////////////////

function handleRedisError(err) { error(err); }

/** 
 * Emitted when connection to server established and both are ready to receive 
 * commands.
 */
function handleRedisReady() {
  debug("Redis: client connected to server.");
  debug("Redis: client & server ready for commands.");
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
  var eventId = req.body.eventId;

  chatStreamSubscribers[eventId] = redis.createClient(redisPort, redisHost);
  var eventStreamSubscriber = chatStreamSubscribers[eventId];

  client.rpush(getChatMessageListKey(eventId), getChatWelcomeMessage(eventId));
  client.sadd(getChatUserListKey(eventId), SYSTEM_USER_ID);

  debug("Chat room created for event "+eventId);

  eventStreamSubscriber.on("subscribe", function(channel, count) {
    debug("Chat room: "+channel+" listening for messages...");
  });

  eventStreamSubscriber.on("message", function(channel, message) {
    debug("Chat room: "+channel+" received message");
    client.rpush(channel, message);
  });

  eventStreamSubscriber.subscribe(getChatStreamKey(eventId));
  res.send("Chat room for "+eventId+" created.");
});


/** Called when a client posts a message to a chat room */
app.post("/message", function(req, res) {
    var eventId = req.body.eventId,
        user = req.body.userId,
        message = req.body.message;
    client.publish(getChatStreamKey(eventId), message);
    res.send('1');
});


/** Called when a client requests the messages from a chat room */
app.get("/messages/:eventId/:userId", function(req, res) {
  var eventId = req.params.eventId,
      user = req.params.userId;
  debug("got message request");
  client.lrange(getChatMessageListKey(eventId), "0", "-1", 
    function (err, reply) {
      if (err != null) {
        error(err);
        res.send({text: "", error: err});
      }
      res.send(reply);
    }
  );
});


// /** Called when a user joins the chat room for the event */
// app.post("/event/chatuser/:eventId/:userId", function(req, res) {
//   var eventId = req.body.eventId,
//       theUser = req.body.userId;
//   client.sadd(getChatUserListKey(eventId), theUser);
// });


// /** Called when a client leaves the chat room for an event */
// app.delete("/event/chatuser/:eventId/:userId", function(req, res) {
//   var eventId = req.body.eventId,
//       theUser = req.body.userId;
//   client.srem(getChatUserListKey(eventId), theUser);
// });

app.listen(app.get('port'));
console.log("server listening on port " + app.get('port') + "...");