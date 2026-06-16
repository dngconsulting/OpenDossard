import { JsonLogger } from './json.logger';
import { requestContext } from './request-context';

/**
 * Tests du logger applicatif en mode production (sortie JSON).
 * Force `NODE_ENV !== 'development'` pour exercer le chemin JSON structuré.
 */
describe('JsonLogger (JSON output)', () => {
  const originalEnv = process.env.NODE_ENV;
  let writeSpy: jest.SpyInstance;
  let logger: JsonLogger;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    logger = new JsonLogger();
    writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  /** Parse la dernière ligne écrite sur stdout. */
  const lastEntry = (): Record<string, unknown> => {
    const line = writeSpy.mock.calls.at(-1)?.[0] as string;
    return JSON.parse(line);
  };

  it('émet une ligne JSON avec level/context/msg', () => {
    logger.log('hello', 'MyContext');

    const entry = lastEntry();
    expect(entry.level).toBe('info');
    expect(entry.context).toBe('MyContext');
    expect(entry.msg).toBe('hello');
    expect(typeof entry.time).toBe('string');
  });

  it('injecte le requestId du contexte courant', () => {
    requestContext.run({ requestId: 'req-abc' }, () => {
      logger.log('dans une requête', 'Ctx');
    });

    expect(lastEntry().requestId).toBe('req-abc');
  });

  it('promeut les champs d’un message-objet en clés de premier niveau', () => {
    requestContext.run({ requestId: 'req-1', userId: 42 }, () => {
      logger.log({ msg: 'GET /x 200 5ms', method: 'GET', status: 200, durationMs: 5 }, 'HTTP');
    });

    const entry = lastEntry();
    expect(entry.method).toBe('GET');
    expect(entry.status).toBe(200);
    expect(entry.durationMs).toBe(5);
    expect(entry.requestId).toBe('req-1');
    expect(entry.userId).toBe(42);
    expect(entry.context).toBe('HTTP');
  });

  it('mappe les niveaux et capture la stack sur error', () => {
    logger.error('boom', 'Error: boom\n    at foo', 'Ctx');

    const entry = lastEntry();
    expect(entry.level).toBe('error');
    expect(entry.stack).toContain('at foo');
    expect(entry.msg).toBe('boom');
    expect(entry.context).toBe('Ctx');
  });

  it('sérialise un Error en message', () => {
    logger.error(new Error('explosion'));
    expect(lastEntry().msg).toBe('explosion');
  });
});
