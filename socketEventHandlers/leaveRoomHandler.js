function joinRoomHandler(io, socket) {
  socket.on('disconnect', () => {
    console.log('user disconnected : ', socket.id);
    socket.leave(socket.handshake.auth);
  });
}

module.exports = joinRoomHandler;
