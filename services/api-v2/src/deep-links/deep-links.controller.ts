import { Controller, Get, Param, Res, Header, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { join } from 'path';

const APP_STORE_URL = 'https://apps.apple.com/app/dossardeur/id1496777795';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dossardeur';
const APP_SCHEME = 'dossardeur://';

/**
 * Controller hors du prefix /api — sert les pages de fallback deep link
 * et les fichiers .well-known pour Universal Links / App Links.
 */
@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class DeepLinksController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('.well-known/apple-app-site-association')
  @Header('Content-Type', 'application/json')
  appleAppSiteAssociation() {
    return {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: ['N676M59J43.com.dossardeur'],
            components: [
              // Pages de partage (épreuve, classement, palmarès) — fallback web
              // si l'app n'est pas installée, sinon ouverture directe dans l'app.
              { '/': '/app/*' },
              // NB Firebase email links (reset password, verify email) ne
              // passent plus par ce host : ils sont servis par Firebase Hosting
              // sur `auth-test.opendossard.com` / `auth.opendossard.com` (cf.
              // `app.config.ts > LINK_DOMAIN`), qui auto-sert son AASA.
            ],
          },
        ],
      },
    };
  }

  @Get('.well-known/assetlinks.json')
  @Header('Content-Type', 'application/json')
  assetLinks() {
    return [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.dossardeur',
          sha256_cert_fingerprints: [
            '03:43:AB:3E:F1:83:26:F9:76:25:D9:8E:96:CE:31:E5:EC:87:8C:A3:B9:14:B5:A5:5B:CA:B6:2A:CA:D8:5D:2F'
          ],
        },
      },
    ];
  }

  @Get('app/app-icon.png')
  serveAppIcon(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'assets', 'app-icon.png'));
  }

  @Get('app/epreuve/:id')
  async epreuveDeepLink(@Param('id') id: string, @Res() res: Response) {
    let title = 'Épreuve cycliste';
    let description = 'Voir le détail de cette épreuve sur Dossardeur';

    try {
      const row = await this.dataSource.query(
        'SELECT name, event_date, fede FROM competition WHERE id = $1',
        [id],
      );
      if (row.length > 0) {
        title = row[0].name;
        const date = new Date(row[0].event_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        description = `${row[0].fede} — ${date}`;
      }
    } catch {
      // fallback silencieux
    }

    res.type('html').send(buildFallbackPage({
      title,
      description,
      deepLink: `${APP_SCHEME}epreuve/${id}`,
      path: `/app/epreuve/${id}`,
    }));
  }

  @Get('app/classement/:id')
  async classementDeepLink(@Param('id') id: string, @Res() res: Response) {
    let title = 'Classement';
    let description = 'Voir le classement sur Dossardeur';

    try {
      const row = await this.dataSource.query(
        'SELECT name FROM competition WHERE id = $1',
        [id],
      );
      if (row.length > 0) {
        title = `Classement — ${row[0].name}`;
      }
    } catch {}

    res.type('html').send(buildFallbackPage({
      title,
      description,
      deepLink: `${APP_SCHEME}classement/${id}`,
      path: `/app/classement/${id}`,
    }));
  }

  @Get('app/palmares/:id')
  async palmaresDeepLink(@Param('id') id: string, @Res() res: Response) {
    let title = 'Palmarès';
    let description = 'Voir le palmarès sur Dossardeur';

    try {
      const row = await this.dataSource.query(
        `SELECT name, first_name FROM licence WHERE id = $1`,
        [id],
      );
      if (row.length > 0) {
        title = `Palmarès de ${row[0].first_name} ${row[0].name}`;
      }
    } catch {}

    res.type('html').send(buildFallbackPage({
      title,
      description,
      deepLink: `${APP_SCHEME}palmares-detail/${id}`,
      path: `/app/palmares/${id}`,
    }));
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFallbackPage(opts: {
  title: string;
  description: string;
  deepLink: string;
  path: string;
}) {
  const t = escapeHtml(opts.title);
  const d = escapeHtml(opts.description);
  const dl = escapeHtml(opts.deepLink);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t} — Dossardeur</title>
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://app-v2.opendossard.com/app/app-icon.png" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1C3C57 0%, #2d4889 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      color: white; padding: 24px; }
    .card { background: rgba(255,255,255,0.12); border-radius: 20px; padding: 40px;
      max-width: 400px; text-align: center; backdrop-filter: blur(10px); }
    .logo { width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
    p { font-size: 15px; opacity: 0.8; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 12px;
      font-weight: 700; font-size: 16px; text-decoration: none; margin: 6px; }
    .btn-primary { background: white; color: #1C3C57; }
    .btn-store { background: rgba(255,255,255,0.2); color: white; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; }
    .btn-store svg { width: 18px; height: 18px; fill: white; }
    .store-badges { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="https://app-v2.opendossard.com/app/app-icon.png" alt="Open Dossard" />
    <h1>${t}</h1>
    <p>${d}</p>
    <a class="btn btn-primary" href="${dl}">Ouvrir dans l'app</a>
    <div class="store-badges">
      <a class="btn btn-store" href="${APP_STORE_URL}">
        <svg viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
        App Store
      </a>
      <a class="btn btn-store" href="${PLAY_STORE_URL}">
        <svg viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
        Google Play
      </a>
    </div>
  </div>
  <script>
    // Tente d'ouvrir l'app automatiquement
    setTimeout(function() { window.location.href = '${dl}'; }, 300);
  </script>
</body>
</html>`;
}
