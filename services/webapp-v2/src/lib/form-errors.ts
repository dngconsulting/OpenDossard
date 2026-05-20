import type { FieldError, FieldErrors } from 'react-hook-form';

/**
 * Aplatit récursivement les `FieldErrors` de react-hook-form en une liste de
 * messages lisibles. Gère les objets imbriqués (`pricing.message`) et les
 * arrays de FieldErrors (`races.0.message`).
 *
 * À utiliser EXCLUSIVEMENT pour les erreurs de validation côté front : le
 * 2e callback de `form.handleSubmit(onValid, onInvalid)`. Les erreurs
 * remontées par les mutations React Query sont gérées par le
 * `MutationCache.onError` global (cf. `App.tsx`) — ne JAMAIS toaster
 * manuellement à ce niveau, sinon doublon.
 */
export function collectFormErrorMessages(errors: FieldErrors): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') {return;}
    const maybeMessage = (node as Partial<FieldError>).message;
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      out.push(maybeMessage);
      return;
    }
    for (const value of Object.values(node)) {
      walk(value);
    }
  };
  walk(errors);
  return out;
}
