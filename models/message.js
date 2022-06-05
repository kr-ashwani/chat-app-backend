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
  senderName: {
    type: String,
    required: [true, 'sender name is missing'],
  },
  senderPhotoUrl: {
    type: String,
    required: [true, 'sender photoUrl is missing'],
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
  repliedMessage: {
    replied: {
      type: Boolean,
      default: false,
    },
    replierID: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    messageType: {
      type: String,
      default: '',
    },
    messageThumbnail: {
      type: String,
      default: '',
    },
    userPhotoURL: {
      type: String,
      default: '',
    },
    userID: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      default: '',
    },
    messageID: {
      type: String,
      default: '',
    },
  },
});

const Message = mongoose.model('message', MessageSchema);
module.exports = Message;
