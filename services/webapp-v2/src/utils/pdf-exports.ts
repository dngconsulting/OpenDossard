import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { RaceRowType } from '@/types/races';
import type { CompetitionDetailType, FederationType } from '@/types/competitions';
import { transformRows, type TransformedRow } from './classements';

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
      // Haute résolution pour une bonne qualité d'impression (300 DPI équivalent)
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Activer l'anti-aliasing pour un meilleur rendu
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
 * Ajoute le logo de la fédération au PDF
 */
function addLogoToPdf(doc: jsPDF, logoDataUrl: string | null, x: number, y: number, size: number = 12): void {
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', x, y, size, size);
    } catch {
      // Ignorer les erreurs de chargement de logo
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

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${day} ${month} ${year}`;
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

/**
 * Récupère les vainqueurs du challenge sprint
 */
function getChallengeWinners(rows: TransformedRow[]): string {
  const winners = rows.filter((r) => r.sprintchallenge && r.name);
  if (winners.length === 0) return 'NC';
  return winners.map((w) => `${w.name} (${w.club})`).join(', ');
}

/**
 * Export PDF des classements (équivalent de resultsPDF)
 */
export async function exportClassementsPDF(
  engagements: RaceRowType[],
  races: string[],
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Clt_${competition.name.replace(/\s/g, '')}_cate_${races.join(',').replace(/\s/g, '')}.pdf`;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  // Charger le logo de la fédération
  const logoDataUrl = await loadLogoAsDataUrl(competition.fede);

  // Vérifier si on a des tours
  const avecTours = engagements.some((row) => row.tours != null && row.tours > 0);

  races.forEach((currentRace: string, pageIndex: number) => {
    const transformed = transformRows(engagements, currentRace);
    const rankedRows = transformed.filter((r) => r.rankingScratch != null || r.comment != null);

    const rowsToDisplay: (string | number | null)[][] = [];

    rankedRows.forEach((r: TransformedRow) => {
      rowsToDisplay.push([
        r.comment ?? r.rankingScratch,
        r.rankOfCate,
        r.riderNumber ? displayDossard(r.riderNumber) : '',
        r.name ?? '',
        r.club ?? '',
        r.gender ?? '',
        r.catev ?? '',
        r.catea ?? '',
        r.fede ?? '',
        ...(competition.avecChrono ? [r.chrono ?? ''] : []),
        ...(avecTours ? [r.tours ? `${r.tours}T` : ''] : []),
      ]);
    });

    autoTable(doc, {
      head: [
        [
          'Scrat.',
          'Cat.',
          'Doss',
          'Coureur',
          'Club',
          'H/F',
          'Caté.V',
          'Caté.A',
          'Fédé',
          ...(competition.avecChrono ? ['Temps'] : []),
          ...(avecTours ? ['Tours'] : []),
        ],
      ],
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 0.5,
        minCellHeight: 8,
      },
      bodyStyles: {
        minCellHeight: 3,
        cellPadding: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center', fillColor: [253, 238, 115], fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 15, halign: 'center' },
      },
      body: rowsToDisplay,
      didDrawPage: (data) => {
        // Logo fédération
        addLogoToPdf(doc, logoDataUrl, data.settings.margin.left, 2, 12);
        // Header
        doc.setFontSize(13);
        doc.text(`Epreuve : ${competition.name}`, data.settings.margin.left + 15, 7);
        doc.text(
          `Date : ${capitalize(formatDateFr(competition.eventDate))}`,
          data.settings.margin.left + 15,
          12
        );
        doc.text(`Catégorie(s) : ${currentRace}`, data.settings.margin.left + 15, 17);
      },
      margin: { top: 22, left: 5, right: 5 },
      styles: {
        valign: 'middle',
        halign: 'left',
        fontSize: 10,
        minCellHeight: 5,
      },
    });

    // Footer avec infos compétition
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    let footerY = finalY > 240 ? (doc.addPage(), 15) : finalY + 10;

    doc.setTextColor('#424242');
    doc.setFontSize(10);

    const raceEngagements = engagements.filter((e) => e.raceCode === currentRace);
    const footerText = [
      `NOMBRE DE COUREURS : ${raceEngagements.length} en catégorie(s) ${currentRace}`,
      `ORGANISATEUR : ${competition.club?.longName ?? 'NC'}`,
      `COMMISSAIRES : ${competition.commissaires ?? 'NC'}`,
      `SPEAKER : ${competition.speaker ?? 'NC'}`,
      ...(competition.competitionType === 'CX' ? [`ABOYEUR : ${competition.aboyeur ?? 'NC'}`] : []),
      `REMARQUES : ${competition.feedback ?? 'NC'}`,
      `Vainqueur(s) du challenge : ${getChallengeWinners(rankedRows)}`,
    ].join('\n');

    const splitText = doc.splitTextToSize(footerText, 190);
    doc.text(splitText, 5, footerY);

    if (pageIndex + 1 < races.length) {
      doc.addPage();
    }
  });

  // Numérotation des pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height || pageSize.getHeight();
    doc.text(`Page ${i}/${pageCount}`, 5, pageHeight - 10);
    doc.text(`${filename} généré à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 40, pageHeight - 5);
  }

  doc.save(filename);
}

/**
 * Export PDF des podiums (équivalent de podiumsPDF)
 */
export async function exportPodiumsPDF(
  engagements: RaceRowType[],
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Podiums_${competition.name.replace(/\s/g, '')}.pdf`;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  // Charger le logo de la fédération
  const logoDataUrl = await loadLogoAsDataUrl(competition.fede);

  // Récupérer toutes les catégories individuelles
  const allCategories = competition.races
    .split(',')
    .flatMap((r) => r.split('/'))
    .map((c) => c.trim())
    .filter(Boolean);

  let isFirstTable = true;

  allCategories.forEach((category) => {
    // Filtrer les engagés de cette catégorie
    const categoryEngagements = engagements.filter((e) => e.catev === category);
    if (categoryEngagements.length === 0) return;

    // Calculer les podiums (top 3)
    const ranked = categoryEngagements
      .filter((e) => e.rankingScratch != null && e.comment == null)
      .sort((a, b) => (a.rankingScratch ?? 0) - (b.rankingScratch ?? 0));

    // Calculer le rang dans la catégorie
    const podiums = ranked.slice(0, 3).map((r, index) => ({
      ...r,
      rankInCate: index + 1,
    }));

    if (podiums.length === 0) return;

    // Trouver le vainqueur du challenge
    const challengeWinner = categoryEngagements.find((e) => e.sprintchallenge);

    const rowsToDisplay: (string | number)[][] = podiums.map((r) => [
      r.rankInCate,
      r.rankingScratch ?? '',
      displayDossard(r.riderNumber),
      r.name ?? r.riderName ?? '',
      r.club ?? '',
      r.gender ?? '',
      r.catev ?? '',
      r.catea ?? '',
      r.fede ?? '',
    ]);

    const previousFinalY = isFirstTable
      ? undefined
      : (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY;

    // Titre de la catégorie
    doc.setTextColor(40);
    doc.setFontSize(11);
    const titleY = previousFinalY === undefined ? 35 : previousFinalY + 8;

    let titleText = `Catégorie ${category}`;
    if (challengeWinner) {
      titleText += `  - Challenge : ${challengeWinner.name ?? challengeWinner.riderName} - scratch: ${challengeWinner.rankingScratch} (${challengeWinner.club})`;
    }
    doc.text(titleText, 5, titleY);

    autoTable(doc, {
      startY: titleY + 2,
      head: [['Cat.', 'Scrat.', 'Doss', 'Coureur', 'Club', 'H/F', 'Caté.V', 'Caté.A', 'Fédé']],
      headStyles: {
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 0.5,
      },
      bodyStyles: {
        minCellHeight: 4,
        cellPadding: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center', fillColor: [253, 238, 115], fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 35 },
        5: { cellWidth: 10, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 15, halign: 'center' },
      },
      body: rowsToDisplay,
      didDrawPage: (data) => {
        if (isFirstTable) {
          // Logo fédération
          addLogoToPdf(doc, logoDataUrl, data.settings.margin.left, 2, 12);
          doc.setFontSize(14);
          doc.setTextColor(40);
          doc.text(`Podiums : ${competition.name}`, data.settings.margin.left + 15, 7);
          doc.setFontSize(10);
          doc.text(
            `Date : ${capitalize(formatDateFr(competition.eventDate))}`,
            data.settings.margin.left + 15,
            12
          );
          doc.text(`Organisateur : ${competition.club?.longName ?? 'NC'}`, data.settings.margin.left + 15, 17);
        }
      },
      margin: { top: isFirstTable ? 22 : 10, left: 5, right: 5 },
      styles: {
        valign: 'middle',
        fontSize: 9,
        minCellHeight: 4,
      },
    });

    isFirstTable = false;

    // Vérifier si on doit passer à la page suivante
    const currentFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    if (currentFinalY > 250) {
      doc.addPage();
      isFirstTable = true;
    }
  });

  // Numérotation des pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height || pageSize.getHeight();
    doc.text(`Page ${i}/${pageCount}`, 5, pageHeight - 10);
    doc.text(`${filename} généré à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 40, pageHeight - 5);
  }

  doc.save(filename);
}

/**
 * Export PDF de la liste des engagés (équivalent de listeEngagesPDF avec emargement=false)
 */
export async function exportEngagesPDF(
  engagements: RaceRowType[],
  raceCode: string,
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Engagement_${competition.name.replace(/\s/g, '')}_cate_${raceCode}.pdf`;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });

  // Charger le logo de la fédération
  const logoDataUrl = await loadLogoAsDataUrl(competition.fede);

  // Filtrer et trier par numéro de dossard
  const raceEngagements = engagements
    .filter((e) => e.raceCode === raceCode)
    .sort((a, b) => a.riderNumber - b.riderNumber);

  // Calculer les statistiques
  const uniqueClubs = new Set(raceEngagements.map((e) => e.club)).size;
  const uniqueDepts = new Set(raceEngagements.map((e) => e.dept)).size;
  const uniqueCatea = new Set(raceEngagements.map((e) => e.catea)).size;
  const uniqueCatev = new Set(raceEngagements.map((e) => e.catev)).size;
  const uniqueFede = new Set(raceEngagements.map((e) => e.fede)).size;

  const rowsToDisplay: (string | number)[][] = [];

  // Ligne de statistiques
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

  // Données des coureurs
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
    bodyStyles: {
      minCellHeight: 3,
      cellPadding: 0.5,
    },
    rowPageBreak: 'avoid',
    headStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 15, fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 13 },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 12 },
      6: { cellWidth: 13 },
      7: { cellWidth: 12 },
      8: { cellWidth: 20 },
    },
    body: rowsToDisplay,
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (data) => {
      // Logo fédération
      addLogoToPdf(doc, logoDataUrl, data.settings.margin.left, 2, 12);
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.setFontSize(10);
      doc.text(`Listing Engagés : ${competition.name}`, data.settings.margin.left + 15, 4);
      doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, data.settings.margin.left + 15, 8);
      doc.text(`Catégorie(s) : ${raceCode}`, data.settings.margin.left + 15, 12);

      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, data.settings.margin.left, pageHeight - 10);
      doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 40, pageHeight - 5);
    },
    margin: { top: 16, left: 10 },
    styles: {
      valign: 'middle',
      fontSize: 10,
      minCellHeight: 5,
    },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}

