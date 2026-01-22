import { ArrowLeft, Download, Shuffle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { EngagementForm, EngagementsTable } from '@/components/engagements';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type CompetitionType as CompetitionTypeEnum } from '@/config/federations';
import { useCompetition } from '@/hooks/useCompetitions';
import { useCompetitionRaces } from '@/hooks/useRaces';

export default function EngagementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const competitionId = id ? parseInt(id, 10) : undefined;

  // Récupérer la course depuis le hash de l'URL
  const [currentRaceCode, setCurrentRaceCode] = useState<string>('');

  // Charger les données
  const { data: competition, isLoading: isLoadingCompetition } = useCompetition(competitionId);
  const { data: engagements = [], isLoading: isLoadingEngagements } =
    useCompetitionRaces(competitionId);

  // Liste des courses triées
  // races peut être un string (comma-separated) ou déjà un array
  const races = useMemo(() => {
    if (!competition?.races) return [];
    const racesArray = typeof competition.races === 'string'
      ? competition.races.split(',').map(r => r.trim()).filter(Boolean)
      : competition.races;
    return [...racesArray].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }, [competition?.races]);

  // Synchroniser le hash avec la course courante
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && races.includes(hash)) {
      setCurrentRaceCode(hash);
    } else if (races.length > 0 && !currentRaceCode) {
      setCurrentRaceCode(races[0]);
      navigate(`#${races[0]}`, { replace: true });
    }
  }, [location.hash, races, currentRaceCode, navigate]);

  // Changer de course
  const handleRaceChange = (raceCode: string) => {
    setCurrentRaceCode(raceCode);
    navigate(`#${raceCode}`, { replace: true });
  };

  // Compter les engagés par course
  const engagementsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const race of races) {
      counts[race] = engagements.filter(e => e.raceCode === race).length;
    }
    return counts;
  }, [engagements, races]);

  const toolbar = (
    <Button variant="outline" onClick={() => navigate('/competitions')}>
      <ArrowLeft /> Retour
    </Button>
  );

  const isLoading = isLoadingCompetition || isLoadingEngagements;

  if (isLoading && !competition) {
    return (
      <Layout title="Engagements" toolbar={toolbar}>
        <div className="flex items-center justify-center p-8">Chargement...</div>
      </Layout>
    );
  }

  if (!competition) {
    return (
      <Layout title="Engagements" toolbar={toolbar}>
        <div className="flex items-center justify-center p-8 text-destructive">
          Compétition non trouvée
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Engagements" toolbar={toolbar}>
      <div className="space-y-6 p-4">
        {/* Titre de l'épreuve */}
        <h1 className="text-2xl font-bold">{competition.name}</h1>

        {/* Onglets des courses */}
        {races.length > 0 && (
          <Tabs value={currentRaceCode} onValueChange={handleRaceChange}>
            <TabsList className="flex-wrap h-auto">
              {races.map(race => (
                <TabsTrigger
                  key={race}
                  value={race}
                  className="flex items-center gap-2"
                >
                  <span>Cat. {race}</span>
                  <Badge variant="secondary" className="text-xs">
                    {engagementsCount[race] || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button variant="outline" disabled title="Fonctionnalité à venir">
            <Shuffle className="h-4 w-4 mr-2" />
            Réorganiser la course
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled title="Fonctionnalité à venir">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Engagements PDF</DropdownMenuItem>
              <DropdownMenuItem>Feuilles d'émargement PDF</DropdownMenuItem>
              <DropdownMenuItem>Engagements CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Formulaire d'engagement */}
        {currentRaceCode && (
          <EngagementForm
            competitionId={competition.id}
            competitionFede={competition.fede}
            competitionType={competition.competitionType as CompetitionTypeEnum}
            currentRaceCode={currentRaceCode}
            existingEngagements={engagements}
          />
        )}

        {/* Tableau des engagés */}
        {currentRaceCode && (
          <EngagementsTable
            engagements={engagements}
            currentRaceCode={currentRaceCode}
            competitionId={competition.id}
            isLoading={isLoadingEngagements}
          />
        )}
      </div>
    </Layout>
  );
}
