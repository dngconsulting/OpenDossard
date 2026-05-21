/**
 * Souscrit (ou re-souscrit) l'URL de webhook HelloAsso côté partenaire.
 *
 * Usage :
 *   npm run register:helloasso-webhook -- --url https://abc.trycloudflare.com/api/v2/helloasso/webhooks
 *   npm run register:helloasso-webhook -- --url https://abc.trycloudflare.com/api/v2/helloasso/webhooks --show-key
 *
 * Appelle :
 *   1. POST {HELLOASSO_API_BASE_URL}/oauth2/token  (clientCredentials)
 *   2. PUT  {HELLOASSO_API_BASE_URL}/v5/partners/me/api-notifications
 *      body { url, notificationType: 'Payment' }
 *   3. PUT  {HELLOASSO_API_BASE_URL}/v5/partners/me/api-notifications
 *      body { url, notificationType: 'Organization' }
 *
 * Deux souscriptions distinctes sont nécessaires car l'API HA n'accepte
 * qu'un `notificationType` par requête. `Payment` couvre les paiements ;
 * `Organization` couvre les events orga (notamment `Organization.IsCashinCompliant`,
 * qui pilote l'éligibilité d'une asso à l'encaissement côté UI).
 *
 * HelloAsso renvoie `{ url, apiNotificationType, signatureKey }`. La
 * `signatureKey` est le secret partagé HMAC-SHA256 utilisé pour vérifier
 * les webhooks entrants — elle doit être mise dans
 * `HELLOASSO_WEBHOOK_SIGNATURE_KEY` du `.env` backend, sinon les webhooks
 * seront rejetés en 401 par notre receiver. Le script vérifie que les
 * deux souscriptions retournent la MÊME signatureKey (sinon il faudrait
 * étendre la config backend pour gérer deux clés ; à ce jour HA renvoie
 * une clé partenaire unique, mais on se protège du contraire en abortant).
 *
 * Par défaut la clé est MASQUÉE en stdout et écrite (mode 0600) dans
 * `/tmp/helloasso-webhook-signature-key`. Le flag `--show-key` la révèle
 * en stdout (avec warning stderr) — à n'utiliser qu'en local et JAMAIS
 * coller la sortie ailleurs (chat, ticket, log partagé).
 *
 * Pré-requis :
 *   - HELLOASSO_CLIENT_ID, HELLOASSO_CLIENT_SECRET, HELLOASSO_API_BASE_URL
 *     dans `.env.local` puis `.env` (même précédence que ConfigModule)
 *
 * Dev local : voir README "HelloAsso webhook — setup dev local"
 * (commande cloudflared, ré-enregistrement après relance du tunnel).
 */
import * as dotenv from 'dotenv';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface CliArgs {
  url: string;
  showKey: boolean;
}

interface RegisterResponse {
  url?: string;
  apiNotificationType?: string;
  signatureKey?: string;
}

interface TokenResponse {
  access_token?: string;
}

function loadEnv(): void {
  const candidates = [resolve(__dirname, '../.env.local'), resolve(__dirname, '../.env')];
  for (const path of candidates) {
    if (existsSync(path)) {
      dotenv.config({ path, override: false });
    }
  }
}

function parseArgs(argv: string[]): CliArgs {
  let url: string | undefined;
  let showKey = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') {
      url = argv[++i];
    } else if (a === '--show-key') {
      showKey = true;
    } else if (a === '--help' || a === '-h') {
      printUsageAndExit(0);
    } else {
      throw new Error(`Argument inconnu : ${a}`);
    }
  }
  if (!url || url.trim().length === 0) {
    throw new Error('Préciser --url <https-public-url>');
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`--url doit être une URL valide, reçu "${url}"`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`--url doit être en HTTPS, reçu "${parsed.protocol}"`);
  }
  return { url: parsed.toString(), showKey };
}

