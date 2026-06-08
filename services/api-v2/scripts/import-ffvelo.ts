/**
 * Importe les randonnées FFvelo (fichier public `randoffvelo.json`) dans la base
 * OpenDossard : crée les clubs organisateurs FFvelo manquants puis insère les
 * compétitions associées (fédération FFVELO).
 *
 * Usage (lancé via ts-node — en conteneur `importer` ou en local) :
 *   npx ts-node scripts/import-ffvelo.ts                    # ~/Downloads/randoffvelo.json
 *   npx ts-node scripts/import-ffvelo.ts --file <chemin>    # chemin local explicite
 *   npx ts-node scripts/import-ffvelo.ts --url <url>        # télécharge depuis une URL
 *   npx ts-node scripts/import-ffvelo.ts --dry-run          # n'écrit rien, affiche le bilan
 *   npx ts-node scripts/import-ffvelo.ts --replace          # ancien mode purge+réinsertion
 *
 * Source URL : 404 / statut non-2xx / erreur réseau → import sauté proprement
 * (base intacte, exit 0). 200 → mêmes contrôles de schéma que pour un fichier.
 *
 * Idempotent. Deux modes :
 *   - DÉFAUT (delta) : match par clé d'identité (nom + date + type + CP),
 *     UPDATE si le contenu change, INSERT si nouvelle, DELETE des obsolètes.
 *     Préserve les `id` des lignes conservées et n'écrit que ce qui bouge.
 *   - `--replace` : purge complète de l'import précédent puis réinsertion (les
 *     `id` changent à chaque run).
 * Les clubs FFvelo pré-existants sont réutilisés par nom (pas de doublon). La
 * suppression d'une compétition est sûre tant qu'aucune `race`/inscription ne
 * la référence (FK RESTRICT → le DELETE échouerait proprement sinon).
 *
 * Pré-requis :
 *   - Variables d'env DB (POSTGRES_HOST/PORT/USER/PASSWORD/DB) lues depuis
 *     .env.local puis .env (cf. src/data-source.ts).
 *
 * Aucune modification de schéma. Les champs FFvelo sans colonne d'accueil sont
 * ignorés (cf. design 2026-06-08-import-ffvelo-design.md). Mix ciblé : la commune
 * (idx2) est ajoutée à `lieuDossard`, le type d'épreuve (idx8) + la description
 * (idx9) vont dans `observations`, et les attributs PSH/éco/femmes (idx28-30)
 * forment le bandeau `info`.
 */
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { QueryRunner, Repository, In } from 'typeorm';
import dataSource from '../src/data-source';
import { ClubEntity } from '../src/clubs/entities/club.entity';
import { CompetitionEntity } from '../src/competitions/entities/competition.entity';
import { Federation, CompetitionType } from '../src/common/enums';
import { PricingInfo, CompetitionInfo, LinkInfo } from '../src/common/types';

const AUTHOR = 'import-ffvelo';

/** Index des champs dans le tuple FFvelo (cf. en-têtes CSV). */
const F = {
  date: 0,
  name: 1,
  commune: 2,
  organisateur: 3,
  // departement: 4 (CODEP fédéral 3 chiffres — non fiable ; dept dérivé du code postal)
  // region: 5  (skippé — déductible du département)
  tarif: 6,
  activite: 7,
  type: 8,
  description: 9,
  // plusInfos: 10 (skippé — slug relatif)
  contactNom: 11,
  contactPrenom: 12,
  contactSiteWeb: 13,
  lieuAccueil: 14,
  // adresseAccueil: 15, cpArrivee/communeArrivee: 18-20 (skippés)
  cpAccueil: 16,
  cpArrivee: 19,
  latDepart: 21,
  lonDepart: 22,
  inscriptionWeb: 25,
  fichiersGpx: 26,
  fichierFlyer: 27,
  accessPsh: 28,
  devDurable: 29,
  specifiqueFemmes: 30,
} as const;

/**
 * Attributs booléens (idx 28-30) → picto + libellé court affiché dans `info`
 * si activé (=1). Format synthétique sur une seule ligne (séparateur ` · `).
 */
