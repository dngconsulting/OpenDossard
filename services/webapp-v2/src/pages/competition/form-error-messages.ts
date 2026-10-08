import { getCompetitionInfoLabels } from '@/config/federations';
import { collectFormErrorMessages } from '@/lib/form-errors';

import type { FormValues } from './types';
import type { FieldErrors } from 'react-hook-form';

/**
 * Messages des erreurs de validation du formulaire d'épreuve, lisibles par un
 * organisateur : chaque message nomme l'onglet, le circuit ou le tarif, et les
 * champs à renseigner. Les messages bruts de zod (« Invalid input: expected
 * string, received undefined ») n'indiquent ni le champ ni la ligne. Cas
 * typique : épreuves importées (FFVELO) dont les circuits n'ont pas d'horaires.
 */

/** Message par défaut de zod (type attendu absent) : jamais montré tel quel. */
const RAW_ZOD_MESSAGE = /^Invalid input/;

const ROW_ERROR_KEYS = new Set(['message', 'type', 'ref', 'types', 'root']);

/** Libellés des champs de premier niveau, tels qu'affichés dans le formulaire. */
const FIELD_LABELS: Partial<Record<keyof FormValues, string>> = {
  name: 'Nom de l’épreuve',
  eventDate: 'Date',
  competitionType: 'Type',
  fede: 'Fédération',
  zipCode: 'Code postal',
  clubId: 'Club organisateur',
};

/** Erreurs d'une liste (circuits, tarifs) : une ligne par élément fautif, champs nommés. */
function rowMessages(
  rows: unknown,
  labels: Record<string, string>,
  describeRow: (index: number) => string,
): string[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.flatMap((rowErrors: unknown, index) => {
    if (!rowErrors || typeof rowErrors !== 'object') {
      return [];
    }
    // Champs fautifs seulement : une erreur portée par la ligne entière a les clés
    // techniques de react-hook-form (`message`, `type`, `ref`), sans intérêt ici.
    const fields = Object.keys(rowErrors)
      .filter(field => !ROW_ERROR_KEYS.has(field))
      .map(field => labels[field] ?? field);
    const rowMessage = (rowErrors as { message?: unknown }).message;
    if (fields.length === 0) {
      return typeof rowMessage === 'string' && rowMessage
        ? [`${describeRow(index)} : ${rowMessage}`]
        : [];
    }
    return [`${describeRow(index)} : à renseigner (crayon « Modifier ») — ${fields.join(', ')}.`];
  });
}

export function competitionFormErrorMessages(
  errors: FieldErrors<FormValues>,
  values: FormValues,
): string[] {
  const { competitionInfo, pricing, ...otherErrors } = errors;
  const { info1Label, info2Label } = getCompetitionInfoLabels(values.fede, values.competitionType);

  const circuits = rowMessages(
    competitionInfo,
    {
      course: 'Catégorie/Départ',
      horaireEngagement: 'Heure dossard',
      horaireDepart: 'Heure départ',
      info1: info1Label,
      info2: info2Label,
      info3: 'Lien externe du parcours',
    },
    index => {
      const course = values.competitionInfo?.[index]?.course?.trim();
      return `Onglet Horaires & Circuits, circuit ${course ? `« ${course} »` : `n° ${index + 1}`}`;
    },
  );
  const prices = rowMessages(pricing, { name: 'Nom', tarif: 'Montant' }, index => {
    const name = values.pricing?.[index]?.name?.trim();
    return `Onglet Tarifs, tarif ${name ? `« ${name} »` : `n° ${index + 1}`}`;
  });

  // Erreur portée par la liste elle-même (pas par une ligne) : message tel quel.
  const listLevel = collectFormErrorMessages<FormValues>({
    ...(competitionInfo && !Array.isArray(competitionInfo) ? { competitionInfo } : {}),
    ...(pricing && !Array.isArray(pricing) ? { pricing } : {}),
  });

  const fields = Object.entries(otherErrors).flatMap(([field, error]) => {
    const messages = collectFormErrorMessages<FormValues>({ [field]: error });
    const label = FIELD_LABELS[field as keyof FormValues] ?? field;
    return messages.map(message =>
      RAW_ZOD_MESSAGE.test(message) ? `${label} : à renseigner ou invalide.` : message,
    );
  });

  return [...fields, ...circuits, ...prices, ...listLevel];
}
