import { ENV_CONFIG } from '@/config/environment.config';

interface EnvironmentBannerProps {
  fixed?: boolean;
}

export function EnvironmentBanner({ fixed }: EnvironmentBannerProps) {
  if (!ENV_CONFIG.show) return null;

  const position = fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0';

  return (
    <div
      className={`${ENV_CONFIG.bgClass} ${ENV_CONFIG.textClass} text-center text-xs font-semibold py-1 px-2 tracking-wide ${position} z-50`}
    >
      {ENV_CONFIG.label}
    </div>
  );
}
