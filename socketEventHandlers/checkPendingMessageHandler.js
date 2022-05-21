function checkPendingMessageHandler(io, socket) {
  socket.emit('check:pending', 'check any pending message');
}

module.exports = checkPendingMessageHandler;
