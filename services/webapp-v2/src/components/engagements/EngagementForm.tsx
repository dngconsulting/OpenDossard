import { Plus, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { LicenceAutocomplete } from '@/components/LicenceAutocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCatevOptions, type CompetitionType } from '@/config/federations';
import { useEngage } from '@/hooks/useRaces';
import type { LicenceType } from '@/types/licences';
import type { RaceRowType } from '@/types/races';

type EngagementFormProps = {
  competitionId: number;
  competitionFede: string;
  competitionType: CompetitionType;
  competitionRaces: string;
  currentRaceCode: string;
  existingEngagements: RaceRowType[];
  onSuccess?: () => void;
};

export function EngagementForm({
  competitionId,
  competitionFede,
  competitionType,
  competitionRaces,
  currentRaceCode,
  existingEngagements,
  onSuccess,
}: EngagementFormProps) {
  const [selectedLicence, setSelectedLicence] = useState<LicenceType | null>(null);
  const [riderNumber, setRiderNumber] = useState('');
  const [catev, setCatev] = useState('');
  const [showFedeWarning, setShowFedeWarning] = useState(false);
  const [showSaisonWarning, setShowSaisonWarning] = useState(false);

  const engageMutation = useEngage();

  // Catégorie pré-remplie depuis la licence (pour l'ajouter aux options si absente)
  const licenceCatevValue = useMemo(() => {
    if (!selectedLicence) return '';
    return competitionType === 'CX'
      ? selectedLicence.catevCX || selectedLicence.catev
      : selectedLicence.catev;
  }, [selectedLicence, competitionType]);

  // Options de catégorie basées sur la fédération de la compétition + catégories personnalisées
  const catevOptions = useMemo(() => {
    const fedeOptions = getCatevOptions(competitionFede, competitionType);
    const allValues = new Set(fedeOptions.map(opt => opt.value));

    // Extraire les catégories personnalisées depuis competition.races
    // Format: "A,B,C,1/2" -> séparer par "," puis par "/" pour obtenir A, B, C, 1, 2
    const customCategories: { value: string; label: string }[] = [];
    if (competitionRaces) {
      const categories = competitionRaces
        .split(/[,/]/)
        .map(r => r.trim())
        .filter(Boolean);
      for (const cat of categories) {
        if (!allValues.has(cat)) {
          customCategories.push({ value: cat, label: cat });
          allValues.add(cat);
        }
      }
    }

    // Ajouter le catev de la licence s'il n'est pas déjà dans les options
    if (licenceCatevValue && !allValues.has(licenceCatevValue)) {
      customCategories.push({ value: licenceCatevValue, label: licenceCatevValue });
    }

    // Retourner les catégories personnalisées en premier, puis les options de la fédé
    return [...customCategories, ...fedeOptions];
  }, [competitionFede, competitionType, competitionRaces, licenceCatevValue]);

  // Reset du formulaire quand la course change
  useEffect(() => {
    setSelectedLicence(null);
    setRiderNumber('');
    setCatev('');
    setShowFedeWarning(false);
    setShowSaisonWarning(false);
  }, [currentRaceCode]);

  // Quand on sélectionne une licence, pré-remplir la catégorie depuis la licence
  useEffect(() => {
    if (selectedLicence) {
      const licenceCatev =
        competitionType === 'CX' ? selectedLicence.catevCX || selectedLicence.catev : selectedLicence.catev;
      setCatev(licenceCatev || '');
      setShowFedeWarning(selectedLicence.fede !== competitionFede);
      const currentYear = new Date().getFullYear().toString();
      setShowSaisonWarning(selectedLicence.saison !== currentYear);
    } else {
      setCatev('');
      setShowFedeWarning(false);
      setShowSaisonWarning(false);
    }
  }, [selectedLicence, competitionFede, competitionType]);

  // Validation
  const isRiderNumberTaken = useMemo(() => {
    if (!riderNumber) return false;
    const num = parseInt(riderNumber, 10);
    return existingEngagements.some(
      e => e.raceCode === currentRaceCode && e.riderNumber === num
    );
  }, [existingEngagements, currentRaceCode, riderNumber]);

  const isLicenceAlreadyEngaged = useMemo(() => {
    if (!selectedLicence) return false;
    return existingEngagements.some(
      e => e.raceCode === currentRaceCode && e.licenceId === selectedLicence.id
    );
  }, [existingEngagements, currentRaceCode, selectedLicence]);

  const canSubmit =
    currentRaceCode &&
    selectedLicence &&
    riderNumber &&
    catev &&
    !isRiderNumberTaken &&
    !isLicenceAlreadyEngaged &&
    !engageMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedLicence) return;

    try {
      await engageMutation.mutateAsync({
        competitionId,
        licenceId: selectedLicence.id,
        raceCode: currentRaceCode,
        riderNumber: parseInt(riderNumber, 10),
        catev,
        catea: selectedLicence.catea,
        club: selectedLicence.club,
      });

      // Reset form
      setSelectedLicence(null);
      setRiderNumber('');
      setCatev('');
      setShowFedeWarning(false);
      setShowSaisonWarning(false);

      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de l\'engagement:', error);
    }
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
      {/* Ligne de saisie */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Autocomplete Licence */}
        <div className="flex-1 min-w-[300px]">
          <LicenceAutocomplete
            value={selectedLicence}
            onChange={setSelectedLicence}
            competitionFede={competitionFede}
            error={isLicenceAlreadyEngaged ? ' ' : undefined}
            required
          />
        </div>

        {/* Numéro de dossard */}
        <div className="w-32 space-y-2">
          <Label htmlFor="riderNumber" className="flex items-center gap-2">
            <span>Dossard <span className="text-destructive">*</span></span>
            {isRiderNumberTaken && (
              <span className="text-destructive text-xs font-normal">Déjà pris</span>
            )}
          </Label>
          <Input
            id="riderNumber"
            type="number"
            value={riderNumber}
            onChange={e => setRiderNumber(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
            className={isRiderNumberTaken ? 'border-destructive focus:border-destructive focus-visible:ring-destructive/50' : ''}
          />
        </div>

        {/* Catégorie */}
        <div className="w-40 space-y-2">
          <Label htmlFor="catev">
            Catégorie <span className="text-destructive">*</span>
          </Label>
          <Select value={catev} onValueChange={setCatev}>
            <SelectTrigger id="catev">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {catevOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bouton Ajouter */}
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {engageMutation.isPending ? (
            'Ajout...'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </>
          )}
        </Button>
      </div>

      {/* Erreur licence déjà engagée */}
      {isLicenceAlreadyEngaged && (
        <p className="text-destructive text-sm">Ce licencié est déjà engagé sur cette course</p>
      )}

      {/* Avertissements */}
      {(showFedeWarning || showSaisonWarning) && (
        <div className="space-y-2">
          {showFedeWarning && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Ce licencié est de la fédération <strong>{selectedLicence?.fede}</strong>. Avez-vous vérifié qu'il ne
                possède pas aussi une licence <strong>{competitionFede}</strong> ?
              </span>
            </div>
          )}
          {showSaisonWarning && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                La licence de ce coureur est enregistrée pour la saison <strong>{selectedLicence?.saison || 'N/A'}</strong>.
                Elle n'est pas à jour pour la saison en cours (<strong>{new Date().getFullYear()}</strong>).
                {' '}<Link to={`/licence/${selectedLicence?.id}?from=engagements&competitionId=${competitionId}`} className="underline font-semibold hover:text-red-900 dark:hover:text-red-100">Mettre à jour la licence</Link>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
