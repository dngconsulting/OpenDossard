import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authApi } from '@/api/auth.api';
import {
  authInputClassName,
  authLinkClassName,
  authSubmitButtonClassName,
} from '@/components/layout/auth-card.styles';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email('Adresse email invalide')),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/** Email éventuellement transmis par la page de connexion via `navigate(…, { state })`. */
function readPrefilledEmail(state: unknown): string {
  if (state && typeof state === 'object' && 'email' in state && typeof state.email === 'string') {
    return state.email;
  }
  return '';
}

export default function ForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: readPrefilledEmail(location.state) },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setSubmitError(null);
    try {
      await authApi.forgotPassword(email);
      setSubmittedEmail(email);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    }
  };

  if (submittedEmail !== null) {
    return (
      <AuthCardLayout title="Vérifiez votre boîte mail">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <MailCheck className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-white/90 text-sm leading-relaxed">
              Si un compte correspond à{' '}
              <span className="font-semibold text-white break-all">{submittedEmail}</span>, un
              email contenant un lien de réinitialisation vient de vous être envoyé. Le lien est
              valable 1 heure.
            </p>
            <p className="text-white/60 text-sm">Pensez à vérifier vos courriers indésirables.</p>
          </div>
          <Button
            type="button"
            onClick={() => navigate('/login')}
            className={authSubmitButtonClassName}
          >
            Retour à la connexion
          </Button>
        </div>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      title="Mot de passe oublié"
      subtitle="Recevez par email un lien pour choisir un nouveau mot de passe"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/90">
            Adresse email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@example.com"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            className={authInputClassName}
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className={authSubmitButtonClassName}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer le lien'
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
