export interface MediaProvider {
  write(input: WriteMediaInput): Promise<StoredMediaObject>;
  read(reference: MediaObjectReference): Promise<Buffer>;
  delete(reference: MediaObjectReference): Promise<void>;
}

/** A private storage reference. It is never a browser URL. */
export interface MediaObjectReference {
  namespace: MediaNamespace;
  key: string;
}

export interface WriteMediaInput extends MediaObjectReference {
  bytes: Buffer;
  contentType: string;
}

export interface StoredMediaObject extends MediaObjectReference {
  byteLength: number;
  contentType: string;
}

/** Keep local and production storage separated by product-owned namespaces. */
export type MediaNamespace = 'listing-media' | 'verification-evidence';
