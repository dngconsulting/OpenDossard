import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { LicenceType } from '@/types/licences';

/**
 * Generates a PDF file containing a table of licences
 * @param data - Array of licences to export
 */
export const licencesPDF = (data: LicenceType[]): void => {
  const filename = 'Licences.pdf';
  const rowsToDisplay: (string | number)[][] = [];

  data.forEach((licence: LicenceType) => {
    rowsToDisplay.push([
      licence.id,
      licence.licenceNumber || '',
      licence.name || '',
      licence.firstName || '',
      licence.club || '',
      licence.gender || '',
      licence.dept || '',
      licence.birthYear || '',
      licence.catea || '',
      licence.catev || '',
      licence.catevCX || '',
      licence.fede || '',
      licence.saison || '',
    ]);
  });

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totalPagesExp = '{total_pages_count_string}';

  autoTable(doc, {
    head: [
      [
        'ID',
        'Licence N\u00b0',
        'Nom',
        'Pr\u00e9nom',
        'Club',
        'H/F',
        'Dept',
        'Ann\u00e9e',
        'Cat.A',
        'Cat.V',
        'Cat\u00e9.CX',
        'F\u00e9d\u00e9.',
        'Saison',
      ],
    ],
    body: rowsToDisplay,
    bodyStyles: {
      minCellHeight: 3,
      cellPadding: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 10 }, // ID
      1: { cellWidth: 20 }, // Licence N\u00b0
      2: { cellWidth: 20 }, // Nom
      3: { cellWidth: 20 }, // Pr\u00e9nom
      4: { cellWidth: 40 }, // Club
      5: { cellWidth: 10 }, // H/F
      6: { cellWidth: 10 }, // Dept
      7: { cellWidth: 10 }, // Ann\u00e9e
      8: { cellWidth: 6 }, // Cat.A
      9: { cellWidth: 6 }, // Cat.V
      10: { cellWidth: 15 }, // Cat\u00e9.CX
      11: { cellWidth: 12 }, // F\u00e9d\u00e9
      12: { cellWidth: 10 }, // Saison
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
        `Open Dossard - Listing de ${rowsToDisplay.length} Licences`,
        pageData.settings.margin.left + 70,
        10
      );

      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageStr = `Page ${doc.getNumberOfPages()}/${totalPagesExp}`;

      doc.setFontSize(8);
      doc.text(pageStr, pageData.settings.margin.left, pageHeight - 10);
      doc.text(
        `Fichier : ${filename} Imprim\u00e9 le : ${new Date().toLocaleString('fr-FR')}`,
        70,
        pageHeight - 5
      );
    },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(filename);
};
