const User = require('../../models/user');
const getUserInfo = require('../utils/getUserInfo');
const handleErrors = require('../utils/handleErrors');

module.exports = async function (req, res) {
  if (!req.accessToken) return res.send(401);
  try {
    let response = await User.find().sort({ firstName: 1 }).exec();
    response = response.map((elem) => getUserInfo(elem));
    res.send(response);
  } catch (err) {
    const message = handleErrors(err);
    res.status(404).json({ message });
  }
};
