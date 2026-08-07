export interface MediaScannerProvider {
  scan(input: ScanMediaInput): Promise<MediaScanResult>;
}

export interface ScanMediaInput {
  bytes: Buffer;
  contentType: string;
  objectKey: string;
}

export type MediaScanResult =
  | { verdict: 'clean' }
  | { verdict: 'malicious'; reasonCode: 'test_signature_detected' }
  | { verdict: 'error'; reasonCode: 'scanner_unavailable' };
