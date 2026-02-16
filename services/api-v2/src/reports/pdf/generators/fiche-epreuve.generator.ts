import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JSDOM } from 'jsdom';

import { CompetitionEntity } from '../../../competitions/entities/competition.entity';
import {
  addLogoToPdf,
  loadLogoAsDataUrl,
  loadOpenDossardLogo,
} from './pdf-logo.utils';

const COMPETITION_TYPE_LABELS: Record<string, string> = {
  ROUTE: 'Route',
  CX: 'Cyclo-cross',
  VTT: 'VTT',
  GRAVEL: 'Gravel',
  RANDO: 'Randonnée',
};

function formatDateFr(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];

  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth: number,
  maxWidth?: number,
  truncate?: boolean,
  boldValue?: boolean,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text(`${label} :`, x, y);
  doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
  doc.setTextColor(0);

  if (maxWidth && value) {
    if (truncate) {
      let text = value;
      if (doc.getTextWidth(text) > maxWidth) {
        while (text.length > 0 && doc.getTextWidth(text + '...') > maxWidth) {
          text = text.slice(0, -1);
        }
        text = text.trimEnd() + '...';
      }
      doc.text(text, x + labelWidth, y);
      return 1;
    }
    const lines: string[] = doc.splitTextToSize(value, maxWidth);
    doc.text(lines, x + labelWidth, y);
    return lines.length;
  }

  doc.text(value || '', x + labelWidth, y);
  return 1;
}

function renderHtmlToPdf(
  doc: jsPDF,
  html: string,
  x: number,
  startY: number,
  maxWidth: number,
  fontSize: number = 7,
  maxY?: number,
): { y: number; truncated: boolean } {
  if (!html) {
    return { y: startY, truncated: false };
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;
  let y = startY;
  let truncated = false;
  const lineH = fontSize * 0.45;

  const NODE_ELEMENT = 1;
  const NODE_TEXT = 3;

  function isOverflow(): boolean {
    return maxY != null && y >= maxY;
  }

  function renderTextSegment(
    text: string,
    curX: number,
    style: string,
    linkUrl?: string,
  ): number {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    if (linkUrl) {
      doc.setTextColor(0, 82, 147);
    }

    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (!word || truncated) {
        continue;
      }
      const w = doc.getTextWidth(word);
      if (curX + w > x + maxWidth && curX > x && word.trim()) {
        curX = x;
        y += lineH;
        if (isOverflow()) {
          truncated = true;
          return curX;
        }
      }
      if (word.trim()) {
        doc.text(word, curX, y);
        if (linkUrl) {
          doc.link(curX, y - fontSize * 0.35, w, fontSize * 0.45, { url: linkUrl });
        }
      }
      curX += w;
    }

    if (linkUrl) {
      doc.setTextColor(0);
    }
    return curX;
  }

  function renderInline(node: any, curX: number, bold: boolean, italic: boolean): number {
    if (truncated) {
      return curX;
    }

    if (node.nodeType === NODE_TEXT) {
      const text = node.textContent || '';
      if (!text) {
        return curX;
      }

      const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
      return renderTextSegment(text, curX, style);
    }

    if (node.nodeType === NODE_ELEMENT) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') {
        y += lineH;
        if (isOverflow()) {
          truncated = true;
          return x;
        }
        return x;
      }

      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        const linkText = node.textContent || href;
        const style = bold ? 'bold' : 'normal';
        let cx = renderTextSegment(linkText, curX, style, href);
        if (href && linkText !== href) {
          cx = renderTextSegment(` (${href})`, cx, style, href);
        }
        return cx;
      }

      const isBold = bold || tag === 'strong' || tag === 'b';
      const isItalic = italic || tag === 'em' || tag === 'i';

      let cx = curX;
      for (const child of Array.from(node.childNodes) as any[]) {
        if (truncated) {
          break;
        }
        cx = renderInline(child, cx, isBold, isItalic);
      }
      return cx;
    }
    return curX;
  }

  function renderBlock(el: any): void {
    if (truncated) {
      return;
    }
    const tag = el.tagName.toLowerCase();

    if (tag === 'p' || tag === 'div' || tag.match(/^h[1-6]$/)) {
      const isHeading = !!tag.match(/^h[1-6]$/);
      const prevSize = fontSize;
      if (isHeading) {
        fontSize = prevSize + (4 - parseInt(tag[1])) * 1.5;
      }
      renderInline(el, x, isHeading, false);
      fontSize = prevSize;
      if (!truncated) {
        y += lineH + (isHeading ? 1.5 : 0.8);
      }
      if (isOverflow()) {
        truncated = true;
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      let idx = 1;
      for (const child of Array.from(el.children) as any[]) {
        if (truncated) {
          break;
        }
        if (child.tagName.toLowerCase() === 'li') {
          const bullet = ordered ? `${idx}. ` : '- ';
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          const bulletW = doc.getTextWidth(bullet);
          doc.text(bullet, x, y);
          renderInline(child, x + bulletW, false, false);
          if (!truncated) {
            y += lineH + 0.5;
          }
          if (isOverflow()) {
            truncated = true;
            break;
          }
          idx++;
        }
      }
      if (!truncated) {
        y += 0.5;
      }
    } else {
      for (const child of Array.from(el.childNodes) as any[]) {
        if (truncated) {
          break;
        }
        if (child.nodeType === NODE_ELEMENT) {
          renderBlock(child);
        } else if (child.nodeType === NODE_TEXT && child.textContent?.trim()) {
          renderInline(child, x, false, false);
          if (!truncated) {
            y += lineH;
          }
          if (isOverflow()) {
            truncated = true;
            break;
          }
        }
      }
    }
  }

  for (const child of Array.from(document.body.childNodes) as any[]) {
    if (truncated) {
      break;
    }
    if (child.nodeType === NODE_ELEMENT) {
      renderBlock(child);
    } else if (child.nodeType === NODE_TEXT && child.textContent?.trim()) {
      renderInline(child, x, false, false);
      if (!truncated) {
        y += lineH;
      }
      if (isOverflow()) {
        truncated = true;
        break;
      }
    }
  }

  return { y, truncated };
}

