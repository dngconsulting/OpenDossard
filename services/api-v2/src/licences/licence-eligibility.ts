import { UnprocessableEntityException } from '@nestjs/common';

import { Federation } from '../common/enums';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from './entities/licence.entity';

/**
 * Éligibilité d'une licence à une épreuve, selon la fédération.
 *
 * Seuls `FEDE_NOT_ALLOWED` et `NL_NOT_ALLOWED` interdisent l'engagement.
 * `CONFIRM_OTHER_FEDE` est accepté : l'app demande une confirmation au coureur
 * qui s'engage avec une licence d'une autre fédé alors qu'il en possède une
 * dans la fédé organisatrice.
 */
export enum LicenceEligibility {
  OK = 'OK',
  CONFIRM_OTHER_FEDE = 'CONFIRM_OTHER_FEDE',
  FEDE_NOT_ALLOWED = 'FEDE_NOT_ALLOWED',
  NL_NOT_ALLOWED = 'NL_NOT_ALLOWED',
}

/**
 * `openedToOtherFede` / `openedNL` à null valent false : c'est à l'organisateur
 * de les renseigner. Toute fédé différente de celle de l'épreuve (FFVELO, FFTRI,
 * fédé absente…) est traitée comme « autre fédé ».
 *
 * @param hasOrganizerFedeLicence le même coureur possède une licence dans la
 *   fédé de l'épreuve (cf. `sameRiderCondition`).
 */
export function getLicenceEligibility(
  licence: Pick<LicenceEntity, 'fede'>,
  competition: Pick<CompetitionEntity, 'fede' | 'openedToOtherFede' | 'openedNL'>,
  hasOrganizerFedeLicence: boolean,
): LicenceEligibility {
  if (licence.fede === competition.fede) {
    return LicenceEligibility.OK;
  }
  if (licence.fede === Federation.NL) {
    return competition.openedNL ? LicenceEligibility.OK : LicenceEligibility.NL_NOT_ALLOWED;
  }
  if (!competition.openedToOtherFede) {
    return LicenceEligibility.FEDE_NOT_ALLOWED;
  }
  return hasOrganizerFedeLicence ? LicenceEligibility.CONFIRM_OTHER_FEDE : LicenceEligibility.OK;
}

/**
 * Refuse (422) une licence que l'épreuve n'accepte pas. Ne cherche pas les
 * autres licences du coureur : `CONFIRM_OTHER_FEDE` est accepté comme `OK`.
 */
export function assertLicenceAllowed(
  licence: Pick<LicenceEntity, 'fede'>,
  competition: Pick<CompetitionEntity, 'fede' | 'openedToOtherFede' | 'openedNL'>,
): void {
  const eligibility = getLicenceEligibility(licence, competition, false);
  if (eligibility === LicenceEligibility.FEDE_NOT_ALLOWED) {
    throw new UnprocessableEntityException({
      code: 'LICENCE_FEDE_NOT_ALLOWED',
      message: `Épreuve réservée aux licenciés ${competition.fede}`,
    });
  }
  if (eligibility === LicenceEligibility.NL_NOT_ALLOWED) {
    throw new UnprocessableEntityException({
      code: 'LICENCE_NL_NOT_ALLOWED',
      message: 'Les non licenciés ne sont pas autorisés sur cette épreuve',
    });
  }
}
