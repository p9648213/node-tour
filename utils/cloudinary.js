const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinaryBase64 = (image, userId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      image,
      {
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
        public_id: publicId,
      },
      (error, result) => {
        if (result && result.secure_url) {
          return resolve(result.secure_url);
        }
        return reject(error);
      }
    );
  });
};

const uploadToCloudinaryBuffer = (image, publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          overwrite: true,
          invalidate: true,
          public_id: publicId,
        },
        (error, result) => {
          if (result && result.secure_url) {
            return resolve(result.secure_url);
          }
          return reject(error);
        }
      )
      .end(image);
  });
};

module.exports = { uploadToCloudinaryBuffer, uploadToCloudinaryBase64 };