/**
 * Export PDF de la feuille d'émargement (équivalent de listeEngagesPDF avec emargement=true)
 */
export async function exportEmargementPDF(
  engagements: RaceRowType[],
  raceCode: string,
  competition: CompetitionDetailType
): Promise<void> {
  const filename = `Emargement_${competition.name.replace(/\s/g, '')}_cate_${raceCode}.pdf`;
  // Format paysage pour l'émargement
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

  // Charger le logo de la fédération
  const logoDataUrl = await loadLogoAsDataUrl(competition.fede);

  // Filtrer et trier par numéro de dossard
  const raceEngagements = engagements
    .filter((e) => e.raceCode === raceCode)
    .sort((a, b) => a.riderNumber - b.riderNumber);

  const rowsToDisplay: (string | number)[][] = [];

  // Données des coureurs
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
      '', // Colonne signature vide
    ]);
  });

  // Ajouter 10 lignes vides pour les inscriptions sur place
  for (let i = 0; i < 10; i++) {
    rowsToDisplay.push(['', '', '', '', '', '', '', '', '', '', '']);
  }

  const totalPagesExp = '{total_pages_count_string}';

  autoTable(doc, {
    head: [['Doss', 'Coureur', 'Club', 'H/F', 'Dept', 'Année', 'Cat.A', 'Cat.V', 'Licence N°', 'Fédé.', 'Signature']],
    bodyStyles: {
      minCellHeight: 10,
      cellPadding: 0.5,
    },
    rowPageBreak: 'avoid',
    headStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 15, fillColor: [253, 238, 115], halign: 'center', fontStyle: 'bold', fontSize: 13 },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 12 },
      6: { cellWidth: 13 },
      7: { cellWidth: 12 },
      8: { cellWidth: 20 },
      9: { cellWidth: 20 },
      10: { cellWidth: 50, lineWidth: 0.2, lineColor: [73, 138, 159] },
    },
    body: rowsToDisplay,
    didDrawPage: (data) => {
      // Logo fédération
      addLogoToPdf(doc, logoDataUrl, data.settings.margin.left, 2, 12);
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.setFontSize(10);
      doc.text(`Feuille d'émargement : ${competition.name}`, data.settings.margin.left + 15, 4);
      doc.text(`Date : ${capitalize(formatDateFr(competition.eventDate))}`, data.settings.margin.left + 15, 8);
      doc.text(`Catégorie(s) : ${raceCode}`, data.settings.margin.left + 15, 12);

      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      doc.setFontSize(8);
      doc.text(`Page ${doc.getNumberOfPages()}/${totalPagesExp}`, data.settings.margin.left, pageHeight - 10);
      doc.text(`Fichier : ${filename} Imprimé à : ${new Date().toLocaleTimeString('fr-FR')}`, 40, pageHeight - 5);
    },
    margin: { top: 16, left: 10 },
    styles: {
      valign: 'middle',
      fontSize: 10,
      minCellHeight: 10,
    },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
}
