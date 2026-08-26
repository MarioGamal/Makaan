import {
  v2 as cloudinaryClient,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';

import {
  MediaObjectReference,
  MediaProvider,
  StoredMediaObject,
  WriteMediaInput,
} from '../media.provider';

export class CloudinaryMediaProvider implements MediaProvider {
  constructor(private readonly client: typeof cloudinaryClient) {}

  async write(input: WriteMediaInput): Promise<StoredMediaObject> {
    await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = this.client.uploader.upload_stream(
        {
          public_id: this.publicId(input),
          resource_type: 'image',
          overwrite: false,
        },
        (
          error?: UploadApiErrorResponse,
          result?: UploadApiResponse,
        ) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed.'));
            return;
          }
          resolve(result);
        },
      );
      stream.end(input.bytes);
    });

    return {
      namespace: input.namespace,
      key: input.key,
      byteLength: input.bytes.byteLength,
      contentType: input.contentType,
    };
  }

  async read(reference: MediaObjectReference): Promise<Buffer> {
    const response = await fetch(
      this.client.url(this.publicId(reference), {
        secure: true,
        resource_type: 'image',
      }),
    );
    if (!response.ok) throw new Error('Cloudinary media read failed.');
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(reference: MediaObjectReference): Promise<void> {
    await this.client.uploader.destroy(this.publicId(reference), {
      resource_type: 'image',
    });
  }

  private publicId(reference: MediaObjectReference): string {
    return `makaan/${reference.namespace}/${reference.key.replace(/\.[^.]+$/, '')}`;
  }
}
