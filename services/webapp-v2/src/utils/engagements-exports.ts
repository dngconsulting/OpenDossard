import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { RaceRowType } from '@/types/races';
import type { CompetitionDetailType, FederationType } from '@/types/competitions';

/**
 * Mapping des fédérations vers les fichiers de logos
 */
const FEDE_LOGOS: Partial<Record<FederationType, string>> = {
  FSGT: '/logo/fsgt.svg',
  UFOLEP: '/logo/ufolep.svg',
  FFC: '/logo/ffc.svg',
  FFVELO: '/logo/ffvelo.svg',
  FFTRI: '/logo/fftri.svg',
};

/**
 * Logo Open Dossard
 */
const OPEN_DOSSARD_LOGO = '/logo/opendossard.png';

/**
 * Charge un logo SVG et le convertit en data URL pour jsPDF
 */
async function loadLogoAsDataUrl(fede: FederationType): Promise<string | null> {
  const logoPath = FEDE_LOGOS[fede];
  if (!logoPath) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png', 1.0));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoPath;
  });
}

/**
 * Type pour le logo Open Dossard avec son ratio
 */
type OpenDossardLogoResult = {
  dataUrl: string;
  width: number;
  height: number;
  ratio: number;
} | null;

/**
 * Charge le logo Open Dossard avec son ratio original
 */
async function loadOpenDossardLogo(): Promise<OpenDossardLogoResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png', 1.0),
          width: img.width,
          height: img.height,
          ratio: img.width / img.height,
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = OPEN_DOSSARD_LOGO;
  });
}

/**
 * Ajoute le logo au PDF
 */
function addLogoToPdf(doc: jsPDF, logoDataUrl: string | null, x: number, y: number, width: number = 12, height?: number): void {
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, width, height ?? width);
    } catch {
      // Ignorer les erreurs
    }
  }
}

/**
 * Formate la date en français
 */
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Capitalise la première lettre
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formate le numéro de dossard avec padding
 */
function displayDossard(num: string | number): string {
  return String(num).padStart(3, '0');
}

// ============================================================================
// PDF EXPORTS
// ============================================================================

/**
 * Export PDF de la liste des engagés
 */
