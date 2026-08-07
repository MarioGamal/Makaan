import type { PublicLocation } from '@makaan/shared/types/marketplace';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicLocationService {
  fromApprovedProjection(row: {
    public_location_mode: 'approximate' | 'area_only';
    public_latitude: string | number | null;
    public_longitude: string | number | null;
    public_radius_meters: string | number | null;
  }): PublicLocation {
    if (
      row.public_location_mode === 'approximate' &&
      row.public_latitude !== null &&
      row.public_longitude !== null &&
      row.public_radius_meters !== null
    ) {
      return {
        mode: 'approximate',
        latitude: Number(row.public_latitude),
        longitude: Number(row.public_longitude),
        radiusMeters: Number(row.public_radius_meters),
      };
    }

    return { mode: 'area_only' };
  }
}
