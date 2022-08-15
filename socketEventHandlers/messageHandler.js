const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const Message = require('../models/message');

function messageHandler(io, socket) {
  const getMessageList = async ({ chatRoomID }) => {
    try {
      let chatRoomMsgs = await Message.find({
        chatRoomID,
      })
        .sort({
          updatedAt: 1,
        })
        .exec();

      chatRoomMsgs = chatRoomMsgs.map(async (elem) => {
        const msgs = elem.toObject();
        msgs.repliedMessage = null;
        if (msgs.repliedMessageID) {
          const repliedMsgInfo = await Message.findOne(
            { messageID: msgs.repliedMessageID },
            {
              message: 1,
              messageID: 1,
              chatRoomID: 1,
              senderPhotoUrl: 1,
              senderID: 1,
              senderName: 1,
              _id: 0,
            }
          ).exec();
          // eslint-disable-next-line no-param-reassign
          msgs.repliedMessage = repliedMsgInfo;
        }
        return msgs;
      });

      chatRoomMsgs = await Promise.all(chatRoomMsgs);
      socket.emit('message:list', { chatRoomID, chatRoomMsgs });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:list', { error: message });
    }
  };

  const createNewMessage = async ({ messageData, checkPending }) => {
    try {
      const {
        senderID,
        messageID,
        senderName,
        senderPhotoUrl,
        message,
        messageType,
        createdAt,
        updatedAt,
        chatRoomID,
        showUserInfo,
        repliedMessageID,
        repliedMessage,
      } = messageData;

      const checkMsg = await Message.findOne({ messageID }).exec();

      if (checkMsg && checkPending) {
        setTimeout(() => {
          socket.emit('chatRoom:send:moreMsgs', { chatRoomID, messageID });
        }, 0);
        return;
      }

      await Chat.findOneAndUpdate(
        { chatRoomID },
        {
          $set: {
            lastMessage: message,
            lastMessageType: messageType,
            lastMessageTimestamp: createdAt,
            updatedAt,
            lastMessageID: messageID,
          },
        }
      );

      const updatedChatRoom = {
        chatRoomID,
        lastMessage: message,
        lastMessageType: messageType,
        lastMessageTimestamp: createdAt,
        updatedAt,
        lastMessageID: messageID,
      };

      const lastMsg = await Message.findOne({
        messageType: { $ne: 'information' },
        chatRoomID,
      })
        .sort({ createdAt: -1 })
        .exec();

      // console.log(lastMsg);
      // console.log(createdAt);
      if (lastMsg && lastMsg.senderID === senderID)
        if ((createdAt - lastMsg.createdAt) / (1000 * 60) < 1) {
          lastMsg.showUserInfo = false;
          await lastMsg.save();
        }

      let newMsg = await Message.create({
        senderID,
        senderName,
        senderPhotoUrl,
        chatRoomID,
        message,
        messageType,
        createdAt,
        updatedAt,
        messageID,
        showUserInfo,
        repliedMessageID,
      });

      newMsg = newMsg.toObject();
      newMsg.repliedMessage = repliedMessage;

      const chatRoom = await Chat.findOne({ chatRoomID }).exec();

      chatRoom.participants.forEach((elem) => {
        socket.to(elem).emit('DB:chatRoom:update', { updatedChatRoom });
      });

      chatRoom.participants.forEach((elem) => {
        socket.to(elem).emit('DB:message:create', { newMsg, lastMsg });
      });

      io.to(senderID).emit('message:sent', {
        chatRoomID,
        messageID,
      });

      if (checkPending)
        setTimeout(() => {
          socket.emit('chatRoom:send:moreMsgs', { chatRoomID, messageID });
        }, 0);
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('message:create', { error: message });
    }
  };

  const sentMessage = async ({ messageID }) => {
    try {
      const msg = await Message.findOne({ messageID }).exec();
      if (!msg) return;
      if (msg.messageStatus.sent) return;
      msg.messageStatus.sent = true;
      await msg.save();
    } catch (err) {
      console.log(err.message);
    }
  };

  const receivedMessage = async ({ messageID, senderID, chatRoomID }) => {
    try {
      const msg = await Message.findOne({ messageID }).exec();
      if (!msg) return;

      socket.to(senderID).emit('message:delivered', { chatRoomID, messageID });
      if (msg.messageStatus.delivered) return;

      msg.messageStatus.delivered = true;
      await msg.save();
    } catch (err) {
      console.log(err.message);
    }
  };

  const seenMessage = async ({ messageID, senderID, chatRoomID }) => {
    try {
      const msg = await Message.findOne({ messageID }).exec();
      if (!msg) return;

      socket.to(senderID).emit('message:seen', { chatRoomID, messageID });
      if (msg.messageStatus.seen) return;

      msg.messageStatus.seen = true;
      await msg.save();
    } catch (err) {
      console.log(err.message);
    }
  };

  function checkSocketOnline(payload) {
    socket.emit('online:message', payload);
  }

  socket.on('online:message', checkSocketOnline);
  socket.on('message:list', getMessageList);
  socket.on('message:create', createNewMessage);
  socket.on('message:sent', sentMessage);
  socket.on('message:seen', seenMessage);
  socket.on('message:received', receivedMessage);
}

module.exports = messageHandler;
