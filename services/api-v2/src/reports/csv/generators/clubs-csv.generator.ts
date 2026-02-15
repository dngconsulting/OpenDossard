import { ClubEntity } from '../../../clubs/entities/club.entity';
import { escapeCsvField } from './csv-utils';

interface CsvColumn {
  label: string;
  value: keyof ClubEntity;
}

const CSV_COLUMNS: CsvColumn[] = [
  { label: 'ID', value: 'id' },
  { label: 'Nom court', value: 'shortName' },
  { label: 'Nom long', value: 'longName' },
  { label: 'Département', value: 'dept' },
  { label: 'Fédération', value: 'fede' },
  { label: 'Nom e-licence', value: 'elicenceName' },
];

export function generateClubsCSVBuffer(clubs: ClubEntity[]): Buffer {
  const header = CSV_COLUMNS.map(col => escapeCsvField(col.label)).join(';');
  const rows = clubs.map(club =>
    CSV_COLUMNS.map(col => escapeCsvField(club[col.value] ?? '')).join(';'),
  );
  const csv = [header, ...rows].join('\n');

  // BOM UTF-8 + CSV content
  return Buffer.concat([
    Buffer.from('\uFEFF', 'utf-8'),
    Buffer.from(csv, 'utf-8'),
  ]);
}
