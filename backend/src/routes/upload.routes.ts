import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload endpoint
router.post('/', upload.single('image'), async (req: any, res: any) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 File details:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: req.body.type === 'machine-update' ? 'machine-updates' : 'general',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 800, height: 600, crop: 'limit' }]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result?.public_id);
            resolve(result);
          }
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: result.secure_url,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: req.file.size
      }
    });
    
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

// Delete from Cloudinary endpoint
router.delete('/:publicId', async (req: any, res: any) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      result
    });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file'
    });
  }
});

export default router;