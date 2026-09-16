import { capitalize, formatDateFr } from './pdf-format.utils';

describe('pdf-format.utils', () => {
  it('formatDateFr rend « jour d mois aaaa » en français', () => {
    expect(formatDateFr(new Date(2026, 2, 15))).toBe('dimanche 15 mars 2026');
    expect(formatDateFr('2026-08-01T00:00:00')).toBe('samedi 1 août 2026');
    expect(formatDateFr('2026-01-01T00:00:00')).toBe('jeudi 1 janvier 2026');
    expect(formatDateFr('2026-12-31T00:00:00')).toBe('jeudi 31 décembre 2026');
  });

  it('capitalize met la 1re lettre en majuscule', () => {
    expect(capitalize('dimanche')).toBe('Dimanche');
  });
});
