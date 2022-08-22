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

  async function updateUserProfile(payload) {
    console.log(payload);
    try {
      let updatedUser = null;
      if (payload.changedValue.fileUrl) {
        updatedUser = await User.findOneAndUpdate(
          { _id: payload.userID },
          { photoUrl: payload.changedValue.fileUrl },
          {
            new: true,
          }
        ).exec();
      } else {
        const updateKey = Object.keys(payload.changedValue)[0];
        const updateValue = Object.values(payload.changedValue)[0];
        updatedUser = await User.findOneAndUpdate(
          { _id: payload.userID },
          { [updateKey]: updateValue },
          {
            new: true,
          }
        ).exec();
      }

      updatedUser = getUserInfo(updatedUser.toObject());
      io.to(payload.userID).emit(
        'user:currentUser:profile:update',
        updatedUser
      );
    } catch (err) {
      handleErrors(err);
    }
  }

  socket.on('user:list', getUserlist);
  socket.on('user:profile:update', updateUserProfile);
}

module.exports = userHandler;
