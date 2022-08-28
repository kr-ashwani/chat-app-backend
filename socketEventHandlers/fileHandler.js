const handleErrors = require('../controllers/utils/handleErrors');

function fileHandler(io, socket) {
  try {
    console.log(socket);
  } catch (err) {
    handleErrors(err);
  }
}

module.exports = fileHandler;
