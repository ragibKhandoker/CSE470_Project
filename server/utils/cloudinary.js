const cloudinary = require('cloudinary').v2;

// Cloudinary configuration setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image file buffer or path to Cloudinary
 */
const uploadImage = async (filePath, folder = 'sharemeal') => {
  try {
    // TODO: implement Cloudinary upload logic
    const result = await cloudinary.uploader.upload(filePath, { folder });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage
};
