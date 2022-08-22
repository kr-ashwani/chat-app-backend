const handleErrors = require('../utils/handleErrors');

const sendUploadedFileLink = (req, res) => {
  try {
    if (!req.user) return res.status(403).json('please login');

    res.status(200).json({ fileUrl: req.fileURL });
  } catch (err) {
    const message = handleErrors(err);
    res.status(400).json({ success: false, message });
  }
};

module.exports = sendUploadedFileLink;