export async function exportEngagesPDF(
  engagements: RaceRowType[],
  raceCode: string,
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Engagement_${competition.name.replace(/\s/g, '')}_cate_${raceCode}.pdf`;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  // Charger les logos
  const [fedeLogo, odLogo] = await Promise.all([
    loadLogoAsDataUrl(competition.fede),
    loadOpenDossardLogo(),
  ]);

  const pageMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - 2 * pageMargin;

  const baseWidths = [15, 55, 45, 12, 12, 14, 15, 14, 18];
  const totalBase = baseWidths.reduce((a, b) => a + b, 0);
  const scale = availableWidth / totalBase;
  const columnWidths = baseWidths.map((w) => w * scale);

  const raceEngagements = engagements
    .filter((e) => e.raceCode === raceCode)
    .sort((a, b) => a.riderNumber - b.riderNumber);

  const uniqueClubs = new Set(raceEngagements.map((e) => e.club)).size;
  const uniqueDepts = new Set(raceEngagements.map((e) => e.dept)).size;
  const uniqueCatea = new Set(raceEngagements.map((e) => e.catea)).size;
  const uniqueCatev = new Set(raceEngagements.map((e) => e.catev)).size;
  const uniqueFede = new Set(raceEngagements.map((e) => e.fede)).size;

  const rowsToDisplay: (string | number)[][] = [];

  rowsToDisplay.push([
    '',
    `${raceEngagements.length} coureurs engagés`,
    `${uniqueClubs} clubs représentés`,
    '',
    uniqueDepts,
    '',
    uniqueCatea,
    uniqueCatev,
    uniqueFede,
  ]);

  raceEngagements.forEach((r) => {
    rowsToDisplay.push([
      displayDossard(r.riderNumber),
      r.name ?? r.riderName ?? '',
      r.club ?? '',
      r.gender ?? '',
      (r.dept ?? '').toString().padStart(2, '0'),
      r.birthYear ?? '',
      r.catea ?? '',
      r.catev ?? '',
      r.fede ?? '',
    ]);
  });

  const totalPagesExp = '{total_pages_count_string}';

  autoTable(doc, {
    head: [['Doss', 'Coureur', 'Club', 'H/F', 'Dept', 'Année', 'Cat.A', 'Cat.V', 'Fédé.']],
    bodyStyles: { minCellHeight: 5, cellPadding: 1 },
    rowPageBreak: 'avoid',
    headStyles: { fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: columnWidths[0], fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 12 },
      1: { cellWidth: columnWidths[1], halign: 'left' },
      2: { cellWidth: columnWidths[2], halign: 'left' },
      3: { cellWidth: columnWidths[3], halign: 'center' },
      4: { cellWidth: columnWidths[4], halign: 'center' },
      5: { cellWidth: columnWidths[5], halign: 'center' },
      6: { cellWidth: columnWidths[6], halign: 'center' },
      7: { cellWidth: columnWidths[7], halign: 'center' },
      8: { cellWidth: columnWidths[8], halign: 'center' },
    },
    body: rowsToDisplay,
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: () => {
      // Logo fédération à gauche
      addLogoToPdf(doc, fedeLogo, pageMargin, 2, 12);
      // Logo Open Dossard à droite
      // Open Dossard logo avec ratio original
      if (odLogo) {
        const odLogoHeight = 12;
        const odLogoWidth = odLogoHeight * odLogo.ratio;
        addLogoToPdf(doc, odLogo.dataUrl, pageWidth - pageMargin - odLogoWidth, 2, odLogoWidth, odLogoHeight);
      }

      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Listing Engagés : ${competition.name}`, pageMargin + 15, 4);
      doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, pageMargin + 15, 8);
      doc.text(`Catégorie(s) : ${raceCode}`, pageMargin + 15, 12);

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, pageMargin, pageHeight - 10);
      doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 50, pageHeight - 5);
    },
    margin: { top: 16, left: pageMargin, right: pageMargin },
    styles: { valign: 'middle', fontSize: 10, minCellHeight: 5 },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}

/**
 * Export PDF de la liste des engagés pour toutes les courses
 */
