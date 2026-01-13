import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { IconWifiOff } from '@tabler/icons-react';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <IconWifiOff size={18} />
      <span>
        Mode hors ligne — Une connexion internet est nécessaire pour accéder à Open Dossard
      </span>
    </div>
  );
}
