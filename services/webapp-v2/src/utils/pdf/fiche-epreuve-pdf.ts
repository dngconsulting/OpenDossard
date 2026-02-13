import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { CompetitionDetailType } from '@/types/competitions';
import {
  addLogoToPdf,
  capitalize,
  formatDateFr,
  loadLogoAsDataUrl,
  loadOpenDossardLogo,
} from '@/utils/pdf-exports';

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

/**
 * Rend du HTML (TipTap) dans le PDF avec gestion du gras, italique, listes, titres.
 * Si maxY est fourni, le rendu s'arrête avant de dépasser cette limite.
 * Retourne { y, truncated }.
 */
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

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  let y = startY;
  let truncated = false;
  const lineH = fontSize * 0.45;

  function isOverflow(): boolean {
    return maxY != null && y >= maxY;
  }

  function renderInline(node: Node, curX: number, bold: boolean, italic: boolean): number {
    if (truncated) {
      return curX;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text) {
        return curX;
      }

      const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
      doc.setFont('helvetica', style);
      doc.setFontSize(fontSize);

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
        }
        curX += w;
      }
      return curX;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase();
      if (tag === 'br') {
        y += lineH;
        if (isOverflow()) {
          truncated = true;
          return x;
        }
        return x;
      }
      const isBold = bold || tag === 'strong' || tag === 'b';
      const isItalic = italic || tag === 'em' || tag === 'i';

      let cx = curX;
      for (const child of Array.from(node.childNodes)) {
        if (truncated) {
          break;
        }
        cx = renderInline(child, cx, isBold, isItalic);
      }
      return cx;
    }
    return curX;
  }

  function renderBlock(el: Element): void {
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
      for (const child of Array.from(el.children)) {
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
      for (const child of Array.from(el.childNodes)) {
        if (truncated) {
          break;
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          renderBlock(child as Element);
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
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

  for (const child of Array.from(parsed.body.childNodes)) {
    if (truncated) {
      break;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      renderBlock(child as Element);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
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
    // Checkmark noir
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

export async function exportFicheEpreuvePDF(competition: CompetitionDetailType): Promise<void> {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  const [logoDataUrl, openDossardLogo] = await Promise.all([
    loadLogoAsDataUrl(competition.fede),
    loadOpenDossardLogo(),
  ]);

  const saison = new Date(competition.eventDate).getFullYear();

  // --- En-tête : logo fédération à gauche, titre centré, logo OpenDossard à droite ---
  addLogoToPdf(doc, logoDataUrl, margin, 8, 18);

  // Titre centré en grand format
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
  doc.text(`RÈGLEMENT ÉPREUVE ROUTE — Saison : ${saison}`, pageWidth / 2, bannerY + 5.5, {
    align: 'center',
  });

  // --- Champs formulaire (2 colonnes) ---
  const fieldStartY = 44;
  const lineHeight = 7;
  const col1X = margin;
  const col2X = margin + contentWidth / 2;
  const labelW = 30;

  // Épreuve - pleine largeur en premier, retour à la ligne automatique si nom trop long
  const epreuveMaxWidth = contentWidth - labelW;
  const epreuveLines = drawField(
    doc,
    'Épreuve',
    competition.name,
    col1X,
    fieldStartY,
    labelW,
    epreuveMaxWidth,
    false,
    true,
  );
  const epreuveExtraH = epreuveLines > 1 ? (epreuveLines - 1) * 4.5 : 0;

  // Grille 2 colonnes (décalée après Épreuve)
  const gridY = fieldStartY + lineHeight + epreuveExtraH;
  drawField(doc, 'Comité', competition.dept || '', col1X, gridY, labelW);
  drawField(
    doc,
    'Date',
    capitalize(formatDateFr(competition.eventDate)),
    col1X,
    gridY + lineHeight,
    labelW,
  );

  drawField(
    doc,
    'CP + Ville',
    competition.zipCode + ' ' + competition.lieuDossard || '',
    col2X,
    gridY,
    labelW,
  );
  drawField(doc, 'Contact', competition.contactName || '', col2X, gridY + lineHeight, labelW);
  drawField(
    doc,
    'Téléphone',
    competition.contactPhone || '',
    col2X,
    gridY + lineHeight * 2,
    labelW,
  );
  drawField(doc, 'Email', competition.contactEmail || '', col1X, gridY + lineHeight * 2, labelW);

  // Club - pleine largeur, retour à la ligne automatique si nom trop long
  const clubY = gridY + lineHeight * 3;
  const clubLines = drawField(
    doc,
    'Club',
    competition.club?.longName || '',
    col1X,
    clubY,
    labelW,
    epreuveMaxWidth,
  );
  const clubExtraH = clubLines > 1 ? (clubLines - 1) * 4.5 : 0;

  // Ligne suivante : infos circuit
  const row2Y = clubY + lineHeight + clubExtraH;
  drawField(
    doc,
    'Longueur',
    competition.longueurCircuit ? `${competition.longueurCircuit} km` : '',
    col1X,
    row2Y,
    labelW,
  );
  drawField(doc, 'Type (profil)', competition.info || '', col2X, row2Y, labelW);

  // Ligne 6 : OpenRunner (pleine largeur)
  const openRunner = competition.competitionInfo?.[0]?.info3 || '';
  drawField(doc, 'OpenRunner', openRunner, col1X, row2Y + lineHeight, labelW);

  // Ligne 7 : Commissaires (pleine largeur)
  drawField(
    doc,
    'Commissaires',
    competition.commissaires || '',
    col1X,
    row2Y + lineHeight * 2,
    labelW,
    contentWidth - labelW,
    true,
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
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 2.5,
        minCellHeight: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
      body: competition.competitionInfo.map(ci => [
        ci.course,
        ci.horaireEngagement,
        ci.horaireDepart,
        ci.info1 || '',
        ci.info2 && !isNaN(parseFloat(ci.info2)) ? `${Math.round(parseFloat(ci.info2))} km` : '',
      ]),
      margin: { left: margin, right: margin },
      styles: { valign: 'middle', fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    });

    catTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // --- Tarifs (liste de checkboxes) ---
  let tarifY = catTableY + 4;

  if (competition.pricing && competition.pricing.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Tarifs', margin, tarifY);
    tarifY += 6;

    competition.pricing.forEach(p => {
      const label = p.tarif ? `${p.name} : ${p.tarif}` : p.name;
      drawCheckbox(doc, label, margin + 2, tarifY, true);
      tarifY += 6;
    });

    tarifY += 2;
  }

  // --- Non licenciés ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text('Les non licenciés ne sont plus autorisés à participer aux épreuves.', margin, tarifY);
  doc.setTextColor(0);
  tarifY += 7;

  // --- Observations (suit le contenu, minimum 20% de la page) ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerMargin = 10;

  let obsY = tarifY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Observations et règlement', margin, obsY);
  obsY += 5;

  const obsContentX = margin + 2;
  const obsMaxWidth = contentWidth - 4;
  let contentEndY = obsY + 3.5;

  // Règlement statique
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40);

  const reglementLines = [
    "- Le port du casque rigide est OBLIGATOIRE pour tous les coureurs (y compris à l'échauffement).",
    '- Braquets limités pour les minimes : 6,10 m maximum de développement.',
    '- Les VAE (Vélos à Assistance Électrique) sont INTERDITS en compétition.',
    '- La licence en cours de validité doit être présentée lors du retrait du dossard.',
    '- Les coureurs doivent respecter le code de la route et les consignes des commissaires.',
    '- Tout comportement antisportif entraînera la disqualification immédiate.',
    "- L'organisateur décline toute responsabilité en cas de vol ou de dommage sur le matériel.",
    "- En cas de conditions météorologiques dangereuses, l'organisateur se réserve le droit d'annuler ou de modifier le parcours.",
  ];

  for (const line of reglementLines) {
    doc.text(line, obsContentX, contentEndY);
    contentEndY += 3.2;
  }

  // Observations de l'organisateur (HTML TipTap → PDF formaté)
  const obsLimitY = pageHeight - footerMargin - 10;

  if (competition.observations) {
    contentEndY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(40);
    doc.text("Notes de l'organisateur :", obsContentX, contentEndY);
    contentEndY += 3.5;

    const result = renderHtmlToPdf(
      doc,
      competition.observations,
      obsContentX,
      contentEndY,
      obsMaxWidth,
      7,
      obsLimitY,
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

  // Boîte englobante : colle au contenu, ne dépasse pas le footer
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
    margin,
    pageHeight - 5,
  );
  doc.text(
    'Généré par Open Dossard — https://www.opendossard.com',
    pageWidth - margin,
    pageHeight - 5,
    { align: 'right' },
  );

  // --- Sauvegarde ---
  const filename = `Fiche_epreuve_${competition.name.replace(/\s/g, '_')}.pdf`;
  doc.save(filename);
}
