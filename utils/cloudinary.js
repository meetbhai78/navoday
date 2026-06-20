const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'daulyz7fl',
  api_key: process.env.CLOUDINARY_API_KEY || '922436663281344',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rcTYG6X0QIolmq5TD5CjNHHZqPc'
});

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'navoday'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return null;
  }
};

module.exports = { uploadToCloudinary };
