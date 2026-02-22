export type AppEnvironment = 'PROD' | 'PREPROD' | 'TEST' | 'LOCAL';

interface EnvironmentConfig {
  name: AppEnvironment;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  show: boolean;
}

const ENVIRONMENT_MAP: Record<AppEnvironment, EnvironmentConfig> = {
  TEST: {
    name: 'TEST',
    label: 'Environnement de TEST',
    color: '#dc2626',
    bgClass: 'bg-red-600',
    textClass: 'text-white',
    show: true,
  },
  PREPROD: {
    name: 'PREPROD',
    label: 'Pré-production',
    color: '#d97706',
    bgClass: 'bg-amber-600',
    textClass: 'text-white',
    show: true,
  },
  LOCAL: {
    name: 'LOCAL',
    label: 'Local',
    color: '#7c3aed',
    bgClass: 'bg-violet-600',
    textClass: 'text-white',
    show: true,
  },
  PROD: {
    name: 'PROD',
    label: '',
    color: '',
    bgClass: '',
    textClass: '',
    show: false,
  },
};

function detectEnvironment(): AppEnvironment {
  const hostname = window.location.hostname;
  if (hostname.startsWith('test')) return 'TEST';
  if (hostname.startsWith('preprod')) return 'PREPROD';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'LOCAL';
  return 'PROD';
}

export const APP_ENV = detectEnvironment();
export const ENV_CONFIG = ENVIRONMENT_MAP[APP_ENV];
