import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Clock,
  Euro,
  Image,
  Info,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { ClubAutocomplete } from '@/components/ClubAutocomplete';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useCompetition,
  useCreateCompetition,
  useUpdateCompetition,
} from '@/hooks/useCompetitions';
import {
  COMPETITION_TYPE_VALUES,
  FEDERATION_VALUES,
  type CompetitionInfoItem,
  type LinkItem,
  type PricingItem,
} from '@/types/competitions';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler/error-handler';

// Profile options based on competition type
const getProfileOptions = (competitionType: string) => {
  if (competitionType === 'CX') {
    return [{ value: 'Cyclo Cross', label: 'Cyclo Cross' }];
  }
  return [
    { value: 'Montagne', label: 'Montagne' },
    { value: 'Moy-Montagne', label: 'Moy-Montagne' },
    { value: 'Vallonné', label: 'Vallonné' },
    { value: 'Circuit Plat', label: 'Circuit Plat' },
    { value: 'NC', label: 'NC' },
  ];
};

// Federation options (exclude NL and FFTRI for competition creation)
const FEDE_OPTIONS = FEDERATION_VALUES.filter(f => f !== 'NL' && f !== 'FFTRI').map(f => ({
  value: f,
  label: f,
}));

const COMPETITION_TYPE_OPTIONS = COMPETITION_TYPE_VALUES.map(t => ({
  value: t,
  label: t === 'CX' ? 'Cyclo-Cross' : t === 'VTT' ? 'VTT' : 'Route',
}));

// Zod schema for the form
const competitionSchema = z.object({
  name: z.string().min(1, "Le nom de l'épreuve est requis"),
  eventDate: z.string().min(1, 'La date est requise'),
  competitionType: z.string().min(1, 'Le type est requis'),
  fede: z.string().min(1, 'La fédération est requise'),
  zipCode: z
    .string()
    .min(5, 'Le code postal doit contenir 5 chiffres')
    .max(5, 'Le code postal doit contenir 5 chiffres')
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  dept: z.string().optional(),
  club: z.string().optional(),
  longueurCircuit: z.string().optional(),
  info: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z
    .string()
    .optional()
    .refine(val => !val || val.length === 10, 'Le téléphone doit contenir 10 chiffres'),
  contactEmail: z
    .string()
    .optional()
    .refine(val => !val || val.includes('@'), "L'email doit contenir @"),
  siteweb: z
    .string()
    .optional()
    .refine(val => !val || val.startsWith('http'), 'Le site web doit commencer par http'),
  facebook: z
    .string()
    .optional()
    .refine(val => !val || val.startsWith('http'), 'Le lien Facebook doit commencer par http'),
  openedToOtherFede: z.boolean().optional(),
  openedNL: z.boolean().optional(),
  avecChrono: z.boolean().optional(),
  observations: z.string().optional(),
  commissaires: z.string().optional(),
  speaker: z.string().optional(),
  aboyeur: z.string().optional(),
  feedback: z.string().optional(),
  lieuDossard: z.string().optional(),
  lieuDossardGPS: z.string().optional(),
  competitionInfo: z
    .array(
      z.object({
        course: z.string(),
        horaireEngagement: z.string(),
        horaireDepart: z.string(),
        info1: z.string(),
        info2: z.string(),
        info3: z.string().optional(),
      })
    )
    .optional(),
  pricing: z
    .array(
      z.object({
        name: z.string(),
        tarif: z.number(),
      })
    )
    .optional(),
  photoUrls: z
    .array(
      z.object({
        label: z.string(),
        link: z.string(),
      })
    )
    .optional(),
});

