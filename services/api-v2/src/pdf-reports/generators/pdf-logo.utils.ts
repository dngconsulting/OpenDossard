import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { Federation } from '../../common/enums';

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
  [Federation.FSGT]: 'fsgt.svg',
  [Federation.UFOLEP]: 'ufolep.svg',
  [Federation.FFC]: 'ffc.svg',
  [Federation.FFVELO]: 'ffvelo.svg',
  [Federation.FFTRI]: 'fftri.svg',
};

function getAssetsDir(): string {
  return path.join(__dirname, '..', '..', 'assets', 'logos');
}

export async function loadLogoAsDataUrl(fede: Federation): Promise<FedeLogoResult> {
  const filename = FEDE_LOGOS[fede];
  if (!filename) {
    return null;
  }

  const filePath = path.join(getAssetsDir(), filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const svgBuffer = fs.readFileSync(filePath);
    const pngBuffer = await sharp(svgBuffer).resize(400).png().toBuffer();
    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    return { dataUrl, ratio: width / height };
  } catch {
    return null;
  }
}

export async function loadOpenDossardLogo(): Promise<OpenDossardLogoResult> {
  const filePath = path.join(getAssetsDir(), 'od-blue.png');
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const pngBuffer = fs.readFileSync(filePath);
    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    return { dataUrl, width, height, ratio: width / height };
  } catch {
    return null;
  }
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
    } catch {
      // Ignorer les erreurs de chargement de logo
    }
  }
}
