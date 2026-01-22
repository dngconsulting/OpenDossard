import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterRaceDto {
  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page', default: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'ID de la compétition' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  competitionId?: number;

  @ApiPropertyOptional({ description: 'ID de la licence' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  licenceId?: number;

  @ApiPropertyOptional({ description: 'Code de la course' })
  @IsString()
  @IsOptional()
  raceCode?: string;
}
