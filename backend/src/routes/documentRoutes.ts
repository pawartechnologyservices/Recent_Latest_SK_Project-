import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Document from '../models/documents.model';
import mongoose from 'mongoose';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed.'));
    }
  }
});

// Upload document endpoint
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('📤 Document upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { folder = 'documents', description, category } = req.body;
    
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder,
      category
    });

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(req.file!.buffer);
    });

    console.log('✅ Cloudinary upload successful:', result.public_id);

    // Determine category based on mimetype if not provided
    let finalCategory = category;
    if (!finalCategory) {
      if (req.file.mimetype.startsWith('image/')) {
        finalCategory = 'image';
      } else if (req.file.mimetype === 'application/pdf') {
        finalCategory = 'document';
      } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document')) {
        finalCategory = 'document';
      } else if (req.file.mimetype.includes('sheet') || req.file.mimetype.includes('excel')) {
        finalCategory = 'spreadsheet';
      } else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) {
        finalCategory = 'presentation';
      } else {
        finalCategory = 'other';
      }
    }

    // Save to database
    const document = new Document({
      url: result.secure_url,
      public_id: result.public_id,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder: folder,
      category: finalCategory,
      description: description || '',
      tags: [],
      isArchived: false,
      uploadedAt: new Date(),
      lastAccessed: new Date()
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        originalname: req.file.originalname,
        documentId: document._id,
        mimetype: req.file.mimetype,
        category: finalCategory
      }
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
});

// Get all documents with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    const query: any = { isArchived: false };
    if (category) {
      query.category = category;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Documents fetched successfully',
      data: documents,
      count: documents.length,
      total: total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch documents'
    });
  }
});

// Get document by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Update last accessed
    document.lastAccessed = new Date();
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document fetched successfully',
      data: document
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch document'
    });
  }
});

// Save document metadata (POST to /documents)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      originalname,
      url,
      public_id,
      mimetype,
      size,
      folder,
      category,
      description,
      tags
    } = req.body;
    
    const document = new Document({
      originalname,
      url,
      public_id,
      mimetype,
      size,
      folder: folder || 'documents',
      category: category || 'document',
      description,
      tags: tags || [],
      isArchived: false,
      uploadedAt: new Date(),
      lastAccessed: new Date()
    });
    
    await document.save();
    
    res.status(201).json({
      success: true,
      message: 'Document metadata saved successfully',
      data: document
    });
    
  } catch (error: any) {
    console.error('❌ Error saving document metadata:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save document metadata'
    });
  }
});

// Delete document
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format'
      });
    }
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(document.public_id);
      console.log('✅ Deleted from Cloudinary:', document.public_id);
    } catch (cloudinaryError) {
      console.error('⚠️ Cloudinary deletion failed:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }
    
    // Delete from database
    await Document.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document'
    });
  }
});

// Search documents
router.get('/search/all', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const documents = await Document.find({
      $or: [
        { originalname: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q as string, 'i')] } },
        { folder: { $regex: q, $options: 'i' } }
      ],
      isArchived: false
    }).sort({ uploadedAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Search completed',
      data: documents,
      count: documents.length
    });
    
  } catch (error: any) {
    console.error('❌ Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search documents'
    });
  }
});

export default router;