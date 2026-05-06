import { Controller, Get, Param, Query, Res, Header, VERSION_NEUTRAL } from '@nestjs/common';
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
              // Liens Firebase (reset password, verify email) — l'app est
              // toujours installée par construction (l'user a déjà un compte).
              // Wildcard `*` pour matcher les query strings (mode, oobCode).
              { '/': '/auth/action*' },
              // Wrapper Firebase post-FDL généré quand `linkDomain` pointe sur
              // ce host (cf. app.config.ts > authLinkDomain). Cible :
              // `/__/auth/links?link=…` puis `/__/auth/action?…`.
              { '/': '/__/auth/*' },
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

  /**
   * Wrapper Firebase post-FDL — cible initiale du clic email. Si l'OS a une
   * association Universal Links / App Links sur ce host, l'app intercepte et
   * cet endpoint n'est jamais hit. Sinon (browser, app pas installée), on
   * déballe le `link` interne et on redirige vers le fallback web ci-dessous.
   */
  @Get('__/auth/links')
  authLinksRedirect(@Query('link') link: string | undefined, @Res() res: Response) {
    if (!link) {
      return res.status(400).type('html').send(buildAuthErrorPage('Lien invalide.'));
    }
    let inner: URL;
    try {
      inner = new URL(link);
    } catch {
      return res.status(400).type('html').send(buildAuthErrorPage('Lien invalide.'));
    }
    const mode = inner.searchParams.get('mode') ?? '';
    const oobCode = inner.searchParams.get('oobCode') ?? '';
    const apiKey = inner.searchParams.get('apiKey') ?? '';
    const continueUrl = inner.searchParams.get('continueUrl') ?? '';
    const lang = inner.searchParams.get('lang') ?? 'fr';

    const params = new URLSearchParams({ mode, oobCode, apiKey, continueUrl, lang });
    return res.redirect(302, `/__/auth/action?${params.toString()}`);
  }

  /**
   * Fallback web pour reset password / verify email quand l'app n'est pas
   * installée. Utilise l'API Firebase Identity Toolkit côté client (l'`apiKey`
   * passe déjà en clair dans le lien email — c'est la clé publique Web).
   * Le `oobCode` reste à usage unique côté Firebase, le rendre côté browser
   * n'élargit pas la surface d'attaque.
   */
  @Get('__/auth/action')
  authActionFallback(
    @Query('mode') mode: string | undefined,
    @Query('oobCode') oobCode: string | undefined,
    @Query('apiKey') apiKey: string | undefined,
    @Query('continueUrl') continueUrl: string | undefined,
    @Res() res: Response,
  ) {
    if (!mode || !oobCode || !apiKey) {
      return res.status(400).type('html').send(buildAuthErrorPage('Lien incomplet ou expiré.'));
    }
    const supportedModes = new Set(['resetPassword', 'verifyEmail']);
    if (!supportedModes.has(mode)) {
      return res
        .status(400)
        .type('html')
        .send(buildAuthErrorPage(`Action « ${mode} » non supportée.`));
    }
    res.type('html').send(
      buildAuthFallbackPage({
        mode: mode as 'resetPassword' | 'verifyEmail',
        oobCode,
        apiKey,
        continueUrl: continueUrl ?? '',
      }),
    );
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

/**
 * Page web de fallback pour les actions d'auth Firebase (reset password /
 * verify email). Embarque l'oobCode + apiKey côté client et tape directement
 * l'API Identity Toolkit, donc l'endpoint NestJS est purement statique
 * (pas de proxy, pas de credentials côté serveur).
 */
function buildAuthFallbackPage(opts: {
  mode: 'resetPassword' | 'verifyEmail';
  oobCode: string;
  apiKey: string;
  continueUrl: string;
}) {
  const isReset = opts.mode === 'resetPassword';
  const title = isReset ? 'Réinitialisation du mot de passe' : 'Vérification de votre email';
  const t = escapeHtml(title);

  const formBlock = isReset
    ? `
        <h1 id="title">${t}</h1>
        <p id="subtitle" class="muted">Choisissez un nouveau mot de passe pour votre compte.</p>
        <form id="reset-form" novalidate>
          <label for="pw1">Nouveau mot de passe</label>
          <input id="pw1" type="password" autocomplete="new-password" minlength="8" required />
          <label for="pw2">Confirmer le mot de passe</label>
          <input id="pw2" type="password" autocomplete="new-password" minlength="8" required />
          <p id="form-error" class="error" hidden></p>
          <button type="submit" id="submit-btn">Valider</button>
        </form>
        <div id="result" hidden></div>
      `
    : `
        <h1 id="title">${t}</h1>
        <p id="subtitle" class="muted">Vérification en cours…</p>
        <div id="spinner" class="spinner"></div>
        <div id="result" hidden></div>
      `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t} — Dossardeur</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1C3C57 0%, #2d4889 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      color: white; padding: 24px; }
    .card { background: rgba(255,255,255,0.12); border-radius: 20px; padding: 32px 28px;
      max-width: 420px; width: 100%; backdrop-filter: blur(10px); }
    .logo { display: block; width: 96px; height: 96px; object-fit: contain;
      margin: 0 auto 16px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; line-height: 1.3; text-align: center; }
    .muted { font-size: 14px; opacity: 0.8; margin-bottom: 22px; text-align: center; line-height: 1.4; }
    label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;
      text-transform: uppercase; opacity: 0.8; margin-bottom: 6px; margin-top: 14px; }
    input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.25); color: white; font-size: 16px; }
    input:focus { outline: 2px solid rgba(255,255,255,0.4); }
    button { margin-top: 22px; width: 100%; padding: 14px; border-radius: 10px;
      border: 0; background: white; color: #1C3C57; font-weight: 700; font-size: 16px;
      cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { color: #FFB4B4; font-size: 14px; margin-top: 12px; }
    .ok { color: #B8F5C8; font-size: 15px; margin-top: 8px; line-height: 1.5; }
    .result-block { text-align: center; }
    .spinner { width: 32px; height: 32px; margin: 24px auto; border: 3px solid rgba(255,255,255,0.2);
      border-top-color: white; border-radius: 50%; animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .open-app { display: block; text-align: center; margin-top: 18px; font-size: 14px;
      color: white; text-decoration: underline; opacity: 0.85; }
  </style>
</head>
<body data-mode="${escapeHtml(opts.mode)}">
  <div class="card">
    <img class="logo" src="https://app-v2.opendossard.com/logood.png" alt="Dossardeur" />
    ${formBlock}
    <a class="open-app" href="dossardeur://auth/action?mode=${encodeURIComponent(opts.mode)}&oobCode=${encodeURIComponent(opts.oobCode)}">Ouvrir dans l'app Dossardeur</a>
  </div>
  <script>
    (function() {
      var params = new URLSearchParams(window.location.search);
      var oobCode = params.get('oobCode');
      var apiKey = params.get('apiKey');
      var mode = document.body.dataset.mode;

      function showResult(html, isError) {
        var el = document.getElementById('result');
        el.className = 'result-block ' + (isError ? 'error' : 'ok');
        el.innerHTML = html;
        el.hidden = false;
      }

      function hide(id) { var el = document.getElementById(id); if (el) el.hidden = true; }

      function fbErrorMessage(code) {
        switch (code) {
          case 'EXPIRED_OOB_CODE': return 'Ce lien a expiré. Demandez-en un nouveau depuis l\\'app.';
          case 'INVALID_OOB_CODE': return 'Ce lien n\\'est plus valide (déjà utilisé ?). Demandez-en un nouveau.';
          case 'USER_DISABLED': return 'Ce compte est désactivé.';
          case 'WEAK_PASSWORD : Password should be at least 6 characters':
          case 'WEAK_PASSWORD': return 'Mot de passe trop faible (au moins 8 caractères).';
          default: return 'Erreur Firebase : ' + code;
        }
      }

      if (mode === 'verifyEmail') {
        fetch('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + encodeURIComponent(apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oobCode: oobCode })
        })
        .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, body: j }; }); })
        .then(function(res) {
          hide('spinner');
          if (res.ok) {
            document.getElementById('subtitle').textContent = '';
            showResult('<p class="ok">Votre adresse email a été vérifiée. Vous pouvez retourner dans l\\'app.</p>', false);
          } else {
            var code = (res.body && res.body.error && res.body.error.message) || 'UNKNOWN';
            showResult('<p>' + fbErrorMessage(code) + '</p>', true);
          }
        })
        .catch(function() {
          hide('spinner');
          showResult('<p>Erreur réseau. Réessayez plus tard.</p>', true);
        });
        return;
      }

      // resetPassword
      var form = document.getElementById('reset-form');
      var pw1 = document.getElementById('pw1');
      var pw2 = document.getElementById('pw2');
      var btn = document.getElementById('submit-btn');
      var errEl = document.getElementById('form-error');

      function setError(msg) {
        if (msg) { errEl.textContent = msg; errEl.hidden = false; }
        else { errEl.textContent = ''; errEl.hidden = true; }
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        setError('');
        if (pw1.value.length < 8) { setError('Au moins 8 caractères.'); return; }
        if (pw1.value !== pw2.value) { setError('Les deux mots de passe ne correspondent pas.'); return; }
        btn.disabled = true;
        btn.textContent = 'Validation…';
        fetch('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=' + encodeURIComponent(apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oobCode: oobCode, newPassword: pw1.value })
        })
        .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, body: j }; }); })
        .then(function(res) {
          if (res.ok) {
            form.hidden = true;
            document.getElementById('subtitle').textContent = '';
            showResult('<p class="ok">Mot de passe modifié. Vous pouvez retourner dans l\\'app et vous connecter.</p>', false);
          } else {
            var code = (res.body && res.body.error && res.body.error.message) || 'UNKNOWN';
            setError(fbErrorMessage(code));
            btn.disabled = false;
            btn.textContent = 'Valider';
          }
        })
        .catch(function() {
          setError('Erreur réseau. Réessayez plus tard.');
          btn.disabled = false;
          btn.textContent = 'Valider';
        });
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Page minimaliste pour les liens malformés ou modes non supportés.
 * On reste sobre : pas d'info technique exposée.
 */
function buildAuthErrorPage(message: string) {
  const m = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lien invalide — Dossardeur</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #1C3C57 0%, #2d4889 100%);
      min-height: 100vh; margin: 0; display: flex; align-items: center;
      justify-content: center; color: white; padding: 24px; }
    .card { background: rgba(255,255,255,0.12); border-radius: 20px; padding: 32px;
      max-width: 380px; text-align: center; }
    .logo { display: block; width: 80px; height: 80px; object-fit: contain;
      margin: 0 auto 14px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { font-size: 14px; opacity: 0.85; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <img class="logo" src="https://app-v2.opendossard.com/logood.png" alt="Dossardeur" />
    <h1>Lien invalide</h1>
    <p>${m}</p>
  </div>
</body>
</html>`;
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
