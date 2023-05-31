const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const handleErrors = require('../../controllers/utils/handleErrors');

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_ID,
  secretAccessKey: process.env.S3_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});
const upload = (bucket) =>
  multer({
    storage: multerS3({
      s3,
      bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key(req, file, cb) {
        const fileName = file.originalname.split('.');
        const fileExten = fileName.pop();
        cb(null, `${fileName.join('.')}-${Date.now()}.${fileExten}`);
      },
    }),
  });

const uploadFileS3 = async (req, res, next) => {
  try {
    const uploadSingle = upload(process.env.S3_BUCKET_NAME).single(
      'file-upload'
    );

    uploadSingle(req, res, (err) => {
      if (err) {
        const message = handleErrors(err);
        res.status(500).json({ success: false, message });
      }
      if (!req.file) return next();
      //  populating imageURL property on req
      req.fileURL = req.file.location;
      next();
    });
  } catch (err) {
    const message = handleErrors(err);
    res.status(500).json({ success: false, message });
  }
};

module.exports = { uploadFileS3 };
