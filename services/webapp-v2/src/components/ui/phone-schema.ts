import { z } from 'zod';

/** Téléphone optionnel : vide ou exactement 10 chiffres sans séparateur. */
export const phoneSchema = z
  .string()
  .regex(/^(\d{10})?$/, 'Le numéro doit comporter 10 chiffres')
  .optional();

/**
 * Valeur stockée → valeur de formulaire. Un numéro seulement formaté
 * (chiffres, espaces, points, tirets) est réduit à ses chiffres ; toute autre
 * valeur (forme mixte laissée par la migration 1788) est gardée telle quelle
 * pour que la validation bloque et que l'utilisateur la corrige, au lieu de
 * perdre le texte en silence.
 */
export const toPhoneDigits = (raw?: string | null): string =>
  raw && /^[\d\s.-]+$/.test(raw) ? raw.replace(/\D/g, '') : (raw ?? '');
