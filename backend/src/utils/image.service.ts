import { randomUUID } from 'node:crypto';

import {
  Inject,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import sharp from 'sharp';

import {
  CLOUDINARY,
  getListingUploadFolder,
} from '../config/cloudinary.config';
import { LocalMediaProvider } from '../services/providers/local/local-media.provider';
import { resolveRepositoryPath } from '../services/providers/providers.module';

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
  private readonly mediaProvider: 'local' | 'cloudinary';
  private readonly localMedia?: LocalMediaProvider;

  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary,
    private readonly configService: ConfigService,
  ) {
    this.mediaProvider =
      this.configService.get<string>('MEDIA_PROVIDER') === 'local'
        ? 'local'
        : 'cloudinary';
    if (this.mediaProvider === 'local') {
      this.localMedia = new LocalMediaProvider(
        resolveRepositoryPath(
          this.configService.getOrThrow<string>('LOCAL_MEDIA_ROOT'),
        ),
      );
    }
  }

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

    const url = await this.storeProcessedImage(data, listingId);

    return {
      url,
      width: info.width,
      height: info.height,
    };
  }

  /** Deletes only references issued by this service; it never derives a disk path from untrusted input. */
  async deleteListingImage(url: string): Promise<void> {
    if (this.mediaProvider === 'local') {
      const reference = this.parseLocalPreviewUrl(url);
      if (reference && this.localMedia) {
        await this.localMedia.delete({
          namespace: 'listing-media',
          key: reference,
        });
      }
      return;
    }

    const publicId = url
      .split('/upload/')[1]
      ?.replace(/^[^/]+\//, '')
      .replace(/\.[^.]+$/, '');
    if (publicId) {
      await this.cloudinary.uploader.destroy(publicId);
    }
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

  private async storeProcessedImage(
    buffer: Buffer,
    listingId: string,
  ): Promise<string> {
    const objectName = `${randomUUID()}.webp`;
    const key = `${listingId}/${objectName}`;
    if (this.mediaProvider === 'local') {
      if (!this.localMedia) {
        throw new Error('Local media provider is unavailable.');
      }
      await this.localMedia.write({
        namespace: 'listing-media',
        key,
        bytes: buffer,
        contentType: 'image/webp',
      });
      return new URL(
        `/media/listings/${key}`,
        `http://localhost:${this.configService.getOrThrow<number>('PORT')}`,
      ).toString();
    }

    const uploadResponse = await this.uploadToCloudinary(
      buffer,
      listingId,
      objectName,
    );
    return uploadResponse.secure_url;
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    listingId: string,
    objectName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: getListingUploadFolder(listingId),
          resource_type: 'image',
          format: 'webp',
          public_id: objectName.replace(/\.[^.]+$/, ''),
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

  private parseLocalPreviewUrl(url: string): string | undefined {
    let pathname: string;
    try {
      pathname = new URL(url, 'http://local-preview').pathname;
    } catch {
      return undefined;
    }
    const match =
      /^\/media\/listings\/([0-9a-f-]{36}\/[0-9a-f-]{36}\.webp)$/i.exec(
        pathname,
      );
    return match?.[1];
  }
}
