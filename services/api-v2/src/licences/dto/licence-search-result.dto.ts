import { ApiPropertyOptional } from '@nestjs/swagger';

import { LicenceEntity } from '../entities/licence.entity';
import { LicenceEligibility } from '../licence-eligibility';

/**
 * Résultat de `GET /licences/search`. `eligibility` n'est présent que si la
 * recherche porte sur une épreuve (`competitionId`).
 */
export class LicenceSearchResultDto extends LicenceEntity {
  @ApiPropertyOptional({
    enum: LicenceEligibility,
    enumName: 'LicenceEligibility',
    description: "Éligibilité de la licence à l'épreuve demandée",
  })
  eligibility?: LicenceEligibility;
}
