import { slugify } from './slugify.util';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('CYCLO CLUB CASTANEEN')).toBe('cyclo-club-castaneen');
  });

  it('strips French accents and diacritics', () => {
    expect(slugify('Élite Cyclistes')).toBe('elite-cyclistes');
    expect(slugify('Vélo Côté Châtel')).toBe('velo-cote-chatel');
    expect(slugify('Œuvres')).toBe('uvres'); // pas d'expansion œ→oe (HelloAsso non plus)
  });

  it('collapses runs of punctuation/separators into a single dash', () => {
    expect(slugify('Vélo & Co')).toBe('velo-co');
    expect(slugify('A -- B')).toBe('a-b');
    expect(slugify('multi   spaces')).toBe('multi-spaces');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  Padded  ')).toBe('padded');
    expect(slugify('-edge-')).toBe('edge');
    expect(slugify('!!Hello!!')).toBe('hello');
  });

  it('preserves digits', () => {
    expect(slugify('Team 42')).toBe('team-42');
  });

  it('returns empty string for input with no alphanumeric chars', () => {
    expect(slugify('---')).toBe('');
    expect(slugify('   ')).toBe('');
    expect(slugify('!!')).toBe('');
  });

  it('leaves an already-slugified string unchanged', () => {
    expect(slugify('cyclo-club-castaneen')).toBe('cyclo-club-castaneen');
  });

  it('is idempotent', () => {
    const a = slugify('Vélo & Co — Toulouse');
    expect(slugify(a)).toBe(a);
  });
});
