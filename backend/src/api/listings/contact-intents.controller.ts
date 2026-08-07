import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { Request } from 'express';

import { CorrelatedRequest } from '../../middleware/correlation-id.middleware';
import {
  CsrfGuard,
  CsrfRequest,
  RequireCsrfScope,
} from '../../middleware/csrf.guard';
import { AbuseControlService } from '../../services/abuse-control.service';
import { AnonymousSubjectService } from '../../services/anonymous-subject.service';
import { ContactIntentService } from '../../services/contact-intent.service';

class CreateContactIntentDto {
  @IsIn(['phone', 'whatsapp'])
  channel!: 'phone' | 'whatsapp';
}

@Controller()
export class ContactIntentsController {
  constructor(
    private readonly contactIntents: ContactIntentService,
    private readonly anonymousSubjects: AnonymousSubjectService,
    private readonly abuseControl: AbuseControlService,
  ) {}

  @Post('listings/:listingId/contact-intents')
  @UseGuards(CsrfGuard)
  @RequireCsrfScope('anonymous')
  async create(
    @Param('listingId', new ParseUUIDPipe({ version: '4' })) listingId: string,
    @Body() body: CreateContactIntentDto,
    @Req() request: CsrfRequest & CorrelatedRequest,
  ) {
    const subjectId = request.makaanAnonymousSubject!.id;
    await this.abuseControl.consume('contact', [subjectId, listingId]);
    return this.contactIntents.create(
      listingId,
      subjectId,
      body.channel,
      request.correlationId ?? 'unavailable',
    );
  }

  @Get('contact-intents/:token/resolve')
  @Redirect()
  async resolve(
    @Param('token') token: string,
    @Req() request: Request & CorrelatedRequest,
  ) {
    const subject = await this.anonymousSubjects.authenticate(
      request.cookies?.[this.anonymousSubjects.cookieName()] as
        string | undefined,
    );
    const url = await this.contactIntents.resolve(
      token,
      subject.id,
      request.correlationId ?? 'unavailable',
    );
    return { url };
  }
}
