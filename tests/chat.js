var request = require('request');
var host = "http://localhost:3001";

function callback(error, response, body) {
  if (!error  && response.statusCode == 200) {
    console.log("body:" + body);
  } else {
    console.log("error: " + error);
  }
}

var kendal = "Kendal",
    adam = "Adam",
    eventId = 1,
    message = "Hello chat room!";

// Create a chat room
// console.log("creating chatroom "+eventId);
// request.post(host+"/event/chatroom", callback).form({
//   eventId: eventId
// });

// Post a message to the chat room
// console.log("posting message: "+message);
// request.post(host+"/message", callback).form({
//   eventId: eventId,
//   userId: kendal,
//   message: message
// });

// // // Get all messages from the chat room
console.log("requesting all messages...");
request.get(host+"/messages/"+eventId+"/"+kendal, callback);

//request.post().form();
//request.get(host+"/message", callback).form(message);

