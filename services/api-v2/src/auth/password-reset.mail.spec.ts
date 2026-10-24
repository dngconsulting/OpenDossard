import { buildPasswordResetMail } from './password-reset.mail';

describe('buildPasswordResetMail', () => {
  const link = 'https://backoffice.example/reset-password#token=abc_DEF-123';

  it('contient le lien dans le html et dans le texte', () => {
    const mail = buildPasswordResetMail('Jeanne', link);
    expect(mail.html).toContain(`href="${link}"`);
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
  });

  it('a un sujet explicite', () => {
    expect(buildPasswordResetMail('Jeanne', link).subject).toBe(
      'Réinitialisation de votre mot de passe Open Dossard',
    );
  });

  it('salue le destinataire par son prénom', () => {
    const mail = buildPasswordResetMail('Jeanne', link);
    expect(mail.html).toContain('Bonjour Jeanne,');
    expect(mail.text).toContain('Bonjour Jeanne,');
  });

  it('mentionne la validité d’une heure, l’usage unique et la consigne si non demandé', () => {
    const mail = buildPasswordResetMail('Jeanne', link);
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain('1 heure');
      expect(body).toContain('une seule fois');
      expect(body).toContain('votre mot de passe reste inchangé');
    }
  });

  it('échappe le prénom dans le html', () => {
    const mail = buildPasswordResetMail('<script>alert("x")</script>', link);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it.each([null, undefined, '', '   '])('gère un prénom absent (%p)', firstName => {
    const mail = buildPasswordResetMail(firstName, link);
    expect(mail.html).toContain('Bonjour,');
    expect(mail.text).toContain('Bonjour,');
    expect(mail.html).not.toContain('null');
    expect(mail.html).not.toContain('undefined');
  });
});