export async function exportAllEngagesPDF(
  engagements: RaceRowType[],
  races: string[],
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Engagement_${competition.name.replace(/\s/g, '')}_toutes_courses.pdf`;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  // Charger les logos UNE SEULE FOIS avant de générer le PDF
  const [fedeLogo, odLogo] = await Promise.all([
    loadLogoAsDataUrl(competition.fede),
    loadOpenDossardLogo(),
  ]);

  const pageMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - 2 * pageMargin;

  const baseWidths = [15, 55, 45, 12, 12, 14, 15, 14, 18];
  const totalBase = baseWidths.reduce((a, b) => a + b, 0);
  const scale = availableWidth / totalBase;
  const columnWidths = baseWidths.map((w) => w * scale);

  const totalPagesExp = '{total_pages_count_string}';
  let isFirstPage = true;

  for (const raceCode of races) {
    const raceEngagements = engagements
      .filter((e) => e.raceCode === raceCode)
      .sort((a, b) => a.riderNumber - b.riderNumber);

    if (raceEngagements.length === 0) continue;

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const uniqueClubs = new Set(raceEngagements.map((e) => e.club)).size;
    const uniqueDepts = new Set(raceEngagements.map((e) => e.dept)).size;
    const uniqueCatea = new Set(raceEngagements.map((e) => e.catea)).size;
    const uniqueCatev = new Set(raceEngagements.map((e) => e.catev)).size;
    const uniqueFede = new Set(raceEngagements.map((e) => e.fede)).size;

    const rowsToDisplay: (string | number)[][] = [];

    rowsToDisplay.push([
      '',
      `${raceEngagements.length} coureurs engagés`,
      `${uniqueClubs} clubs représentés`,
      '',
      uniqueDepts,
      '',
      uniqueCatea,
      uniqueCatev,
      uniqueFede,
    ]);

    raceEngagements.forEach((r) => {
      rowsToDisplay.push([
        displayDossard(r.riderNumber),
        r.name ?? r.riderName ?? '',
        r.club ?? '',
        r.gender ?? '',
        (r.dept ?? '').toString().padStart(2, '0'),
        r.birthYear ?? '',
        r.catea ?? '',
        r.catev ?? '',
        r.fede ?? '',
      ]);
    });

    const currentRaceCode = raceCode;
    autoTable(doc, {
      head: [['Doss', 'Coureur', 'Club', 'H/F', 'Dept', 'Année', 'Cat.A', 'Cat.V', 'Fédé.']],
      bodyStyles: { minCellHeight: 5, cellPadding: 1 },
      rowPageBreak: 'avoid',
      headStyles: { fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: columnWidths[0], fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 12 },
        1: { cellWidth: columnWidths[1], halign: 'left' },
        2: { cellWidth: columnWidths[2], halign: 'left' },
        3: { cellWidth: columnWidths[3], halign: 'center' },
        4: { cellWidth: columnWidths[4], halign: 'center' },
        5: { cellWidth: columnWidths[5], halign: 'center' },
        6: { cellWidth: columnWidths[6], halign: 'center' },
        7: { cellWidth: columnWidths[7], halign: 'center' },
        8: { cellWidth: columnWidths[8], halign: 'center' },
      },
      body: rowsToDisplay,
      didParseCell: (data) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: () => {
        // Logo fédération à gauche
        addLogoToPdf(doc, fedeLogo, pageMargin, 2, 12);
        // Logo Open Dossard à droite
        // Open Dossard logo avec ratio original
      if (odLogo) {
        const odLogoHeight = 12;
        const odLogoWidth = odLogoHeight * odLogo.ratio;
        addLogoToPdf(doc, odLogo.dataUrl, pageWidth - pageMargin - odLogoWidth, 2, odLogoWidth, odLogoHeight);
      }

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`Listing Engagés : ${competition.name}`, pageMargin + 15, 4);
        doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, pageMargin + 15, 8);
        doc.text(`Catégorie(s) : ${currentRaceCode}`, pageMargin + 15, 12);

        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, pageMargin, pageHeight - 10);
        doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 50, pageHeight - 5);
      },
      margin: { top: 16, left: pageMargin, right: pageMargin },
      styles: { valign: 'middle', fontSize: 10, minCellHeight: 5 },
    });
  }

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}

/**
 * Export PDF de la feuille d'émargement
 */
export async function exportEmargementPDF(
  engagements: RaceRowType[],
  raceCode: string,
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Emargement_${competition.name.replace(/\s/g, '')}_cate_${raceCode}.pdf`;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

  // Charger les logos
  const [fedeLogo, odLogo] = await Promise.all([
    loadLogoAsDataUrl(competition.fede),
    loadOpenDossardLogo(),
  ]);

  const pageMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - 2 * pageMargin;

  const baseWidths = [15, 50, 40, 12, 12, 14, 14, 14, 25, 18, 55];
  const totalBase = baseWidths.reduce((a, b) => a + b, 0);
  const scale = availableWidth / totalBase;
  const columnWidths = baseWidths.map((w) => w * scale);

  const raceEngagements = engagements
    .filter((e) => e.raceCode === raceCode)
    .sort((a, b) => a.riderNumber - b.riderNumber);

  const rowsToDisplay: (string | number)[][] = [];

  raceEngagements.forEach((r) => {
    rowsToDisplay.push([
      displayDossard(r.riderNumber),
      r.name ?? r.riderName ?? '',
      r.club ?? '',
      r.gender ?? '',
      (r.dept ?? '').toString().padStart(2, '0'),
      r.birthYear ?? '',
      r.catea ?? '',
      r.catev ?? '',
      r.licenceNumber ?? '',
      r.fede ?? '',
      '',
    ]);
  });

  for (let i = 0; i < 10; i++) {
    rowsToDisplay.push(['', '', '', '', '', '', '', '', '', '', '']);
  }

  const totalPagesExp = '{total_pages_count_string}';

  autoTable(doc, {
    head: [['Doss', 'Coureur', 'Club', 'H/F', 'Dept', 'Année', 'Cat.A', 'Cat.V', 'Licence N°', 'Fédé.', 'Signature']],
    bodyStyles: { minCellHeight: 10, cellPadding: 1 },
    rowPageBreak: 'avoid',
    headStyles: { fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: columnWidths[0], fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 12 },
      1: { cellWidth: columnWidths[1], halign: 'left' },
      2: { cellWidth: columnWidths[2], halign: 'left' },
      3: { cellWidth: columnWidths[3], halign: 'center' },
      4: { cellWidth: columnWidths[4], halign: 'center' },
      5: { cellWidth: columnWidths[5], halign: 'center' },
      6: { cellWidth: columnWidths[6], halign: 'center' },
      7: { cellWidth: columnWidths[7], halign: 'center' },
      8: { cellWidth: columnWidths[8], halign: 'center' },
      9: { cellWidth: columnWidths[9], halign: 'center' },
      10: { cellWidth: columnWidths[10], lineWidth: 0.2, lineColor: [73, 138, 159] },
    },
    body: rowsToDisplay,
    didDrawPage: () => {
      // Logo fédération à gauche
      addLogoToPdf(doc, fedeLogo, pageMargin, 2, 12);
      // Logo Open Dossard à droite
      // Open Dossard logo avec ratio original
      if (odLogo) {
        const odLogoHeight = 12;
        const odLogoWidth = odLogoHeight * odLogo.ratio;
        addLogoToPdf(doc, odLogo.dataUrl, pageWidth - pageMargin - odLogoWidth, 2, odLogoWidth, odLogoHeight);
      }

      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Feuille d'émargement : ${competition.name}`, pageMargin + 15, 4);
      doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, pageMargin + 15, 8);
      doc.text(`Catégorie(s) : ${raceCode}`, pageMargin + 15, 12);

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, pageMargin, pageHeight - 10);
      doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 50, pageHeight - 5);
    },
    margin: { top: 16, left: pageMargin, right: pageMargin },
    styles: { valign: 'middle', fontSize: 10, minCellHeight: 10 },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}

