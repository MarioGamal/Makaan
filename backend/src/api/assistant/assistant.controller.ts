import type { AssistantMessageResponse } from '@makaan/shared/types/assistant';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  CsrfGuard,
  CsrfRequest,
  RequireCsrfScope,
} from '../../middleware/csrf.guard';
import { AbuseControlService } from '../../services/abuse-control.service';
import { AssistantService } from '../../services/assistant.service';

import { AssistantMessageDto } from './dto/assistant-message.dto';

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly abuseControl: AbuseControlService,
  ) {}

  /**
   * Answers one visitor question. It is a POST because the question is a body,
   * not because it changes state, so it carries the same anonymous subject and
   * CSRF requirements as the other anonymous marketplace actions.
   */
  @Post('messages')
  // A question creates nothing; only the request shape makes this a POST.
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @RequireCsrfScope('anonymous')
  async ask(
    @Body() dto: AssistantMessageDto,
    @Req() request: CsrfRequest & Request,
  ): Promise<AssistantMessageResponse> {
    const client = this.abuseControl.clientAddress(request);
    await this.abuseControl.consume('assistantMessage', ['client', client]);
    const subject = request.makaanAnonymousSubject;
    if (subject) {
      await this.abuseControl.consume('assistantMessage', [
        'subject',
        subject.id,
      ]);
    }

    return this.assistant.answer(dto.message, dto.locale, dto.context);
  }
}
