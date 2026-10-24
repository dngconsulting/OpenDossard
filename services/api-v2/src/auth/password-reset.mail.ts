const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, c => HTML_ESCAPES[c]);

/**
 * Email de réinitialisation de mot de passe (html + texte équivalent).
 * Le prénom vient de la base (saisie utilisateur) : toujours échappé dans le html.
 * Le lien est construit par le backend à partir de WEBAPP_PUBLIC_URL et d'un
 * token base64url : il ne contient aucun caractère à échapper.
 */
export function buildPasswordResetMail(
  firstName: string | null | undefined,
  link: string,
): { subject: string; html: string; text: string } {
  const name = firstName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const htmlGreeting = name ? `Bonjour ${escapeHtml(name)},` : 'Bonjour,';

  const subject = 'Réinitialisation de votre mot de passe Open Dossard';
  const intro =
    'Vous avez demandé la réinitialisation de votre mot de passe Open Dossard. ' +
    'Cliquez sur le lien ci-dessous pour en choisir un nouveau.';
  const validity = 'Ce lien est valable 1 heure et utilisable une seule fois.';
  const ignore =
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message, " +
    'votre mot de passe reste inchangé.';

  const text = [
    greeting,
    '',
    intro,
    '',
    link,
    '',
    validity,
    '',
    ignore,
    '',
    "L'équipe Open Dossard",
  ].join('\n');

  const p = 'margin:0 0 16px;font-size:15px;line-height:1.5;color:#1f2933;';
  const html = `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:8px;">
    <p style="${p}">${htmlGreeting}</p>
    <p style="${p}">${intro}</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">Choisir un nouveau mot de passe</a>
    </p>
    <p style="${p}">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${link}" style="color:#1d4ed8;word-break:break-all;">${link}</a>
    </p>
    <p style="${p}">${validity}</p>
    <p style="${p}">${ignore}</p>
    <p style="margin:0;font-size:15px;line-height:1.5;color:#1f2933;">L'équipe Open Dossard</p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
