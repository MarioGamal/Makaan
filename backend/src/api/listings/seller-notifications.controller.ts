import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AuthSessionScope } from '../../models/auth-session.entity';
import { SellerDashboardService } from '../../services/seller-dashboard.service';

@Controller('seller')
@UseGuards(SessionGuard)
@RequireSessionScope(AuthSessionScope.SELLER)
export class SellerNotificationsController {
  constructor(
    private readonly sellerDashboardService: SellerDashboardService,
  ) {}

  @Get('notifications')
  async getNotifications(@Req() request: SessionRequest) {
    return {
      success: true,
      notifications: await this.sellerDashboardService.getNotifications(
        request.makaanSession!.userId,
      ),
    };
  }
}
