/**
 * Sérialise un objet en query string `?k1=v1&k2=v2` en ignorant les valeurs
 * `undefined`, `null`, `''`. `filters` est aplati au même niveau (chaque clé
 * devient un param). Les nombres et booléens sont stringifiés.
 *
 * Pattern repris de `licences.api.ts` et `payments.api.ts` — factorisé ici
 * pour éviter la duplication. Pas d'encodage spécial : `URLSearchParams` gère
 * l'escaping standard.
 */
export type QueryStringParams = {
  filters?: Record<string, unknown>;
  [key: string]: unknown;
};

export function buildQueryString(params: QueryStringParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'filters') {continue;}
    appendParam(searchParams, key, value);
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      appendParam(searchParams, key, value);
    }
  }

  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

function appendParam(target: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') {return;}
  target.set(key, String(value));
}
