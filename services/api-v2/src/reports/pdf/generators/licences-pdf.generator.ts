import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { LicenceEntity } from '../../../licences/entities/licence.entity';

export function generateLicencesPDFBuffer(licences: LicenceEntity[]): Buffer {
  const filename = 'Licences.pdf';

  const rowsToDisplay: (string | number)[][] = licences.map(licence => [
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
        'Licence N°',
        'Nom',
        'Prénom',
        'Club',
        'H/F',
        'Dept',
        'Année',
        'Cat.A',
        'Cat.V',
        'Caté.CX',
        'Fédé.',
        'Saison',
      ],
    ],
    body: rowsToDisplay,
    bodyStyles: {
      minCellHeight: 3,
      cellPadding: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 },
      5: { cellWidth: 10 },
      6: { cellWidth: 10 },
      7: { cellWidth: 10 },
      8: { cellWidth: 6 },
      9: { cellWidth: 6 },
      10: { cellWidth: 15 },
      11: { cellWidth: 12 },
      12: { cellWidth: 10 },
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
