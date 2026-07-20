import { Inject, Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import sharp from 'sharp';

import { CLOUDINARY, getListingUploadFolder } from '../config/cloudinary.config';

type UploadableImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type ProcessedImageResult = {
  url: string;
  width: number;
  height: number;
};

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ImageProcessingService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary,
  ) {}

  async processListingImage(
    file: UploadableImage,
    listingId: string,
  ): Promise<ProcessedImageResult> {
    this.validateFile(file);

    const { data, info } = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const uploadResponse = await this.uploadToCloudinary(data, listingId, file.originalname);

    return {
      url: uploadResponse.secure_url,
      width: info.width,
      height: info.height,
    };
  }

  private validateFile(file: UploadableImage): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        'Only jpg, png, and webp images are supported',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new UnsupportedMediaTypeException('Image must be 5MB or smaller');
    }
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    listingId: string,
    originalFilename: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: getListingUploadFolder(listingId),
          resource_type: 'image',
          format: 'webp',
          public_id: originalFilename.replace(/\.[^.]+$/, ''),
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }
}

