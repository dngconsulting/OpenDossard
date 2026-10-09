import { Download, Loader2, Map as MapIcon, Route, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { gpxTracesApi } from '@/api/gpx-traces.api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGpxTrack } from '@/hooks/useGpxTraces';
import { showErrorToast } from '@/utils/error-handler/error-handler';
import { ApiError } from '@/utils/error-handler/error-types';

import { FieldHelp } from './FieldHelp';
import { GpxTracePreviewDialog } from './GpxTracePreviewDialog';

type CircuitGpxFieldProps = {
  /** `undefined` tant que l'épreuve n'est pas enregistrée (création, duplication). */
  competitionId?: number;
  gpxTraceId?: string;
  /** Le circuit a un lien : le dépôt d'un GPX le remplacera (jamais les deux). */
  hasLink: boolean;
  /** Dépôt en cours, détenu par la page : il bloque aussi l'ajout du circuit et l'enregistrement. */
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onChange: (gpxTraceId: string | undefined) => void;
};

/**
 * Attente maximale d'un dépôt (~15 s pour 200 km en temps normal). Au-delà,
 * on rend la main : le formulaire n'est jamais bloqué indéfiniment.
 */
const UPLOAD_TIMEOUT_MS = 20_000;

const kmFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const metersFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Dépôt du GPX d'un circuit. Le serveur calcule le tracé (profil IGN,
 * statistiques) et renvoie son id, porté par le circuit jusqu'à
 * l'enregistrement de l'épreuve. Un circuit a soit un lien, soit un GPX : le
 * dépôt remplace le lien, effacé seulement si le dépôt réussit. Un GPX retiré
 * ou remplacé est supprimé côté serveur par le ménage quotidien.
 */
export function CircuitGpxField({
  competitionId,
  gpxTraceId,
  hasLink,
  uploading,
  onUploadingChange,
  onChange,
}: CircuitGpxFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Résumé du dernier dépôt, affiché tant que le circuit porte ce tracé.
  // Statistiques lues sur le tracé servi (aussi pour un circuit déjà enregistré).
  const { data: track } = useGpxTrack(competitionId, gpxTraceId);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || competitionId == null) {
      return;
    }
    onUploadingChange(true);
    const signal = AbortSignal.timeout(UPLOAD_TIMEOUT_MS);
    try {
      const uploaded = await gpxTracesApi.upload(competitionId, file, signal);
      onChange(uploaded.id);
    } catch (error) {
      showErrorToast(
        'Le GPX n’a pas pu être déposé',
        signal.aborted
          ? 'Le calcul du profil prend trop de temps. Réessayez dans quelques minutes.'
          : error instanceof ApiError
            ? error.userMessage
            : undefined,
      );
    } finally {
      onUploadingChange(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    if (competitionId == null || !gpxTraceId) {
      return;
    }
    try {
      const blob = await gpxTracesApi.downloadGpx(competitionId, gpxTraceId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track?.name ?? 'parcours'}.gpx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast(
        'Le GPX n’a pas pu être téléchargé',
        error instanceof ApiError ? error.userMessage : undefined,
      );
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>
        Fichier GPX
        <FieldHelp>Fichier visualisé dans l’application Dossardeur</FieldHelp>
      </Label>
      {competitionId == null ? (
        <p className="text-sm text-muted-foreground py-2">
          Enregistrez l’épreuve pour déposer le GPX du circuit.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {gpxTraceId ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Route className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                {track
                  ? `${kmFormat.format(track.stats.distance / 1000)} km · D+ ${metersFormat.format(track.stats.ascent)} m`
                  : 'GPX déposé'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Télécharger le GPX"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => setPreviewOpen(true)}
              >
                <MapIcon className="h-4 w-4" />
                Aperçu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Calcul du profil…' : 'Remplacer'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => onChange(undefined)}
              >
                Retirer
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading
                ? 'Calcul du profil…'
                : hasLink
                  ? 'Remplacer le lien par un GPX'
                  : 'Déposer un GPX'}
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".gpx,application/gpx+xml"
            className="hidden"
            onChange={event => handleFile(event.target.files?.[0])}
          />
          <GpxTracePreviewDialog
            competitionId={competitionId}
            open={previewOpen && !!gpxTraceId}
            gpxTraceId={gpxTraceId ?? null}
            onClose={() => setPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
