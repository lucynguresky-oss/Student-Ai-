import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // --- CORS: allow only configured origins (or all in development) ---
  const allowedOrigins = config.get<string>('cors.origins');
  const origins = allowedOrigins
    ? allowedOrigins.split(',').map((o) => o.trim())
    : true; // fall back to wildcard in dev (no env var set)
  app.enableCors({ origin: origins, credentials: true });

  // --- Global guards ---
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new ThrottlerGuard({} as any, {} as any, reflector));

  // --- Global pipes ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown props
      forbidNonWhitelisted: true, // 400 on unknown props
      transform: true, // auto-cast to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Global filters: convert Prisma errors to clean HTTP responses ---
  app.useGlobalFilters(new PrismaExceptionFilter());

  // --- Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Learnix API')
    .setDescription('Social learning platform – Instagram-style core')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Learnix API on http://localhost:${port}  (docs: /docs)`);
}

void bootstrap();
