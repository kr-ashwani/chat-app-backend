const handleErrors = require('../controllers/utils/handleErrors');
const Chat = require('../models/chat');
const File = require('../models/file');
const Message = require('../models/message');
const User = require('../models/user');

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

        const userInfo = await User.findOne(
          { _id: msgs.senderID },
          {
            firstName: 1,
            lastName: 1,
            photoUrl: 1,
            _id: 0,
          }
        ).exec();
        msgs.senderName = `${userInfo.firstName} ${userInfo.lastName}`;
        msgs.senderPhotoUrl = userInfo.photoUrl;

        msgs.repliedMessage = null;
        msgs.fileInfo = null;
        if (msgs.fileID) {
          const msgFileInfo = await File.findOne({ _id: msgs.fileID }).exec();
          msgs.fileInfo = msgFileInfo;
        }
        if (msgs.repliedMessageID) {
          let repliedMsgInfo = await Message.findOne(
            { messageID: msgs.repliedMessageID },
            {
              message: 1,
              messageID: 1,
              chatRoomID: 1,
              senderID: 1,
              _id: 0,
            }
          ).exec();

          repliedMsgInfo = repliedMsgInfo.toObject();
          const userInfo2 = await User.findOne(
            { _id: repliedMsgInfo.senderID },
            {
              firstName: 1,
              lastName: 1,
              photoUrl: 1,
              _id: 0,
            }
          ).exec();

          repliedMsgInfo.senderName = `${userInfo2.firstName} ${userInfo2.lastName}`;
          repliedMsgInfo.senderPhotoUrl = userInfo2.photoUrl;

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
        fileInfo,
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
            lastMessage: fileInfo ? fileInfo.fileName : message,
            lastMessageType: messageType,
            lastMessageTimestamp: createdAt,
            updatedAt,
            lastMessageID: messageID,
          },
        }
      );

      const updatedChatRoom = {
        chatRoomID,
        lastMessage: fileInfo ? fileInfo.fileName : message,
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

      let newFile = null;
      if (fileInfo) newFile = await File.create({ ...fileInfo });

      let newMsg = await Message.create({
        senderID,
        chatRoomID,
        message,
        messageType,
        createdAt,
        updatedAt,
        messageID,
        showUserInfo,
        repliedMessageID,
        fileID: newFile ? newFile._id : null,
      });

      newMsg = newMsg.toObject();
      newMsg.senderName = senderName;
      newMsg.senderPhotoUrl = senderPhotoUrl;
      newMsg.repliedMessage = repliedMessage;
      newMsg.fileInfo = newFile;

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
