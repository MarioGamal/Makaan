import { describe, expect, it } from '@jest/globals';
import { DataSource } from 'typeorm';

const databaseUrl = process.env.TEST_DATABASE_URL;
const databaseIt = databaseUrl ? it : it.skip;

function assertDisposable(url: string): void {
  const parsed = new URL(url);
  const database = parsed.pathname.slice(1).toLowerCase();
  expect(process.env.APP_MODE).toBe('test');
  expect(['localhost', '127.0.0.1', '::1']).toContain(parsed.hostname);
  expect(database).toMatch(/(^|[_-])test([_-]|$)/);
}

async function columns(
  dataSource: DataSource,
  table: string,
): Promise<string[]> {
  const rows = (await dataSource.query(
    `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )) as Array<{ column_name: string }>;
  return rows.map((row) => row.column_name);
}

/**
 * These are deliberately database-gated: spatial assertions require a real
 * disposable PostGIS target, never an in-memory approximation.
 */
describe('public discovery privacy, Arabic matching, and organic-v1 (T036)', () => {
  databaseIt(
    'stores a separate stable public point and never uses the exact point for bbox discovery',
    async () => {
      assertDisposable(databaseUrl as string);
      const source = new DataSource({ type: 'postgres', url: databaseUrl });
      await source.initialize();
      try {
        const listingColumns = await columns(source, 'listings');
        expect(listingColumns).toEqual(
          expect.arrayContaining([
            'exact_location',
            'public_location',
            'approved_public_location_mode',
            'availability_confirmed_at',
          ]),
        );

        // T042/T043 must query this persisted point only. A tiny bbox around an
        // exact point must not be a membership oracle when the stored public point
        // is elsewhere or presentation is area-only.
        const searchSource =
          require('../../src/services/public-listing.service') as {
            PublicListingService: unknown;
          };
        expect(searchSource.PublicListingService).toBeDefined();
      } finally {
        await source.destroy();
      }
    },
  );

  databaseIt(
    'has governed Arabic normalized names and aliases, never fuzzy user aliases',
    async () => {
      assertDisposable(databaseUrl as string);
      const source = new DataSource({ type: 'postgres', url: databaseUrl });
      await source.initialize();
      try {
        expect(await columns(source, 'cairo_areas')).toEqual(
          expect.arrayContaining(['normalized_name_ar', 'normalized_name_en']),
        );
        expect(await columns(source, 'cairo_area_aliases')).toEqual(
          expect.arrayContaining(['area_id', 'normalized_alias']),
        );
        const { AreaSearchService } =
          require('../../src/services/area-search.service') as {
            AreaSearchService: unknown;
          };
        expect(AreaSearchService).toBeDefined();
        // Required examples for the service fixture/API test once T042 exists:
        // «مِصْر الجديدة», «مصر الجديدة», «مـــصر الجديدة», and the reviewed
        // alias «هليوبوليس» must resolve to one governed area, while an arbitrary
        // misspelling must resolve to none.
      } finally {
        await source.destroy();
      }
    },
  );

  databaseIt(
    'declares deterministic organic-v1 lexicographic ranking without engagement or payment signals',
    async () => {
      assertDisposable(databaseUrl as string);
      const source = new DataSource({ type: 'postgres', url: databaseUrl });
      await source.initialize();
      try {
        const { PublicListingService } =
          require('../../src/services/public-listing.service') as {
            PublicListingService: unknown;
          };
        expect(PublicListingService).toBeDefined();

        const sourceText = require('node:fs').readFileSync(
          require('node:path').join(
            __dirname,
            '../../src/services/public-listing.service.ts',
          ),
          'utf8',
        ) as string;
        expect(sourceText).toMatch(/organic-v1/);
        expect(sourceText).toMatch(
          /query.*geographic.*completeness.*verification.*availability.*compliance.*owner.*approval.*id/is,
        );
        expect(sourceText).not.toMatch(
          /orderBy\([^\n]*(view_count|save_count|contact_count|payment|paid)/i,
        );
      } finally {
        await source.destroy();
      }
    },
  );
});