const FLAGS: ReadonlyArray<{ idx: number; label: string }> = [
  { idx: F.accessPsh, label: 'PMR' },
  { idx: F.devDurable, label: 'Éco' },
  { idx: F.specifiqueFemmes, label: 'Femmes' },
];

const DIFF_LABELS: Record<number, string> = {
  1: 'Très facile',
  2: 'Facile',
  3: 'Difficile',
  4: 'Très difficile',
};

/** Disciplines retenues, par ordre de priorité pour la discipline dominante. */
const DISCIPLINES: ReadonlyArray<{ key: string; label: string; type: CompetitionType }> = [
  { key: 'route', label: 'Route', type: CompetitionType.ROUTE },
  { key: 'vtt', label: 'VTT', type: CompetitionType.VTT },
  { key: 'gravel', label: 'Gravel', type: CompetitionType.GRAVEL },
];

interface Circuit {
  dist: number;
  deniv: number;
  diff: number;
}

interface CliArgs {
  file: string;
  /** Si défini, télécharge le JSON depuis cette URL au lieu de lire `file`. */
  url?: string;
  dryRun: boolean;
  /** true = purge+réinsertion (ancien mode). false (défaut) = delta upsert. */
  replace: boolean;
}

/** Erreur « douce » : on saute l'import proprement (base intacte), exit 0. */
class SkipImport extends Error {}

/**
 * Télécharge le JSON depuis une URL. 404 / autre statut non-2xx / erreur réseau
 * → `SkipImport` (import sauté, base non modifiée). 200 → corps texte.
 */
async function fetchRemote(url: string): Promise<string> {
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new SkipImport(
      `Téléchargement impossible (${url}) : ${msg} — import ignoré, base non modifiée.`,
    );
  }
  if (res.status === 404) {
    throw new SkipImport(
      `Source introuvable (HTTP 404) : ${url} — import ignoré, base non modifiée.`,
    );
  }
  if (!res.ok) {
    throw new SkipImport(
      `Réponse HTTP ${res.status} sur ${url} — import ignoré, base non modifiée.`,
    );
  }
  return res.text();
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    file: join(homedir(), 'Downloads', 'randoffvelo.json'),
    dryRun: false,
    replace: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--replace') {
      args.replace = true;
    } else if (a === '--url') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--url attend une URL');
      }
      args.url = v;
    } else if (a === '--file') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--file attend un chemin');
      }
      args.file = v;
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: npx ts-node scripts/import-ffvelo.ts [--url <url> | --file <chemin>] [--dry-run] [--replace]',
      );
      process.exit(0);
    } else {
      throw new Error(`Argument inconnu : ${a}`);
    }
  }
  return args;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** "07074 - ARDECHOISE CYCLO PROMOTION" → { code, name }. */
function parseOrganisateur(raw: string): { code: string; name: string } {
  const sep = raw.indexOf(' - ');
  if (sep === -1) {
    return { code: '', name: raw.trim() };
  }
  return { code: raw.slice(0, sep).trim(), name: raw.slice(sep + 3).trim() };
}

/** Circuits valides (objets dist/deniv/diff) d'une discipline donnée. */
function circuitsOf(activite: unknown, key: string): Circuit[] {
  const obj = (activite ?? {}) as Record<string, unknown>;
  const arr = Array.isArray(obj[key]) ? (obj[key] as unknown[]) : [];
  return arr.filter(
    (c): c is Circuit =>
      !!c && typeof c === 'object' && !Array.isArray(c) && typeof (c as Circuit).dist === 'number',
  );
}

/** Discipline dominante (route > vtt > gravel) ou null si aucune. */
function dominantDiscipline(activite: unknown): (typeof DISCIPLINES)[number] | null {
  for (const d of DISCIPLINES) {
    if (circuitsOf(activite, d.key).length > 0) {
      return d;
    }
  }
  return null;
}

/** Disciplines présentes (marche exclue), pour `categories`. */
function presentDisciplines(activite: unknown): string[] {
  return DISCIPLINES.filter(d => circuitsOf(activite, d.key).length > 0).map(d => d.label);
}

