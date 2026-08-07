import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AnonymousSubjectService } from '../../services/anonymous-subject.service';

@Controller('anonymous')
export class AnonymousController {
  constructor(
    private readonly anonymousSubjectService: AnonymousSubjectService,
  ) {}

  @Get('csrf')
  async csrf(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName = this.anonymousSubjectService.cookieName();
    const currentToken = request.cookies?.[cookieName] as string | undefined;
    const issued =
      await this.anonymousSubjectService.issueOrRotateCsrf(currentToken);
    if (!currentToken || currentToken !== issued.subjectToken) {
      response.cookie(
        cookieName,
        issued.subjectToken,
        this.anonymousSubjectService.subjectCookieSettings(),
      );
    }
    response.cookie(
      this.anonymousSubjectService.csrfCookieName(),
      issued.csrfToken,
      this.anonymousSubjectService.csrfCookieSettings(),
    );
    return {
      csrfToken: issued.csrfToken,
      expiresAt: issued.subject.expiresAt?.toISOString() ?? null,
    };
  }

  @Post('session')
  session(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.csrf(request, response);
  }
}
