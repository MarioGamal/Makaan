import { resolve } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { resolveRepositoryPath } from './services/providers/providers.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  const configService = app.get(ConfigService);
  if (configService.get<string>('MEDIA_PROVIDER') === 'local') {
    // Local-only preview endpoint. Filenames are generated server-side and the root is never user supplied.
    app.useStaticAssets(
      resolve(
        resolveRepositoryPath(
          configService.getOrThrow<string>('LOCAL_MEDIA_ROOT'),
        ),
        'listing-media',
      ),
      { prefix: '/media/listings' },
    );
  }
  const allowedOrigins = configService
    .getOrThrow<string>('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const trustedProxyCidrs = (
    configService.get<string>('TRUSTED_PROXY_CIDRS') ?? ''
  )
    .split(',')
    .map((cidr) => cidr.trim())
    .filter(Boolean);
  if (trustedProxyCidrs.length > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustedProxyCidrs);
  }
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(configService.getOrThrow<number>('PORT'));
}

void bootstrap();