function buildPricing(tarif: unknown): PricingInfo[] {
  const labels = ['Adulte licencié', 'Jeune licencié', 'Adulte', 'Jeune'];
  const values = Array.isArray(tarif) ? tarif : [];
  const out: PricingInfo[] = [];
  for (let i = 0; i < labels.length; i++) {
    const v = str(values[i]);
    if (v.length > 0) {
      out.push({ name: labels[i], tarif: v });
    }
  }
  return out;
}

/**
 * Une entrée par circuit. Le front mobile affiche `info1` en ligne « Distance »
 * et `info2` en ligne « Dénivelé » → on y met respectivement la distance et le
 * D+. La difficulté n'est PAS ici (elle va dans `observations`).
 */
function buildCompetitionInfo(circuits: Circuit[], label: string): CompetitionInfo[] {
  return circuits.map((c, i) => {
    const info: CompetitionInfo = { course: `${label} P${i + 1} — ${c.dist}km` };
    info.info1 = `${c.dist} km`;
    if (typeof c.deniv === 'number' && c.deniv > 0) {
      info.info2 = `${c.deniv} m`;
    }
    return info;
  });
}

/** Résumé des difficultés par parcours, destiné à `observations`. */
function buildDifficultyNote(circuits: Circuit[], label: string): string {
  const lines = circuits
    .map((c, i) => {
      const diff = DIFF_LABELS[c.diff];
      return diff ? `${label} P${i + 1} (${c.dist}km) : ${diff}` : null;
    })
    .filter((x): x is string => x !== null);
  return lines.length > 0 ? `Difficulté des parcours :\n${lines.join('\n')}` : '';
}

function buildLinks(url: string, label: string): LinkInfo[] | null {
  return url.length > 0 ? [{ label, link: url }] : null;
}

/**
 * Lien d'inscription (idx25) → HTML placé EN TÊTE des `observations`
 * (champ rendu en HTML par le front). Vide si pas de lien.
 */
function buildInscriptionHtml(url: string): string {
  return url.length > 0
    ? `<p>Vous pouvez vous inscrire à l'évènement <a href="${url}">en suivant ce lien</a></p>`
    : '';
}

/**
 * Liens GPX (idx26, URLs séparées par des virgules) → HTML appendé aux
 * `observations` (champ rendu en HTML par le front). Un `<p>` par fichier,
 * numéroté quand il y en a plusieurs (un par parcours).
 */
function buildGpxHtml(raw: string): string {
  const urls = raw
    .split(',')
    .map(u => u.trim())
    .filter(u => u.length > 0);
  return urls
    .map((url, i) => {
      const label = urls.length > 1 ? `fichier GPX n°${i + 1}` : 'fichier GPX';
      return `<p>Téléchargez le <a href="${url}">${label}</a> du parcours</p>`;
    })
    .join('');
}

/**
 * Construit la compétition. Pré-condition : `row` a au moins un circuit avec
 * `dist` (les épreuves sans distance sont filtrées en amont). La discipline
 * dominante est donc toujours définie — jamais de fallback RANDO.
 */
