/**
 * Enregistre (ou remplace) le domaine partenaire HelloAsso autorisé pour
 * les `redirect_uri` OAuth et les URLs de retour de paiement.
 *
 * Usage :
 *   npm run register:helloasso-api-client -- --domain https://test-v2.opendossard.com
 *   npm run register:helloasso-api-client -- --domain https://localhost:3001   # dev
 *
 * Appelle :
 *   1. POST {HELLOASSO_API_BASE_URL}/oauth2/token  (clientCredentials)
 *   2. PUT  {HELLOASSO_API_BASE_URL}/v5/partners/me/api-clients
 *      body { domain }
 *
 * HelloAsso autorise alors tout chemin sous `domain` comme `redirect_uri`
 * OAuth et comme URL de retour (`backUrl` / `errorUrl` / `returnUrl`) côté
 * checkout-intent.
 *
 * ⚠️ ATTENTION — sémantique PUT : la valeur enregistrée REMPLACE la précédente.
 * Un seul domaine est autorisé à la fois par partenaire. Conséquence pratique :
 * basculer entre `localhost`, TEST, PREPROD, PROD nécessite de relancer ce
 * script à chaque changement de contexte.
 *
 * Pré-requis :
 *   - HELLOASSO_CLIENT_ID, HELLOASSO_CLIENT_SECRET, HELLOASSO_API_BASE_URL
 *     dans `.env.local` puis `.env` (même précédence que ConfigModule)
 */
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

interface CliArgs {
  domain: string;
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
  let domain: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--domain') {
      domain = argv[++i];
    } else if (a === '--help' || a === '-h') {
      printUsageAndExit(0);
    } else {
      throw new Error(`Argument inconnu : ${a}`);
    }
  }
  if (!domain || domain.trim().length === 0) {
    throw new Error('Préciser --domain <https-domain>');
  }
  let parsed: URL;
  try {
    parsed = new URL(domain);
  } catch {
    throw new Error(`--domain doit être une URL valide, reçu "${domain}"`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`--domain doit être en HTTPS, reçu "${parsed.protocol}"`);
  }
  // Pas de chemin / query / fragment — HelloAsso veut juste un domaine
  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error(`--domain ne doit pas inclure de chemin, reçu "${parsed.pathname}"`);
  }
  // Origin = scheme://host[:port], sans slash final
  return { domain: parsed.origin };
}

function printUsageAndExit(code: number): never {
  console.log(`Usage:
  npm run register:helloasso-api-client -- --domain <https-origin>

Exemples :
  npm run register:helloasso-api-client -- --domain https://test-v2.opendossard.com
  npm run register:helloasso-api-client -- --domain https://preprod-v2.opendossard.com
  npm run register:helloasso-api-client -- --domain https://app-v2.opendossard.com
  npm run register:helloasso-api-client -- --domain https://localhost:3001        # dev local

⚠️ HelloAsso ne stocke qu'UN seul domaine partenaire à la fois (sémantique PUT).
Relancer ce script à chaque changement de contexte (env / dev local).`);
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

async function registerApiClient(
  apiBaseUrl: string,
  accessToken: string,
  domain: string,
): Promise<{ status: number; body: string }> {
  const response = await fetch(`${apiBaseUrl}/v5/partners/me/api-clients`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain }),
  });
  const body = await safeReadText(response);
  return { status: response.status, body };
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

async function main(): Promise<void> {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));

  const clientId = requireEnv('HELLOASSO_CLIENT_ID');
  const clientSecret = requireEnv('HELLOASSO_CLIENT_SECRET');
  const apiBaseUrl = trimTrailingSlash(requireEnv('HELLOASSO_API_BASE_URL'));

  console.log(`→ Auth partenaire sur ${apiBaseUrl}/oauth2/token ...`);
  const accessToken = await getPartnerAccessToken(apiBaseUrl, clientId, clientSecret);
  console.log(`  ✓ token partenaire obtenu`);

  console.log(`→ PUT ${apiBaseUrl}/v5/partners/me/api-clients  { domain: ${args.domain} }`);
  const { status, body } = await registerApiClient(apiBaseUrl, accessToken, args.domain);

  if (status < 200 || status >= 300) {
    throw new Error(
      `Enregistrement KO : HTTP ${status} body=${truncate(body, 500)}`,
    );
  }

  console.log(`  ✓ HTTP ${status}`);
  console.log('');
  console.log(`Domaine partenaire actif : ${args.domain}`);
  console.log('');
  console.log('Tout chemin sous ce domaine est désormais accepté par HelloAsso');
  console.log('comme redirect_uri OAuth et comme backUrl/errorUrl/returnUrl checkout.');
  console.log('');
  console.log('⚠️  Le domaine précédent a été REMPLACÉ. Pour revenir en dev local,');
  console.log('    relancer avec --domain https://localhost:3001');
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Erreur: ${msg}`);
  process.exit(1);
});
