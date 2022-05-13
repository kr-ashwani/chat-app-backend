const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const Message = require('../models/message');

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

  const createNewMessage = async ({ messageData, selectedChat }) => {
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

        // socket.to(senderID).emit('DB:chatRoom:create', { newChat });
        // socket.to(receiverID).emit('DB:chatRoom:create', { newChat });

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

        // const chatRoom = await Chat.findOne({
        //   _id: messageData.chatRoomID,
        // }).exec();

        // chatRoom.participants.forEach((elem) => {
        //   socket.to(elem).emit('DB:message:create', { chatRoom });
        // });
      }

      const lastMsg = await Message.findOne({
        messageType: { $ne: 'information' },
      }).sort({ createdAt: -1 });

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
