import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin = (configService.get<string>('CORS_ORIGIN') ?? '*').trim();
  const corsOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigins,
    credentials: false,
  });

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
