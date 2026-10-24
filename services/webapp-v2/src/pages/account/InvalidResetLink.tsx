import { LinkIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { authLinkClassName, authSubmitButtonClassName } from '@/components/layout/auth-card.styles';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { Button } from '@/components/ui/button';

interface InvalidResetLinkProps {
  message: string;
}

/** Écran affiché quand le lien de réinitialisation est absent, invalide ou expiré. */
export function InvalidResetLink({ message }: InvalidResetLinkProps) {
  const navigate = useNavigate();

  return (
    <AuthCardLayout title="Réinitialisation du mot de passe">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <LinkIcon className="h-7 w-7 text-white" />
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">{message}</p>
        <Button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className={authSubmitButtonClassName}
        >
          Demander un nouveau lien
        </Button>
        <div>
          <Link to="/login" className={authLinkClassName}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthCardLayout>
  );
}
