import { saveAs } from 'file-saver';

import type { LicenceType } from '@/types/licences';

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
  authorNomPrenom: string;
  authorLogin: string;
}

/**
 * Formats a date string to DD/MM/YYYY format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
}

/**
 * Formats a date string to HH:mm:ss format
 */
function formatTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR');
}

/**
 * Parses author string (format: "login/nom/prenom") to extract parts
 */
function parseAuthor(author?: string): { login: string; nomPrenom: string } {
  if (!author) return { login: '', nomPrenom: '' };
  const parts = author.split('/');
  if (parts.length >= 3) {
    return {
      login: parts[0],
      nomPrenom: `${parts[1]} ${parts[2]}`,
    };
  }
  return { login: author, nomPrenom: '' };
}

/**
 * Transforms licence data for CSV export
 */
function transformLicenceForCsv(licence: LicenceType): TransformedLicence {
  const { login, nomPrenom } = parseAuthor(licence.author);

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
    authorNomPrenom: nomPrenom,
    authorLogin: login,
  };
}

const CSV_COLUMNS: CsvColumn[] = [
  { label: 'ID', value: 'id' },
  { label: 'Lic. N\u00b0', value: 'licenceNumber' },
  { label: 'Nom', value: 'name' },
  { label: 'Pr\u00e9nom', value: 'firstName' },
  { label: 'Club', value: 'club' },
  { label: 'H/F', value: 'gender' },
  { label: 'Dept', value: 'dept' },
  { label: 'Ann\u00e9e', value: 'birthYear' },
  { label: 'Cat\u00e9.A', value: 'catea' },
  { label: 'Cat\u00e9.V', value: 'catev' },
  { label: 'Cat\u00e9.CX', value: 'catevCX' },
  { label: 'F\u00e9d\u00e9', value: 'fede' },
  { label: 'Saison', value: 'saison' },
  { label: 'Com.', value: 'comment' },
  { label: 'Date MAJ', value: 'lastChanged' },
  { label: 'Heure MAJ', value: 'time' },
  { label: 'Auteur', value: 'authorNomPrenom' },
  { label: 'Login Auteur', value: 'authorLogin' },
];

/**
 * Escapes a CSV field value (handles quotes and delimiters)
 */
function escapeCsvField(value: string | number): string {
  const stringValue = String(value);
  // If value contains delimiter, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Converts data to CSV string
 */
function toCsv(data: TransformedLicence[], columns: CsvColumn[], delimiter = ';'): string {
  // Header row
  const header = columns.map(col => escapeCsvField(col.label)).join(delimiter);

  // Data rows
  const rows = data.map(row =>
    columns.map(col => escapeCsvField(row[col.value])).join(delimiter)
  );

  return [header, ...rows].join('\n');
}

/**
 * Generates a CSV file containing a table of licences
 * @param data - Array of licences to export
 */
export const licencesCSV = (data: LicenceType[]): void => {
  const transformedData = data.map(transformLicenceForCsv);
  const csv = toCsv(transformedData, CSV_COLUMNS);

  // Add BOM for proper Excel encoding
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });

  const date = new Date().toISOString().split('T')[0];
  saveAs(blob, `licences - ${date}.csv`);
};
