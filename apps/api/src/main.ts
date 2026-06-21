import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './messages/socket-io.adapter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { validateEnv } from './common/env.validation';

async function bootstrap() {
  // Validate env before anything else — fails fast if misconfigured
  const env = validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: env.NODE_ENV === 'development' }),
  );

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // web
      'http://localhost:3001', // admin
      'http://localhost:8081', // expo
    ],
    credentials: true,
  });

  // WebSocket adapter — Socket.io on a standalone port (4001)
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  // Global response envelope interceptor (§1)
  app.useGlobalInterceptors(new EnvelopeInterceptor());

  // Global exception filter — structured error responses, no stack trace leaks (§1)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Learnix API')
    .setDescription('Learnix — Social Learning Platform for Africa')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication & authorization')
    .addTag('users', 'User management')
    .addTag('profiles', 'Profile management')
    .addTag('posts', 'Feed & posts')
    .addTag('learn', 'Learning engine')
    .addTag('library', 'Digital library')
    .addTag('papers', 'Past papers')
    .addTag('ai', 'AI tutor')
    .addTag('admin', 'Admin dashboard')
    .addTag('messages', 'Real-time messaging')
    .addTag('search', 'Search engine')
    .addTag('taxonomy', 'Country/curriculum/level/subject taxonomy')
    .addTag('onboarding', 'Duolingo-style onboarding flow')
    .addTag('settings', 'Account settings & privacy')
    .addTag('gamification', 'XP, streaks, badges, leaderboard')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`🚀 Learnix API v2.0 running on http://localhost:${env.PORT}`);
  console.log(`📚 API docs at http://localhost:${env.PORT}/docs`);
  console.log(`💬 WebSocket server active (Socket.io via adapter)`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
}
bootstrap();
