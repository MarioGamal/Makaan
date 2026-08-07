import { basename, dirname, isAbsolute, resolve } from 'node:path';

import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DeterministicScannerProvider } from './local/deterministic-scanner.provider';
import { LocalMapMetadataProvider } from './local/local-map-metadata.provider';
import { LocalMediaProvider } from './local/local-media.provider';
import { LocalOtpProvider } from './local/local-otp.provider';
import { MapMetadataProvider } from './map-metadata.provider';
import { MediaProvider } from './media.provider';
import { OtpProvider } from './otp.provider';
import { MediaScannerProvider } from './scanner.provider';

export const OTP_PROVIDER = Symbol('OTP_PROVIDER');
export const MEDIA_PROVIDER = Symbol('MEDIA_PROVIDER');
export const MEDIA_SCANNER_PROVIDER = Symbol('MEDIA_SCANNER_PROVIDER');
export const MAP_METADATA_PROVIDER = Symbol('MAP_METADATA_PROVIDER');

type ProviderFactory<T> = (configService: ConfigService) => T;

/** Resolve local development paths consistently from either the repository or backend cwd. */
export function resolveRepositoryPath(path: string): string {
  if (isAbsolute(path)) {
    return path;
  }
  const currentDirectory = process.cwd();
  const repositoryRoot =
    basename(currentDirectory) === 'backend'
      ? dirname(currentDirectory)
      : currentDirectory;
  return resolve(repositoryRoot, path);
}

function localOnlyProvider<T>(
  category: string,
  expectedMode: string,
  selectedModeName: string,
  factory: ProviderFactory<T>,
): ProviderFactory<T> {
  return (configService) => {
    const appMode = configService.getOrThrow<string>('APP_MODE');
    const selectedMode = configService.getOrThrow<string>(selectedModeName);

    if (
      (appMode !== 'local' && appMode !== 'test') ||
      selectedMode !== expectedMode
    ) {
      throw new Error(
        `${category} provider is not registered for the validated application mode.`,
      );
    }

    return factory(configService);
  };
}

const providerBindings: Provider[] = [
  {
    provide: OTP_PROVIDER,
    inject: [ConfigService],
    useFactory: localOnlyProvider<OtpProvider>(
      'OTP',
      'local_fixed',
      'OTP_PROVIDER',
      () => {
        return new LocalOtpProvider();
      },
    ),
  },
  {
    provide: MEDIA_PROVIDER,
    inject: [ConfigService],
    useFactory: localOnlyProvider<MediaProvider>(
      'Media',
      'local',
      'MEDIA_PROVIDER',
      (config) => {
        return new LocalMediaProvider(
          resolveRepositoryPath(config.getOrThrow<string>('LOCAL_MEDIA_ROOT')),
        );
      },
    ),
  },
  {
    provide: MEDIA_SCANNER_PROVIDER,
    inject: [ConfigService],
    useFactory: localOnlyProvider<MediaScannerProvider>(
      'Malware scanner',
      'deterministic',
      'MALWARE_SCANNER_PROVIDER',
      () => new DeterministicScannerProvider(),
    ),
  },
  {
    provide: MAP_METADATA_PROVIDER,
    inject: [ConfigService],
    useFactory: localOnlyProvider<MapMetadataProvider>(
      'Map metadata',
      'accessible_local',
      'MAP_PROVIDER',
      () => new LocalMapMetadataProvider(),
    ),
  },
];

/**
 * Local/test adapters are available only after validated APP_MODE selection.
 * Production remains fail-closed until each real adapter is registered by its owning feature task.
 */
@Global()
@Module({
  providers: providerBindings,
  exports: [
    OTP_PROVIDER,
    MEDIA_PROVIDER,
    MEDIA_SCANNER_PROVIDER,
    MAP_METADATA_PROVIDER,
  ],
})
export class ProvidersModule {}
