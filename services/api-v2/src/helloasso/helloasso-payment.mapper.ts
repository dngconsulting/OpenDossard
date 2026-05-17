import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from '../licences/entities/licence.entity';
import { HelloAssoPaymentDto } from './dto/helloasso-payment.dto';
import { HelloAssoPaymentEntity } from './entities/helloasso-payment.entity';

export function toPaymentDto(payment: HelloAssoPaymentEntity): HelloAssoPaymentDto {
  return {
    id: payment.id,
    status: payment.status,
    competitionId: payment.competitionId,
    licenceId: payment.licenceId,
    tarifName: payment.tarifId,
    montant: payment.amountCents / 100,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

/**
 * Variante enrichie pour l'endpoint liste : populate `competition*` quand
 * la JOIN a chargé la compétition. Le polling `GET /:id` n'utilise pas cette
 * variante (pas besoin de réloader la competition côté mobile).
 */
export function toPaymentListDto(
  payment: HelloAssoPaymentEntity & {
    competition?: CompetitionEntity;
    licence?: LicenceEntity;
  },
): HelloAssoPaymentDto {
  return {
    ...toPaymentDto(payment),
    competitionName: payment.competition?.name ?? undefined,
    competitionDate: payment.competition?.eventDate?.toISOString() ?? undefined,
    competitionFede: payment.competition?.fede ?? undefined,
    licenceFirstName: payment.licence?.firstName ?? undefined,
    // `LicenceEntity.name` est le lastName dans le schéma OpenDossard.
    licenceLastName: payment.licence?.name ?? undefined,
  };
}

/**
 * Ajoute `paymentId=<id>` à la query string d'une URL, en préservant les
 * éventuels params déjà présents (`?` vs `&` selon le cas). Ne valide pas
 * l'URL — la conf est validée au boot via `requireNonEmpty`.
 */
export function appendPaymentId(url: string, paymentId: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}paymentId=${paymentId}`;
}

/**
 * Parse la valeur de `tarif` (string | number) en euros.
 * Accepte `12,50` / `12.50` / `12,3` / `12` / number direct.
 * Renvoie `undefined` si vide, non parsable, ou ≤ 0.
 */
export function parseTarifAmount(tarif: string | number | undefined): number | undefined {
  if (typeof tarif === 'number') {
    return Number.isFinite(tarif) && tarif > 0 ? tarif : undefined;
  }
  if (typeof tarif !== 'string') return undefined;
  const cleaned = tarif.trim().replace(',', '.');
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
