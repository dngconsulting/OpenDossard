import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function exportChartToPdf(
  element: HTMLElement,
  title: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 1.5,
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const imgW = canvas.width;
  const imgH = canvas.height;

  const landscape = imgW > imgH * 1.2;
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const titleH = 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageW / 2, margin + 5, { align: 'center' });

  const availW = pageW - 2 * margin;
  const availH = pageH - margin - titleH - 20;
  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = margin + titleH;
  doc.addImage(imgData, 'JPEG', x, y, drawW, drawH);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  const now = new Date();
  doc.text(
    `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — Open Dossard`,
    pageW / 2,
    pageH - 8,
    { align: 'center' },
  );

  const safeName = title
    .replace(/[^a-zA-Z0-9àâéèêëïîôùûüçÀÂÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
    .replace(/\s+/g, '_');
  doc.save(`${safeName}.pdf`);
}
