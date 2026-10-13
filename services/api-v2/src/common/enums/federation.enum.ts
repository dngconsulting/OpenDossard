export enum Federation {
  FSGT = 'FSGT',
  UFOLEP = 'UFOLEP',
  FFC = 'FFC',
  CYCLOS = 'CYCLOS',
  FFVELO = 'FFVELO',
  NL = 'NL',
  FFTRI = 'FFTRI',
}

/**
 * Raison sociale des fédérations, pour les en-têtes de documents officiels
 * (fiche épreuve…). CYCLOS et NL ne sont pas des fédérations : pas d'entrée,
 * l'appelant retombe sur le code.
 */
export const FEDERATION_FULL_NAMES: Partial<Record<Federation, string>> = {
  [Federation.FSGT]: 'Fédération Sportive et Gymnique du Travail',
  [Federation.UFOLEP]: 'UFOLEP',
  [Federation.FFC]: 'Fédération Française de Cyclisme',
  [Federation.FFVELO]: 'Fédération Française de Cyclotourisme',
  [Federation.FFTRI]: 'Fédération Française de Triathlon',
};
