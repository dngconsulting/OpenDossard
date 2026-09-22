import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export const HELLOASSO_LINK_FILTERS = ['linked', 'unlinked'] as const;
export type HelloAssoLinkFilter = (typeof HELLOASSO_LINK_FILTERS)[number];

export class FilterClubDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by short name' })
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ description: 'Filter by federation' })
  @IsOptional()
  @IsString()
  fede?: string;

  @ApiPropertyOptional({ description: 'Filter by long name' })
  @IsOptional()
  @IsString()
  longName?: string;

  @ApiPropertyOptional({ description: 'Filter by eLicence name' })
  @IsOptional()
  @IsString()
  elicenceName?: string;

  @ApiPropertyOptional({
    enum: HELLOASSO_LINK_FILTERS,
    description:
      '`linked` = clubs ayant une liaison HelloAsso (expirée ou non), `unlinked` = clubs sans liaison. Absent = pas de filtre.',
  })
  @IsOptional()
  @IsIn(HELLOASSO_LINK_FILTERS)
  helloAsso?: HelloAssoLinkFilter;

  @ApiPropertyOptional({
    description:
      '`true` = uniquement les clubs ayant au moins une épreuve (passée ou à venir). Absent ou `false` = pas de filtre. Toute autre valeur → 400.',
  })
  @IsOptional()
  // `enableImplicitConversion` convertit "false" en `true` (Boolean("false"))
  // AVANT d'appeler @Transform : `value` est déjà faux. On relit donc la valeur
  // brute de la query string via `obj[key]`. Une valeur inconnue est rendue
  // telle quelle pour que @IsBoolean la rejette (même rigueur que `helloAsso`).
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    if (raw === true || raw === 'true') return true;
    if (raw === false || raw === 'false') return false;
    return raw;
  })
  @IsBoolean()
  organizer?: boolean;
}
