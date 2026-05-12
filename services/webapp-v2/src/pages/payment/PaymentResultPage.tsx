import { Ban, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Page de retour après paiement HelloAsso, atteinte quand le deep link
 * `dossardeur://payment/{variant}` n'a pas été suivi (test desktop, app non
 * installée, etc.). Statique : pas de polling côté web — l'app mobile poll
 * elle-même `GET /helloasso/payments/:id` côté backend.
 *
 * Routes publiques (App.tsx), exposées sur `/payment/{success,error,cancelled}`.
 * Reçoit les query params de HelloAsso : `paymentId`, `checkoutIntentId`,
 * `orderId`, `code` — préservés tels quels pour relancer le deep link.
 */
export type PaymentResultVariant = 'success' | 'error' | 'cancelled';

interface VariantConfig {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  message: string;
}

const VARIANTS: Record<PaymentResultVariant, VariantConfig> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    title: 'Paiement confirmé',
    message:
      "Votre inscription est validée. Vous pouvez retourner sur l'app Dossardeur — le statut s'y mettra à jour automatiquement.",
  },
  error: {
    icon: XCircle,
    iconClass: 'text-destructive',
    title: 'Erreur de paiement',
    message:
      "Le paiement n'a pas pu être finalisé. Aucun montant n'a été débité. Vous pouvez réessayer depuis l'app Dossardeur.",
  },
  cancelled: {
    icon: Ban,
    iconClass: 'text-muted-foreground',
    title: 'Paiement annulé',
    message:
      "Vous avez annulé le paiement. Aucun montant n'a été débité. Vous pouvez retourner sur l'app Dossardeur quand vous le souhaitez.",
  },
};

export function PaymentResultPage({ variant }: { variant: PaymentResultVariant }) {
  const [params] = useSearchParams();
  const config = VARIANTS[variant];
  const Icon = config.icon;
  const deepLink = `dossardeur://payment/${variant}?${params.toString()}`;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center space-y-3">
          <Icon className={`h-16 w-16 ${config.iconClass}`} aria-hidden />
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription className="text-balance">{config.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <a href={deepLink}>Ouvrir Dossardeur</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
