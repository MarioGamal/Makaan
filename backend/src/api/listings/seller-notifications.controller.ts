import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { Roles, RolesGuard } from '../../middleware/roles.guard';
import { SellerDashboardService } from '../../services/seller-dashboard.service';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
export class SellerNotificationsController {
  constructor(private readonly sellerDashboardService: SellerDashboardService) {}

  @Get('notifications')
  async getNotifications(@Req() request: Request & { user?: { id?: string } }) {
    if (!request.user?.id) {
      throw new ForbiddenException('Unauthorized. Please log in as a seller.');
    }

    return {
      success: true,
      notifications: await this.sellerDashboardService.getNotifications(request.user.id),
    };
  }
}
