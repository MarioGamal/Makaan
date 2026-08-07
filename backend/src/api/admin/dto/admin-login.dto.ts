import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  secondFactorCode!: string;
}
