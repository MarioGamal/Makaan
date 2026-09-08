import { basename, dirname, isAbsolute, resolve } from 'node:path';

import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { AssistantProvider } from './assistant.provider';
import { CloudinaryMediaProvider } from './hosted/cloudinary-media.provider';
import { MapboxMetadataProvider } from './hosted/mapbox-metadata.provider';
import { DeterministicAssistantProvider } from './local/deterministic-assistant.provider';
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
export const ASSISTANT_PROVIDER = Symbol('ASSISTANT_PROVIDER');

/** The only assistant adapter registered today; a model-backed one is a separate task. */
export const DEFAULT_ASSISTANT_PROVIDER = 'deterministic';

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

function selectedProvider<T>(
  category: string,
  allowedAppModes: string[],
  expectedMode: string | undefined,
  selectedModeName: string,
  factory: ProviderFactory<T>,
): ProviderFactory<T> {
  return (configService) => {
    const appMode = configService.getOrThrow<string>('APP_MODE');
    const selectedMode = configService.getOrThrow<string>(selectedModeName);

    if (
      !allowedAppModes.includes(appMode) ||
      (expectedMode !== undefined && selectedMode !== expectedMode)
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
    useFactory: selectedProvider<OtpProvider>(
      'OTP',
      ['local', 'test', 'demo'],
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
    useFactory: selectedProvider<MediaProvider>(
      'Media',
      ['local', 'test', 'demo'],
      undefined,
      'APP_MODE',
      (config) => {
        if (config.getOrThrow<string>('APP_MODE') === 'demo') {
          cloudinary.config({
            cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
            api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
            secure: true,
          });
          return new CloudinaryMediaProvider(cloudinary);
        }
        return new LocalMediaProvider(
          resolveRepositoryPath(config.getOrThrow<string>('LOCAL_MEDIA_ROOT')),
        );
      },
    ),
  },
  {
    provide: MEDIA_SCANNER_PROVIDER,
    inject: [ConfigService],
    useFactory: selectedProvider<MediaScannerProvider>(
      'Malware scanner',
      ['local', 'test', 'demo'],
      'deterministic',
      'MALWARE_SCANNER_PROVIDER',
      () => new DeterministicScannerProvider(),
    ),
  },
  {
    provide: MAP_METADATA_PROVIDER,
    inject: [ConfigService],
    useFactory: selectedProvider<MapMetadataProvider>(
      'Map metadata',
      ['local', 'test', 'demo'],
      undefined,
      'APP_MODE',
      (config) =>
        config.getOrThrow<string>('APP_MODE') === 'demo'
          ? new MapboxMetadataProvider()
          : new LocalMapMetadataProvider(),
    ),
  },
  {
    provide: ASSISTANT_PROVIDER,
    inject: [ConfigService],
    useFactory: (configService: ConfigService): AssistantProvider => {
      const selected =
        configService.get<string>('ASSISTANT_PROVIDER')?.trim() ||
        DEFAULT_ASSISTANT_PROVIDER;
      if (selected !== DEFAULT_ASSISTANT_PROVIDER) {
        // Fail closed: a model-backed adapter must be registered by its own task
        // before configuration is allowed to select it.
        throw new Error(
          'Assistant provider is not registered for the validated application mode.',
        );
      }
      return new DeterministicAssistantProvider();
    },
  },
];

/**
 * Local/test/demo adapters are available only after validated APP_MODE selection.
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
    ASSISTANT_PROVIDER,
  ],
})
export class ProvidersModule {}
