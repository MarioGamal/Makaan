import {
  MediaScannerProvider,
  MediaScanResult,
  ScanMediaInput,
} from '../scanner.provider';

const EICAR_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
const SCANNER_ERROR_MARKER = 'MAKAAN_SCANNER_ERROR_TEST_MARKER';

/**
 * A deterministic local/test scanner. It is intentionally not a no-op: tests can
 * prove both malicious and scanner-failure quarantine paths without a paid service.
 */
export class DeterministicScannerProvider implements MediaScannerProvider {
  async scan(input: ScanMediaInput): Promise<MediaScanResult> {
    const content = input.bytes.toString('latin1');

    if (content.includes(SCANNER_ERROR_MARKER)) {
      return { verdict: 'error', reasonCode: 'scanner_unavailable' };
    }

    if (content.includes(EICAR_SIGNATURE)) {
      return { verdict: 'malicious', reasonCode: 'test_signature_detected' };
    }

    return { verdict: 'clean' };
  }
}
