import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Clock,
  Euro,
  Image,
  Info,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  competitionSchema,
  type FormValues,
  type TabValue,
  VALID_TABS,
} from './competition/types';

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

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = {
        ...data,
        eventDate: new Date(data.eventDate).toISOString(),
        races: '[]',
        categories: '["Toutes"]',
        dept: deptFromZip,
      };

      if (isCreating) {
        await createCompetition.mutateAsync(formData as any);
        showSuccessToast('Epreuve creee avec succes');
      } else {
        await updateCompetition.mutateAsync({ id: competitionId!, data: formData as any });
        showSuccessToast('Epreuve mise a jour avec succes');
      }
    } catch (error) {
      showErrorToast(
        "Erreur lors de l'enregistrement",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/competitions')}>
        <ArrowLeft /> Retour
      </Button>
      <Button
        onClick={() => {
          console.log('Button clicked, form values:', form.getValues());
          form.handleSubmit(onSubmit, errors => console.error('Validation errors:', errors))();
        }}
        disabled={isSaving}
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </div>
  );

  const toolbarLeft = competition && (
    <span className="text-sm text-muted-foreground">
      <strong className="text-foreground">{competition.name}</strong>
      {competition.club && <span className="ml-2">- {competition.club.longName}</span>}
    </span>
  );

  const pageTitle = isCreating ? 'Nouvelle epreuve' : "Detail de l'epreuve";

  if (!isCreating && isLoading) {
    return (
      <Layout title={pageTitle} toolbar={toolbar}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Chargement...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={pageTitle} toolbar={toolbar} toolbarLeft={toolbarLeft}>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full gap-0">
              <TabsList className="mb-0 flex w-full justify-start md:justify-center gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-x-auto scrollbar-none">
                <TabsTrigger
                  value="general"
                  className="group flex shrink-0 items-center gap-2.5 rounded-none px-5 py-3 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
                >
                  <Info className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Infos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="horaires"
                  className="group flex shrink-0 items-center gap-2.5 rounded-none px-5 py-3 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
                >
                  <Clock className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Horaires</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tarifs"
                  className="group flex shrink-0 items-center gap-2.5 rounded-none px-5 py-3 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
                >
                  <Euro className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Tarifs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="localisation"
                  className="group flex shrink-0 items-center gap-2.5 rounded-none px-5 py-3 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
                >
                  <MapPin className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Lieu</span>
                </TabsTrigger>
                <TabsTrigger
                  value="medias"
                  className="group flex shrink-0 items-center gap-2.5 rounded-none px-5 py-3 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
                >
                  <Image className="h-6 w-6" strokeWidth={2.5} />
                  <span className="text-base font-bold">Medias</span>
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
