import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Bike, ChevronRight, Clock, Euro, Image, Info, Loader2, MapPin, Mountain, TreePine } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FEDERATIONS, type FedeEnum } from '@/config/federations';
import {
  useCompetition,
  useCreateCompetition,
  useUpdateCompetition,
} from '@/hooks/useCompetitions';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

import { GeneralTab } from './competition/GeneralTab';
import { HorairesTab } from './competition/HorairesTab';
import { LocalisationTab } from './competition/LocalisationTab';
import { MediasTab } from './competition/MediasTab';
import { TarifsTab } from './competition/TarifsTab';
import { competitionSchema, type FormValues, type TabValue, VALID_TABS } from './competition/types';

const competitionTypeIcons: Record<string, React.ReactNode> = {
  ROUTE: <Bike className="size-4" />,
  CX: <TreePine className="size-4" />,
  VTT: <Mountain className="size-4" />,
};

const competitionTypeLabels: Record<string, string> = {
  ROUTE: 'Route',
  CX: 'Cyclo-cross',
  VTT: 'VTT',
};

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCreating = !id;
  const competitionId = id ? parseInt(id, 10) : undefined;

  const tabParam = searchParams.get('tab');
  const currentTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'general';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: competition, isLoading } = useCompetition(competitionId);
  const createCompetition = useCreateCompetition();
  const updateCompetition = useUpdateCompetition();

  const isSaving = createCompetition.isPending || updateCompetition.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: '',
      eventDate: '',
      competitionType: '',
      fede: '',
      zipCode: '',
      dept: '',
      clubId: null,
      longueurCircuit: '',
      info: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      siteweb: '',
      facebook: '',
      openedToOtherFede: false,
      openedNL: false,
      avecChrono: false,
      observations: '',
      commissaires: '',
      speaker: '',
      aboyeur: '',
      feedback: '',
      lieuDossard: '',
      lieuDossardGPS: '',
      competitionInfo: [],
      pricing: [],
      photoUrls: [],
    },
  });

  const watchedZipCode = form.watch('zipCode');
  const watchedName = form.watch('name');
  const watchedEventDate = form.watch('eventDate');
  const watchedCompetitionType = form.watch('competitionType');
  const watchedFede = form.watch('fede');

  // Les 5 champs obligatoires doivent être remplis pour activer le bouton Enregistrer
  const canSave = Boolean(
    watchedName &&
      watchedEventDate &&
      watchedCompetitionType &&
      watchedFede &&
      watchedZipCode?.length === 5,
  );

  const deptFromZip = useMemo(() => {
    if (watchedZipCode && watchedZipCode.length >= 2) {
      return watchedZipCode.substring(0, 2);
    }
    return '';
  }, [watchedZipCode]);

  useEffect(() => {
    if (competition) {
      let eventDateLocal = '';
      if (competition.eventDate) {
        const date = new Date(competition.eventDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        eventDateLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      form.reset({
        name: competition.name || '',
        eventDate: eventDateLocal,
        competitionType: competition.competitionType || '',
        fede: competition.fede || '',
        zipCode: competition.zipCode || '',
        dept: competition.dept || '',
        clubId: competition.club?.id ?? null,
        longueurCircuit: competition.longueurCircuit || '',
        info: competition.info || '',
        contactName: competition.contactName || '',
        contactPhone: competition.contactPhone || '',
        contactEmail: competition.contactEmail || '',
        siteweb: competition.siteweb || '',
        facebook: competition.facebook || '',
        openedToOtherFede: competition.openedToOtherFede || false,
        openedNL: competition.openedNL || false,
        avecChrono: competition.avecChrono || false,
        observations: competition.observations || '',
        commissaires: competition.commissaires || '',
        speaker: competition.speaker || '',
        aboyeur: competition.aboyeur || '',
        feedback: competition.feedback || '',
        lieuDossard: competition.lieuDossard || '',
        lieuDossardGPS: competition.lieuDossardGPS || '',
        competitionInfo: competition.competitionInfo || [],
        pricing: competition.pricing || [],
        photoUrls: competition.photoUrls || [],
      });
    }
  }, [competition, form]);

  // Génère les races par défaut basées sur les 6 premières catégories de la fédération
  const getDefaultRaces = (fede: string): string => {
    const federation = FEDERATIONS[fede as FedeEnum];
    if (!federation) return '';
    const races = federation.catev.slice(0, 6).map(cat => cat.value);
    return races.join(',');
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const defaultRaces = isCreating ? getDefaultRaces(data.fede) : '';
      const formData = {
        ...data,
        eventDate: new Date(data.eventDate).toISOString(),
        races: isCreating ? defaultRaces : competition?.races || '',
        categories: '["Toutes"]',
        dept: deptFromZip,
      };

      if (isCreating) {
        const newCompetition = await createCompetition.mutateAsync(formData as any);
        showSuccessToast('Epreuve créée avec succès');
        navigate(`/competition/${newCompetition.id}`, { replace: true });
      } else {
        await updateCompetition.mutateAsync({ id: competitionId!, data: formData as any });
        showSuccessToast('Epreuve mise à jour avec succès');
      }
    } catch (error) {
      showErrorToast(
        "Erreur lors de l'enregistrement",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const typeIcon = competition?.competitionType
    ? competitionTypeIcons[competition.competitionType] || <Bike className="size-4" />
    : null;
  const typeLabel = competition?.competitionType
    ? competitionTypeLabels[competition.competitionType] || competition.competitionType
    : '';

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/competitions"
        className="text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors"
      >
        Épreuves
      </Link>
      <ChevronRight className="size-4 text-muted-foreground" />
      <span className="font-medium">
        {isCreating ? 'Nouvelle épreuve' : (competition?.name || <Skeleton className="h-4 w-32 inline-block" />)}
      </span>
    </nav>
  );

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => {
          form.handleSubmit(onSubmit, errors => console.error('Validation errors:', errors))();
        }}
        disabled={isSaving || !canSave}
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </div>
  );

  const toolbarLeft = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/competitions')}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      {competition && (
        <>
          <Badge className="bg-slate-600 text-white hover:bg-slate-600 gap-1">
            {typeIcon}
            {typeLabel}
          </Badge>
          {competition.fede && (
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              {competition.fede}
            </Badge>
          )}
        </>
      )}
    </div>
  );

  if (!isCreating && isLoading) {
    return (
      <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Chargement...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={breadcrumb} toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full gap-0">
              <TabsList className="mb-0 flex w-full justify-start md:justify-center gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none border-0">
                <TabsTrigger
                  value="general"
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <Info className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Infos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="horaires"
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <Clock className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Horaires</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tarifs"
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <Euro className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Tarifs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="medias"
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <Image className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Medias</span>
                </TabsTrigger>
                <TabsTrigger
                  value="localisation"
                  className="group flex shrink-0 items-center gap-2.5 rounded-t-lg rounded-b-none first:rounded-tl-xl last:rounded-tr-xl px-5 py-3 bg-muted/30 border border-muted-foreground/20 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white data-[state=active]:border-[#047857]"
                >
                  <MapPin className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Lieu</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-0">
                <GeneralTab competition={competition} isCreating={isCreating} />
              </TabsContent>

              <TabsContent value="horaires" className="mt-0">
                <HorairesTab />
              </TabsContent>

              <TabsContent value="tarifs" className="mt-0">
                <TarifsTab />
              </TabsContent>

              <TabsContent value="localisation" className="mt-0">
                <LocalisationTab />
              </TabsContent>

              <TabsContent value="medias" className="mt-0">
                <MediasTab />
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </FormProvider>
    </Layout>
  );
}
