import { jsPDF } from 'jspdf';
import autoTable, { CellHookData, HookData, RowInput, Styles } from 'jspdf-autotable';

import { CompetitionType } from '../../../common/enums';
import { CompetitionEntity } from '../../../competitions/entities/competition.entity';
import { RaceRowDto } from '../../../races/dto/race-row.dto';
import {
  displayDossard,
  getChallengeWinners,
  transformRows,
  type TransformedRow,
} from './classements.utils';
import { capitalize, formatDateFr } from './pdf-format.utils';
import {
  addLogoToPdf,
  loadLogoAsDataUrl,
  loadOpenDossardLogo,
  loadTrophyIcons,
} from './pdf-logo.utils';

const OD_BLUE: [number, number, number] = [0, 82, 147];
const PAGE_MARGIN = 10;
/** Hauteur des logos d'en-tête (mm). */
const LOGO_HEIGHT = 12;
/** Taille des trophées dessinés dans la colonne « Cat. » (mm). */
const TROPHY_SIZE = 3.5;
/** Au-delà de cette ordonnée, le pied de page passe sur une nouvelle page. */
const FOOTER_MAX_Y = 240;

// Fuseau explicite : le conteneur de prod tourne en UTC, l'heure « généré le » doit rester française
const DATE_TIME_FR = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

/** Courses de l'épreuve dans l'ordre de saisie (« 1/2,3 » → ['1/2', '3']). */
export function competitionRaces(competition: CompetitionEntity): string[] {
  return (competition.races ?? '')
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
}

/**
 * Port serveur de `exportClassementsPDF` (webapp-v2) : une page par course,
 * tableau des classés + abandons, trophées sur le podium de catégorie,
 * pied de page organisateur / officiels / vainqueurs du challenge.
 */
export function generateClassementsPDF(competition: CompetitionEntity, rows: RaceRowDto[]): Buffer {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - 2 * PAGE_MARGIN;

  const fedeLogo = loadLogoAsDataUrl(competition.fede);
  const odLogo = loadOpenDossardLogo();
  const trophies = loadTrophyIcons();

  const races = competitionRaces(competition);
  const avecChrono = competition.avecChrono === true;
  const avecTours = rows.some(r => r.tours != null && r.tours > 0);

  // Largeurs de colonnes proportionnelles à la largeur utile de la page
  const baseWidths = [
    12,
    12,
    14,
    50,
    40,
    12,
    16,
    14,
    18,
    ...(avecChrono ? [20] : []),
    ...(avecTours ? [14] : []),
  ];
  const scale = availableWidth / baseWidths.reduce((a, b) => a + b, 0);
  const columnStyles: Record<number, Partial<Styles>> = Object.fromEntries(
    baseWidths.map((w, i) => [
      i,
      {
        cellWidth: w * scale,
        halign: i === 3 || i === 4 ? 'left' : 'center',
        ...(i === 2 ? { fontStyle: 'bold' } : {}),
      },
    ]),
  );

  const head: RowInput[] = [
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
      ...(avecChrono ? ['Temps'] : []),
      ...(avecTours ? ['Tours'] : []),
    ],
  ];

  const drawTrophy = (data: CellHookData): void => {
    if (data.section !== 'body' || data.column.index !== 1) return;
    const rank = data.cell.raw;
    const icon =
      rank === 1
        ? trophies.gold
        : rank === 2
          ? trophies.silver
          : rank === 3
            ? trophies.bronze
            : null;
    if (!icon) return;
    try {
      doc.addImage(
        icon,
        'PNG',
        data.cell.x + 1,
        data.cell.y + (data.cell.height - TROPHY_SIZE) / 2,
        TROPHY_SIZE,
        TROPHY_SIZE,
      );
    } catch {
      // Asset illisible : on ignore
    }
  };

  const drawPageHeader = (race: string, data: HookData): void => {
    const centerX = pageWidth / 2;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Résultats générés avec Open Dossard (https://www.opendossard.com)', centerX, 4, {
      align: 'center',
    });
    doc.setTextColor(0);

    addLogoToPdf(doc, fedeLogo, data.settings.margin.left, 6, LOGO_HEIGHT);
    if (odLogo) {
      const w = LOGO_HEIGHT * odLogo.ratio;
      try {
        doc.addImage(
          odLogo.dataUrl,
          'PNG',
          pageWidth - data.settings.margin.right - w,
          6,
          w,
          LOGO_HEIGHT,
        );
      } catch {
        // Asset illisible : on ignore
      }
    }

    doc.setFontSize(13);
    doc.text(competition.name, centerX, 9, { align: 'center' });
    doc.text(capitalize(formatDateFr(competition.eventDate)), centerX, 14, { align: 'center' });
    doc.text(`Catégorie(s) : ${race}`, centerX, 19, { align: 'center' });
  };

  races.forEach((race, pageIndex) => {
    const transformed = transformRows(rows, race);
    const rankedRows = transformed.filter(r => r.rankingScratch != null || r.comment != null);

    const body: RowInput[] = rankedRows.map((r: TransformedRow) => [
      r.comment ?? r.rankingScratch ?? '',
      r.rankOfCate ?? '',
      // Un dossard 0 est volontairement rendu « 000 » (le web testait la truthiness)
      r.riderNumber != null ? displayDossard(r.riderNumber) : '',
      r.name ?? '',
      r.club ?? '',
      r.gender ?? '',
      r.catev ?? '',
      r.catea ?? '',
      r.fede ?? '',
      ...(avecChrono ? [r.chrono ?? ''] : []),
      ...(avecTours ? [r.tours ? `${r.tours}T` : ''] : []),
    ]);

    autoTable(doc, {
      head,
      body,
      margin: { top: 24, left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { valign: 'middle', halign: 'left', fontSize: 10, minCellHeight: 5 },
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 1,
        minCellHeight: 8,
        fillColor: OD_BLUE,
        textColor: [255, 255, 255],
      },
      bodyStyles: { minCellHeight: 5, cellPadding: 1 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles,
      didDrawCell: drawTrophy,
      didDrawPage: data => drawPageHeader(race, data),
    });

    // Pied de page : infos épreuve sous le tableau, ou sur une nouvelle page s'il est trop bas
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const footerY = finalY > FOOTER_MAX_Y ? (doc.addPage(), 15) : finalY + 10;

    doc.setTextColor('#424242');
    doc.setFontSize(10);
    const engagedCount = rows.filter(r => r.raceCode === race).length;
    const footer = [
      `NOMBRE DE COUREURS : ${engagedCount} en catégorie(s) ${race}`,
      `ORGANISATEUR : ${competition.club?.longName ?? 'NC'}`,
      `COMMISSAIRES : ${competition.commissaires ?? 'NC'}`,
      `SPEAKER : ${competition.speaker ?? 'NC'}`,
      ...(competition.competitionType === CompetitionType.CX
        ? [`ABOYEUR : ${competition.aboyeur ?? 'NC'}`]
        : []),
      `REMARQUES : ${competition.feedback ?? 'NC'}`,
      `Vainqueur(s) du challenge : ${getChallengeWinners(rankedRows)}`,
    ].join('\n');
    doc.text(doc.splitTextToSize(footer, availableWidth) as string[], PAGE_MARGIN, footerY);

    if (pageIndex + 1 < races.length) doc.addPage();
  });

  // Numérotation et mention de génération sur toutes les pages
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = DATE_TIME_FR.format(new Date());
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i}/${pageCount}`, PAGE_MARGIN, pageHeight - 10);
    doc.text(`Classements ${competition.name} — généré le ${generatedAt}`, 50, pageHeight - 5);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
