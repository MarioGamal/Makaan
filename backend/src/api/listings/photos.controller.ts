import {
  Controller,
  Delete,
  ForbiddenException,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { Roles, RolesGuard } from '../../middleware/roles.guard';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { ImageProcessingService } from '../../utils/image.service';

@Controller('seller/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
export class PhotosController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles()
    files: Array<{
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    }>,
    @Req() request: Request & { user?: { id: string } },
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id, sellerId: request.user?.id },
    });
    if (!listing) {
      throw new ForbiddenException('Listing not found or not owned by seller.');
    }

    const existingCount = await this.photoRepository.count({ where: { listingId: id } });
    if (existingCount + files.length > 10) {
      throw new ForbiddenException('Maximum 10 photos allowed per listing.');
    }

    const createdPhotos: Photo[] = [];
    for (const [index, file] of files.entries()) {
      const processed = await this.imageProcessingService.processListingImage(file, id);
      const photo = await this.photoRepository.save(
        this.photoRepository.create({
          listingId: id,
          cloudinaryUrl: processed.url,
          displayOrder: existingCount + index,
          originalFilename: file.originalname,
          width: processed.width,
          height: processed.height,
        }),
      );
      createdPhotos.push(photo);
    }

    return {
      photos: createdPhotos.map((photo) => ({
        id: photo.id,
        url: photo.cloudinaryUrl,
        order: photo.displayOrder,
      })),
    };
  }

  @Delete(':id/photos/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Req() request: Request & { user?: { id: string } },
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id, sellerId: request.user?.id },
    });
    if (!listing) {
      throw new ForbiddenException('Listing not found or not owned by seller.');
    }

    const photo = await this.photoRepository.findOne({
      where: { id: photoId, listingId: id },
    });
    if (!photo) {
      throw new ForbiddenException('Photo not found.');
    }

    const publicId = photo.cloudinaryUrl.split('/upload/')[1]?.replace(/^[^/]+\//, '').replace(/\.webp$/, '');
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    await this.photoRepository.delete({ id: photoId });
    return { success: true };
  }
}
