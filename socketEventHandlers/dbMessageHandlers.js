const Chat = require('../models/chat');
const Message = require('../models/message');

function dbMessageHandler(io) {
  try {
    Message.watch().on('change', async (data) => {
      if (data.operationType === 'insert') {
        const chatRoom = await Chat.findOne({
          _id: data.fullDocument.chatRoomID,
        }).exec();
        chatRoom.participants.forEach((elem) => {
          io.to(elem).emit('DB:message:create', { newMsg: data.fullDocument });
        });
        // socketRooms.emit('DB:message:create', { newMsg: data.fullDocument });
      }
    });
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = dbMessageHandler;
