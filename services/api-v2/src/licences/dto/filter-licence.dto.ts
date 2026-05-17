import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

export class FilterLicenceDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ description: 'Filter by federation' })
  @IsOptional()
  @IsString()
  fede?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Filter by birth year' })
  @IsOptional()
  @IsString()
  birthYear?: string;

  @ApiPropertyOptional({ description: 'Filter by age category' })
  @IsOptional()
  @IsString()
  catea?: string;

  @ApiPropertyOptional({ description: 'Filter by value category' })
  @IsOptional()
  @IsString()
  catev?: string;

  @ApiPropertyOptional({ description: 'Filter by CX category' })
  @IsOptional()
  @IsString()
  catevCX?: string;

  @ApiPropertyOptional({ description: 'Filter by season' })
  @IsOptional()
  @IsString()
  saison?: string;

  @ApiPropertyOptional({ description: 'Filter by ID' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ description: 'Filter licences without licence number' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withoutNumber?: boolean;

  /**
   * Quand fourni, joint le paiement HelloAsso le plus récent du licencié pour
   * cette compétition (subquery corrélée) — utilisé par l'autocomplete licence
   * dans l'écran Engagement pour afficher le statut du paiement à côté du
   * licencié. Pas un filtre WHERE : enrichit la réponse, ne réduit pas l'ensemble.
   */
  @ApiPropertyOptional({ description: 'Compétition pour joindre le statut de paiement.' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNumber()
  competitionId?: number;
}
