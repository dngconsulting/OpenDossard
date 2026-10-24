import { Global, Module } from '@nestjs/common';

import { MailConfig } from './mail.config';
import { MailService } from './mail.service';

/**
 * Module global d'envoi d'emails : `MailService` est injectable partout sans
 * import explicite. La config est validée au boot (cf. MailConfig).
 */
@Global()
@Module({
  providers: [MailConfig, MailService],
  exports: [MailService],
})
export class MailModule {}
