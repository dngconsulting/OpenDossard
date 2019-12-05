import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {Logger} from '@nestjs/common';
import config from './config';
import {NestExpressApplication} from '@nestjs/platform-express';
import {join} from 'path';
import {NotFoundExceptionFilter} from './exception/NotFoundExceptionFilter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {logger: ['error', 'warn', 'debug']});
    app.useGlobalFilters(new NotFoundExceptionFilter());
    if (config.app.env !== 'DEV') {
        app.useStaticAssets(join(__dirname, '../..', 'client/build'), {index: 'index.html'});
    }
    const options = new DocumentBuilder()
        .setTitle('Open Dossard')
        .setContact('contact Open Dossard', 'http://app.opendossard.com/api', 'contact@opendossard.com')
        .setDescription('Documentation de l\'API Open Dossard')
        .setVersion('1.0')
        .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header'}, 'bearerAuth')
        .addSecurityRequirements('bearerAuth')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);

    Logger.debug(`┌────────────────────────────────────────────────────────────┐`);
    Logger.debug(`│    Starting Open Dossard powered by NestJS Framework       │`);
    Logger.debug(`└────────────────────────────────────────────────────────────┘`);

    await app.listen(9090);
    Logger.debug(`Server launched in mode ${config.app.env} `);
    Logger.debug('JWT Expire ' + config.app.jwtExpires);
}

bootstrap();
