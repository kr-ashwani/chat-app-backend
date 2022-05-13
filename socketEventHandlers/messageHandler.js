const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const getUserInfo = require('../controllers/utils/getUserInfo');

function messageHandler(io, socket) {
  const getMessageList = async (payload) => {
    try {
      const _id = payload;
      const chatRoomMsgs = await Message.find({
        chatRoomID: _id,
      })
        .sort({
          lastUpdatedAt: 1,
        })
        .exec();

      socket.emit('message:list', { chatRoomID: _id, chatRoomMsgs });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:list', { error: message });
    }
  };

  const createNewMessage = async ({ messageData, selectedChat }) => {
    console.log(messageData);
    let userObj = null;
    let newChat = null;

    if (selectedChat)
      userObj = (({ chatRoomID, selectedUserID, createdAt, ...rest }) => rest)(
        selectedChat
      );
    try {
      const {
        senderID,
        senderName,
        senderPhotoUrl,
        message,
        messageType,
        createdAt,
        updatedAt,
        receiverID,
        chatRoomUpdatedID,
      } = messageData;

      let { chatRoomID } = messageData;

      if (!messageData.chatRoomID) {
        const chats = await Chat.find({
          participants: { $all: [senderID, receiverID] },
        }).exec();
        if (chats.length)
          return socket.emit('message:create', {
            error: 'chat room alredy present',
          });
        newChat = await Chat.create({
          participants: [senderID, receiverID],
          lastMessage: messageData.message,
          lastMessageType: messageData.messageType,
          lastMessageTimestamp: createdAt,
          chatRoomUpdatedID,
          chatPicture: '',
          chatname: '',
          createdAt,
          updatedAt,
        });

        const senderInfo = getUserInfo(
          (await User.findOne({ _id: senderID }).exec()).toObject()
        );
        const receiverInfo = getUserInfo(
          (await User.findOne({ _id: receiverID }).exec()).toObject()
        );

        socket
          .to(senderID)
          .emit('DB:chatRoom:create', { receiverInfo, newChat });
        socket
          .to(receiverID)
          .emit('DB:chatRoom:create', { senderInfo, newChat });

        chatRoomID = newChat._id;
      }

      if (messageData.chatRoomID) {
        await Chat.findOneAndUpdate(
          { _id: messageData.chatRoomID },
          {
            $set: {
              lastMessage: messageData.message,
              lastMessageType: messageData.messageType,
              lastMessageTimestamp: createdAt,
              updatedAt,
            },
          },
          { new: true }
        );

        const chatRoom = await Chat.findOne({ _id: chatRoomID }).exec();

        const updatedChat = {
          _id: messageData.chatRoomID,
          lastMessage: messageData.message,
          lastMessageType: messageData.messageType,
          lastMessageTimestamp: createdAt,
          updatedAt,
        };

        chatRoom.participants.forEach((elem) => {
          socket.to(elem).emit('DB:chatRoom:update', { updatedChat });
        });
      }

      const lastMsg = await Message.findOne({
        messageType: { $ne: 'information' },
      }).sort({ createdAt: -1 });

      // console.log(lastMsg);

      if (lastMsg && lastMsg.senderID === senderID)
        if ((createdAt - lastMsg.createdAt) / (1000 * 60) < 1) {
          lastMsg.showUserInfo = false;
          lastMsg.save();
        }
      const newMsg = await Message.create({
        senderID,
        senderName,
        senderPhotoUrl,
        chatRoomID,
        message,
        messageType,
        createdAt,
        updatedAt,
      });

      if (!messageData.chatRoomID)
        socket.emit('message:create', {
          newChatRoom: {
            ...newChat.toObject(),
            ...userObj,
          },
          newMsg,
          selectedChatRoom: selectedChat,
        });

      const chatRoom = await Chat.findOne({ _id: chatRoomID }).exec();

      chatRoom.participants.forEach((elem) => {
        socket.to(elem).emit('DB:message:create', { newMsg, lastMsg });
      });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:create', { error: message });
    }
  };

  socket.on('message:list', getMessageList);
  socket.on('message:create', createNewMessage);
}

module.exports = messageHandler;
