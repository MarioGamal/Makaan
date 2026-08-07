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
import { Repository } from 'typeorm';

import { RequireCsrfScope, CsrfGuard } from '../../middleware/csrf.guard';
import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AuthSessionScope } from '../../models/auth-session.entity';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { AbuseControlService } from '../../services/abuse-control.service';
import { ImageProcessingService } from '../../utils/image.service';

@Controller('seller/listings')
@UseGuards(SessionGuard, CsrfGuard)
@RequireSessionScope(AuthSessionScope.SELLER)
@RequireCsrfScope(AuthSessionScope.SELLER)
export class PhotosController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly abuseControlService: AbuseControlService,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  @Post(':id/media')
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
    @Req() request: SessionRequest,
  ) {
    const sellerId = request.makaanSession?.userId;
    if (!sellerId) {
      throw new ForbiddenException('seller_session_required');
    }
    await this.abuseControlService.consume('upload', ['seller', sellerId]);
    const listing = await this.listingRepository.findOne({
      where: { id, sellerId },
    });
    if (!listing) {
      throw new ForbiddenException('Listing not found or not owned by seller.');
    }

    const existingCount = await this.photoRepository.count({
      where: { listingId: id },
    });
    if (existingCount + files.length > 10) {
      throw new ForbiddenException('Maximum 10 photos allowed per listing.');
    }

    const createdPhotos: Photo[] = [];
    for (const [index, file] of files.entries()) {
      const processed = await this.imageProcessingService.processListingImage(
        file,
        id,
      );
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

  @Delete(':id/media/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Req() request: SessionRequest,
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id, sellerId: request.makaanSession?.userId },
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

    await this.imageProcessingService.deleteListingImage(photo.cloudinaryUrl);

    await this.photoRepository.delete({ id: photoId });
    return { success: true };
  }
}
