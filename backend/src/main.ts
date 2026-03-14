import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOriginRaw = (configService.get<string>('CORS_ORIGIN') ?? '').trim();
  const envOrigins = corsOriginRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const allowedOrigins = Array.from(
    new Set(['https://pethubvn.store', 'https://www.pethubvn.store', ...envOrigins]),
  );

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  });

  // Allow image/base64 payloads for pet profile upload and similar forms.
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(configService.get<string>('PORT') ?? 4000);
  await app.listen(port);
}

void bootstrap();
