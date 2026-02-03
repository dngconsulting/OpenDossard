import { parse } from 'csv-parse/sync';

export type ElicenceCsvRow = {
  licenceNumber: string | undefined;
  name: string | undefined;
  firstName: string | undefined;
  saison: string | undefined;
  elicenceClubName: string | undefined;
  catea: string | undefined;
  active: string | undefined;
  birthDay: string | undefined;
  catev: string | undefined;
  catevCX: string | undefined;
  dept: string | undefined;
  gender: string | undefined;
};

export function stripBOM(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export function normalizeGender(genre: string | undefined): string | undefined {
  if (!genre) return undefined;
  if (genre === 'M') return 'H';
  if (genre === 'F') return 'F';
  if (genre === 'Mme') return 'F';
  return undefined;
}

export function formatDepartement(dept: string): string {
  return String(Number(dept)).padStart(2, '0');
}

export function extractBirthYear(birthDay: string): string {
  return birthDay.slice(-4);
}

export function computeCateaFromBirthYear(birthYear: string, gender: string): string {
  const age = new Date().getFullYear() - parseInt(birthYear, 10);
  let catea = gender === 'F' ? 'F' : '';

  if (age >= 5 && age <= 6) catea += 'MO';
  else if (age >= 7 && age <= 8) catea += 'PO';
  else if (age >= 9 && age <= 10) catea += 'PU';
  else if (age >= 11 && age <= 12) catea += 'B';
  else if (age >= 13 && age <= 14) catea += 'M';
  else if (age >= 15 && age <= 16) catea += 'C';
  else if (age >= 17 && age <= 18) catea += 'J';
  else if (age >= 19 && age <= 22) catea += 'E';
  else if (age >= 23 && age <= 39) catea += 'S';
  else if (age >= 40 && age <= 49) catea += 'V';
  else if (age >= 50 && age <= 59) catea += 'SV';
  else if (age >= 60 && age <= 69) catea += 'A';
  else if (age >= 70) catea += 'SA';

  return catea;
}

/**
 * Parse e-licence CSV content into typed rows.
 * Uses csv-parse with columns:true so each row is an object keyed by header name.
 * This handles quoted fields (containing ;) correctly — same approach as V1.
 */
export function parseElicenceCsv(content: string): ElicenceCsvRow[] {
  const cleaned = stripBOM(content);
  const records: Record<string, string>[] = parse(cleaned, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const deptPattern = /\d+$/;

  const col = (data: Record<string, string>, ...names: string[]): string | undefined => {
    for (const name of names) {
      const val = data[name]?.trim();
      if (val) return val;
    }
    return undefined;
  };

  return records.map(data => {
    let dept = col(data, 'Code Comité Départemental');
    if (!dept) {
      const deptFull = col(data, 'Comité Départemental');
      if (deptFull) {
        const match = deptFull.match(deptPattern);
        if (match) dept = match[0];
      }
    }

    return {
      name: col(data, 'Nom'),
      firstName: col(data, 'Prénom'),
      saison: col(data, 'Saison'),
      elicenceClubName: col(data, 'Nom Club', 'Nom club'),
      catea: col(data, "Catégorie d'âge vélo", 'Catégorie âge sportif'),
      active: col(data, 'État'),
      birthDay: col(data, 'DDN', 'Date de naissance'),
      licenceNumber: col(data, 'Code adhérent', 'Numéro adhérent'),
      catev: col(data, 'Niveau Route'),
      catevCX: col(data, 'Niveau Cyclo-Cross'),
      dept,
      gender: normalizeGender(col(data, 'Genre', 'Civilité')),
    };
  });
}
