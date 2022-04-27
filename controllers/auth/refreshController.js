const handleErrors = require('../utils/handleErrors');

async function refreshController(req, res) {
  const { accessToken } = req;
  try {
    res.status(200).json({ accessToken });
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = refreshController;
