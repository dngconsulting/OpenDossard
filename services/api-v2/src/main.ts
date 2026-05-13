import { NestFactory } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';

/**
 * Charge les certs HTTPS locaux (mkcert) pour le mode dev.
 *
 * Activé uniquement si `HTTPS=true` dans l'env — typiquement utile pour les
 * intégrations OAuth qui exigent HTTPS sur le redirect_uri (HelloAsso, etc.).
 *
 * En TEST/PREPROD/PROD, c'est le reverse proxy (Cloud Run, ALB…) qui termine
 * TLS — laisser `HTTPS` non défini.
 *
 * Génération des certs :
 *   brew install mkcert && mkcert -install
 *   mkdir -p certs && mkcert -key-file certs/localhost-key.pem \
 *                            -cert-file certs/localhost.pem localhost 127.0.0.1
 */
function loadDevHttpsOptions(): { key: Buffer; cert: Buffer } {
  const certDir = resolve(process.cwd(), 'certs');
  const keyPath = resolve(certDir, 'localhost-key.pem');
  const certPath = resolve(certDir, 'localhost.pem');
  if (!existsSync(keyPath) || !existsSync(certPath)) {
    throw new Error(
      `HTTPS=true mais certs introuvables (${keyPath}, ${certPath}). Génère-les avec mkcert (cf. main.ts).`,
    );
  }
  return { key: readFileSync(keyPath), cert: readFileSync(certPath) };
}

async function bootstrap() {
  const useHttps = process.env.HTTPS === 'true';
  const httpsOptions = useHttps ? loadDevHttpsOptions() : undefined;
  // `rawBody: true` permet d'injecter @RawBody() Buffer dans les controllers
  // — requis pour vérifier la signature HMAC du webhook HelloAsso sur les bytes
  // bruts avant tout reparsing. Le body parser JSON continue de fonctionner
  // normalement en parallèle (les autres endpoints reçoivent toujours @Body() parsé).
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    ...(httpsOptions ? { httpsOptions } : {}),
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Compression
  app.use(compression());

  // API Versioning - /api/v2/* (deep-links et .well-known exclus du prefix)
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '.well-known/apple-app-site-association', method: RequestMethod.GET },
      { path: '.well-known/assetlinks.json', method: RequestMethod.GET },
      { path: 'app/(.*)', method: RequestMethod.GET },
      { path: 'payment/(.*)', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3500',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Open Dossard API v2')
    .setDescription('API pour la gestion des courses cyclistes')
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentification et gestion des sessions')
    .addTag('Licences', 'Gestion des licences coureurs')
    .addTag('Competitions', 'Gestion des compétitions')
    .addTag('Races', 'Gestion des engagements et résultats')
    .addTag('Clubs', 'Gestion des clubs')
    .addTag('Challenges', 'Gestion des challenges')
    .addTag('Dashboard', 'Statistiques et graphiques')
    .addTag('Users', 'Administration des utilisateurs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v2/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3500;
  await app.listen(port);
  const scheme = useHttps ? 'https' : 'http';
  Logger.log(`🚀 API v2 running on ${scheme}://localhost:${port}/api/v2`, 'Bootstrap');
  Logger.log(`📚 Swagger docs: ${scheme}://localhost:${port}/api/v2/docs`, 'Bootstrap');
}
bootstrap();
