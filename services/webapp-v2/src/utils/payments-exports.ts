import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { PAYMENT_STATUS_META, type PaymentAdminRow, type PaymentsScope } from '@/types/payments';

import { loadOpenDossardLogo } from './pdf-exports';

/**
 * Service d'export (PDF + CSV) de la liste des paiements HelloAsso.
 *
 * Conçu pour être réutilisable par tous les écrans qui affichent un
 * `PaymentAdminRow[]` : l'onglet HelloAsso d'une épreuve (scope `competition`)
 * comme l'écran « tous les paiements » admin (scope `all`). Les fonctions sont
 * PURES (pas de fetch) : l'appelant fournit les lignes déjà récupérées/filtrées,
 * ce qui permet d'appliquer plus tard n'importe quels filtres (épreuve, payeur,
 * date…) en amont sans toucher à l'export.
 */

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const DATE_FR = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const DATETIME_FR = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function fmtDate(iso: string | null, withTime = false): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return withTime ? DATETIME_FR.format(d) : DATE_FR.format(d);
}

function fmtPerson(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ');
}

type ExportMode = 'pdf' | 'csv';

type PaymentExportColumn = {
  header: string;
  /** Valeur en texte plat. `mode` permet de différencier PDF (€) et CSV (numérique). */
  accessor: (row: PaymentAdminRow, mode: ExportMode) => string;
  /** Colonne affichée uniquement en scope `all` (vue multi-compétitions). */
  competitionOnly?: boolean;
};

/**
 * Colonnes d'export, alignées sur la grid `PaymentsTable` (hors colonne
 * d'actions). L'ordre reproduit l'affichage : bloc compétition (scope `all`),
 * bloc financier, puis bloc licence/coureur.
 */
export const PAYMENT_EXPORT_COLUMNS: PaymentExportColumn[] = [
  { header: 'Compétition', competitionOnly: true, accessor: r => r.competitionName ?? '' },
  { header: 'Date comp.', competitionOnly: true, accessor: r => fmtDate(r.competitionDate) },
  { header: 'Statut', accessor: r => PAYMENT_STATUS_META[r.status].label },
  { header: 'Participant', accessor: r => fmtPerson(r.licenceFirstName, r.licenceName) },
  { header: 'Payé le', accessor: r => fmtDate(r.paidAt, true) },
  { header: 'Créé le', accessor: r => fmtDate(r.createdAt, true) },
  {
    header: 'Montant',
    // CSV : valeur numérique à la française (virgule décimale, sans symbole) pour
    // rester exploitable dans Excel. PDF : montant formaté avec le symbole €.
    accessor: (r, mode) => (mode === 'csv' ? r.amount.toFixed(2).replace('.', ',') : EUR.format(r.amount)),
  },
  { header: 'Tarif', accessor: r => r.tarifId },
  { header: 'Payeur', accessor: r => fmtPerson(r.payerFirstName, r.payerLastName) },
  { header: 'N° demande', accessor: r => r.checkoutIntentId ?? '' },
  { header: 'N° commande', accessor: r => r.orderId ?? '' },
  { header: 'N° transaction', accessor: r => r.paymentId ?? '' },
  { header: 'Dossard', accessor: r => (r.riderNumber == null ? '' : String(r.riderNumber).padStart(3, '0')) },
  { header: 'Club', accessor: r => r.club ?? '' },
  { header: 'H/F', accessor: r => r.gender ?? '' },
  { header: 'Dept', accessor: r => r.dept ?? '' },
  { header: 'Année', accessor: r => r.birthYear ?? '' },
  { header: 'Cat.A', accessor: r => r.catea ?? '' },
  { header: 'Cat.V', accessor: r => r.catev ?? '' },
  { header: 'Fédé', accessor: r => r.fede ?? '' },
];

function columnsForScope(scope: PaymentsScope): PaymentExportColumn[] {
  const showCompetition = scope.kind === 'all';
  return PAYMENT_EXPORT_COLUMNS.filter(c => showCompetition || !c.competitionOnly);
}

/**
 * Échappe une valeur pour un CSV séparé par `;` :
 *  - protection contre l'injection de formule (Excel/LibreOffice interprètent
 *    une cellule débutant par `=`, `+`, `-`, `@`, tab ou CR comme une formule) :
 *    on préfixe alors d'une apostrophe ;
 *  - quoting RFC 4180 si la valeur contient un guillemet, le séparateur ou un
 *    saut de ligne.
 */
function csvEscape(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) {
    v = `'${v}`;
  }
  if (/[";\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

type ExportOptions = {
  scope: PaymentsScope;
  /** Titre du document PDF (nom de l'épreuve ou « Tous les paiements »). */
  title: string;
  /** Nom de fichier sans extension. */
  filename: string;
};

/**
 * Export CSV (séparateur `;`, BOM UTF-8 pour Excel FR) de la liste des paiements.
 */
export function exportPaymentsCsv(rows: PaymentAdminRow[], options: Omit<ExportOptions, 'title'>): void {
  const columns = columnsForScope(options.scope);
  const headerLine = columns.map(c => csvEscape(c.header)).join(';');
  const dataLines = rows.map(row =>
    columns.map(c => csvEscape(c.accessor(row, 'csv'))).join(';'),
  );
  const csvContent = [headerLine, ...dataLines].join('\n');

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export PDF (A4 paysage, tableau complet) de la liste des paiements.
 */
export async function exportPaymentsPdf(rows: PaymentAdminRow[], options: ExportOptions): Promise<void> {
  const columns = columnsForScope(options.scope);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

  const odLogo = await loadOpenDossardLogo();

  const pageMargin = 8;
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString('fr-FR');

  const body = rows.map(row => columns.map(c => c.accessor(row, 'pdf')));

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body,
    startY: 18,
    margin: { top: 18, left: pageMargin, right: pageMargin },
    rowPageBreak: 'avoid',
    styles: { fontSize: 7, cellPadding: 1, valign: 'middle', overflow: 'linebreak' },
    headStyles: { fontSize: 7, fontStyle: 'bold', fillColor: [73, 138, 159], halign: 'center' },
    didDrawPage: () => {
      if (odLogo) {
        const logoHeight = 9;
        const logoWidth = logoHeight * odLogo.ratio;
        addLogo(doc, odLogo.dataUrl, pageWidth - pageMargin - logoWidth, 3, logoWidth, logoHeight);
      }
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(options.title, pageMargin, 8);
      doc.setFontSize(8);
      doc.setTextColor(110);
      doc.text(`${rows.length} paiement(s) — généré le ${generatedAt}`, pageMargin, 13);

      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - pageMargin, pageHeight - 4, {
        align: 'right',
      });
    },
  });

  doc.save(`${options.filename}.pdf`);
}

function addLogo(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  try {
    doc.addImage(dataUrl, 'PNG', x, y, width, height);
  } catch {
    // logo non critique : on ignore une éventuelle erreur de décodage
  }
}
