import { startOfEventDay } from './event-day';

describe('startOfEventDay', () => {
  it("donne minuit à Paris en heure d'hiver (UTC+1)", () => {
    expect(startOfEventDay('2026-12-06').toISOString()).toBe('2026-12-05T23:00:00.000Z');
  });

  it("donne minuit à Paris en heure d'été (UTC+2)", () => {
    expect(startOfEventDay('2026-06-01').toISOString()).toBe('2026-05-31T22:00:00.000Z');
  });

  it("reste juste les jours de changement d'heure", () => {
    // Passage à l'heure d'été le 29 mars 2026, à l'heure d'hiver le 25 octobre.
    expect(startOfEventDay('2026-03-29').toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(startOfEventDay('2026-03-30').toISOString()).toBe('2026-03-29T22:00:00.000Z');
    expect(startOfEventDay('2026-10-25').toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(startOfEventDay('2026-10-26').toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('décale du nombre de jours demandé, y compris en fin de mois', () => {
    expect(startOfEventDay('2026-06-30', 1).toISOString()).toBe('2026-06-30T22:00:00.000Z');
    expect(startOfEventDay('2026-12-31', 1).toISOString()).toBe('2026-12-31T23:00:00.000Z');
  });
});
