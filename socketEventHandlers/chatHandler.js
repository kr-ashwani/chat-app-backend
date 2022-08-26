const getUserInfo = require('../controllers/utils/getUserInfo');
const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const User = require('../models/user');

function chatHandler(io, socket) {
  const createGroupChatRoom = async (payload) => {
    try {
      const {
        participants,
        lastMessage,
        lastMessageType,
        lastMessageID,
        createdAt,
        updatedAt,
        chatRoomID,
        lastMessageTimestamp,
        messageData,
        msgInfoTime,
        groupChatPicture,
        groupChatName,
      } = payload;

      const newChatRoom = await Chat.create({
        participants,
        lastMessage,
        lastMessageType,
        createdAt,
        updatedAt,
        lastMessageID,
        chatRoomID,
        lastMessageTimestamp,
        groupChatPicture,
        groupChatName,
      });

      // chatRoom:create:success

      socket.emit('chatRoom:create:success', { messageData, msgInfoTime });

      console.log(groupChatName);
      if (groupChatName) {
        const senderInfo = await User.findOne({ _id: participants[0] }).exec();
        const receiverInfo = await User.findOne({
          _id: participants[1],
        }).exec();

        socket.to(participants[0]).emit('DB:chatRoom:create', {
          firstName: receiverInfo.firstName,
          lastName: receiverInfo.lastName,
          photoUrl: receiverInfo.photoUrl,
          newChatRoom,
        });
        socket.to(participants[1]).emit('DB:chatRoom:create', {
          firstName: senderInfo.firstName,
          lastName: senderInfo.lastName,
          photoUrl: senderInfo.photoUrl,
          newChatRoom,
        });
      } else {
        participants.forEach((elem) => {
          socket.to(elem).emit('DB:chatRoom:create', {
            newChatRoom,
          });
        });
      }
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('chatRoom:create', { error: message });
    }
  };

  const chatRoomsList = async (payload) => {
    try {
      let response = await Chat.find({
        participants: { $all: [payload] },
      })
        .sort({
          lastUpdatedAt: -1,
        })
        .exec();

      response = response.map(async (elem) => {
        if (!elem.groupChatName) {
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
