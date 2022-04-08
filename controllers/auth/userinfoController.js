const getUserInfo = require("../getUserInfo");

exports.userinfoController = async (req, res) => {
  const accessToken = req.headers.authorization.split(" ").pop();
  try {
    if (accessToken) {
      const currentUser = await getUserInfo(accessToken);

      res.status(200).json({ currentUser });
    } else throw new Error("access token required");
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