/**
 * Export PDF des feuilles d'émargement pour toutes les courses
 */
export async function exportAllEmargementPDF(
  engagements: RaceRowType[],
  races: string[],
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Emargement_${competition.name.replace(/\s/g, '')}_toutes_courses.pdf`;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

  // Charger les logos
  const [fedeLogo, odLogo] = await Promise.all([
    loadLogoAsDataUrl(competition.fede),
    loadOpenDossardLogo(),
  ]);

  const pageMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - 2 * pageMargin;

  const baseWidths = [15, 50, 40, 12, 12, 14, 14, 14, 25, 18, 55];
  const totalBase = baseWidths.reduce((a, b) => a + b, 0);
  const scale = availableWidth / totalBase;
  const columnWidths = baseWidths.map((w) => w * scale);

  const totalPagesExp = '{total_pages_count_string}';
  let isFirstPage = true;

  for (const raceCode of races) {
    const raceEngagements = engagements
      .filter((e) => e.raceCode === raceCode)
      .sort((a, b) => a.riderNumber - b.riderNumber);

    if (raceEngagements.length === 0) continue;

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const rowsToDisplay: (string | number)[][] = [];

    raceEngagements.forEach((r) => {
      rowsToDisplay.push([
        displayDossard(r.riderNumber),
        r.name ?? r.riderName ?? '',
        r.club ?? '',
        r.gender ?? '',
        (r.dept ?? '').toString().padStart(2, '0'),
        r.birthYear ?? '',
        r.catea ?? '',
        r.catev ?? '',
        r.licenceNumber ?? '',
        r.fede ?? '',
        '',
      ]);
    });

    for (let i = 0; i < 10; i++) {
      rowsToDisplay.push(['', '', '', '', '', '', '', '', '', '', '']);
    }

    const currentRaceCode = raceCode;
    autoTable(doc, {
      head: [['Doss', 'Coureur', 'Club', 'H/F', 'Dept', 'Année', 'Cat.A', 'Cat.V', 'Licence N°', 'Fédé.', 'Signature']],
      bodyStyles: { minCellHeight: 10, cellPadding: 1 },
      rowPageBreak: 'avoid',
      headStyles: { fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: columnWidths[0], fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 12 },
        1: { cellWidth: columnWidths[1], halign: 'left' },
        2: { cellWidth: columnWidths[2], halign: 'left' },
        3: { cellWidth: columnWidths[3], halign: 'center' },
        4: { cellWidth: columnWidths[4], halign: 'center' },
        5: { cellWidth: columnWidths[5], halign: 'center' },
        6: { cellWidth: columnWidths[6], halign: 'center' },
        7: { cellWidth: columnWidths[7], halign: 'center' },
        8: { cellWidth: columnWidths[8], halign: 'center' },
        9: { cellWidth: columnWidths[9], halign: 'center' },
        10: { cellWidth: columnWidths[10], lineWidth: 0.2, lineColor: [73, 138, 159] },
      },
      body: rowsToDisplay,
      didDrawPage: () => {
        // Logo fédération à gauche
        addLogoToPdf(doc, fedeLogo, pageMargin, 2, 12);
        // Logo Open Dossard à droite
        // Open Dossard logo avec ratio original
      if (odLogo) {
        const odLogoHeight = 12;
        const odLogoWidth = odLogoHeight * odLogo.ratio;
        addLogoToPdf(doc, odLogo.dataUrl, pageWidth - pageMargin - odLogoWidth, 2, odLogoWidth, odLogoHeight);
      }

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`Feuille d'émargement : ${competition.name}`, pageMargin + 15, 4);
        doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, pageMargin + 15, 8);
        doc.text(`Catégorie(s) : ${currentRaceCode}`, pageMargin + 15, 12);

        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, pageMargin, pageHeight - 10);
        doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 50, pageHeight - 5);
      },
      margin: { top: 16, left: pageMargin, right: pageMargin },
      styles: { valign: 'middle', fontSize: 10, minCellHeight: 10 },
    });
  }

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}

