// src/utils/gcsUploader.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const uuid = require('uuid');
require('dotenv').config();

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket('uniunity_bucket'); 

async function uploadImageToGCS(fileBuffer, originalName) {
  const fileName = `${uuid.v4()}_${originalName}`;
  const file = bucket.file(fileName);

  await file.save(fileBuffer, {
    resumable: false,
    contentType: 'image/jpeg',
    public: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

module.exports = { uploadImageToGCS };
