const express = require('express');
const auth = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();

router.post('/upload-image', auth, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const imageUrl = await uploadImage(image);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