// ============================================================================
// CSV EXPORTS
// ============================================================================

/**
 * Export CSV des engagés pour une course
 */
export function exportEngagesCsv(
  engagements: RaceRowType[],
  raceCode: string,
  competitionName: string
): void {
  const headers = ['Dossard', 'Nom', 'Club', 'Sexe', 'Dept', 'Année', 'CatéA', 'CatéV', 'Licence', 'Fédé', 'Course'];

  const raceEngagements = engagements
    .filter((e) => e.raceCode === raceCode)
    .sort((a, b) => a.riderNumber - b.riderNumber);

  const csvRows = raceEngagements.map((row) => [
    row.riderNumber ?? '',
    row.name ?? row.riderName ?? '',
    row.club ?? '',
    row.gender ?? '',
    row.dept ?? '',
    row.birthYear ?? '',
    row.catea ?? '',
    row.catev ?? '',
    row.licenceNumber ?? '',
    row.fede ?? '',
    raceCode,
  ]);

  const csvContent = [headers.join(';'), ...csvRows.map((row) => row.join(';'))].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${competitionName}-${raceCode}-engages.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export CSV des engagés pour toutes les courses
 */
export function exportAllEngagesCsv(
  engagements: RaceRowType[],
  races: string[],
  competitionName: string
): void {
  const headers = ['Dossard', 'Nom', 'Club', 'Sexe', 'Dept', 'Année', 'CatéA', 'CatéV', 'Licence', 'Fédé', 'Course'];

  const allRows: string[][] = [];

  for (const raceCode of races) {
    const raceEngagements = engagements
      .filter((e) => e.raceCode === raceCode)
      .sort((a, b) => a.riderNumber - b.riderNumber);

    const csvRows = raceEngagements.map((row) => [
      String(row.riderNumber ?? ''),
      row.name ?? row.riderName ?? '',
      row.club ?? '',
      row.gender ?? '',
      String(row.dept ?? ''),
      String(row.birthYear ?? ''),
      row.catea ?? '',
      row.catev ?? '',
      row.licenceNumber ?? '',
      row.fede ?? '',
      raceCode,
    ]);
    allRows.push(...csvRows);
  }

  const csvContent = [headers.join(';'), ...allRows.map((row) => row.join(';'))].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${competitionName}-tous-engages.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
