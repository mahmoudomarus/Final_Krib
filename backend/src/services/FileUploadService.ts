import { supabaseAdmin } from '../lib/supabase';
import { digitalOceanSpacesService } from './DigitalOceanSpacesService';
import * as fs from 'fs';
import * as path from 'path';

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

interface DocumentUpload {
  userId: string;
  documentType: 'emirates_id' | 'passport' | 'utility_bill' | 'salary_certificate' | 'trade_license';
  file: Buffer;
  filename: string;
  mimetype: string;
}

interface PropertyImageUpload {
  propertyId: string;
  hostId: string;
  files: Array<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }>;
}

export class FileUploadService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
    console.log('✅ File upload service initialized');
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
      
      // Create subdirectories
      const subdirs = ['documents', 'properties', 'avatars'];
      subdirs.forEach(dir => {
        const fullPath = path.join(this.uploadDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });
    } catch (error) {
      console.warn('Could not create upload directories, using mock uploads');
    }
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(originalName: string, prefix: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${prefix}${name}_${timestamp}_${random}${ext}`;
  }

  /**
   * Save file to Digital Ocean Spaces
   */
  private async saveFile(
    buffer: Buffer,
    folder: string,
    filename: string,
    mimetype: string = 'application/octet-stream'
  ): Promise<UploadResult> {
    try {
      // Generate the file key for Digital Ocean Spaces
      const fileKey = digitalOceanSpacesService.generateFileKey(folder, filename);
      
      // Upload to Digital Ocean Spaces
      const uploadResult = await digitalOceanSpacesService.uploadFile(
        buffer,
        fileKey,
        mimetype,
        true // Make files public by default
      );

      if (!uploadResult.success) {
        // Fallback to local storage in development if DO Spaces fails
        if (process.env.NODE_ENV === 'development') {
          console.warn('Digital Ocean Spaces upload failed, using local fallback:', uploadResult.error);
          const filePath = path.join(this.uploadDir, folder, filename);
          fs.writeFileSync(filePath, buffer);
          const localUrl = `/uploads/${folder}/${filename}`;
          
          return {
            success: true,
            url: localUrl,
            publicId: `${folder}/${filename}`
          };
        }
        
        return uploadResult;
      }

      return uploadResult;
    } catch (error) {
      console.error('File upload error:', error);
      
      // Fallback to local storage in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const filePath = path.join(this.uploadDir, folder, filename);
          fs.writeFileSync(filePath, buffer);
          const localUrl = `/uploads/${folder}/${filename}`;
          
          return {
            success: true,
            url: localUrl,
            publicId: `${folder}/${filename}`
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: 'Both cloud and local upload failed'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload identity documents for KYC verification
   */
  async uploadDocument(data: DocumentUpload): Promise<UploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(data.mimetype)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.'
        };
      }

      // Validate file size (10MB limit)
      if (data.file.length > 10 * 1024 * 1024) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        };
      }

      const filename = this.generateFilename(data.filename, `${data.documentType}_`);
      const folder = `documents/${data.userId}`;
      
      const uploadResult = await this.saveFile(data.file, folder, filename, data.mimetype);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update user record with document URL
      const updates: any = {
        updated_at: new Date().toISOString(),
        kyc_status: 'pending'
      };

      if (data.documentType === 'emirates_id') {
        updates.emirates_id = uploadResult.url;
      } else if (data.documentType === 'passport') {
        updates.passport_number = uploadResult.url;
      }

      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', data.userId);

      if (dbError) {
        console.error('Database update error:', dbError);
        return {
          success: false,
          error: 'Failed to save document information'
        };
      }

      // Log the document upload for audit
      await this.logDocumentUpload(data.userId, data.documentType, uploadResult.url!);

      return uploadResult;
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: 'Failed to upload document'
      };
    }
  }

  /**
   * Upload multiple property images
   */
  async uploadPropertyImages(data: PropertyImageUpload): Promise<{
    success: boolean;
    uploadedImages?: string[];
    failedUploads?: string[];
    error?: string;
  }> {
    try {
      if (data.files.length === 0) {
        return {
          success: false,
          error: 'No files provided'
        };
      }

      if (data.files.length > 10) {
        return {
          success: false,
          error: 'Maximum 10 images allowed per property'
        };
      }

      const uploadPromises = data.files.map(async (file, index) => {
        // Validate image type
        if (!file.mimetype.startsWith('image/')) {
          return {
            success: false,
            filename: file.filename,
            error: 'Only image files are allowed'
          };
        }

        // Validate file size (5MB limit for images)
        if (file.buffer.length > 5 * 1024 * 1024) {
          return {
            success: false,
            filename: file.filename,
            error: 'Image size too large. Maximum size is 5MB.'
          };
        }

        const filename = this.generateFilename(file.filename, `img_${index}_`);
        const folder = `properties/${data.propertyId}`;
        const result = await this.saveFile(file.buffer, folder, filename, file.mimetype);

        return {
          ...result,
          filename: file.filename
        };
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length === 0) {
        return {
          success: false,
          error: 'All image uploads failed',
          failedUploads: failed.map(f => f.filename || 'unknown')
        };
      }

      // Update property with new image URLs
      const imageUrls = successful.map(r => r.url).filter(Boolean);
      
      // Get existing images
      const { data: property } = await supabaseAdmin
        .from('properties')
        .select('images')
        .eq('id', data.propertyId)
        .eq('host_id', data.hostId)
        .single();

      let existingImages: string[] = [];
      if (property?.images) {
        existingImages = property.images.split(',').map((url: string) => url.trim()).filter(Boolean);
      }

      const allImages = [...existingImages, ...imageUrls];
      const imagesString = allImages.join(',');

      const { error: updateError } = await supabaseAdmin
        .from('properties')
        .update({
          images: imagesString,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.propertyId)
        .eq('host_id', data.hostId);

      if (updateError) {
        console.error('Property update error:', updateError);
        return {
          success: false,
          error: 'Failed to update property with new images'
        };
      }

      return {
        success: true,
        uploadedImages: imageUrls,
        failedUploads: failed.length > 0 ? failed.map(f => f.filename || 'unknown') : undefined
      };
    } catch (error) {
      console.error('Property images upload error:', error);
      return {
        success: false,
        error: 'Failed to upload property images'
      };
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: Buffer, filename: string, mimetype: string): Promise<UploadResult> {
    try {
      // Validate image type
      if (!mimetype.startsWith('image/')) {
        return {
          success: false,
          error: 'Only image files are allowed for avatars'
        };
      }

      // Validate file size (2MB limit for avatars)
      if (file.length > 2 * 1024 * 1024) {
        return {
          success: false,
          error: 'Avatar size too large. Maximum size is 2MB.'
        };
      }

      const filename_new = this.generateFilename(filename, `avatar_${userId}_`);
      const folder = `avatars`;
      const uploadResult = await this.saveFile(file, folder, filename_new, mimetype);

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update user avatar
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({
          avatar: uploadResult.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (dbError) {
        console.error('Avatar update error:', dbError);
        return {
          success: false,
          error: 'Failed to update user avatar'
        };
      }

      return uploadResult;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'Failed to upload avatar'
      };
    }
  }

  /**
   * Log document upload for audit trail
   */
  private async logDocumentUpload(userId: string, documentType: string, documentUrl: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          event_type: 'document_upload',
          user_id: userId,
          event_data: {
            document_type: documentType,
            document_url: documentUrl,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log document upload:', error);
    }
  }

  /**
   * Get file upload limits and allowed types
   */
  getUploadLimits() {
    return {
      documents: {
        maxSize: '10MB',
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        maxFiles: 1
      },
      propertyImages: {
        maxSize: '5MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        maxFiles: 10
      },
      avatar: {
        maxSize: '2MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        maxFiles: 1
      }
    };
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Buffer, mimetype: string, maxSize: number, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.length > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }
}

export const fileUploadService = new FileUploadService(); 