const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  message: String,
  messageType: String,
  showUserInfo: {
    type: Boolean,
    default: true,
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
  chatRoomID: {
    type: String,
    required: [true, 'chatroom is missing'],
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

const Message = mongoose.model('message', MessageSchema);
module.exports = Message;
