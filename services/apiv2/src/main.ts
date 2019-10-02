import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {Logger} from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {logger: ['error', 'warn', 'debug']});
    const options = new DocumentBuilder()
        .setTitle('Click And Dossard API V2')
        .setDescription('Documentation de l\'API Click And Dossard API description')
        .setVersion('2.0')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);

    Logger.debug(`┌────────────────────────────────────────────────────────────┐`);
    Logger.debug(`│    Starting Click & Dossard with NestJS Framework          │`);
    Logger.debug(`└────────────────────────────────────────────────────────────┘`);

    await app.listen(9090);
}

bootstrap();
