import {
  MapMetadataProvider,
  MapPublicMetadata,
} from '../map-metadata.provider';

export class MapboxMetadataProvider implements MapMetadataProvider {
  async getPublicMetadata(): Promise<MapPublicMetadata> {
    return {
      provider: 'mapbox',
      presentation: 'interactive-map',
      requiresAccessToken: true,
      attribution: '© Mapbox © OpenStreetMap',
    };
  }
}
