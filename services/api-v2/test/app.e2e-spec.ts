import * as request from 'supertest';

import { getApp } from './setup-e2e';

describe('API v2 (e2e)', () => {
  describe('Health', () => {
    it('GET /api/v2/health should return status ok', () => {
      return request(getApp().getHttpServer())
        .get('/api/v2/health')
        .expect(200)
        .expect((res: request.Response) => {
          expect((res.body as { status: string }).status).toBe('ok');
          expect((res.body as { timestamp: string }).timestamp).toBeDefined();
        });
    });
  });
});
