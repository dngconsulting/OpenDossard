import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authApi, ResetPasswordError } from '@/api/auth.api';
import {
  authInputClassName,
  authLinkClassName,
  authPasswordToggleClassName,
  authSubmitButtonClassName,
} from '@/components/layout/auth-card.styles';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvalidResetLink } from '@/pages/account/InvalidResetLink';
import { showSuccessToast } from '@/utils/error-handler/error-handler';

/** Aligné sur PASSWORD_MIN_LENGTH du backend. */
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_HINT = `Au moins ${PASSWORD_MIN_LENGTH} caractères`;

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_HINT),
    confirm: z.string(),
  })
  .refine(data => data.newPassword === data.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/** Le lien reçu par email porte le token en fragment : `/reset-password#token=…`. */
function readTokenFromHash(hash: string): string | null {
  return new URLSearchParams(hash.slice(1)).get('token');
}

export default function ResetPasswordPage() {
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  // Lu une seule fois : le fragment est retiré de l'URL juste après, le token
  // n'a ensuite plus d'autre source que cet état local.
  const [token] = useState(() => readTokenFromHash(hash));

  // Retire le token de l'URL visible (historique, copier-coller, capture
  // d'écran). `navigate` plutôt que `history.replaceState` : le routeur reste
  // synchronisé ; même route, donc composant conservé et `token` intact.
  // Idempotent : une fois le fragment retiré, `hash` est vide et rien ne se passe.
  useEffect(() => {
    if (hash) {
      navigate({ pathname, search }, { replace: true });
    }
  }, [hash, pathname, search, navigate]);

  if (!token) {
    return <InvalidResetLink message="Ce lien de réinitialisation est invalide." />;
  }

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirm: '' },
  });

  const onSubmit = async ({ newPassword }: ResetPasswordFormData) => {
    setSubmitError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      showSuccessToast('Mot de passe modifié', 'Vous pouvez maintenant vous connecter.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ResetPasswordError && err.kind === 'invalid-link') {
        setLinkExpired(true);
      } else {
        setSubmitError(
          err instanceof Error ? err.message : 'Impossible de réinitialiser le mot de passe',
        );
      }
    }
  };

  if (linkExpired) {
    return <InvalidResetLink message="Ce lien est invalide ou a expiré." />;
  }

  const inputType = showPassword ? 'text' : 'password';
  const toggleLabel = showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe';
  const toggleIcon = showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />;

  return (
    <AuthCardLayout title="Nouveau mot de passe" subtitle="Choisissez votre nouveau mot de passe">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Nouveau mot de passe */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-white/90">
            Nouveau mot de passe
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={inputType}
              placeholder={PASSWORD_HINT}
              autoComplete="new-password"
              autoFocus
              disabled={isSubmitting}
              className={`${authInputClassName} pr-10`}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={authPasswordToggleClassName}
              aria-label={toggleLabel}
              tabIndex={-1}
            >
              {toggleIcon}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-300">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirmation */}
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-white/90">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Input
              id="confirm"
              type={inputType}
              placeholder="Saisissez-le à nouveau"
              autoComplete="new-password"
              disabled={isSubmitting}
              className={`${authInputClassName} pr-10`}
              {...register('confirm')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={authPasswordToggleClassName}
              aria-label={toggleLabel}
              tabIndex={-1}
            >
              {toggleIcon}
            </button>
          </div>
          {errors.confirm && <p className="text-sm text-red-300">{errors.confirm.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className={authSubmitButtonClassName}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer le mot de passe'
          )}
        </Button>

        {submitError && (
          <p className="text-sm text-red-300 text-center" role="alert">
            {submitError}
          </p>
        )}

        <div className="text-center">
          <Link to="/login" className={authLinkClassName}>
            Retour à la connexion
          </Link>
        </div>
      </form>
    </AuthCardLayout>
  );
}
