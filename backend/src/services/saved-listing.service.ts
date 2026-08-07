import type {
  Locale,
  PublicListingCard,
} from '@makaan/shared/types/marketplace';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PublicListingService } from './public-listing.service';

type SavedIdRow = { listing_id: string };

@Injectable()
export class SavedListingService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly publicListings: PublicListingService,
  ) {}

  async list(
    anonymousSubjectId: string,
    locale: Locale,
  ): Promise<{ items: PublicListingCard[] }> {
    const rows = await this.dataSource.query<SavedIdRow[]>(
      `SELECT listing_id
         FROM saved_listings
        WHERE anonymous_subject_id = $1 AND active = true
        ORDER BY updated_at DESC, id ASC
        LIMIT 100`,
      [anonymousSubjectId],
    );
    const items = await this.publicListings.cardsByIds(
      rows.map((row) => row.listing_id),
      locale,
    );
    return { items: items.map((item) => ({ ...item, saved: true })) };
  }

  async save(
    anonymousSubjectId: string,
    listingId: string,
  ): Promise<{ saved: true }> {
    await this.publicListings.detail(listingId, 'ar');
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO saved_listings (user_id, anonymous_subject_id, listing_id, active, created_at, updated_at)
         VALUES (NULL, $1, $2, true, now(), now())
         ON CONFLICT (anonymous_subject_id, listing_id)
           WHERE active = true AND anonymous_subject_id IS NOT NULL
         DO UPDATE SET updated_at = now(), deactivated_at = NULL`,
        [anonymousSubjectId, listingId],
      );
      await this.refreshCount(manager, listingId);
    });
    return { saved: true };
  }

  async unsave(
    anonymousSubjectId: string,
    listingId: string,
  ): Promise<{ saved: false }> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE saved_listings
            SET active = false, deactivated_at = now(), updated_at = now()
          WHERE anonymous_subject_id = $1 AND listing_id = $2 AND active = true`,
        [anonymousSubjectId, listingId],
      );
      await this.refreshCount(manager, listingId);
    });
    return { saved: false };
  }

  private async refreshCount(
    manager: DataSource['manager'],
    listingId: string,
  ): Promise<void> {
    await manager.query(
      `UPDATE listings
          SET save_count = (SELECT count(*)::integer FROM saved_listings WHERE listing_id = $1 AND active = true)
        WHERE id = $1`,
      [listingId],
    );
  }
}
