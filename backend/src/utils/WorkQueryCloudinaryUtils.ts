// utils/workQueryCloudinaryUtils.ts
import {cloudinary} from '../config/cloudinary';
import { Readable } from 'stream';

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateWorkQueryFile = (mimetype: string, originalname: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimetype);
};

// Upload image to Cloudinary
export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = 'work-queries'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Upload multiple images to Cloudinary
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'work-queries'
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder));
  const results = await Promise.all(uploadPromises);
  
  return results.map((result: any) => ({
    url: result.secure_url,
    publicId: result.public_id
  }));
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Delete multiple images from Cloudinary
export const deleteMultipleFromCloudinary = async (publicIds: string[]): Promise<boolean[]> => {
  const deletePromises = publicIds.map(id => deleteFromCloudinary(id));
  return Promise.all(deletePromises);
};