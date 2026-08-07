import {
  MapMetadataProvider,
  MapPublicMetadata,
} from '../map-metadata.provider';

/** Token-free local substitute; consumers must present the accessible listing fallback. */
export class LocalMapMetadataProvider implements MapMetadataProvider {
  async getPublicMetadata(): Promise<MapPublicMetadata> {
    return {
      provider: 'local',
      presentation: 'accessible-list-fallback',
      requiresAccessToken: false,
      attribution: 'Makaan local map substitute',
    };
  }
}
