import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export enum UserSource {
  /** Users mobile Firebase (firebase_uid renseigné) */
  DOSSARDEUR = 'dossardeur',
  /** Users backoffice Open Dossard (pas de firebase_uid) */
  OPENDOSSARD = 'opendossard',
}

export class FilterUserDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: UserSource,
    description:
      "Filtre par origine du compte : 'dossardeur' = users mobile Firebase, " +
      "'opendossard' = users backoffice. Absent = tous les users.",
  })
  @IsOptional()
  @IsEnum(UserSource)
  source?: UserSource;
}
