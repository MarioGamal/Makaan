import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RedisService } from '../config/redis.module';
import { CairoArea } from '../models/cairo-area.entity';

type AreaSearchRow = {
  id: string;
  name_en: string;
  name_ar: string;
  bbox: string;
};

@Injectable()
export class CairoAreaService {
  constructor(
    @InjectRepository(CairoArea)
    private readonly cairoAreaRepository: Repository<CairoArea>,
    private readonly redisService: RedisService,
  ) {}

  async searchAreas(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const cacheKey = `areas:search:${normalizedQuery.toLowerCase()}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const rows = (await this.cairoAreaRepository
      .createQueryBuilder('area')
      .select([
        'area.id AS id',
        'area.name_en AS name_en',
        'area.name_ar AS name_ar',
        `ARRAY[
          ST_XMin(area.boundary::geometry),
          ST_YMin(area.boundary::geometry),
          ST_XMax(area.boundary::geometry),
          ST_YMax(area.boundary::geometry)
        ]::text AS bbox`,
      ])
      .where('area.name_en ILIKE :query OR area.name_ar ILIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orderBy('area.level', 'DESC')
      .limit(5)
      .getRawMany()) as AreaSearchRow[];

    const results = rows.map((row) => ({
      id: row.id,
      name_en: row.name_en,
      name_ar: row.name_ar,
      bbox: row.bbox.replace(/[{}]/g, '').split(',').map(Number) as [
        number,
        number,
        number,
        number,
      ],
    }));

    await this.redisService.setex(cacheKey, 3600, JSON.stringify(results));
    return results;
  }
}
