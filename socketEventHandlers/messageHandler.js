const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');

function messageHandler(io, socket) {
  const getMessageList = async (payload) => {
    try {
      const _id = payload;
      const response = await Message.find({
        chatRoomID: _id,
      })
        .sort({
          lastUpdatedAt: 1,
        })
        .exec();

      socket.emit('message:list', { response });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:list', { error: message });
    }
  };

  const createNewMessage = async (payload) => {
    try {
      const { senderID, senderName, senderPhotoUrl, message, messageType } =
        payload;

      let { chatRoomID } = payload;

      if (!chatRoomID) chatRoomID = '';

      const newMsg = await Message.create({
        senderID,
        senderName,
        senderPhotoUrl,
        chatRoomID,
        message,
        messageType,
      });

      if (!payload.chatRoomID) {
        const chats = await Chat.find({
          participants: { $all: [senderID, payload.receiverID] },
        }).exec();
        if (chats.length)
          return socket.emit('message:create', {
            error: 'chat room alredy present',
          });
        const newChat = await Chat.create({
          participants: [senderID, payload.receiverID],
          lastMessage: payload.message,
          lastMessageID: newMsg._id,
          lastMessageType: payload.messageType,
          chatPicture: '',
          chatname: '',
        });

        await Message.findOneAndUpdate(
          { _id: newMsg._id },
          {
            $set: {
              chatRoomID: newChat._id,
            },
          }
        );
      } else {
        await Chat.findOneAndUpdate(
          { _id: payload.chatRoomID },
          {
            $set: {
              lastMessage: payload.message,
              lastMessageID: newMsg._id,
              lastMessageType: payload.messageType,
            },
          }
        );
      }
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:create', { error: message });
    }
  };

  socket.on('message:list', getMessageList);
  // socket.on('message:create', createNewMessage);
}

module.exports = messageHandler;
