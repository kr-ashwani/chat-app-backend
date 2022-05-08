const mongoose = require('mongoose');

const schemaOptions = {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'lastUpdatedAt',
  },
};

const ChatSchema = new mongoose.Schema(
  {
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
  },
  schemaOptions
);

const Chat = mongoose.model('chat', ChatSchema);
module.exports = Chat;
