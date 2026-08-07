import { createHash } from 'node:crypto';

import {
  ListingStatus,
  RejectionReason,
  SellerType,
} from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';

import { CorrelatedRequest } from '../../middleware/correlation-id.middleware';
import { RequireCsrfScope, CsrfGuard } from '../../middleware/csrf.guard';
import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AdminAction, AdminActionType } from '../../models/admin-action.entity';
import { AuditActorKind } from '../../models/audit-event.entity';
import {
  AuthSession,
  AuthSessionScope,
} from '../../models/auth-session.entity';
import { Listing, PublicLocationMode } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { SellerNotification } from '../../models/seller-notification.entity';
import {
  SellerProfile,
  SellerVerificationState,
} from '../../models/seller-profile.entity';
import { User, UserStatus } from '../../models/user.entity';
import { AuditService } from '../../services/audit.service';
import { derivePublicParticipationLabel } from '../../services/participation.service';

import { ApproveListingDto } from './dto/approve-listing.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { UnpublishListingDto } from './dto/unpublish-listing.dto';

type AdminRequest = SessionRequest & CorrelatedRequest;

@Controller('admin')
@UseGuards(SessionGuard)
@RequireSessionScope(AuthSessionScope.ADMIN)
export class AdminModerationController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  @Get('listings')
  async getListings(
    @Query('status') status = ListingStatus.SUBMITTED,
    @Query('participation') participation?: string,
    @Query('page') pageValue = '1',
    @Query('pageSize') pageSizeValue = '30',
  ) {
    const page = Math.max(1, Number.parseInt(pageValue, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(pageSizeValue, 10) || 30),
    );
    const listings = await this.dataSource.getRepository(Listing).find({
      where: { status: status as ListingStatus },
      relations: { area: true, seller: { sellerProfile: true } },
      order: { submittedAt: 'ASC' },
    });
    const mapped = listings.map((listing) => ({
      id: listing.id,
      titleAr: listing.titleAr,
      titleEn: listing.titleEn,
      submittedAt: listing.submittedAt?.toISOString() ?? null,
      area: {
        id: listing.area?.id ?? null,
        nameAr: listing.area?.nameAr ?? null,
        nameEn: listing.area?.nameEn ?? null,
      },
      propertyType: listing.propertyType,
      purpose: listing.purpose,
      priceEgp: Number(listing.priceEgp),
      participation: listing.seller?.sellerProfile
        ? derivePublicParticipationLabel(listing.seller.sellerProfile)
        : 'owner_not_verified',
      lockVersion: listing.lockVersion,
    }));
    const filtered = participation
      ? mapped.filter((listing) => listing.participation === participation)
      : mapped;
    const offset = (page - 1) * pageSize;
    return {
      items: filtered.slice(offset, offset + pageSize),
      page,
      pageSize,
      total: filtered.length,
      hasMore: offset + pageSize < filtered.length,
    };
  }

  @Get('listings/:id')
  async getListingForReview(@Param('id') id: string) {
    const listing = await this.dataSource.getRepository(Listing).findOne({
      where: { id },
      relations: { area: true, photos: true, seller: { sellerProfile: true } },
    });
    if (!listing) throw new NotFoundException('listing_not_found');
    const actions = await this.dataSource.getRepository(AdminAction).find({
      where: { targetListingId: id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const profile = listing.seller?.sellerProfile;
    const proposedPublicLocation = await this.proposedPublicLocation(listing);
    const publicParticipation = profile
      ? derivePublicParticipationLabel(profile)
      : 'owner_not_verified';
    return {
      id: listing.id,
      titleAr: listing.titleAr,
      titleEn: listing.titleEn,
      descriptionAr: listing.descriptionAr,
      descriptionEn: listing.descriptionEn,
      purpose: listing.purpose,
      propertyType: listing.propertyType,
      sizeSqm: Number(listing.sizeSqm),
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      finishingLevel: listing.finishingLevel,
      priceEgp: Number(listing.priceEgp),
      floorNumber: listing.floorNumber,
      amenities: listing.amenities,
      status: listing.status,
      lockVersion: listing.lockVersion,
      currentRevisionId: listing.currentRevisionId,
      submittedAt: listing.submittedAt?.toISOString() ?? null,
      exactLocation: {
        latitude: listing.location.coordinates[1],
        longitude: listing.location.coordinates[0],
      },
      proposedPublicLocation,
      area: {
        id: listing.area?.id ?? null,
        nameAr: listing.area?.nameAr ?? null,
        nameEn: listing.area?.nameEn ?? null,
      },
      media: [...(listing.photos ?? [])]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((photo) => ({
          id: photo.id,
          previewUrl: photo.cloudinaryUrl,
          width: photo.width,
          height: photo.height,
          displayOrder: photo.displayOrder,
          state: 'clean' as const,
        })),
      seller: {
        id: listing.sellerId,
        phone: null,
        participation: publicParticipation,
        isVerified: profile?.verificationState === 'verified',
      },
      declaration: {
        participation: publicParticipation,
        submittedAt: listing.submittedAt?.toISOString() ?? null,
        publicLocationConsent: listing.sellerPublicLocationMode,
      },
      revision: {
        id: listing.currentRevisionId ?? undefined,
        submittedAt: listing.submittedAt?.toISOString() ?? null,
        version: listing.lockVersion,
      },
      decisions: actions.map((action) => ({
        id: action.id,
        action:
          action.actionType === AdminActionType.APPROVE
            ? 'approved'
            : action.actionType === AdminActionType.REJECT
              ? 'rejected'
              : 'unpublished',
        reasonCode: action.reason,
        internalReason: action.notes,
        createdAt: action.createdAt.toISOString(),
      })),
    };
  }

  @Post('listings/:id/approve')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.ADMIN)
  async approveListing(
    @Param('id') id: string,
    @Body() dto: ApproveListingDto,
    @Req() request: AdminRequest,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Listing);
      const listing = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      this.assertReviewable(listing, dto.lockVersion);
      const [profile, photos] = await Promise.all([
        manager.getRepository(SellerProfile).findOne({
          where: { userId: listing!.sellerId },
        }),
        manager.getRepository(Photo).find({
          where: { listingId: listing!.id },
          order: { displayOrder: 'ASC' },
        }),
      ]);
      if (!profile) throw new BadRequestException('seller_profile_required');
      if (!listing!.currentRevisionId)
        throw new BadRequestException('submitted_revision_required');
      listing!.photos = photos;
      if (photos.length < 3)
        throw new BadRequestException('minimum_three_media_required');
      if (
        listing!.sellerPublicLocationMode === PublicLocationMode.AREA_ONLY &&
        dto.approvedPublicLocation.mode === PublicLocationMode.APPROXIMATE
      ) {
        throw new BadRequestException('public_precision_exceeds_consent');
      }

      const participationOutcome =
        dto.participationOutcome === 'declared_agent'
          ? SellerType.AGENT
          : SellerType.OWNER;
      profile.moderatorParticipationOverride =
        participationOutcome === profile.declaredParticipation
          ? null
          : participationOutcome;
      profile.verificationState =
        dto.participationOutcome === 'verified_owner'
          ? SellerVerificationState.VERIFIED
          : SellerVerificationState.NOT_VERIFIED;
      if (participationOutcome === SellerType.AGENT) {
        profile.agentDeclarationConfirmedVersion =
          profile.participationDeclarationVersion;
        profile.agentDeclarationConfirmedAt = new Date();
        profile.agentDeclarationConfirmedBy = request.makaanSession!.userId;
      }
      await manager.getRepository(SellerProfile).save(profile);

      listing!.approvedPublicLocationMode = dto.approvedPublicLocation.mode;
      if (dto.approvedPublicLocation.mode === PublicLocationMode.APPROXIMATE) {
        const latitude = dto.approvedPublicLocation.latitude!;
        const longitude = dto.approvedPublicLocation.longitude!;
        const [{ distance }] = (await manager.query(
          `SELECT ST_Distance(exact_location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance
             FROM listings WHERE id = $3`,
          [latitude, longitude, id],
        )) as Array<{ distance: number }>;
        const meters = Math.round(Number(distance));
        if (meters < 100 || meters > 500)
          throw new BadRequestException(
            'approximate_location_distance_invalid',
          );
        listing!.publicLocation = {
          type: 'Point',
          coordinates: [longitude, latitude],
        };
        listing!.publicLocationDistanceM = meters;
      } else {
        listing!.publicLocation = null;
        listing!.publicLocationDistanceM = null;
      }
      const now = new Date();
      listing!.approvedRevisionId = listing!.currentRevisionId;
      listing!.approvedAt = now;
      listing!.approvedBy = request.makaanSession!.userId;
      listing!.availabilityConfirmedAt = now;
      listing!.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      listing!.rejectedAt = null;
      listing!.rejectedBy = null;
      listing!.rejectionReason = null;
      listing!.status = ListingStatus.ACTIVE;
      listing!.lockVersion += 1;
      await repository.save(listing!);
      await this.publishLegacyMedia(manager, listing!);
      await this.recordDecision(
        manager,
        request,
        listing!,
        AdminActionType.APPROVE,
        null,
        dto.internalReason,
      );
    });
    return this.getListingForReview(id);
  }

  @Post('listings/:id/reject')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.ADMIN)
  async rejectListing(
    @Param('id') id: string,
    @Body() dto: RejectListingDto,
    @Req() request: AdminRequest,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Listing);
      const listing = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      this.assertReviewable(listing, dto.lockVersion);
      listing!.status = ListingStatus.REJECTED;
      listing!.rejectionReason = dto.reasonCode;
      listing!.rejectedAt = new Date();
      listing!.rejectedBy = request.makaanSession!.userId;
      listing!.lockVersion += 1;
      await repository.save(listing!);
      await manager.getRepository(SellerNotification).save({
        sellerId: listing!.sellerId,
        listingId: listing!.id,
        rejectionReason: dto.reasonCode,
        notes: dto.sellerNote ?? null,
        isRead: false,
      });
      await this.recordDecision(
        manager,
        request,
        listing!,
        AdminActionType.REJECT,
        dto.reasonCode,
        dto.internalReason,
      );
    });
    return this.getListingForReview(id);
  }

  @Post('listings/:id/unpublish')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.ADMIN)
  async unpublishListing(
    @Param('id') id: string,
    @Body() dto: UnpublishListingDto,
    @Req() request: AdminRequest,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Listing);
      const listing = await repository.findOne({
        where: { id, status: ListingStatus.ACTIVE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!listing) throw new NotFoundException('active_listing_not_found');
      if (listing.lockVersion !== dto.lockVersion)
        throw new ConflictException('listing_version_conflict');
      listing.status = ListingStatus.INACTIVE;
      listing.lockVersion += 1;
      await repository.save(listing);
      await this.recordDecision(
        manager,
        request,
        listing,
        AdminActionType.UNPUBLISH,
        dto.reasonCode,
        dto.internalReason,
      );
    });
    return this.getListingForReview(id);
  }

  @Post('users/:id/block')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.ADMIN)
  async blockUser(
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
    @Req() request: AdminRequest,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({ where: { id } });
      if (!user) throw new NotFoundException('user_not_found');
      user.status = UserStatus.BLOCKED;
      await manager.getRepository(User).save(user);
      await manager
        .getRepository(AuthSession)
        .update(
          { userId: id, revokedAt: IsNull() },
          { revokedAt: new Date(), revocationReason: 'moderator_blocked_user' },
        );
      await manager
        .createQueryBuilder()
        .update(Listing)
        .set({ status: ListingStatus.INACTIVE })
        .where('seller_id = :id', { id })
        .andWhere('status IN (:...statuses)', {
          statuses: [ListingStatus.ACTIVE, ListingStatus.SUBMITTED],
        })
        .execute();
      await this.auditService.append(manager, {
        actorKind: AuditActorKind.USER,
        actorId: request.makaanSession!.userId,
        sessionId: request.makaanSession!.id,
        action: 'moderator.block_user',
        targetKind: 'user',
        targetId: id,
        reasonKey: dto.reason,
        correlationId: request.correlationId!,
      });
    });
    return { success: true, status: UserStatus.BLOCKED };
  }

  private async proposedPublicLocation(listing: Listing) {
    if (listing.sellerPublicLocationMode !== PublicLocationMode.APPROXIMATE) {
      return { mode: PublicLocationMode.AREA_ONLY } as const;
    }
    const rows = (await this.dataSource.query(
      `SELECT ST_Y(candidate::geometry) AS latitude,
              ST_X(candidate::geometry) AS longitude
         FROM listings listing
         JOIN cairo_areas area ON area.id = listing.area_id
         CROSS JOIN LATERAL (
           SELECT ST_Project(listing.exact_location, 200, radians(bearing::double precision)) AS candidate
             FROM generate_series(0, 315, 45) AS bearing
            WHERE ST_Covers(
              area.boundary::geometry,
              ST_Project(listing.exact_location, 200, radians(bearing::double precision))::geometry
            )
            LIMIT 1
         ) proposal
        WHERE listing.id = $1`,
      [listing.id],
    )) as Array<{ latitude: number; longitude: number }>;
    if (!rows[0]) return { mode: PublicLocationMode.AREA_ONLY } as const;
    return {
      mode: PublicLocationMode.APPROXIMATE,
      latitude: Number(rows[0].latitude),
      longitude: Number(rows[0].longitude),
      radiusMeters: 200,
    } as const;
  }

  private assertReviewable(
    listing: Listing | null,
    expectedLockVersion: number,
  ): void {
    if (!listing) throw new NotFoundException('pending_listing_not_found');
    if (listing.lockVersion !== expectedLockVersion)
      throw new ConflictException('listing_version_conflict');
    if (listing.status !== ListingStatus.SUBMITTED)
      throw new NotFoundException('pending_listing_not_found');
  }

  private async publishLegacyMedia(
    manager: Parameters<AuditService['append']>[0],
    listing: Listing,
  ) {
    for (const photo of listing.photos ?? []) {
      const digest = createHash('sha256')
        .update(photo.cloudinaryUrl)
        .digest('hex');
      await manager.query(
        `INSERT INTO listing_media (
          listing_id, revision_id, source_object_reference_ciphertext,
          detected_mime, byte_size, width, height, sha256_digest,
          scan_state, scanned_at, display_order, approved_derivative_reference
        ) VALUES ($1, $2, $3, 'image/webp', 1, $4, $5, $6, 'clean', now(), $7, $8)
        ON CONFLICT (listing_id, display_order) WHERE deleted_at IS NULL
        DO UPDATE SET revision_id = EXCLUDED.revision_id,
          approved_derivative_reference = EXCLUDED.approved_derivative_reference,
          width = EXCLUDED.width, height = EXCLUDED.height,
          sha256_digest = EXCLUDED.sha256_digest, scan_state = 'clean', scanned_at = now()`,
        [
          listing.id,
          listing.currentRevisionId,
          `v1:legacy-photo:${photo.id}`,
          photo.width,
          photo.height,
          digest,
          photo.displayOrder,
          photo.cloudinaryUrl,
        ],
      );
    }
  }

  private async recordDecision(
    manager: Parameters<AuditService['append']>[0],
    request: AdminRequest,
    listing: Listing,
    action: AdminActionType,
    reason: RejectionReason | null,
    internalReason: string,
  ) {
    await manager.getRepository(AdminAction).save({
      adminId: request.makaanSession!.userId,
      actionType: action,
      targetListingId: listing.id,
      targetUserId: null,
      reason,
      notes: internalReason,
    });
    await this.auditService.append(manager, {
      actorKind: AuditActorKind.USER,
      actorId: request.makaanSession!.userId,
      actorSnapshot: { role: 'admin' },
      sessionId: request.makaanSession!.id,
      action: `moderator.${action}`,
      targetKind: 'listing',
      targetId: listing.id,
      resultingState: {
        status: listing.status,
        lockVersion: listing.lockVersion,
      },
      reasonKey: reason,
      metadata: { participation: listing.sellerPublicLocationMode },
      correlationId: request.correlationId!,
    });
  }
}
