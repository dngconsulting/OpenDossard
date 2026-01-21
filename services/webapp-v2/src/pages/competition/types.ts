import { z } from 'zod';
import {
  COMPETITION_TYPE_VALUES,
  FEDERATION_VALUES,
} from '@/types/competitions';

// Profile options based on competition type
export const getProfileOptions = (competitionType: string) => {
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

// Federation options (exclude NL and FFTRI for competition creation only)
export const FEDE_OPTIONS_CREATE = FEDERATION_VALUES.filter(
  f => f !== 'NL' && f !== 'FFTRI'
).map(f => ({
  value: f,
  label: f,
}));

// All federation options (for editing)
export const FEDE_OPTIONS_ALL = FEDERATION_VALUES.map(f => ({
  value: f,
  label: f,
}));

export const COMPETITION_TYPE_OPTIONS = COMPETITION_TYPE_VALUES.map(t => ({
  value: t,
  label: t === 'CX' ? 'Cyclo-Cross' : t === 'VTT' ? 'VTT' : 'Route',
}));

// Zod schema for the form
export const competitionSchema = z.object({
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
  clubId: z.number().nullable().optional(),
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
      }),
    )
    .optional(),
  pricing: z
    .array(
      z.object({
        name: z.string(),
        tarif: z.string(),
      }),
    )
    .optional(),
  photoUrls: z
    .array(
      z.object({
        label: z.string(),
        link: z.string(),
      }),
    )
    .optional(),
});

export type FormValues = z.infer<typeof competitionSchema>;

export const VALID_TABS = ['general', 'horaires', 'tarifs', 'localisation', 'medias'] as const;
export type TabValue = (typeof VALID_TABS)[number];
