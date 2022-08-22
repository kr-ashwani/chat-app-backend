const express = require('express');
const sendUploadedFileLink = require('../../controllers/FileUploadS3/sendUploadedFileLink');
const { uploadFileS3 } = require('../../middleware/filesS3/uploadFileS3');

const router = express.Router();

router.post('/uploadfile', uploadFileS3, sendUploadedFileLink);

module.exports = router;
