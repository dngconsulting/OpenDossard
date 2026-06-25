import { toast } from 'sonner';

import { AppToast } from '@/components/ui/app-toast';

/**
 * Affiche un toast applicatif (style `AppToast`). Les toasts de succès
 * s'auto-ferment ; erreurs/infos restent jusqu'à action de l'utilisateur.
 */
export function showAppToast(type: 'success' | 'error' | 'info', message: string) {
  const id = toast.custom(toastId => <AppToast id={toastId} type={type} message={message} />);
  if (type === 'success') {
    setTimeout(() => toast.dismiss(id), 1500);
  }
}
