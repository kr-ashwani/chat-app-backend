module.exports = async function (req, res) {
  res.clearCookie('_auth_token');
  res.sendStatus(200);
};
