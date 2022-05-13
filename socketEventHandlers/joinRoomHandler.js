async function joinRoomHandler(io, socket) {
  console.log(socket.handshake.auth);
  socket.join(socket.handshake.auth.userID);

  // const roomUsers = await io.in(socket.handshake.auth.userID).fetchSockets();
  // const roomList = [];
  // console.log(socket.rooms);
  // roomUsers.forEach((element) => {
  //   roomList.push(element.id);
  // });
  // console.log(roomList);
}

module.exports = joinRoomHandler;