function drawCheckbox(doc: jsPDF, label: string, x: number, y: number, checked: boolean): void {
  const boxSize = 3.5;
  const bx = x;
  const by = y - boxSize + 0.5;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(bx, by, boxSize, boxSize);
  if (checked) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(bx + 0.7, by + boxSize * 0.5, bx + boxSize * 0.4, by + boxSize * 0.8);
    doc.line(bx + boxSize * 0.4, by + boxSize * 0.8, bx + boxSize - 0.6, by + boxSize * 0.2);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.text(label, x + boxSize + 2, y);
}

export async function generateFicheEpreuvePDF(competition: CompetitionEntity): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  const logoDataUrl = loadLogoAsDataUrl(competition.fede);
  const openDossardLogo = loadOpenDossardLogo();

  const saison = new Date(competition.eventDate).getFullYear();

  // --- En-tête : logo fédération à gauche, titre centré, logo OpenDossard à droite ---
  addLogoToPdf(doc, logoDataUrl, margin, 8, 18);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Fédération Sportive et Gymnique du Travail', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Commission Cycliste Haute-Garonne', pageWidth / 2, 21, { align: 'center' });

  if (openDossardLogo) {
    const logoHeight = 14;
    const logoWidth = logoHeight * openDossardLogo.ratio;
    const logoX = pageWidth - margin - logoWidth;
    try {
      doc.addImage(openDossardLogo.dataUrl, 'PNG', logoX, 8, logoWidth, logoHeight);
    } catch {
      // Ignorer les erreurs de chargement
    }
  }

  // --- Sous-titre avec bordure ---
  const bannerY = 29;
  const bannerH = 9;
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(margin, bannerY, contentWidth, bannerH);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const typeLabel = COMPETITION_TYPE_LABELS[competition.competitionType] ?? competition.competitionType;
  doc.text(`RÈGLEMENT ÉPREUVE ${typeLabel.toUpperCase()} — Saison : ${saison}`, pageWidth / 2, bannerY + 5.5, {
    align: 'center',
  });

  // --- Champs formulaire (2 colonnes) ---
  const fieldStartY = 44;
  const lineHeight = 7;
  const col1X = margin;
  const col2X = margin + contentWidth / 2;
  const labelW = 30;

  const epreuveMaxWidth = contentWidth - labelW;
  const epreuveLines = drawField(
    doc, 'Épreuve', competition.name, col1X, fieldStartY, labelW, epreuveMaxWidth, false, true,
  );
  const epreuveExtraH = epreuveLines > 1 ? (epreuveLines - 1) * 4.5 : 0;

  const gridY = fieldStartY + lineHeight + epreuveExtraH;
  drawField(doc, 'Comité', competition.dept || '', col1X, gridY, labelW);
  drawField(doc, 'Date', capitalize(formatDateFr(competition.eventDate)), col1X, gridY + lineHeight, labelW);

  drawField(
    doc, 'CP + Ville',
    (competition.zipCode || '') + ' ' + (competition.lieuDossard || ''),
    col2X, gridY, labelW,
  );
  drawField(doc, 'Contact', competition.contactName || '', col2X, gridY + lineHeight, labelW);
  drawField(doc, 'Téléphone', competition.contactPhone || '', col2X, gridY + lineHeight * 2, labelW);
  drawField(doc, 'Email', competition.contactEmail || '', col1X, gridY + lineHeight * 2, labelW);

  const clubY = gridY + lineHeight * 3;
  const clubLines = drawField(
    doc, 'Club', competition.club?.longName || '', col1X, clubY, labelW, epreuveMaxWidth,
  );
  const clubExtraH = clubLines > 1 ? (clubLines - 1) * 4.5 : 0;

  const row2Y = clubY + lineHeight + clubExtraH;
  drawField(
    doc, 'Longueur',
    competition.longueurCircuit ? `${competition.longueurCircuit} km` : '',
    col1X, row2Y, labelW,
  );
  drawField(doc, 'Type (profil)', competition.info || '', col2X, row2Y, labelW);

  const openRunner = competition.competitionInfo?.[0]?.info3 || '';
  drawField(doc, 'OpenRunner', openRunner, col1X, row2Y + lineHeight, labelW);

  drawField(
    doc, 'Commissaires', competition.commissaires || '',
    col1X, row2Y + lineHeight * 2, labelW, contentWidth - labelW, true,
  );

  // --- Ouverture aux autres fédérations ---
  const fedeLineY = row2Y + lineHeight * 3.2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  const fede = competition.fede || 'FSGT';
  if (competition.openedToOtherFede) {
    doc.text(`Épreuve ouverte aux licenciés ${fede} et aux autres fédérations`, col1X, fedeLineY);
  } else {
    doc.text(`Épreuve réservée aux licenciés ${fede} uniquement`, col1X, fedeLineY);
  }
  doc.setTextColor(0);

  // --- Table catégories ---
  let catTableY = fedeLineY + 6;

  if (competition.competitionInfo && competition.competitionInfo.length > 0) {
    autoTable(doc, {
      startY: catTableY,
      head: [['Catégorie', 'Heure dossards', 'Heure départ', 'Nombre de tours', 'Total kms']],
      headStyles: {
        fontSize: 10, fontStyle: 'bold', halign: 'center',
        fillColor: [255, 255, 255], textColor: [0, 0, 0],
        lineColor: [0, 0, 0], lineWidth: 0.3, cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 10, cellPadding: 2.5, minCellHeight: 8,
        lineColor: [0, 0, 0], lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
      body: competition.competitionInfo.map(ci => [
        ci.course || '',
        ci.horaireEngagement || '',
        ci.horaireDepart || '',
        ci.info1 || '',
        ci.info2 && !isNaN(parseFloat(ci.info2)) ? `${Math.round(parseFloat(ci.info2))} km` : '',
      ]),
      margin: { left: margin, right: margin },
      styles: { valign: 'middle', fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    });

    catTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // --- Tarifs ---
  let tarifY = catTableY + 4;

  if (competition.pricing && competition.pricing.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Tarifs', margin, tarifY);
    tarifY += 6;

    competition.pricing.forEach(p => {
      const tarif = p.tarif && !p.tarif.includes('€') ? `${p.tarif} €` : p.tarif;
      const label = tarif ? `${p.name} : ${tarif}` : p.name;
      drawCheckbox(doc, label, margin + 2, tarifY, true);
      tarifY += 6;
    });

    tarifY += 2;
  }

  // --- Non licenciés ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  if (competition.openedNL) {
    doc.setTextColor(0);
    doc.text('Les non licenciés sont autorisés à participer à cette épreuve selon conditions.', margin, tarifY);
  } else {
    doc.setTextColor(200, 0, 0);
    doc.text('Les non licenciés ne sont pas autorisés à participer à cette épreuve.', margin, tarifY);
    doc.setTextColor(0);
  }
  tarifY += 7;

  // --- Épreuve chronométrée ---
  if (competition.avecChrono) {
    doc.setTextColor(0);
    doc.text('Épreuve chronométrée.', margin, tarifY);
    tarifY += 7;
  }

  // --- Observations ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerMargin = 10;

  let obsY = tarifY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Observations', margin, obsY);
  obsY += 5;

  const obsContentX = margin + 2;
  const obsMaxWidth = contentWidth - 4;
  let contentEndY = obsY + 3.5;

  const obsLimitY = pageHeight - footerMargin - 10;

  if (competition.observations) {
    const result = renderHtmlToPdf(
      doc, competition.observations, obsContentX, contentEndY, obsMaxWidth, 7, obsLimitY,
    );
    contentEndY = result.y;

    if (result.truncated) {
      contentEndY += 2;
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(7);
      doc.setTextColor(0, 82, 147);
      doc.text("Plus de détails sur l'application Dossardeur", obsContentX, contentEndY);
      doc.setTextColor(40);
      contentEndY += 3;
    }
  }

  const maxBoxBottom = pageHeight - footerMargin;
  const obsBoxHeight = Math.min(contentEndY - obsY + 3, maxBoxBottom - obsY);

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, obsY, contentWidth, obsBoxHeight);

  // --- Pied de page ---
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    margin, pageHeight - 5,
  );
  doc.text(
    'Généré par Open Dossard — https://www.opendossard.com',
    pageWidth - margin, pageHeight - 5, { align: 'right' },
  );

  return Buffer.from(doc.output('arraybuffer'));
}
