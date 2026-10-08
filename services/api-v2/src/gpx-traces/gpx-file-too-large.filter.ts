import { ArgumentsHost, Catch, PayloadTooLargeException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { MAX_GPX_BYTES } from './gpx-traces.service';

/**
 * Fichier GPX au-delà de la limite de multer : son message par défaut
 * (« File too large ») est affiché tel quel par la webapp, remplacé ici.
 */
@Catch(PayloadTooLargeException)
export class GpxFileTooLargeFilter extends BaseExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    super.catch(
      new PayloadTooLargeException(
        `Fichier GPX trop volumineux (${MAX_GPX_BYTES / 1024 / 1024} Mo maximum).`,
      ),
      host,
    );
  }
}
