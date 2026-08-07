/** Metadata safe to expose to the frontend when selecting a map presentation. */
export interface MapMetadataProvider {
  getPublicMetadata(): Promise<MapPublicMetadata>;
}

export interface MapPublicMetadata {
  provider: 'local' | 'mapbox';
  presentation: 'interactive-map' | 'accessible-list-fallback';
  requiresAccessToken: boolean;
  attribution: string;
}
