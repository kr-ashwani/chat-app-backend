const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  message: String,
  messageType: String,
  chatRoomID: {
    type: String,
    required: [true, 'chatroom is missing'],
  },
  messageID: {
    type: String,
    required: [true, 'chatroom is missing'],
    unique: [true, 'messageID must be unique'],
  },
  showUserInfo: {
    type: Boolean,
    required: [true, 'showuserinfo is  missing'],
  },
  senderID: {
    type: String,
    required: [true, 'sender is missing'],
  },
  createdAt: {
    type: Number,
    required: [true, 'createdAt is missing'],
  },
  updatedAt: {
    type: Number,
    required: [true, 'updatedAt is  missing'],
  },
  messageStatus: {
    sent: {
      type: Boolean,
      default: false,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  repliedMessageID: {
    type: String,
    default: null,
  },
  fileID: {
    type: String,
    default: null,
  },
});

const Message = mongoose.model('message', MessageSchema);
module.exports = Message;
