const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  chatRoomID: {
    type: String,
    required: [true, 'chatRoomID is required'],
    unique: [true, 'chatRoomID must be unique'],
  },
  participants: {
    type: [String],
    validate: (v) => Array.isArray(v) && v.length >= 2,
    required: [true, 'provide auth provider'],
  },
  lastMessageID: {
    type: String,
    required: [true, 'lastMessageID is missing'],
  },
  lastMessage: {
    type: String,
    required: [true, 'last Message is missing'],
  },
  lastMessageType: {
    type: String,
    required: [true, 'last Message type is missing'],
  },
  createdAt: {
    type: Number,
    required: [true, 'createdAt is missing'],
  },
  updatedAt: {
    type: Number,
    required: [true, 'updatedAt is  missing'],
  },
  groupChatPicture: {
    type: String,
    default: '',
  },
  groupChatName: {
    type: String,
    default: '',
  },
  lastMessageTimestamp: {
    type: Number,
    required: [true, 'lastMessageTimestamp is missing'],
  },
});

const Chat = mongoose.model('chat', ChatSchema);
module.exports = Chat;
