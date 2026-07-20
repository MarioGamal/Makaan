import { IsNumber, Max, Min } from 'class-validator';

export class LocationDto {
  @IsNumber()
  @Min(29)
  @Max(32)
  lat!: number;

  @IsNumber()
  @Min(28)
  @Max(33)
  lng!: number;
}