type FormValues = z.infer<typeof competitionSchema>;

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id;
  const competitionId = id ? parseInt(id, 10) : undefined;

  const { data: competition, isLoading } = useCompetition(competitionId);
  const createCompetition = useCreateCompetition();
  const updateCompetition = useUpdateCompetition();

  const isSaving = createCompetition.isPending || updateCompetition.isPending;

  // Horaires form state
  const [horaireForm, setHoraireForm] = useState<CompetitionInfoItem>({
    course: '',
    horaireEngagement: '',
    horaireDepart: '',
    info1: '',
    info2: '',
    info3: '',
  });
  const [editingHoraireIndex, setEditingHoraireIndex] = useState<number | null>(null);

  // Pricing form state
  const [pricingForm, setPricingForm] = useState<PricingItem>({ name: '', tarif: 0 });
  const [editingPricingIndex, setEditingPricingIndex] = useState<number | null>(null);

  // Media form state
  const [mediaForm, setMediaForm] = useState<LinkItem>({ label: '', link: '' });
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: '',
      eventDate: '',
      competitionType: '',
      fede: '',
      zipCode: '',
      dept: '',
      club: '',
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

  const {
    fields: competitionInfoFields,
    append: appendCompetitionInfo,
    remove: removeCompetitionInfo,
    update: updateCompetitionInfo,
  } = useFieldArray({
    control: form.control,
    name: 'competitionInfo',
  });

  const {
    fields: pricingFields,
    append: appendPricing,
    remove: removePricing,
    update: updatePricing,
  } = useFieldArray({
    control: form.control,
    name: 'pricing',
  });

  const {
    fields: photoUrlsFields,
    append: appendPhotoUrl,
    remove: removePhotoUrl,
    update: updatePhotoUrl,
  } = useFieldArray({
    control: form.control,
    name: 'photoUrls',
  });

  // Watch form values
  const watchedFede = form.watch('fede');
  const watchedZipCode = form.watch('zipCode');
  const watchedCompetitionType = form.watch('competitionType');

  // Extract department from zipCode
  const deptFromZip = useMemo(() => {
    if (watchedZipCode && watchedZipCode.length >= 2) {
      return watchedZipCode.substring(0, 2);
    }
    return '';
  }, [watchedZipCode]);

  // Profile options based on competition type
  const profileOptions = useMemo(
    () => getProfileOptions(watchedCompetitionType),
    [watchedCompetitionType]
  );

  // Load competition data when editing
  useEffect(() => {
    if (competition) {
      const eventDateLocal = competition.eventDate
        ? new Date(competition.eventDate).toISOString().slice(0, 16)
        : '';

      form.reset({
        name: competition.name || '',
        eventDate: eventDateLocal,
        competitionType: competition.competitionType || '',
        fede: competition.fede || '',
        zipCode: competition.zipCode || '',
        dept: competition.dept || '',
        club: competition.club?.longName || '',
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
        showSuccessToast('Épreuve créée avec succès');
      } else {
        await updateCompetition.mutateAsync({ id: competitionId!, data: formData as any });
        showSuccessToast('Épreuve mise à jour avec succès');
      }
      navigate('/competitions');
    } catch (error) {
      showErrorToast(
        "Erreur lors de l'enregistrement",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  // Horaires handlers
  const handleAddHoraire = () => {
    if (!horaireForm.course || !horaireForm.horaireDepart) return;

    if (editingHoraireIndex !== null) {
      updateCompetitionInfo(editingHoraireIndex, horaireForm);
      setEditingHoraireIndex(null);
    } else {
      appendCompetitionInfo(horaireForm);
    }
    setHoraireForm({
      course: '',
      horaireEngagement: '',
      horaireDepart: '',
      info1: '',
      info2: '',
      info3: '',
    });
  };

  const handleEditHoraire = (index: number) => {
    setHoraireForm(competitionInfoFields[index] as CompetitionInfoItem);
    setEditingHoraireIndex(index);
  };

  // Pricing handlers
  const handleAddPricing = () => {
    if (!pricingForm.name) return;

    if (editingPricingIndex !== null) {
      updatePricing(editingPricingIndex, pricingForm);
      setEditingPricingIndex(null);
    } else {
      appendPricing(pricingForm);
    }
    setPricingForm({ name: '', tarif: 0 });
  };

  const handleEditPricing = (index: number) => {
    setPricingForm(pricingFields[index] as PricingItem);
    setEditingPricingIndex(index);
  };

  // Media handlers
  const handleAddMedia = () => {
    if (!mediaForm.label || !mediaForm.link) return;

    if (editingMediaIndex !== null) {
      updatePhotoUrl(editingMediaIndex, mediaForm);
      setEditingMediaIndex(null);
    } else {
      appendPhotoUrl(mediaForm);
    }
    setMediaForm({ label: '', link: '' });
  };

  const handleEditMedia = (index: number) => {
    setMediaForm(photoUrlsFields[index] as LinkItem);
    setEditingMediaIndex(index);
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate('/competitions')}>
        <ArrowLeft /> Retour
      </Button>
      <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </div>
  );

  const toolbarLeft = competition && (
    <span className="text-sm text-muted-foreground">
      <strong className="text-foreground">{competition.name}</strong>
      {competition.club && <span className="ml-2">— {competition.club.longName}</span>}
    </span>
  );

  const pageTitle = isCreating ? 'Nouvelle épreuve' : "Détail de l'épreuve";

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full gap-0">
            <TabsList className="mb-0 flex w-full justify-center gap-0 rounded-t-xl rounded-b-none bg-muted/50 p-0 h-auto overflow-hidden">
              <TabsTrigger
                value="general"
                className="group flex items-center gap-2.5 rounded-none px-5 py-3 text-muted-foreground transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
              >
                <Info className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-base font-bold">Infos</span>
              </TabsTrigger>
              <TabsTrigger
                value="horaires"
                className="group flex items-center gap-2.5 rounded-none px-5 py-3 text-muted-foreground transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
              >
                <Clock className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-base font-bold">Horaires</span>
              </TabsTrigger>
              <TabsTrigger
                value="tarifs"
                className="group flex items-center gap-2.5 rounded-none px-5 py-3 text-muted-foreground transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
              >
                <Euro className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-base font-bold">Tarifs</span>
              </TabsTrigger>
              <TabsTrigger
                value="localisation"
                className="group flex items-center gap-2.5 rounded-none px-5 py-3 text-muted-foreground transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
              >
                <MapPin className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-base font-bold">Lieu</span>
              </TabsTrigger>
              <TabsTrigger
                value="medias"
                className="group flex items-center gap-2.5 rounded-none px-5 py-3 text-muted-foreground transition-all duration-200 hover:text-[#047857] hover:bg-muted data-[state=active]:bg-[#047857] data-[state=active]:text-white"
              >
                <Image className="h-6 w-6" strokeWidth={2.5} />
                <span className="text-base font-bold">Médias</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Informations générales */}
            <TabsContent value="general" className="mt-0">
              <Card className="rounded-t-none border-t-0">
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>
                    Renseignez les informations principales de l'épreuve
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nom de l'épreuve <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Course de Lombez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Date et heure <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="competitionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Type <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!isCreating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPETITION_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fede"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Fédération <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!isCreating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une fédération" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FEDE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Code postal <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ex: 31000"
                              maxLength={5}
                              {...field}
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longueurCircuit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longueur circuit</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: 5km" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profil</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un profil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {profileOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Club - visible when fede and zipCode are set */}
                    {watchedFede && deptFromZip && (
                      <Controller
                        control={form.control}
                        name="club"
                        render={({ field, fieldState }) => (
                          <ClubAutocomplete
                            value={field.value || ''}
                            onChange={field.onChange}
                            fede={watchedFede}
                            department={deptFromZip}
                            error={fieldState.error?.message}
                            description="Club organisateur de l'épreuve"
                          />
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom contact</FormLabel>
                            <FormControl>
                              <Input placeholder="Prénom NOM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0612345678"
                                maxLength={10}
                                {...field}
                                onChange={e => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="siteweb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site web</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input placeholder="https://facebook.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Only show when editing */}
                  {!isCreating && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Organisation (après création)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="commissaires"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commissaires</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="speaker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Speaker</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {watchedCompetitionType === 'CX' && (
                            <FormField
                              control={form.control}
                              name="aboyeur"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Aboyeur</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name="feedback"
                            render={({ field }) => (
                              <FormItem className="md:col-span-3">
                                <FormLabel>Note commissaire(s)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Options</h4>
                    <div className="flex flex-wrap gap-6">
                      <FormField
                        control={form.control}
                        name="openedToOtherFede"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Ouvert aux autres fédérations
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openedNL"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Ouvert aux non licenciés</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="avecChrono"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Compétition chronométrée</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observations</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Horaires & Circuit */}
            <TabsContent value="horaires" className="mt-0">
              <Card className="rounded-t-none border-t-0">
                <CardHeader>
                  <CardTitle>Horaires & Circuit</CardTitle>
                  <CardDescription>
                    Définissez les différents départs et leurs horaires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Catégorie/Départ</Label>
                      <Input
                        value={horaireForm.course}
                        onChange={e => setHoraireForm({ ...horaireForm, course: e.target.value })}
                        placeholder="ex: Cat 4"
                      />
                    </div>
                    <div>
                      <Label>Heure dossard</Label>
                      <Input
                        value={horaireForm.horaireEngagement}
                        onChange={e =>
                          setHoraireForm({ ...horaireForm, horaireEngagement: e.target.value })
                        }
                        placeholder="ex: 14h"
                      />
                    </div>
                    <div>
                      <Label>Heure départ</Label>
                      <Input
                        value={horaireForm.horaireDepart}
                        onChange={e =>
                          setHoraireForm({ ...horaireForm, horaireDepart: e.target.value })
                        }
                        placeholder="ex: 15h"
                      />
                    </div>
                    <div>
                      <Label>Tours</Label>
                      <Input
                        value={horaireForm.info1}
                        onChange={e => setHoraireForm({ ...horaireForm, info1: e.target.value })}
                        placeholder="ex: 10"
                      />
                    </div>
                    <div>
                      <Label>Distance</Label>
                      <Input
                        value={horaireForm.info2}
                        onChange={e => setHoraireForm({ ...horaireForm, info2: e.target.value })}
                        placeholder="ex: 58kms"
                      />
                    </div>
                    <div>
                      <Label>Lien OpenRunner</Label>
                      <Input
                        value={horaireForm.info3 || ''}
                        onChange={e => setHoraireForm({ ...horaireForm, info3: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddHoraire}>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingHoraireIndex !== null ? 'Modifier' : 'Ajouter'}
                  </Button>

                  {competitionInfoFields.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Dossard</TableHead>
                          <TableHead>Départ</TableHead>
                          <TableHead>Tours</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>OpenRunner</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitionInfoFields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>{(field as CompetitionInfoItem).course}</TableCell>
                            <TableCell>{(field as CompetitionInfoItem).horaireEngagement}</TableCell>
                            <TableCell>{(field as CompetitionInfoItem).horaireDepart}</TableCell>
                            <TableCell>{(field as CompetitionInfoItem).info1}</TableCell>
                            <TableCell>{(field as CompetitionInfoItem).info2}</TableCell>
                            <TableCell>
                              {(field as CompetitionInfoItem).info3 && (
                                <a
                                  href={(field as CompetitionInfoItem).info3}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditHoraire(index)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCompetitionInfo(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun horaire ou parcours encore ajouté
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Tarifs */}
            <TabsContent value="tarifs" className="mt-0">
              <Card className="rounded-t-none border-t-0">
                <CardHeader>
                  <CardTitle>Tarifs</CardTitle>
                  <CardDescription>Définissez les différents tarifs d'inscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Nom du tarif</Label>
                      <Input
                        value={pricingForm.name}
                        onChange={e => setPricingForm({ ...pricingForm, name: e.target.value })}
                        placeholder="ex: Licencié FFC"
                      />
                    </div>
                    <div>
                      <Label>Montant (€)</Label>
                      <Input
                        type="number"
                        value={pricingForm.tarif}
                        onChange={e =>
                          setPricingForm({ ...pricingForm, tarif: Number(e.target.value) })
                        }
                        placeholder="ex: 7"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" onClick={handleAddPricing}>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingPricingIndex !== null ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </div>
                  </div>

                  {pricingFields.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarif</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricingFields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>{(field as PricingItem).name}</TableCell>
                            <TableCell>{(field as PricingItem).tarif} €</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPricing(index)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePricing(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun tarif encore ajouté
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Localisation */}
            <TabsContent value="localisation" className="mt-0">
              <Card className="rounded-t-none border-t-0">
                <CardHeader>
                  <CardTitle>Localisation</CardTitle>
                  <CardDescription>
                    Indiquez le lieu de retrait des dossards et les coordonnées GPS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lieuDossard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lieu de retrait des dossards</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Salle des fêtes de Lombez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lieuDossardGPS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coordonnées GPS</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: 43.4731, 0.9114" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-8 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      La carte interactive sera disponible dans une prochaine version.
                      <br />
                      Vous pouvez saisir les coordonnées GPS manuellement ci-dessus.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Photos/Médias */}
            <TabsContent value="medias" className="mt-0">
              <Card className="rounded-t-none border-t-0">
                <CardHeader>
                  <CardTitle>Photos & Médias</CardTitle>
                  <CardDescription>Ajoutez des liens vers les albums photos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Nom de l'album</Label>
                      <Input
                        value={mediaForm.label}
                        onChange={e => setMediaForm({ ...mediaForm, label: e.target.value })}
                        placeholder="ex: Photos toutes catégories"
                      />
                    </div>
                    <div>
                      <Label>Lien de l'album</Label>
                      <Input
                        value={mediaForm.link}
                        onChange={e => setMediaForm({ ...mediaForm, link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" onClick={handleAddMedia}>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingMediaIndex !== null ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </div>
                  </div>

                  {photoUrlsFields.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom de l'album</TableHead>
                          <TableHead>Lien</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {photoUrlsFields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>{(field as LinkItem).label}</TableCell>
                            <TableCell>
                              <a
                                href={(field as LinkItem).link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {(field as LinkItem).link}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMedia(index)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePhotoUrl(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun lien encore ajouté
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </Layout>
  );
}
