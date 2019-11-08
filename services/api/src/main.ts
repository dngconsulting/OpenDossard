import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {Logger} from '@nestjs/common';
import config from './config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {logger: ['error', 'warn', 'debug']});
    const options = new DocumentBuilder()
        .setTitle('Open Dossard')
        .setDescription('Documentation de l\'API Open Dossard')
        .setVersion('2.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);

    Logger.debug(`┌────────────────────────────────────────────────────────────┐`);
    Logger.debug(`│    Starting Open Dossard powered by NestJS Framework       │`);
    Logger.debug(`└────────────────────────────────────────────────────────────┘`);

    await app.listen(9090);
    Logger.debug(`Server launched in mode ${config.app.env} `);
}

bootstrap();
