import { parse } from 'csv-parse/sync';

export type EngageCsvRow = {
  line: number;
  dossard: string | undefined;
  nom: string | undefined;
  club: string | undefined;
  sexe: string | undefined;
  dept: string | undefined;
  annee: string | undefined;
  catea: string | undefined;
  catev: string | undefined;
  licence: string | undefined;
  fede: string | undefined;
  course: string | undefined;
};

function stripBOM(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export function parseEngagesCsv(content: string): EngageCsvRow[] {
  const cleaned = stripBOM(content);

  const firstLine = cleaned.split('\n')[0] ?? '';
  const delimiter = firstLine.includes('\t') ? '\t' : ';';

  const records: Record<string, string>[] = parse(cleaned, {
    delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  });

  const col = (data: Record<string, string>, ...names: string[]): string | undefined => {
    for (const name of names) {
      const val = data[name]?.trim();
      if (val) return val;
    }
    return undefined;
  };

  // Header is line 1, first data row is line 2
  return records.map((data, idx) => ({
    line: idx + 2,
    dossard: col(data, 'Dossard'),
    nom: col(data, 'Nom'),
    club: col(data, 'Club'),
    sexe: col(data, 'Sexe'),
    dept: col(data, 'Dept'),
    annee: col(data, 'Année', 'Annee'),
    catea: col(data, 'CatéA', 'CateA', 'Catea'),
    catev: col(data, 'CatéV', 'CateV', 'Catev'),
    licence: col(data, 'Licence'),
    fede: col(data, 'Fédé', 'Fede'),
    course: col(data, 'Course'),
  }));
}
