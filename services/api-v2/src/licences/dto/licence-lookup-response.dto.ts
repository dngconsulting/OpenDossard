import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Federation } from '../../common/enums';

/**
 * Réponse du lookup `GET /licences/by-number/:licenceNumber`.
 *
 * Champs sélectionnés pour permettre au payeur (côté Dossardeur mobile) de
 * confirmer à 100% l'identité du coureur avant d'engager le paiement HelloAsso.
 * **Champs internes volontairement omis** : `author`, `comment`, `lastChanged`,
 * `saison`, `catevCX` — non pertinents pour le payeur et potentiellement sensibles.
 */
export class LicenceLookupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  licenceNumber: string;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiPropertyOptional()
  gender: string | null;

  @ApiPropertyOptional()
  club: string | null;

  @ApiPropertyOptional()
  dept: string | null;

  @ApiPropertyOptional()
  birthYear: string | null;

  @ApiPropertyOptional()
  catea: string | null;

  @ApiPropertyOptional()
  catev: string | null;

  @ApiProperty({ enum: Federation })
  fede: Federation;
}
