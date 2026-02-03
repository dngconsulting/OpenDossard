import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRankingDto {
  @ApiProperty({ description: 'Numéro de dossard' })
  @IsNumber()
  riderNumber: number;

  @ApiProperty({ description: 'Code de la course' })
  @IsString()
  raceCode: string;

  @ApiProperty({ description: 'ID de la compétition' })
  @IsNumber()
  competitionId: number;

  @ApiPropertyOptional({ description: 'Classement scratch' })
  @IsNumber()
  @IsOptional()
  rankingScratch?: number;

  @ApiPropertyOptional({
    description: 'Commentaire (ABD, DSQ, NC, NP, CHT)',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class RemoveRankingDto {
  @ApiProperty({ description: "ID de l'engagement" })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Code de la course' })
  @IsString()
  raceCode: string;

  @ApiProperty({ description: 'ID de la compétition' })
  @IsNumber()
  competitionId: number;
}

export class UpdateChronoDto {
  @ApiProperty({ description: 'Chrono au format HH:MM:SS ou MM:SS' })
  @IsString()
  chrono: string;
}

export class UpdateToursDto {
  @ApiPropertyOptional({ description: 'Nombre de tours' })
  @IsNumber()
  @IsOptional()
  tours?: number;
}

export class ReorderRankingItemDto {
  @ApiProperty({ description: "ID de l'engagement" })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'Commentaire (ABD, DSQ...)' })
  @IsString()
  @IsOptional()
  comment?: string;
}
