import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  CsrfGuard,
  CsrfRequest,
  RequireCsrfScope,
} from '../../middleware/csrf.guard';
import { AnonymousSubjectService } from '../../services/anonymous-subject.service';
import { SavedListingService } from '../../services/saved-listing.service';

@Controller('saved-listings')
export class SavedListingsController {
  constructor(
    private readonly anonymousSubjects: AnonymousSubjectService,
    private readonly savedListings: SavedListingService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
    @Query('locale') locale: 'ar' | 'en' = 'ar',
  ) {
    const subject = await this.anonymousSubjects.authenticate(
      request.cookies?.[this.anonymousSubjects.cookieName()] as
        string | undefined,
    );
    return this.savedListings.list(subject.id, locale === 'en' ? 'en' : 'ar');
  }

  @Put(':listingId')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope('anonymous')
  save(
    @Req() request: CsrfRequest,
    @Param('listingId', new ParseUUIDPipe({ version: '4' })) listingId: string,
  ) {
    return this.savedListings.save(
      request.makaanAnonymousSubject!.id,
      listingId,
    );
  }

  @Delete(':listingId')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope('anonymous')
  unsave(
    @Req() request: CsrfRequest,
    @Param('listingId', new ParseUUIDPipe({ version: '4' })) listingId: string,
  ) {
    return this.savedListings.unsave(
      request.makaanAnonymousSubject!.id,
      listingId,
    );
  }
}
