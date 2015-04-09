var exports = {

  store_message: function(channel, message) {
    debug("Chat room: "+channel+" received message");
    client.rpush(channel, message);
  }),
  
};