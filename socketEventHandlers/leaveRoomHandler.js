function joinRoomHandler(io, socket) {
  socket.on('disconnect', () => {
    socket.leave(socket.handshake.auth);
  });
}

module.exports = joinRoomHandler;
