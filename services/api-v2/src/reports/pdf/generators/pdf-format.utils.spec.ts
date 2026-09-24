import { capitalize, formatCircuitLength, formatDateFr } from './pdf-format.utils';

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

  it("formatCircuitLength n'ajoute « km » qu'à un nombre seul", () => {
    expect(formatCircuitLength('5')).toBe('5 km');
    expect(formatCircuitLength(' 5,2 ')).toBe('5,2 km');
    expect(formatCircuitLength('5km')).toBe('5km');
    expect(formatCircuitLength('45/80 km')).toBe('45/80 km');
    expect(formatCircuitLength('')).toBe('');
    expect(formatCircuitLength(null)).toBe('');
  });
});
