import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';

async function bootstrap() {
  const adapter = new FastifyAdapter({
    // Structured JSON logs with a request id — the base for observability at scale.
    logger: process.env.NODE_ENV === 'production' ? { level: 'info' } : false,
    trustProxy: true, // behind a load balancer; honour X-Forwarded-For for correct client IPs
    genReqId: () => cryptoRandomId(),
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  // The @fastify/* plugin type instances differ slightly from Nest's re-exported Fastify
  // types; the registrations are correct at runtime. Cast to `any` to bridge the type gap.
  await app.register(fastifyHelmet as any, { contentSecurityPolicy: config.isProd });
  await app.register(fastifyCors as any, {
    origin: [config.env.WEB_ORIGIN],
    credentials: true, // cookies
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(fastifyCookie as any);

  app.enableShutdownHooks(); // graceful drain: onModuleDestroy closes DB/Redis/queues

  // OpenAPI/Swagger (§2 "every endpoint registered").
  const swagger = new DocumentBuilder()
    .setTitle('Learnix API')
    .setDescription('Accounts Centre + Personalized Onboarding — global.')
    .setVersion('0.1.0')
    .addCookieAuth('lx_access')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, doc);

  await app.listen({ port: config.env.PORT, host: '0.0.0.0' });
  new Logger('Bootstrap').log(`Learnix API on :${config.env.PORT} (docs at /docs)`);
}

function cryptoRandomId(): string {
  return require('node:crypto').randomBytes(8).toString('hex');
}

bootstrap();
