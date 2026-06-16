import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { requestContext } from './request-context';

/** Header de corrélation standard, honoré s'il est fourni par un client/proxy amont. */
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Ouvre le contexte de requête (AsyncLocalStorage) au plus tôt dans le pipeline.
 *
 * Le `requestId` est :
 *  - récupéré depuis `x-request-id` si l'amont (client, reverse proxy) en fournit
 *    un — permet une corrélation de bout en bout au-delà de l'API ;
 *  - sinon généré (UUID v4).
 *
 * Il est renvoyé au client dans le header de réponse `x-request-id` pour qu'un
 * appelant puisse référencer la requête en cas d'incident.
 *
 * `requestContext.run(...)` enveloppe `next()` : toute la suite du pipeline
 * (guards, interceptors, handler, services) s'exécute dans ce contexte.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = (typeof incoming === 'string' && incoming.trim()) || randomUUID();

    res.setHeader(REQUEST_ID_HEADER, requestId);
    requestContext.run({ requestId }, () => next());
  }
}
