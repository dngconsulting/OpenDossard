import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import { useHelloAssoAuth, useHelloAssoStatus } from '@/hooks/useHelloAssoAuth';
import { showErrorToast } from '@/utils/error-handler/error-handler';

type Props = {
  clubId?: number;
};

type Variant = 'unlinked' | 'linked' | 'expired';

export function HelloAssoConnectButton({ clubId }: Props) {
  const mutation = useHelloAssoAuth();
  const status = useHelloAssoStatus(clubId);

  const variant: Variant = !status.data || !status.data.linked
    ? 'unlinked'
    : status.data.expired
      ? 'expired'
      : 'linked';

  const onClick = async () => {
    if (variant === 'linked') {
      const confirmed = window.confirm(
        'Ce club est déjà connecté à HelloAsso. Voulez-vous recommencer la liaison ? Les modifications non enregistrées seront perdues.',
      );
      if (!confirmed) {
        return;
      }
    }
    try {
      const { authorizeUrl } = await mutation.mutateAsync();
      window.location.href = authorizeUrl;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      showErrorToast('Impossible de démarrer la liaison HelloAsso', msg);
    }
  };

  const palette = PALETTES[variant];
  const isBusy = mutation.isPending || status.isLoading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      title={titleFor(variant, status.data)}
      style={{
        ...styles.button,
        background: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      {mutation.isPending ? (
        <Loader2 className="animate-spin" style={{ color: palette.text, width: 18, height: 18 }} />
      ) : (
        <img
          src="https://api.helloasso.com/v5/img/logo-ha.svg"
          alt=""
          style={styles.logo}
        />
      )}
      <span style={styles.label}>{LABELS[variant]}</span>
      {variant === 'linked' && <CheckCircle2 style={{ width: 16, height: 16 }} />}
      {variant === 'expired' && <AlertTriangle style={{ width: 16, height: 16 }} />}
    </button>
  );
}

const LABELS: Record<Variant, string> = {
  unlinked: 'Connecter à HelloAsso',
  linked: 'Connecté à HelloAsso',
  expired: 'Reconnexion HelloAsso',
};

const PALETTES: Record<Variant, { bg: string; border: string; text: string }> = {
  unlinked: { bg: '#FFFFFF', border: '#4B3FCF', text: '#4B3FCF' },
  linked: { bg: '#FFFFFF', border: '#1B9E5B', text: '#1B9E5B' },
  expired: { bg: '#FFFFFF', border: '#C77700', text: '#C77700' },
};

function titleFor(variant: Variant, data: ReturnType<typeof useHelloAssoStatus>['data']): string {
  if (variant === 'unlinked') {
    return 'Connecter ce club à un compte HelloAsso';
  }
  if (!data || !data.linked) {
    return '';
  }
  const linkedAt = new Date(data.linkedAt).toLocaleDateString('fr-FR');
  if (variant === 'expired') {
    return `Liaison ${data.slug} expirée (depuis le ${linkedAt}). Cliquer pour re-lier.`;
  }
  const expiresAt = new Date(data.refreshTokenExpiresAt).toLocaleDateString('fr-FR');
  return `Connecté à ${data.slug} depuis le ${linkedAt}. Renouvellement nécessaire avant le ${expiresAt}. Cliquer pour re-lier.`;
}

const styles = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    height: '2.25rem',
    padding: '0 0.875rem',
    border: '0.0625rem solid currentColor',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    lineHeight: 1,
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: 'inherit',
  } satisfies React.CSSProperties,
  logo: {
    width: '1.25rem',
    height: 'auto',
    display: 'block',
  } satisfies React.CSSProperties,
  label: {
    whiteSpace: 'nowrap',
  } satisfies React.CSSProperties,
};
