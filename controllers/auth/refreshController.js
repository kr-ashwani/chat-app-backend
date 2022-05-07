const handleErrors = require('../utils/handleErrors');

async function refreshController(req, res) {
  const { accessToken, user } = req;
  try {
    res.status(200).json({ accessToken, currentUser: user });
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = refreshController;