function buildCompetition(
  row: unknown[],
  dominant: (typeof DISCIPLINES)[number],
  clubId: number | null,
  now: Date,
): Partial<CompetitionEntity> {
  const activite = row[F.activite];
  const circuits = circuitsOf(activite, dominant.key);
  const dists = circuits.map(c => c.dist);

  // Le CODEP (idx4) est un code fédéral à 3 chiffres ("007"), pas le n° de
  // département. On dérive le dept des 2 premiers chiffres du code postal (fiable).
  const zipCode = str(row[F.cpAccueil]) || str(row[F.cpArrivee]) || '00000';
  const dept = zipCode.slice(0, 2);

  const commune = str(row[F.commune]);
  const lieuAccueil = str(row[F.lieuAccueil]);
  const lieuDossard = [lieuAccueil, commune].filter(x => x.length > 0).join(' — ') || null;

  const lat = str(row[F.latDepart]);
  const lon = str(row[F.lonDepart]);
  const gps = lat && lon ? `${lat},${lon}` : null;

  const prenom = str(row[F.contactPrenom]);
  const nom = str(row[F.contactNom]);
  const contactName = [prenom, nom].filter(x => x.length > 0).join(' ') || null;

  const type = str(row[F.type]);
  const description = str(row[F.description]);
  const difficultyNote = buildDifficultyNote(circuits, dominant.label);
  const inscriptionHtml = buildInscriptionHtml(str(row[F.inscriptionWeb]));
  const gpxHtml = buildGpxHtml(str(row[F.fichiersGpx]));
  const observations =
    [inscriptionHtml, type, description, difficultyNote, gpxHtml]
      .filter(x => x.length > 0)
      .join('\n\n') || null;

  // `info` = bandeau d'attributs compact (PSH / éco / femmes), une seule ligne.
  const info =
    FLAGS.filter(f => row[f.idx] === 1 || row[f.idx] === '1')
      .map(f => f.label)
      .join(' · ') || null;

  const disciplines = presentDisciplines(activite);

  const comp: Partial<CompetitionEntity> = {
    eventDate: new Date(`${str(row[F.date])}T00:00:00`),
    clubId: clubId ?? undefined,
    name: str(row[F.name]) || 'Randonnée FFvelo',
    zipCode,
    dept: dept || undefined,
    fede: Federation.FFVELO,
    competitionType: dominant.type,
    pricing: buildPricing(row[F.tarif]),
    competitionInfo: buildCompetitionInfo(circuits, dominant.label),
    races: dists.map(d => `${d}km`).join(', '),
    categories: disciplines.join(', '),
    longueurCircuit: `${dists.join('/')} km`,
    lieuDossard: lieuDossard ?? undefined,
    lieuDossardGPS: gps ?? undefined,
    siteweb: str(row[F.contactSiteWeb]) || str(row[F.inscriptionWeb]) || undefined,
    contactName: contactName ?? undefined,
    registrationUrls: buildLinks(str(row[F.inscriptionWeb]), 'Inscription') ?? undefined,
    photoUrls: buildLinks(str(row[F.fichierFlyer]), 'Affiche'),
    info: info ?? undefined,
    observations: observations ?? undefined,
    // Randos cyclo ouvertes à tous → le front affiche « Ouvert aux autres
    // fédérations et aux non-licenciés » au lieu de « Réservé aux licenciés ».
    openedToOtherFede: true,
    openedNL: true,
    avecChrono: false,
    onlineRegistrationEnabled: false,
    author: AUTHOR,
    lastChanged: now,
  };

  return comp;
}

async function resolveClubs(
  rows: unknown[][],
  runner: QueryRunner,
  dryRun: boolean,
): Promise<{ map: Map<string, number>; created: number; reused: number }> {
  const clubRepo = runner.manager.getRepository(ClubEntity);
  // Clubs FFvelo pré-existants (hors import — celui-ci a été purgé en amont),
  // réutilisés par nom pour ne pas les dupliquer.
  const existing = await clubRepo.find({ where: { fede: Federation.FFVELO } });
  const byName = new Map<string, number>();
  for (const c of existing) {
    byName.set(c.longName, c.id);
  }

  // Déduplication intra-fichier sur l'organisateur brut (code + nom) : deux clubs
  // de même nom mais de code différent restent distincts. Le code fédéral n'est
  // PAS stocké (ce n'est pas un nom court) — il ne sert que de clé ici.
  const map = new Map<string, number>();
  let created = 0;
  let reused = 0;
  const now = new Date();

  for (const row of rows) {
    const raw = str(row[F.organisateur]);
    if (raw.length === 0 || map.has(raw)) {
      continue;
    }
    const { name } = parseOrganisateur(raw);
    const preExisting = byName.get(name);
    if (preExisting !== undefined) {
      map.set(raw, preExisting);
      reused++;
      continue;
    }
    if (dryRun) {
      map.set(raw, -1);
      created++;
      continue;
    }
    const club = clubRepo.create({
      longName: name,
      dept: (str(row[F.cpAccueil]) || str(row[F.cpArrivee])).slice(0, 2) || undefined,
      fede: Federation.FFVELO,
      author: AUTHOR,
      lastChanged: now,
    });
    const saved = await clubRepo.save(club);
    map.set(raw, saved.id);
    created++;
  }
  return { map, created, reused };
}

