import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { setUserId } from './request-context';

/**
 * Trace une ligne par requête HTTP, à sa terminaison (succès ou erreur).
 *
 * La ligne porte des champs structurés (`method`, `url`, `status`, `durationMs`)
 * que `JsonLogger` promeut en champs JSON de premier niveau → directement
 * filtrables/triables dans Netdata Logs (« retrouver toutes les requêtes en
 * 5xx », « trier par durée », etc.).
 *
 * Enrichit aussi le contexte de requête avec l'`userId` authentifié (le guard
 * s'exécute avant les interceptors) : tous les logs émis ensuite par les
 * services porteront ce `userId`.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { id?: number } }>();
    const res = http.getResponse<Response>();

    const userId = req.user?.id;
    if (typeof userId === 'number') {
      setUserId(userId);
    }

    const method = req.method;
    const url = req.originalUrl || req.url;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(method, url, res.statusCode, start),
        error: (err: { status?: number }) => this.write(method, url, err?.status ?? 500, start),
      }),
    );
  }

  private write(method: string, url: string, status: number, start: number): void {
    const durationMs = Date.now() - start;
    const payload = {
      msg: `${method} ${url} ${status} ${durationMs}ms`,
      method,
      url,
      status,
      durationMs,
    };
    if (status >= 500) {
      this.logger.error(payload);
    } else if (status >= 400) {
      this.logger.warn(payload);
    } else {
      this.logger.log(payload);
    }
  }
}
