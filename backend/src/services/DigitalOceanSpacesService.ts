import AWS from 'aws-sdk';

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export class DigitalOceanSpacesService {
  private spacesEndpoint: AWS.S3;
  private bucketName: string;
  private cdnEndpoint: string;

  constructor() {
    // Configure Digital Ocean Spaces (S3-compatible)
    this.spacesEndpoint = new AWS.S3({
      endpoint: process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com',
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID || 'DO00B8XZ7NXWHKE4M9PM',
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY || 'QAmwFUmqYiGGbtc9YhEOyPIoxQjMxzBHAWycT99DDX8',
      region: process.env.DO_SPACES_REGION || 'sgp1',
      s3ForcePathStyle: false, // Configures to use subdomain/virtual calling format
      signatureVersion: 'v4'
    });

    this.bucketName = process.env.DO_SPACES_BUCKET || 'kribbucket';
    this.cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT || 'https://kribbucket.sgp1.cdn.digitaloceanspaces.com';
    
    console.log('✅ Digital Ocean Spaces service initialized');
  }

  /**
   * Upload file to Digital Ocean Spaces
   */
  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
    isPublic: boolean = true
  ): Promise<UploadResult> {
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
        CacheControl: 'max-age=31536000', // 1 year cache
      };

      // Add metadata for better organization
      uploadParams.Metadata = {
        'uploaded-at': new Date().toISOString(),
        'service': 'krib-platform'
      };

      const result = await this.spacesEndpoint.upload(uploadParams).promise();
      
      // Use CDN endpoint for better performance
      const cdnUrl = result.Location.replace(
        `https://${this.bucketName}.${process.env.DO_SPACES_REGION || 'sgp1'}.digitaloceanspaces.com`,
        this.cdnEndpoint
      );

      return {
        success: true,
        url: cdnUrl,
        publicId: key
      };
    } catch (error) {
      console.error('Digital Ocean Spaces upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete file from Digital Ocean Spaces
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.spacesEndpoint.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return { success: true };
    } catch (error) {
      console.error('Digital Ocean Spaces delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Generate a signed URL for private files
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.spacesEndpoint.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      });
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.spacesEndpoint.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput | null> {
    try {
      const result = await this.spacesEndpoint.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      return result;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * List files with prefix
   */
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<AWS.S3.Object[]> {
    try {
      const result = await this.spacesEndpoint.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      }).promise();
      
      return result.Contents || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Generate optimized key for file organization
   */
  generateFileKey(folder: string, filename: string, userId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (userId) {
      return `${folder}/${userId}/${timestamp}_${random}_${sanitizedFilename}`;
    }
    
    return `${folder}/${timestamp}_${random}_${sanitizedFilename}`;
  }

  /**
   * Get bucket info and usage statistics
   */
  async getBucketInfo(): Promise<{
    name: string;
    region: string;
    endpoint: string;
    cdnEndpoint: string;
  }> {
    return {
      name: this.bucketName,
      region: process.env.DO_SPACES_REGION || 'sgp1',
      endpoint: process.env.DO_SPACES_ENDPOINT || 'https://sgp1.digitaloceanspaces.com',
      cdnEndpoint: this.cdnEndpoint
    };
  }
}

export const digitalOceanSpacesService = new DigitalOceanSpacesService(); 