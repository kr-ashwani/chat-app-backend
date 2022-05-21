const handleErrors = require('../controllers/utils/handleErrors');

function messageSyncHandler(io, socket) {
  const checkMessageSync = async (payload) => {
    try {
      console.log(payload);
    } catch (err) {
      const message = handleErrors(err);
      console.log(message);
    }
  };

  socket.emit('message:sync');
  socket.on('message:sync', checkMessageSync);
}

module.exports = messageSyncHandler;
