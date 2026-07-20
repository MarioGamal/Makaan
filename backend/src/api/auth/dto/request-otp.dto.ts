import { Matches } from 'class-validator';

export class RequestOtpDto {
  @Matches(/^\+201[0125]\d{8}$/, {
    message:
      'Invalid phone number format. Must be Egyptian number (+2010/11/12/15xxxxxxxx)',
  })
  phone!: string;
}

