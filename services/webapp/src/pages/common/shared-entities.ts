// TODO: all those entities can be shared between front & back
export const CATEV = [
  { label: 'Catégorie 1', value: '1' },
  { label: 'Catégorie 2', value: '2' },
  { label: 'Catégorie 3', value: '3' },
  { label: 'Catégorie 4', value: '4' },
  { label: 'Catégorie 5', value: '5' },
  { label: 'Junior', value: 'J' },
  { label: 'Cadet', value: 'C' },
  { label: 'Minime', value: 'M' },
  { label: 'Benjamin', value: 'B' },
  { label: 'Pupille', value: 'PU' },
  { label: 'Poussin', value: 'PO' },
  { label: 'Moustic', value: 'MO' }
];

export const CATEV_UFOLEP = [
  { label: 'Catégorie 1', value: '1' },
  { label: 'Catégorie 2', value: '2' },
  { label: 'Catégorie 3', value: '3' },
  { label: 'Catégorie 4A', value: '4A' },
  { label: 'Catégorie 4B', value: '4B' },
  { label: 'Junior', value: 'J' },
  { label: 'Cadet', value: 'C' },
  { label: 'Minime', value: 'M' },
  { label: 'Benjamin', value: 'B' },
  { label: 'Pupille', value: 'PU' },
  { label: 'Poussin', value: 'PO' },
  { label: 'Moustic', value: 'MO' }
];

export const CATEA_FSGT: Array<{
  label: string;
  value: string;
  gender: string;
}> = [
  { label: 'Ancien', value: 'A', gender: 'H' },
  { label: 'Super Vétéran', value: 'SV', gender: 'H' },
  { label: 'Vétéran', value: 'V', gender: 'H' },
  { label: 'Sénior', value: 'S', gender: 'H' },
  { label: 'Junior', value: 'J', gender: 'H' },
  { label: 'Espoir', value: 'E', gender: 'H' },
  { label: 'Cadet', value: 'C', gender: 'H' },
  { label: 'Minime', value: 'M', gender: 'H' },
  { label: 'Benjamin', value: 'B', gender: 'H' },
  { label: 'Pupille', value: 'PU', gender: 'H' },
  { label: 'Poussin', value: 'PO', gender: 'H' },
  { label: 'Moustic', value: 'MO', gender: 'H' },
  { label: 'NC', value: 'NC', gender: 'H' },
  { label: 'Féminine ancien', value: 'FA', gender: 'F' },
  { label: 'Féminine super vétéran', value: 'FSV', gender: 'F' },
  { label: 'Féminine vétéran', value: 'FV', gender: 'F' },
  { label: 'Féminine sénior', value: 'FS', gender: 'F' },
  { label: 'Féminine junior', value: 'FJ', gender: 'F' },
  { label: 'Féminine espoir', value: 'FE', gender: 'F' },
  { label: 'Féminine cadet', value: 'FC', gender: 'F' },
  { label: 'Féminine minime', value: 'FM', gender: 'F' },
  { label: 'Féminine benjamin', value: 'FB', gender: 'F' },
  { label: 'Féminine pupille', value: 'FPU', gender: 'F' },
  { label: 'Féminine poussin', value: 'FPO', gender: 'F' },
  { label: 'Féminine moustic', value: 'FMO', gender: 'F' },
  { label: 'NC', value: 'NC', gender: 'F' }
];

export const CATEA_UFOLEP: Array<{
  label: string;
  value: string;
  gender: string;
}> = [
  { label: 'Féminine ancien', value: 'FA', gender: 'F' },
  { label: 'Féminine super vétéran', value: 'FSV', gender: 'F' },
  { label: 'Féminine vétéran', value: 'FV', gender: 'F' },
  { label: 'Féminine sénior', value: 'FS', gender: 'F' },
  { label: 'Féminine espoir', value: 'FE', gender: 'F' },
  { label: 'Féminine jeune', value: 'FJ', gender: 'F' },
  { label: 'Féminine cadet', value: 'FC', gender: 'F' },
  { label: 'Féminine minime', value: 'FM', gender: 'F' },

  { label: 'Ancien', value: 'A', gender: 'H' },
  { label: 'Sénior', value: 'S', gender: 'H' },
  { label: 'Vétéran', value: 'V', gender: 'H' },
  { label: 'Super Vétéran', value: 'SV', gender: 'H' },
  { label: 'Ancien', value: 'A', gender: 'H' },
  { label: 'Cadet', value: 'C', gender: 'H' },
  { label: 'Minimes', value: 'M', gender: 'H' },
  { label: 'Espoir', value: 'E', gender: 'H' },
  { label: 'Jeune', value: 'J', gender: 'H' },

  { label: 'NC', value: 'NC', gender: 'F' },
  { label: 'NC', value: 'NC', gender: 'H' }
];

export const FEDERATIONS = {
  FSGT: {
    name: { label: 'FSGT', value: 'FSGT' },
    catev: [...CATEV],
    catea: CATEA_FSGT
  },
  UFOLEP: {
    name: { label: 'UFOLEP', value: 'UFOLEP' },
    catev: [...CATEV_UFOLEP],
    catea: [...CATEA_UFOLEP, { label: 'FNC', value: 'FNC' }, { label: 'FFS', value: 'FFS' }]
  },
  FFC: {
    name: { label: 'FFC', value: 'FFC' },
    catev: [
      ...CATEV,
      { label: 'Open 1', value: 'OPEN1' },
      { label: 'Open 2', value: 'OPEN2' },
      { label: 'Open 3', value: 'OPEN3' },
      { label: 'Access 1', value: 'ACCESS1' },
      { label: 'Access 2', value: 'ACCESS2' },
      { label: 'Access 3', value: 'ACCESS3' },
      { label: 'Access 4', value: 'ACCESS4' }
    ],
    catea: CATEA_FSGT
  },
  NL: {
    name: { label: 'Non Licencié', value: 'NL' },
    catev: [...CATEV],
    catea: CATEA_FSGT
  },
  FFTRI: {
    name: { label: 'Fédération Triathlon', value: 'FFTRI' },
    catev: [...CATEV],
    catea: CATEA_FSGT
  },
  CYCLOS: {
    name: { label: 'Cyclosportives', value: 'CYCLOS' },
    catev: [...CATEV],
    catea: CATEA_FSGT
  }
};
