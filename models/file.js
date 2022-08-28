const mongoose = require('mongoose');

const schemaOptions = {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'lastLoginAt',
  },
};

const FileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'filename is  missing'],
    },
    size: {
      type: Number,
      required: [true, 'filesize is  missing'],
    },
    type: {
      type: String,
      required: [true, 'filetype is  missing'],
    },
    url: {
      type: String,
      required: [true, 'fileurl is  missing'],
    },
    extension: {
      type: String,
      required: [true, 'extension is  missing'],
    },
  },
  schemaOptions
);

const File = mongoose.model('file', FileSchema);
module.exports = File;
