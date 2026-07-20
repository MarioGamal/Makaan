import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { Roles, RolesGuard } from '../../middleware/roles.guard';
import { ListingCreateService } from '../../services/listing-create.service';
import { SellerDashboardService } from '../../services/seller-dashboard.service';

import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

@Controller('seller/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
export class SellerListingsController {
  constructor(
    private readonly listingCreateService: ListingCreateService,
    private readonly sellerDashboardService: SellerDashboardService,
  ) {}

  @Get()
  async getSellerListings(@Req() request: Request & { user?: { id: string } }) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    return {
      success: true,
      ...(await this.sellerDashboardService.getSellerListings(request.user.id)),
    };
  }

  @Get(':id/metrics')
  async getSellerListingMetrics(
    @Param('id') id: string,
    @Req() request: Request & { user?: { id: string } },
  ) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    return {
      success: true,
      metrics: await this.sellerDashboardService.getListingMetrics(request.user.id, id),
    };
  }

  @Post()
  async createListing(
    @Body() dto: CreateListingDto,
    @Req() request: Request & { user?: { id: string } },
  ) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    const listing = await this.listingCreateService.createDraft(request.user.id, dto);

    return {
      success: true,
      data: {
        id: listing.id,
        status: listing.status,
      },
    };
  }

  @Put(':id')
  async updateListing(
    @Param('id') id: string,
    @Body() dto: CreateListingDto,
    @Req() request: Request & { user?: { id: string } },
  ) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    const listing = await this.listingCreateService.updateListing(request.user.id, id, dto);

    return {
      success: true,
      data: {
        id: listing.id,
        status: listing.status,
        submittedAt: listing.submittedAt,
      },
    };
  }

  @Put(':id/status')
  async updateListingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateListingStatusDto,
    @Req() request: Request & { user?: { id: string } },
  ) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    const listing = await this.sellerDashboardService.updateListingStatus(
      request.user.id,
      id,
      dto.status,
    );

    return {
      success: true,
      data: {
        id: listing.id,
        status: listing.status,
      },
    };
  }
}
