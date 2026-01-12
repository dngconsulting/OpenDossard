import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Compression
  app.use(compression());

  // API Versioning - /api/v2/*
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '2',
  });

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
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

  const port = process.env.PORT || 9091;
  await app.listen(port);
  console.log(`🚀 API v2 running on http://localhost:${port}/api/v2`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/v2/docs`);
}
bootstrap();