/**
 * Garde-fou exécuté AVANT toute opération destructive : vérifie que le fichier
 * n'est pas vide et que chaque tuple respecte le schéma mappé (bons index, types
 * cohérents). Lève une erreur — sans toucher la base — au moindre écart, pour
 * éviter de purger la fédé FFVELO sur la foi d'un fichier vide/corrompu/mal formé.
 */
function validateDataset(parsed: unknown, file: string): unknown[][] {
  if (!Array.isArray(parsed)) {
    throw new Error(`Le JSON attendu est un tableau de tuples (${file}).`);
  }
  if (parsed.length === 0) {
    throw new Error(
      `Fichier vide : 0 enregistrement dans ${file} — abandon, la base n'est pas modifiée.`,
    );
  }

  const isObj = (c: unknown): c is Record<string, unknown> =>
    !!c && typeof c === 'object' && !Array.isArray(c);
  const errors: string[] = [];

  parsed.forEach((row, i) => {
    if (!Array.isArray(row) || row.length !== 31) {
      const got = Array.isArray(row) ? `${row.length} champs` : typeof row;
      errors.push(`ligne ${i} : tuple invalide (${got}, 31 attendus)`);
      return; // indices non fiables → on ne pousse pas plus loin
    }
    const r = row as unknown[];
    const errs: string[] = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str(r[F.date]))) errs.push('date (idx0) ≠ AAAA-MM-JJ');
    if (str(r[F.name]) === '') errs.push('nom (idx1) vide');
    if (str(r[F.organisateur]) === '') errs.push('organisateur (idx3) vide');
    if (!Array.isArray(r[F.tarif]) || (r[F.tarif] as unknown[]).length !== 4)
      errs.push('tarif (idx6) ≠ tableau de 4');
    const act = r[F.activite];
    if (
      !isObj(act) ||
      !Array.isArray(act.route) ||
      !Array.isArray(act.vtt) ||
      !Array.isArray(act.gravel)
    )
      errs.push('activité (idx7) sans route/vtt/gravel');
    if (typeof r[F.type] !== 'string') errs.push('type (idx8) non-string');
    if (!/^\d{5}$/.test(str(r[F.cpAccueil])) && !/^\d{5}$/.test(str(r[F.cpArrivee])))
      errs.push('code postal (idx16/19) absent ou ≠ 5 chiffres');
    const lat = str(r[F.latDepart]);
    if (lat !== '' && !Number.isFinite(parseFloat(lat)))
      errs.push('latitude (idx21) non numérique');
    for (const f of FLAGS) {
      if (r[f.idx] !== 0 && r[f.idx] !== 1) errs.push(`flag idx${f.idx} ≠ 0/1`);
    }
    if (errs.length > 0) errors.push(`ligne ${i} : ${errs.join(', ')}`);
  });

  if (errors.length > 0) {
    const preview = errors.slice(0, 5).join('\n  ');
    const more = errors.length > 5 ? `\n  … (+${errors.length - 5} autres)` : '';
    throw new Error(
      `Schéma JSON non conforme (${errors.length} ligne(s) en erreur) — abandon, la base n'est pas modifiée.\n  ${preview}${more}`,
    );
  }
  return parsed as unknown[][];
}

/** Champs de contenu comparés pour décider d'un UPDATE (hors id/author/lastChanged). */
const COMPARE_FIELDS: ReadonlyArray<keyof CompetitionEntity> = [
  'name',
  'zipCode',
  'dept',
  'clubId',
  'competitionType',
  'pricing',
  'competitionInfo',
  'races',
  'categories',
  'longueurCircuit',
  'lieuDossard',
  'lieuDossardGPS',
  'siteweb',
  'contactName',
  'registrationUrls',
  'photoUrls',
  'info',
  'observations',
  'openedToOtherFede',
  'openedNL',
  'avecChrono',
  'onlineRegistrationEnabled',
];

/** Clé d'identité d'une compétition : nom + date + type + code postal. */
function compKey(c: Partial<CompetitionEntity>): string {
  const date = c.eventDate instanceof Date ? c.eventDate.toISOString() : String(c.eventDate);
  return `${(c.name ?? '').toLowerCase()}|${date}|${c.competitionType ?? ''}|${c.zipCode ?? ''}`;
}

