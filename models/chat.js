const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  chatPicture: String,
  chatName: String,
  lastMessage: {
    type: String,
    required: [true, 'last Message is missing'],
  },
  lastMessageType: {
    type: String,
    required: [true, 'last Message type is missing'],
  },
  participants: {
    type: [String],
    validate: (v) => Array.isArray(v) && v.length > 0,
    required: [true, 'provide auth provider'],
  },
  chatRoomUpdatedID: {
    type: String,
    required: [true, 'chatRoomUpdatedID is missing'],
  },
  lastMessageTimestamp: {
    type: Number,
    required: [true, 'last message timestamp is missing'],
  },
  createdAt: {
    type: Number,
    required: [true, 'createdAt is missing'],
  },
  updatedAt: {
    type: Number,
    required: [true, 'updatedAt is  missing'],
  },
});

const Chat = mongoose.model('chat', ChatSchema);
module.exports = Chat;
