/* eslint-disable no-console */
/**
 * Inspecte les liaisons HelloAsso stockées en DB.
 *
 * Usage :
 *   npm run decrypt:helloasso -- --clubId 782
 *   npm run decrypt:helloasso -- --all
 *   npm run decrypt:helloasso -- --clubId 782 --show-tokens   # révèle les tokens en clair
 *
 * Par défaut, les tokens (`accessToken` / `refreshToken`) sont MASQUÉS (`****`).
 * Le flag `--show-tokens` est requis pour les afficher en clair — à n'utiliser
 * qu'en local et JAMAIS coller la sortie ailleurs (chat, ticket, log partagé).
 *
 * Pré-requis :
 *   - Variables d'env DB classiques (POSTGRES_HOST/PORT/USER/PASSWORD/DB) lues depuis .env.local puis .env
 *   - HELLOASSO_TOKEN_ENCRYPTION_KEY (32 octets base64) lu depuis le même .env
 */
import dataSource from '../src/data-source';
import { HelloAssoDetailsEntity } from '../src/helloasso/helloasso-details.entity';
import { decryptToken } from '../src/helloasso/util/token-crypto.util';

interface CliArgs {
  clubId?: number;
  all: boolean;
  showTokens: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { all: false, showTokens: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') {
      args.all = true;
    } else if (a === '--show-tokens') {
      args.showTokens = true;
    } else if (a === '--clubId') {
      const v = argv[++i];
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--clubId attend un entier positif, reçu "${v}"`);
      }
      args.clubId = n;
    } else if (a === '--help' || a === '-h') {
      printUsageAndExit(0);
    } else {
      throw new Error(`Argument inconnu : ${a}`);
    }
  }
  if (!args.all && args.clubId === undefined) {
    throw new Error('Préciser --clubId <n> ou --all');
  }
  return args;
}

function printUsageAndExit(code: number): never {
  console.log(`Usage:
  npm run decrypt:helloasso -- --clubId <id>                # tokens masqués
  npm run decrypt:helloasso -- --all                        # tokens masqués
  npm run decrypt:helloasso -- --clubId <id> --show-tokens  # tokens en clair (sensible)`);
  process.exit(code);
}

function loadKey(): Buffer {
  const b64 = process.env.HELLOASSO_TOKEN_ENCRYPTION_KEY;
  if (!b64 || b64.trim().length === 0) {
    throw new Error('HELLOASSO_TOKEN_ENCRYPTION_KEY manquant dans .env');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    throw new Error(`HELLOASSO_TOKEN_ENCRYPTION_KEY doit faire 32 octets une fois décodé en base64, reçu ${key.length}`);
  }
  return key;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const key = loadKey();

  await dataSource.initialize();
  try {
    const repo = dataSource.getRepository(HelloAssoDetailsEntity);
    const rows = args.all
      ? await repo.find({ order: { id: 'ASC' } })
      : await repo.find({ where: { clubId: args.clubId } });

    if (rows.length === 0) {
      console.error(args.all ? 'Aucune liaison HelloAsso en base.' : `Aucune liaison pour clubId=${args.clubId}.`);
      process.exit(2);
    }

    if (args.showTokens) {
      console.error('⚠️  --show-tokens activé : tokens en clair ci-dessous. NE PAS partager cette sortie.');
    }
    for (const row of rows) {
      const accessToken = args.showTokens ? decryptToken(row.accessTokenEncrypted, key) : '****';
      const refreshToken = args.showTokens ? decryptToken(row.refreshTokenEncrypted, key) : '****';
      console.log(JSON.stringify({
        id: row.id,
        clubId: row.clubId,
        slug: row.organizationSlug,
        accessToken,
        refreshToken,
        accessTokenExpiresAt: row.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: row.refreshTokenExpiresAt.toISOString(),
        linkedAt: row.linkedAt.toISOString(),
        lastRefreshedAt: row.lastRefreshedAt?.toISOString() ?? null,
        linkedByUserId: row.linkedByUserId,
      }, null, 2));
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Erreur: ${msg}`);
  process.exit(1);
});
