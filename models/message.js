const mongoose = require('mongoose');

const schemaOptions = {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'lastUpdatedAt',
  },
};

const MessageSchema = new mongoose.Schema(
  {
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
      required: [true, 'chatroom missing'],
    },
  },
  schemaOptions
);

const Message = mongoose.model('message', MessageSchema);
module.exports = Message;
