const getUserInfo = require('../utils/getUserInfo');
const handleErrors = require('../utils/handleErrors');

exports.userinfoController = async (req, res) => {
  const { accessToken, user } = req;
  try {
    if (accessToken) {
      const currentUser = await getUserInfo(user);

      res.status(200).json({ currentUser });
    } else throw new Error('access token required');
  } catch (err) {
    const message = handleErrors(err);
    res.status(404).json({ message });
  }
};
