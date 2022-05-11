const getUserInfo = require('../controllers/utils/getUserInfo');
const handleErrors = require('../controllers/utils/handleErrors');
const User = require('../models/user');

function userHandler(io, socket) {
  const getUserlist = async (payload) => {
    try {
      let response = await User.find({ _id: { $ne: payload } })
        .sort({ firstName: 1 })
        .exec();
      response = response.map((elem) => getUserInfo(elem));
      socket.emit('user:list', { response });
    } catch (err) {
      const message = handleErrors(err);
      socket.emit('user:list', { error: message });
    }
  };

  socket.on('user:list', getUserlist);
}

module.exports = userHandler;
