const Chat = require('../../models/chat');
const handleErrors = require('../utils/handleErrors');
// const getUserInfo = require('../utils/getUserInfo');

async function createChatRoomController(req, res) {
  // if (!req.accessToken) return res.send(401);
  if (!req.body.chatRoomInfo) return res.sendStatus(404);
  try {
    const { participants, lastMessage, lastMessageType } =
      req.body.chatRoomInfo;
    if (participants.length === 2) {
      const chats = await Chat.find({
        participants: { $all: [participants[0], participants[1]] },
      }).exec();
      if (chats.length) return res.status(400).json('chat room already exist.');
      const newChat = await Chat.create({
        participants,
        lastMessage,
        lastMessageType,
        chatPicture: '',
        chatname: '',
      });
      res.json(newChat);
    }
    console.log(req.body);
  } catch (err) {
    const message = handleErrors(err);
    res.status(404).json({ message });
  }
}

module.exports = createChatRoomController;
