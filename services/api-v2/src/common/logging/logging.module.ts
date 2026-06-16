import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JsonLogger } from './json.logger';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { RequestContextMiddleware } from './request-context.middleware';

/**
 * Câble la chaîne de logging corrélé :
 *  - `RequestContextMiddleware` ouvre le contexte (requestId) sur toutes les routes ;
 *  - `HttpLoggingInterceptor` trace une ligne par requête (interceptor global) ;
 *  - `JsonLogger` est exporté pour être branché via `app.useLogger()` dans `main.ts`.
 */
@Module({
  providers: [JsonLogger, { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor }],
  exports: [JsonLogger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
