import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { AppModule } from './app.module';

/** Generates docs/openapi.json without external services (preview mode). */
function ensureEnv() {
  const d: Record<string, string> = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    PASSWORD_PEPPER: 'openapi-pepper-0123456789abcdef',
    TWO_FACTOR_ENC_KEY: Buffer.from('0123456789abcdef0123456789abcdef').toString('base64'),
    WEB_ORIGIN: 'http://localhost:3000',
    COOKIE_DOMAIN: 'localhost',
    JWT_KID: 'doc',
  };
  for (const [k, v] of Object.entries(d)) if (!process.env[k]) process.env[k] = v;
  if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
    const { generateKeyPairSync } = require('node:crypto');
    const kp = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.JWT_PRIVATE_KEY = kp.privateKey.replace(/\n/g, '\\n');
    process.env.JWT_PUBLIC_KEY = kp.publicKey.replace(/\n/g, '\\n');
  }
}

async function main() {
  ensureEnv();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
    preview: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Learnix API')
    .setDescription('Accounts Centre + Personalized Onboarding — global audience.')
    .setVersion('0.1.0')
    .addCookieAuth('lx_access')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  writeFileSync('docs/openapi.json', JSON.stringify(doc, null, 2));
  console.log(`Wrote docs/openapi.json — ${Object.keys(doc.paths).length} paths`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
