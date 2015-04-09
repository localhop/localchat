var exports = {
  store_message: function(channel, message, ctx) {
    ctx.debug("Chat room: "+channel+" received message");
    client.rpush(channel, message);
  }),

  log_message: function(channel, message, ctx) {
    ctx.debug(channel + " received: " + message);
  }
};