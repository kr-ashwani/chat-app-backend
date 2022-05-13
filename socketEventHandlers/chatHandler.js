const getUserInfo = require('../controllers/utils/getUserInfo');
const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const User = require('../models/user');

function chatHandler(io, socket) {
  const createGroupChatRoom = async (payload) => {
    try {
      const { participants, lastMessage, lastMessageType, lastMessageID } =
        payload;
      if (participants.length === 2) {
        const chats = await Chat.find({
          participants: { $all: [participants[0], participants[1]] },
        }).exec();
        if (chats.length)
          return socket.emit('chatRoom:create', {
            error: 'chat room already exist.',
          });
        const newChat = await Chat.create({
          participants,
          lastMessage,
          lastMessageType,
          lastMessageID,
          chatPicture: '',
          chatname: '',
        });
        socket.emit('chatRoom:create', { response: newChat });
      }
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('chatRoom:create', { error: message });
    }
  };

  const chatRoomsList = async (payload) => {
    console.log('chat list request');
    try {
      let response = await Chat.find({
        participants: { $all: [payload] },
      })
        .sort({
          lastUpdatedAt: -1,
        })
        .exec();

      response = response.map(async (elem) => {
        if (elem.participants.length === 2) {
          const arr = elem.participants.filter((e) => e !== payload);
          const user = await User.findOne({ _id: arr[0] }).exec();
          return { ...getUserInfo(user), ...elem.toObject() };
        }
        return elem;
      });
      response = await Promise.all(response);
      socket.emit('chatRoom:list', { response });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('chatRoom:list', { error: message });
    }
  };

  socket.on('chatRoom:create', createGroupChatRoom);
  socket.on('chatRoom:list', chatRoomsList);
}

module.exports = chatHandler;
