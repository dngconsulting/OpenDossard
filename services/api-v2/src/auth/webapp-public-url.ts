export type WebappPublicUrlResult = { origin: string } | { error: string };

/**
 * Valide `WEBAPP_PUBLIC_URL` et renvoie son origine (sans slash final), ou la
 * raison du refus. Ne lève jamais : une URL invalide ne doit pas empêcher l'API
 * de démarrer, seule la réinitialisation de mot de passe est désactivée.
 *
 * Le workflow de déploiement exporte une var GitHub absente en chaîne vide :
 * `getOrThrow` ne suffit pas, d'où la validation complète. L'URL n'est pas
 * sensible, elle peut être citée dans le message d'erreur.
 */
export function parseWebappPublicUrl(
  raw: string | undefined,
  isProduction: boolean,
): WebappPublicUrlResult {
  const value = raw?.trim() ?? '';
  if (value.length === 0) {
    return { error: 'WEBAPP_PUBLIC_URL est obligatoire et non vide' };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: `WEBAPP_PUBLIC_URL invalide : « ${value} » n'est pas une URL` };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: `WEBAPP_PUBLIC_URL invalide : « ${value} » doit être en http(s)` };
  }
  if (isProduction && url.protocol !== 'https:') {
    return {
      error: `WEBAPP_PUBLIC_URL invalide : « ${value} » doit être en https en production`,
    };
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    return {
      error: `WEBAPP_PUBLIC_URL invalide : « ${value} » doit être une origine, sans path, query ni hash`,
    };
  }

  return { origin: url.origin };
}
