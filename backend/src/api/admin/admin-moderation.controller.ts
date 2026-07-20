import { ListingStatus, RejectionReason } from '@makaan/shared/constants/enums';
import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { IsNull, Repository } from 'typeorm';

import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { Roles, RolesGuard } from '../../middleware/roles.guard';
import { AdminAction, AdminActionType } from '../../models/admin-action.entity';
import { AuthSession } from '../../models/auth-session.entity';
import { Listing } from '../../models/listing.entity';
import { SellerNotification } from '../../models/seller-notification.entity';
import { User, UserStatus } from '../../models/user.entity';
import { DuplicateDetectionService } from '../../services/duplicate-detection.service';

import { BlockUserDto } from './dto/block-user.dto';
import { RejectListingDto } from './dto/reject-listing.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminModerationController {
  constructor(
    private readonly duplicateDetectionService: DuplicateDetectionService,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminAction)
    private readonly adminActionRepository: Repository<AdminAction>,
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
    @InjectRepository(SellerNotification)
    private readonly sellerNotificationRepository: Repository<SellerNotification>,
  ) {}

  @Get('listings')
  async getSubmittedListings() {
    const listings = await this.listingRepository.find({
      where: {
        status: ListingStatus.SUBMITTED,
      },
      relations: {
        area: true,
        seller: {
          sellerProfile: true,
        },
      },
      order: {
        submittedAt: 'ASC',
      },
    });

    return {
      success: true,
      listings: listings.map((listing) => ({
        id: listing.id,
        submittedAt: listing.submittedAt?.toISOString() ?? null,
        area: listing.area?.nameEn ?? 'Unknown area',
        propertyType: listing.propertyType,
        priceEgp: Number(listing.priceEgp),
        sellerType: listing.seller?.sellerProfile?.sellerType ?? null,
        sellerPhone: this.maskPhone(listing.seller?.phoneNumber ?? ''),
      })),
    };
  }

  @Get('listings/:id')
  async getListingForReview(@Param('id') id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: {
        area: true,
        photos: true,
        seller: {
          sellerProfile: true,
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const duplicateHints = await this.duplicateDetectionService.findDuplicateHints(id);

    return {
      success: true,
      listing: {
        id: listing.id,
        purpose: listing.purpose,
        propertyType: listing.propertyType,
        sizeSqm: Number(listing.sizeSqm),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        finishingLevel: listing.finishingLevel,
        priceEgp: Number(listing.priceEgp),
        description: listing.description,
        status: listing.status,
        submittedAt: listing.submittedAt?.toISOString() ?? null,
        approvedAt: listing.approvedAt?.toISOString() ?? null,
        rejectionReason: listing.rejectionReason,
        location: {
          lat: listing.location.coordinates[1],
          lng: listing.location.coordinates[0],
        },
        area: {
          id: listing.area?.id ?? null,
          nameEn: listing.area?.nameEn ?? null,
        },
        photos: [...(listing.photos ?? [])]
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((photo) => ({
            id: photo.id,
            url: photo.cloudinaryUrl,
            width: photo.width,
            height: photo.height,
            order: photo.displayOrder,
          })),
        seller: {
          id: listing.sellerId,
          phone: this.maskPhone(listing.seller?.phoneNumber ?? ''),
          sellerType: listing.seller?.sellerProfile?.sellerType ?? null,
          isVerified: listing.seller?.sellerProfile?.isVerified ?? false,
        },
        duplicateHints,
      },
    };
  }

  @Post('listings/:id/approve')
  async approveListing(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id?: string } },
  ) {
    const listing = await this.getListingOrThrow(id);
    listing.status = ListingStatus.ACTIVE;
    listing.approvedAt = new Date();
    listing.rejectionReason = null;
    await this.listingRepository.save(listing);
    await this.recordAdminAction(request.user?.id, AdminActionType.APPROVE, {
      targetListingId: listing.id,
    });

    return {
      success: true,
      status: ListingStatus.ACTIVE,
    };
  }

  @Post('listings/:id/reject')
  async rejectListing(
    @Param('id') id: string,
    @Body() dto: RejectListingDto,
    @Req() request: Request & { user?: { id?: string } },
  ) {
    const listing = await this.getListingOrThrow(id);
    if (!Object.values(RejectionReason).includes(dto.reason)) {
      throw new NotFoundException('Invalid rejection reason');
    }

    listing.status = ListingStatus.REJECTED;
    listing.rejectionReason = dto.reason;
    await this.listingRepository.save(listing);
    await this.recordAdminAction(request.user?.id, AdminActionType.REJECT, {
      targetListingId: listing.id,
      reason: dto.reason,
      notes: dto.notes ?? null,
    });
    await this.sellerNotificationRepository.save(
      this.sellerNotificationRepository.create({
        sellerId: listing.sellerId,
        listingId: listing.id,
        rejectionReason: dto.reason,
        notes: dto.notes ?? null,
        isRead: false,
      }),
    );

    return {
      success: true,
      status: ListingStatus.REJECTED,
      rejectionReason: dto.reason,
    };
  }

  @Post('listings/:id/unpublish')
  async unpublishListing(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id?: string } },
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: ListingStatus.ACTIVE },
    });

    if (!listing) {
      throw new NotFoundException('Active listing not found');
    }

    listing.status = ListingStatus.INACTIVE;
    await this.listingRepository.save(listing);
    await this.recordAdminAction(request.user?.id, AdminActionType.UNPUBLISH, {
      targetListingId: listing.id,
    });

    return {
      success: true,
      status: ListingStatus.INACTIVE,
    };
  }

  @Post('users/:id/block')
  async blockUser(
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
    @Req() request: Request & { user?: { id?: string } },
  ) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.BLOCKED;
    await this.userRepository.save(user);
    await this.authSessionRepository.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.listingRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.INACTIVE })
      .where('seller_id = :sellerId', { sellerId: user.id })
      .andWhere('status IN (:...statuses)', {
        statuses: [ListingStatus.ACTIVE, ListingStatus.SUBMITTED],
      })
      .execute();
    await this.recordAdminAction(request.user?.id, AdminActionType.BLOCK_USER, {
      targetUserId: user.id,
      reason: dto.reason,
    });

    return {
      success: true,
      status: UserStatus.BLOCKED,
    };
  }

  private async getListingOrThrow(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id, status: ListingStatus.SUBMITTED },
    });

    if (!listing) {
      throw new NotFoundException('Submitted listing not found');
    }

    return listing;
  }

  private async recordAdminAction(
    adminId: string | undefined,
    actionType: AdminActionType,
    options: {
      targetListingId?: string | null;
      targetUserId?: string | null;
      reason?: string | null;
      notes?: string | null;
    },
  ) {
    if (!adminId) {
      throw new InternalServerErrorException('Missing authenticated admin identity');
    }

    await this.adminActionRepository.save(
      this.adminActionRepository.create({
        adminId,
        actionType,
        targetListingId: options.targetListingId ?? null,
        targetUserId: options.targetUserId ?? null,
        reason: options.reason ?? null,
        notes: options.notes ?? null,
      }),
    );
  }

  private maskPhone(phone: string): string {
    return phone.replace(/^(\+201\d)(\d{4})(\d{4})$/, '$1****$3');
  }
}
