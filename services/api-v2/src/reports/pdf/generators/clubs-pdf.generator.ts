import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ClubEntity } from '../../../clubs/entities/club.entity';

export function generateClubsPDFBuffer(clubs: ClubEntity[]): Buffer {
  const filename = 'Clubs.pdf';

  const rowsToDisplay: (string | number)[][] = clubs.map(club => [
    club.id,
    club.shortName || '',
    club.longName || '',
    club.dept || '',
    club.fede || '',
    club.elicenceName || '',
  ]);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totalPagesExp = '{total_pages_count_string}';

  autoTable(doc, {
    head: [
      ['ID', 'Nom court', 'Nom long', 'Département', 'Fédération', 'Nom e-licence'],
    ],
    body: rowsToDisplay,
    bodyStyles: {
      minCellHeight: 3,
      cellPadding: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 50 },
    },
    headStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 0.5,
      minCellHeight: 8,
    },
    styles: {
      valign: 'middle',
      fontSize: 7,
      minCellHeight: 5,
    },
    margin: { top: 14, left: 10 },
    didDrawPage: pageData => {
      // Header
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(
        `Open Dossard - Listing de ${rowsToDisplay.length} Clubs`,
        pageData.settings.margin.left + 70,
        10,
      );

      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageStr = `Page ${doc.getNumberOfPages()}/${totalPagesExp}`;

      doc.setFontSize(8);
      doc.text(pageStr, pageData.settings.margin.left, pageHeight - 10);
      doc.text(
        `Fichier : ${filename} Imprimé le : ${new Date().toLocaleString('fr-FR')}`,
        70,
        pageHeight - 5,
      );
    },
  });

  doc.putTotalPages(totalPagesExp);

  return Buffer.from(doc.output('arraybuffer'));
}