function printUsageAndExit(code: number): never {
  console.log(`Usage:
  npm run register:helloasso-webhook -- --url <https-url>             # clé masquée + écrite dans /tmp/helloasso-webhook-signature-key (mode 0600)
  npm run register:helloasso-webhook -- --url <https-url> --show-key  # clé en clair sur stdout (sensible)

L'URL doit être joignable publiquement depuis les datacenters HelloAsso
(localhost ne fonctionne PAS pour les webhooks). En dev local utiliser
cloudflared : voir README "HelloAsso webhook — setup dev local".`);
  process.exit(code);
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.trim().length === 0) {
    throw new Error(`${key} manquant dans .env (ou .env.local)`);
  }
  return v.trim();
}

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function getPartnerAccessToken(
  apiBaseUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(`${apiBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(
      `Auth partenaire KO : HTTP ${response.status} ${response.statusText} body=${truncate(body, 300)}`,
    );
  }
  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error('Auth partenaire KO : access_token manquant dans la réponse HelloAsso');
  }
  return data.access_token;
}

async function registerWebhook(
  apiBaseUrl: string,
  accessToken: string,
  url: string,
  notificationType: 'Payment' | 'Organization',
): Promise<RegisterResponse> {
  const response = await fetch(`${apiBaseUrl}/v5/partners/me/api-notifications`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, notificationType }),
  });
  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(
      `Souscription "${notificationType}" KO : HTTP ${response.status} ${response.statusText} body=${truncate(body, 500)}`,
    );
  }
  return (await response.json()) as RegisterResponse;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable>';
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

const SIGNATURE_KEY_FILE = '/tmp/helloasso-webhook-signature-key';

async function main(): Promise<void> {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));

  const clientId = requireEnv('HELLOASSO_CLIENT_ID');
  const clientSecret = requireEnv('HELLOASSO_CLIENT_SECRET');
  const apiBaseUrl = trimTrailingSlash(requireEnv('HELLOASSO_API_BASE_URL'));

  console.log(`→ Auth partenaire sur ${apiBaseUrl}/oauth2/token ...`);
  const accessToken = await getPartnerAccessToken(apiBaseUrl, clientId, clientSecret);
  console.log(`  ✓ token partenaire obtenu`);

  const notificationTypes: Array<'Payment' | 'Organization'> = ['Payment', 'Organization'];
  const results: Array<{ type: 'Payment' | 'Organization'; response: RegisterResponse }> = [];

  for (const type of notificationTypes) {
    console.log(
      `→ PUT ${apiBaseUrl}/v5/partners/me/api-notifications  { url: ${args.url}, notificationType: "${type}" }`,
    );
    const response = await registerWebhook(apiBaseUrl, accessToken, args.url, type);
    if (!response.signatureKey || response.signatureKey.trim().length === 0) {
      throw new Error(
        `Réponse HelloAsso inattendue (${type}) : signatureKey absent. body=${JSON.stringify(response)}`,
      );
    }
    console.log(`  ✓ souscription "${type}" OK`);
    results.push({ type, response });
  }

  console.log('');
  for (const { type, response } of results) {
    console.log(`  [${type}]`);
    console.log(`    url:                 ${response.url ?? '<missing>'}`);
    console.log(`    apiNotificationType: ${response.apiNotificationType ?? '<missing>'}`);
    console.log(`    signatureKey:        ${args.showKey ? response.signatureKey : '****'}`);
  }
  console.log('');

  // Le receiver côté backend n'utilise qu'UNE seule signatureKey
  // (HELLOASSO_WEBHOOK_SIGNATURE_KEY). On vérifie que les deux souscriptions
  // ont retourné la même valeur — c'est le contrat observé en sandbox HA.
  // Si HA un jour rotate les clés par notificationType, on aboutera ici plutôt
  // que d'avoir 50% des webhooks rejetés en 401 sans diagnostic.
  const signatureKeys = new Set(results.map(r => r.response.signatureKey!));
  if (signatureKeys.size > 1) {
    throw new Error(
      `HelloAsso a renvoyé des signatureKeys DIFFÉRENTES pour Payment et Organization. ` +
        `Le receiver actuel ne sait gérer qu'une seule clé — étendre la config backend ` +
        `(deux clés distinctes) avant d'aller plus loin.`,
    );
  }

  // À ce stade : 1 seule signatureKey unique pour les 2 souscriptions.
  const result: RegisterResponse = results[0].response;

  if (args.showKey) {
    console.error(
      '⚠️  --show-key activé : signatureKey en clair ci-dessus. NE PAS partager cette sortie.',
    );
    console.error(
      '   Copier dans services/api-v2/.env (variable HELLOASSO_WEBHOOK_SIGNATURE_KEY) puis redémarrer le backend.',
    );
  } else {
    writeFileSync(SIGNATURE_KEY_FILE, result.signatureKey ?? '', { mode: 0o600 });
    console.log(`Clé écrite dans ${SIGNATURE_KEY_FILE} (mode 0600).`);
    console.log('Étapes :');
    console.log(`  1. cat ${SIGNATURE_KEY_FILE}`);
    console.log(
      '  2. Coller la valeur dans services/api-v2/.env sur HELLOASSO_WEBHOOK_SIGNATURE_KEY=...',
    );
    console.log('  3. Redémarrer le backend pour recharger la config.');
    console.log(`  4. Supprimer le fichier temporaire : rm ${SIGNATURE_KEY_FILE}`);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Erreur: ${msg}`);
  process.exit(1);
});
