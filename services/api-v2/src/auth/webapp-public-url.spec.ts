import { parseWebappPublicUrl } from './webapp-public-url';

/** Message d'erreur renvoyé (jamais levé), ou un texte qui fera échouer le `toMatch`. */
function errorOf(raw: string | undefined, isProduction: boolean): string {
  const result = parseWebappPublicUrl(raw, isProduction);
  return 'error' in result ? result.error : `origine inattendue : ${result.origin}`;
}

describe('parseWebappPublicUrl', () => {
  it.each([
    ['https://bo.example', 'https://bo.example'],
    ['https://bo.example/', 'https://bo.example'],
    ['  https://bo.example:8443/  ', 'https://bo.example:8443'],
    ['http://localhost:5173', 'http://localhost:5173'],
  ])('%s → origine %s', (raw, expected) => {
    expect(parseWebappPublicUrl(raw, false)).toEqual({ origin: expected });
  });

  it.each([[undefined], [''], ['   ']])('valeur absente ou vide (%s) → erreur', raw => {
    expect(errorOf(raw, false)).toMatch(/obligatoire/);
  });

  it.each([
    ['bo.example', /n'est pas une URL/],
    ['ftp://bo.example', /http\(s\)/],
    ['javascript:alert(1)', /http\(s\)/],
    ['https://bo.example/app', /sans path/],
    ['https://bo.example/?a=1', /sans path/],
    ['https://bo.example/#x', /sans path/],
  ])('%s → erreur, sans throw', (raw, message) => {
    expect(errorOf(raw, false)).toMatch(message);
  });

  it('production : http refusé, https accepté', () => {
    expect(errorOf('http://bo.example', true)).toMatch(/https en production/);
    expect(parseWebappPublicUrl('https://bo.example', true)).toEqual({
      origin: 'https://bo.example',
    });
  });
});
