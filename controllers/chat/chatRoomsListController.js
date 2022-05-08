const Chat = require('../../models/chat');
const handleErrors = require('../utils/handleErrors');

async function chatRoomsListController(req, res) {
  // if (!req.accessToken) return res.send(401);
  try {
    const { _id } = req.body.userInfo;
    const response = await Chat.find({
      participants: { $all: [_id] },
    })
      .sort({
        lastUpdatedAt: -1,
      })
      .exec();

    res.send(response);
  } catch (err) {
    const message = handleErrors(err);
    res.status(404).json({ message });
  }
}

module.exports = chatRoomsListController;
