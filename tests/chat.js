var io = require('socket.io')(),
	socket = io.connect("http://localhost:3001"),
	request = require('request');

function callback(error, response, body) {
  if (!error  && response.statusCode == 200) {
    console.log("body:" + body);
  } else {
    console.log("error: " + error);
  }
}

/** Send a message */
var message = {
	room: "1",
	message: "Hello world!",
};

socket.emit("message:write", message);
//request.get(host+"/message", callback).form(message);

