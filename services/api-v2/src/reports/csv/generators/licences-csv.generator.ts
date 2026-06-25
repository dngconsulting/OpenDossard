import { LicenceEntity } from '../../../licences/entities/licence.entity';
import { escapeCsvField } from './csv-utils';

interface CsvColumn {
  label: string;
  value: keyof TransformedLicence;
}

interface TransformedLicence {
  id: number;
  licenceNumber: string;
  name: string;
  firstName: string;
  club: string;
  gender: string;
  dept: string;
  birthYear: string;
  catea: string;
  catev: string;
  catevCX: string;
  fede: string;
  saison: string;
  comment: string;
  lastChanged: string;
  time: string;
  authorLogin: string;
}

function formatDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('fr-FR');
}

function formatTime(date?: Date): string {
  if (!date) return '';
  return date.toLocaleTimeString('fr-FR');
}

/**
 * Le champ `author` est en général un simple email. Pour les données héritées
 * de l'API v1, il peut prendre la forme `email/prénom/nom[/ImportCSV]` ; dans
 * tous les cas l'email — qui identifie l'auteur de façon univoque — est le
 * premier segment. On n'expose plus que cet identifiant dans l'export.
 */
function extractAuthorLogin(author?: string): string {
  if (!author) return '';
  return author.split('/')[0];
}

function transformLicence(licence: LicenceEntity): TransformedLicence {
  return {
    id: licence.id,
    licenceNumber: licence.licenceNumber || '',
    name: licence.name || '',
    firstName: licence.firstName || '',
    club: licence.club || '',
    gender: licence.gender || '',
    dept: licence.dept || '',
    birthYear: licence.birthYear || '',
    catea: licence.catea || '',
    catev: licence.catev || '',
    catevCX: licence.catevCX || '',
    fede: licence.fede || '',
    saison: licence.saison || '',
    comment: licence.comment || '',
    lastChanged: formatDate(licence.lastChanged),
    time: formatTime(licence.lastChanged),
    authorLogin: extractAuthorLogin(licence.author),
  };
}

const CSV_COLUMNS: CsvColumn[] = [
  { label: 'ID', value: 'id' },
  { label: 'Lic. N°', value: 'licenceNumber' },
  { label: 'Nom', value: 'name' },
  { label: 'Prénom', value: 'firstName' },
  { label: 'Club', value: 'club' },
  { label: 'H/F', value: 'gender' },
  { label: 'Dept', value: 'dept' },
  { label: 'Année', value: 'birthYear' },
  { label: 'Caté.A', value: 'catea' },
  { label: 'Caté.V', value: 'catev' },
  { label: 'Caté.CX', value: 'catevCX' },
  { label: 'Fédé', value: 'fede' },
  { label: 'Saison', value: 'saison' },
  { label: 'Com.', value: 'comment' },
  { label: 'Date MAJ', value: 'lastChanged' },
  { label: 'Heure MAJ', value: 'time' },
  { label: 'Auteur', value: 'authorLogin' },
];

export function generateLicencesCSVBuffer(licences: LicenceEntity[]): Buffer {
  const transformed = licences.map(transformLicence);

  const header = CSV_COLUMNS.map(col => escapeCsvField(col.label)).join(';');
  const rows = transformed.map(row =>
    CSV_COLUMNS.map(col => escapeCsvField(row[col.value])).join(';'),
  );
  const csv = [header, ...rows].join('\n');

  // BOM UTF-8 + CSV content
  return Buffer.concat([Buffer.from('\uFEFF', 'utf-8'), Buffer.from(csv, 'utf-8')]);
}
