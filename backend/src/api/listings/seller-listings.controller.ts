import { ListingStatus } from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RequireCsrfScope, CsrfGuard } from '../../middleware/csrf.guard';
import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AuthSessionScope } from '../../models/auth-session.entity';
import { ListingCreateService } from '../../services/listing-create.service';
import { SellerDashboardService } from '../../services/seller-dashboard.service';

import { CreateListingDto } from './dto/create-listing.dto';

function parseLockVersion(value: string | undefined): number {
  const normalized = value?.replace(/^W\//, '').replaceAll('"', '').trim();
  const parsed = normalized ? Number(normalized) : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new BadRequestException('if_match_lock_version_required');
  }
  return parsed;
}

@Controller('seller/listings')
@UseGuards(SessionGuard)
@RequireSessionScope(AuthSessionScope.SELLER)
export class SellerListingsController {
  constructor(
    private readonly listingCreateService: ListingCreateService,
    private readonly sellerDashboardService: SellerDashboardService,
  ) {}

  @Get()
  async getSellerListings(
    @Req() request: SessionRequest,
    @Query('page') pageValue = '1',
    @Query('pageSize') pageSizeValue = '20',
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, Number.parseInt(pageValue, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(pageSizeValue, 10) || 20),
    );
    const result = await this.sellerDashboardService.getSellerListings(
      request.makaanSession!.userId,
    );
    const participation =
      result.seller.sellerType === 'agent'
        ? 'declared_agent'
        : result.seller.isVerified
          ? 'verified_owner'
          : 'owner_not_verified';
    const filtered = status
      ? result.listings.filter((listing) => listing.status === status)
      : result.listings;
    const offset = (page - 1) * pageSize;
    return {
      items: filtered
        .slice(offset, offset + pageSize)
        .map((listing) => ({ ...listing, participation })),
      page,
      pageSize,
      total: filtered.length,
      hasMore: offset + pageSize < filtered.length,
    };
  }

  @Get(':id/metrics')
  async getSellerListingMetrics(
    @Param('id') id: string,
    @Req() request: SessionRequest,
  ) {
    return {
      success: true,
      metrics: await this.sellerDashboardService.getListingMetrics(
        request.makaanSession!.userId,
        id,
      ),
    };
  }

  @Get(':id')
  async getSellerListing(
    @Param('id') id: string,
    @Req() request: SessionRequest,
  ) {
    const [listing, overview] = await Promise.all([
      this.sellerDashboardService.getSellerListing(
        request.makaanSession!.userId,
        id,
      ),
      this.sellerDashboardService.getSellerListings(
        request.makaanSession!.userId,
      ),
    ]);
    const participation =
      overview.seller.sellerType === 'agent'
        ? 'declared_agent'
        : overview.seller.isVerified
          ? 'verified_owner'
          : 'owner_not_verified';
    return { ...listing, participation };
  }

  @Post()
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async createListing(
    @Body() dto: CreateListingDto,
    @Req() request: SessionRequest,
  ) {
    const listing = await this.listingCreateService.createDraft(
      request.makaanSession!.userId,
      dto,
    );
    return {
      id: listing.id,
      status: listing.status,
      lockVersion: listing.lockVersion,
    };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async patchListing(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body() dto: CreateListingDto,
    @Req() request: SessionRequest,
  ) {
    return this.updateListing(id, ifMatch, dto, request);
  }

  @Post(':id/submit')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async submitListing(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Req() request: SessionRequest,
  ) {
    await this.listingCreateService.submitListing(
      request.makaanSession!.userId,
      id,
      parseLockVersion(ifMatch),
    );
    return this.getSellerListing(id, request);
  }

  @Post(':id/withdraw')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async withdrawListing(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Req() request: SessionRequest,
  ) {
    return this.changeStatus(id, ListingStatus.INACTIVE, request, ifMatch);
  }

  @Post(':id/mark-sold')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async markListingSold(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Req() request: SessionRequest,
  ) {
    return this.changeStatus(id, ListingStatus.SOLD, request, ifMatch);
  }

  private async updateListing(
    id: string,
    ifMatch: string | undefined,
    dto: CreateListingDto,
    request: SessionRequest,
  ) {
    await this.listingCreateService.updateListing(
      request.makaanSession!.userId,
      id,
      dto,
      parseLockVersion(ifMatch),
    );
    return this.getSellerListing(id, request);
  }

  private async changeStatus(
    id: string,
    status: ListingStatus.SOLD | ListingStatus.INACTIVE,
    request: SessionRequest,
    ifMatch?: string,
  ) {
    const listing = await this.sellerDashboardService.updateListingStatus(
      request.makaanSession!.userId,
      id,
      status,
      ifMatch ? parseLockVersion(ifMatch) : undefined,
    );
    return this.getSellerListing(listing.id, request);
  }
}
