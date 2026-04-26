import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Lazy require so `firebase-admin`'s transitive gRPC + native deps are
        // loaded only when the factory actually runs. In e2e tests where
        // FIREBASE_ADMIN is overridden via `overrideProvider`, this require()
        // is never reached and the package stays out of Jest's module
        // resolution (it pollutes pg.Pool otherwise — incident 2026-04-26).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const admin = require('firebase-admin') as typeof import('firebase-admin');
        const raw = config.getOrThrow<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        const serviceAccount = JSON.parse(raw);
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      },
    },
  ],
  exports: [FIREBASE_ADMIN],
})
export class FirebaseModule {}
