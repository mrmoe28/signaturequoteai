import { createHash } from 'crypto';
import { mkdir, writeFile, access, constants } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { createLogger, logOperation } from './logger';
import type { ProductImage } from './types';

const logger = createLogger('image-storage');

export type ImageStorageConfig = {
  baseDir: string;
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  generateThumbnails: boolean;
  cdnBaseUrl?: string;
};

const DEFAULT_CONFIG: ImageStorageConfig = {
  baseDir: join(process.cwd(), 'public/images/products'),
  maxFileSizeMB: 10,
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/avif'
  ],
  generateThumbnails: false,
  cdnBaseUrl: process.env.CDN_BASE_URL,
};

export class ImageStorageService {
  private config: ImageStorageConfig;

  constructor(config: Partial<ImageStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    await logOperation(logger, 'initialize_storage', async () => {
      // Ensure base directory exists
      await mkdir(this.config.baseDir, { recursive: true });
      
      // Create subdirectories for organization
      const subdirs = ['thumbs', 'full'];
      for (const subdir of subdirs) {
        await mkdir(join(this.config.baseDir, subdir), { recursive: true });
      }
    });
  }

  private generateImageId(productId: string, originalUrl: string): string {
    const hash = createHash('sha256')
      .update(`${productId}-${originalUrl}`)
      .digest('hex')
      .substring(0, 16);
    return hash;
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/avif': '.avif',
    };
    return extensions[mimeType] || '.jpg';
  }

  private async validateImage(buffer: Buffer, mimeType: string): Promise<void> {
    // Check file size
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > this.config.maxFileSizeMB) {
      throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB > ${this.config.maxFileSizeMB}MB`);
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}`);
    }

    // Basic image validation - check for image headers
    if (mimeType.includes('jpeg') && !buffer.subarray(0, 4).includes(0xFF)) {
      throw new Error('Invalid JPEG image format');
    }
    if (mimeType.includes('png') && buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw new Error('Invalid PNG image format');
    }
  }

  async downloadAndStoreImage(
    productId: string,
    imageUrl: string,
    isPrimary: boolean = false,
    alt?: string
  ): Promise<ProductImage> {
    return logOperation(logger, 'download_store_image', async () => {
      // Fetch the image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SignatureQuoteCrawler/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Validate image
      await this.validateImage(buffer, contentType);

      // Generate unique image ID and paths
      const imageId = this.generateImageId(productId, imageUrl);
      const extension = this.getFileExtension(contentType);
      const fileName = `${imageId}${extension}`;
      
      // Create directory structure: products/{productId}/
      const productDir = join(this.config.baseDir, 'full', productId);
      await mkdir(productDir, { recursive: true });
      
      const localPath = join(productDir, fileName);
      const relativePath = `/images/products/full/${productId}/${fileName}`;

      // Check if image already exists
      try {
        await access(localPath, constants.F_OK);
        logger.debug({ imageId, localPath }, 'Image already exists, skipping download');
      } catch {
        // Image doesn't exist, write it
        await writeFile(localPath, buffer);
        logger.debug({ 
          imageId, 
          localPath, 
          fileSize: buffer.length 
        }, 'Image downloaded and stored');
      }

      // Construct the public URL
      const publicUrl = this.config.cdnBaseUrl 
        ? `${this.config.cdnBaseUrl}${relativePath}`
        : relativePath;

      const productImage: ProductImage = {
        id: imageId,
        url: imageUrl,
        localPath: publicUrl,
        alt: alt || `Product image for ${productId}`,
        isPrimary,
        fileSize: buffer.length,
        mimeType: contentType,
        // TODO: Add image dimensions if needed
      };

      return productImage;
    }, { productId, imageUrl });
  }

  async downloadProductImages(
    productId: string, 
    imageUrls: string[],
    productName?: string
  ): Promise<ProductImage[]> {
    return logOperation(logger, 'download_product_images', async () => {
      if (!imageUrls.length) {
        return [];
      }

      const images: ProductImage[] = [];
      const maxImages = 5; // Limit to prevent abuse
      const urlsToProcess = imageUrls.slice(0, maxImages);

      for (let i = 0; i < urlsToProcess.length; i++) {
        const imageUrl = urlsToProcess[i];
        const isPrimary = i === 0; // First image is primary
        
        try {
          const image = await this.downloadAndStoreImage(
            productId,
            imageUrl,
            isPrimary,
            productName ? `${productName} - Image ${i + 1}` : undefined
          );
          images.push(image);
          
          // Add small delay between downloads
          if (i < urlsToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          logger.warn({ 
            productId, 
            imageUrl, 
            error: error instanceof Error ? error.message : String(error)
          }, 'Failed to download product image');
        }
      }

      return images;
    }, { productId, imageCount: imageUrls.length });
  }

  async deleteProductImages(productId: string): Promise<void> {
    return logOperation(logger, 'delete_product_images', async () => {
      const productDir = join(this.config.baseDir, 'full', productId);
      
      try {
        // Check if directory exists
        await access(productDir, constants.F_OK);
        
        // Remove directory and all contents
        const { rmdir } = await import('fs/promises');
        await rmdir(productDir, { recursive: true });
        
        logger.info({ productId }, 'Product images deleted');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          logger.warn({ productId, error }, 'Failed to delete product images');
          throw error;
        }
      }
    }, { productId });
  }

  getImageUrl(image: ProductImage): string {
    return image.localPath;
  }

  async getStorageStats(): Promise<{
    totalImages: number;
    totalSizeMB: number;
    storageDir: string;
  }> {
    // Implementation would walk the directory tree and calculate stats
    // For now, return basic info
    return {
      totalImages: 0,
      totalSizeMB: 0,
      storageDir: this.config.baseDir,
    };
  }
}

export const imageStorage = new ImageStorageService();