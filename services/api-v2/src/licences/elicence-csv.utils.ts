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
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
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

export function parseElicenceCsv(content: string): ElicenceCsvRow[] {
  const cleaned = stripBOM(content);
  const lines = cleaned.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim());
  const deptPattern = /\d+$/;

  const col = (row: string[], ...names: string[]): string | undefined => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1 && row[idx] !== undefined) {
        const val = row[idx].trim();
        if (val) return val;
      }
    }
    return undefined;
  };

  const rows: ElicenceCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = line.split(';');

    let dept = col(fields, 'Code Comité Départemental');
    if (!dept) {
      const deptFull = col(fields, 'Comité Départemental');
      if (deptFull) {
        const match = deptFull.match(deptPattern);
        if (match) dept = match[0];
      }
    }

    rows.push({
      name: col(fields, 'Nom'),
      firstName: col(fields, 'Prénom'),
      saison: col(fields, 'Saison'),
      elicenceClubName: col(fields, 'Nom Club', 'Nom club'),
      catea: col(fields, "Catégorie d'âge vélo"),
      active: col(fields, 'État'),
      birthDay: col(fields, 'DDN', 'Date de naissance'),
      licenceNumber: col(fields, 'Code adhérent', 'Numéro adhérent'),
      catev: col(fields, 'Niveau Route'),
      catevCX: col(fields, 'Niveau Cyclo-Cross'),
      dept,
      gender: normalizeGender(col(fields, 'Genre', 'Civilité')),
    });
  }

  return rows;
}
