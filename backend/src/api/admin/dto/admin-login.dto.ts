import { IsString, Matches, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  twoFactorCode!: string;
}
