import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { Federation } from '../../../common/enums';

const logger = new Logger('PdfLogoUtils');

export type FedeLogoResult = {
  dataUrl: string;
  ratio: number;
} | null;

export type OpenDossardLogoResult = {
  dataUrl: string;
  width: number;
  height: number;
  ratio: number;
} | null;

const FEDE_LOGOS: Partial<Record<Federation, string>> = {
  [Federation.FSGT]: 'fsgt.png',
  [Federation.UFOLEP]: 'ufolep.png',
  [Federation.FFC]: 'ffc.png',
  [Federation.FFVELO]: 'ffvelo.png',
  [Federation.FFTRI]: 'fftri.png',
};

function getAssetsDir(): string {
  return path.resolve(process.cwd(), 'dist', 'assets', 'images');
}

/** Lit les dimensions depuis l'en-tête PNG (octets 16-23) */
function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function loadPngAsDataUrl(filePath: string): { dataUrl: string; width: number; height: number } | null {
  if (!fs.existsSync(filePath)) {
    logger.warn(`Image not found: ${filePath}`);
    return null;
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const { width, height } = readPngDimensions(buffer);
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    return { dataUrl, width, height };
  } catch (error) {
    logger.error(`Failed to load image ${filePath}`, error);
    return null;
  }
}

export function loadLogoAsDataUrl(fede: Federation): FedeLogoResult {
  const filename = FEDE_LOGOS[fede];
  if (!filename) return null;

  const result = loadPngAsDataUrl(path.join(getAssetsDir(), filename));
  if (!result) return null;

  return { dataUrl: result.dataUrl, ratio: result.width / result.height };
}

export function loadOpenDossardLogo(): OpenDossardLogoResult {
  const result = loadPngAsDataUrl(path.join(getAssetsDir(), 'od-blue.png'));
  if (!result) return null;

  return { dataUrl: result.dataUrl, width: result.width, height: result.height, ratio: result.width / result.height };
}

export function addLogoToPdf(
  doc: import('jspdf').jsPDF,
  logo: FedeLogoResult,
  x: number,
  y: number,
  height: number = 12,
): void {
  if (logo) {
    try {
      const width = height * logo.ratio;
      doc.addImage(logo.dataUrl, 'PNG', x, y, width, height);
    } catch (error) {
      logger.error('Failed to add logo to PDF', error);
    }
  }
}
