const express = require('express');
const chatRoomsListController = require('../../controllers/chat/chatRoomsListController');
const createChatRoomController = require('../../controllers/chat/createChatRoomController');
const userListController = require('../../controllers/user/userListController');

const router = express.Router();

router.get('/userlist', userListController);
router.get('/chatroomslist', chatRoomsListController);
router.post('/createchatroom', createChatRoomController);

module.exports = router;
