import type { PublicArea } from '@makaan/shared/types/marketplace';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

type AreaRow = { id: string; name_ar: string; name_en: string };

@Injectable()
export class AreaSearchService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async search(query: string): Promise<{ items: PublicArea[] }> {
    const normalized = query.trim().toLocaleLowerCase();
    const rows = await this.dataSource.query<AreaRow[]>(
      `SELECT DISTINCT area.id, area.name_ar, area.name_en, area.display_order
         FROM cairo_areas area
         LEFT JOIN cairo_area_aliases alias
           ON alias.area_id = area.id AND alias.is_active = true
        WHERE area.is_active = true
          AND ($1 = '' OR area.normalized_name_ar LIKE $2 OR area.normalized_name_en LIKE $2
               OR alias.normalized_alias LIKE $2)
        ORDER BY area.display_order ASC, area.name_ar ASC
        LIMIT 12`,
      [normalized, `%${normalized}%`],
    );

    return {
      items: rows.map((area) => ({
        id: area.id,
        nameAr: area.name_ar,
        nameEn: area.name_en,
      })),
    };
  }
}