/** Sérialisation stable (clés triées récursivement) pour comparer des valeurs JSON. */
function stable(v: unknown): string {
  if (v === undefined || v === null) return 'null';
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map(k => `${k}:${stable(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

/** true si au moins un champ de contenu diffère entre l'existant et le désiré. */
function competitionDiffers(
  existing: CompetitionEntity,
  desired: Partial<CompetitionEntity>,
): boolean {
  const ed = existing.eventDate instanceof Date ? existing.eventDate.getTime() : NaN;
  const dd = desired.eventDate instanceof Date ? desired.eventDate.getTime() : NaN;
  if (ed !== dd) return true;
  for (const f of COMPARE_FIELDS) {
    if (stable(existing[f]) !== stable(desired[f])) return true;
  }
  return false;
}

interface SyncStats {
  inserted: number;
  updated: number;
  unchanged: number;
  deleted: number;
}

/**
 * Synchronise les compétitions en delta : match par clé d'identité (nom + date +
 * type + CP), UPDATE si le contenu a changé, INSERT si nouvelle, DELETE des
 * obsolètes (présentes en base mais absentes du fichier — ex. épreuve annulée).
 * Préserve les `id` des lignes conservées. Les ~10 clés en collision retombent
 * en INSERT (sans casse).
 *
 * SÛRETÉ : toute écriture (UPDATE/DELETE) est scopée `fede=FFVELO AND
 * author=import-ffvelo` dans le WHERE — jamais une compétition d'une autre fédé
 * ni d'une autre source ne peut être touchée. Garde défensif en entrée.
 */
async function syncCompetitions(
  repo: Repository<CompetitionEntity>,
  desiredList: Partial<CompetitionEntity>[],
  now: Date,
  dryRun: boolean,
): Promise<SyncStats> {
  // Garde-fou : on n'écrit QUE des compétitions FFVELO issues de cet import.
  for (const c of desiredList) {
    if (c.fede !== Federation.FFVELO || c.author !== AUTHOR) {
      throw new Error(
        'Garde-fou : compétition non-FFVELO ou hors import détectée — abandon, aucune écriture.',
      );
    }
  }

  const existing = await repo.find({ where: { author: AUTHOR, fede: Federation.FFVELO } });
  const byKey = new Map<string, CompetitionEntity[]>();
  for (const e of existing) {
    const k = compKey(e);
    const bucket = byKey.get(k);
    if (bucket) bucket.push(e);
    else byKey.set(k, [e]);
  }

  const seen = new Set<number>();
  const toInsert: Partial<CompetitionEntity>[] = [];
  let updated = 0;
  let unchanged = 0;

  for (const desired of desiredList) {
    const bucket = byKey.get(compKey(desired));
    const match = bucket?.find(e => !seen.has(e.id));
    if (match) {
      seen.add(match.id);
      if (competitionDiffers(match, desired)) {
        // WHERE scopé fede+author : ne peut toucher qu'une compét FFVELO importée.
        if (!dryRun) {
          await repo.update(
            { id: match.id, fede: Federation.FFVELO, author: AUTHOR },
            { ...desired, lastChanged: now },
          );
        }
        updated++;
      } else {
        unchanged++;
      }
    } else {
      toInsert.push(desired);
    }
  }

  if (!dryRun && toInsert.length > 0) {
    const entities = toInsert.map(c => repo.create(c));
    const CHUNK = 200;
    for (let i = 0; i < entities.length; i += CHUNK) {
      await repo.save(entities.slice(i, i + CHUNK));
    }
  }

  // Obsolètes (en base mais absentes du fichier — ex. épreuve annulée) → DELETE.
  // WHERE scopé fede+author EN PLUS des ids : double sécurité, ne peut toucher
  // qu'une compét FFVELO importée, jamais une autre fédé ni une autre source.
  const stale = existing.filter(e => !seen.has(e.id));
  if (!dryRun && stale.length > 0) {
    await repo.delete({
      id: In(stale.map(e => e.id)),
      fede: Federation.FFVELO,
      author: AUTHOR,
    });
  }

  return { inserted: toInsert.length, updated, unchanged, deleted: stale.length };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Source : URL distante (téléchargement, skip propre si 404/erreur) ou fichier local.
  const source = args.url ?? args.file;
  let raw: string;
  if (args.url) {
    console.log(`Téléchargement : ${args.url}`);
    raw = await fetchRemote(args.url);
  } else {
    if (!existsSync(args.file)) {
      throw new Error(`Fichier introuvable : ${args.file}`);
    }
    raw = readFileSync(args.file, 'utf8');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`JSON invalide depuis ${source} : ${msg}`);
  }
  const rows = validateDataset(parsed, source);

  // On n'importe que les épreuves ayant au moins un circuit avec distance.
  // Les autres (marches, concentrations sans parcours chiffré…) sont exclues.
  const kept = rows
    .map(row => ({ row, dominant: dominantDiscipline(row[F.activite]) }))
    .filter(
      (x): x is { row: unknown[]; dominant: (typeof DISCIPLINES)[number] } => x.dominant !== null,
    );
  const excluded = rows.length - kept.length;
  console.log(
    `Lecture : ${rows.length} enregistrements (${kept.length} avec distance retenus, ${excluded} sans distance exclus)`,
  );
  if (kept.length === 0) {
    throw new Error(
      "Aucune compétition importable (toutes sans distance) — abandon, la base n'est pas modifiée.",
    );
  }

  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const compRepo = runner.manager.getRepository(CompetitionEntity);
    const clubRepo = runner.manager.getRepository(ClubEntity);

    // Mode --replace : purge complète du précédent import puis réinsertion
    // (compétitions d'abord pour la FK, puis clubs). En delta (défaut), aucune
    // purge : on conserve les lignes et leurs `id`.
    if (args.replace) {
      await compRepo.delete({ author: AUTHOR, fede: Federation.FFVELO });
      await clubRepo.delete({ author: AUTHOR, fede: Federation.FFVELO });
    }

    const {
      map: clubMap,
      created: clubsCreated,
      reused: clubsReused,
    } = await resolveClubs(
      kept.map(k => k.row),
      runner,
      args.dryRun,
    );

    const now = new Date();
    const built = kept.map(({ row, dominant }) =>
      buildCompetition(row, dominant, clubMap.get(str(row[F.organisateur])) ?? null, now),
    );
    const byType: Record<string, number> = {};
    for (const c of built) {
      const t = c.competitionType ?? '?';
      byType[t] = (byType[t] ?? 0) + 1;
    }

    let compLine: string;
    if (args.replace) {
      if (!args.dryRun) {
        const entities = built.map(c => compRepo.create(c));
        const CHUNK = 200;
        for (let i = 0; i < entities.length; i += CHUNK) {
          await compRepo.save(entities.slice(i, i + CHUNK));
        }
      }
      compLine = `${built.length} ${args.dryRun ? 'à insérer' : 'insérées'} (mode --replace)`;
    } else {
      const s = await syncCompetitions(compRepo, built, now, args.dryRun);
      compLine = `${s.inserted} ajoutées, ${s.updated} mises à jour, ${s.unchanged} inchangées, ${s.deleted} supprimées (delta)`;
    }

    console.log('--- Bilan ---');
    console.log(`Clubs FFvelo  : ${clubsCreated} créés, ${clubsReused} réutilisés`);
    console.log(`Compétitions  : ${compLine}`);
    console.log(`Exclues (sans distance) : ${excluded}`);
    console.log('Répartition par type :', byType);

    if (args.dryRun) {
      console.log('DRY-RUN : aucune écriture, rollback.');
      await runner.rollbackTransaction();
    } else {
      await runner.commitTransaction();
      console.log('Commit OK.');
    }
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (err instanceof SkipImport) {
    // Skip volontaire (source 404/indispo) : base intacte, pas une vraie erreur.
    console.error(`[IMPORT FFVELO IGNORÉ] ${msg}`);
    process.exit(0);
  }
  console.error(`Erreur: ${msg}`);
  process.exit(1);
});
