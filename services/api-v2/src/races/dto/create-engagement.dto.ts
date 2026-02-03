import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEngagementDto {
  @ApiProperty({ description: 'ID de la compétition' })
  @IsNumber()
  @IsNotEmpty()
  competitionId: number;

  @ApiProperty({ description: 'ID de la licence du coureur' })
  @IsNumber()
  @IsNotEmpty()
  licenceId: number;

  @ApiProperty({ description: 'Code de la course (ex: "1", "2/3")' })
  @IsString()
  @IsNotEmpty()
  raceCode: string;

  @ApiProperty({ description: 'Numéro de dossard' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  riderNumber: number;

  @ApiProperty({ description: 'Catégorie valeur (1, 2, 3, J, C, M...)' })
  @IsString()
  @IsNotEmpty()
  catev: string;

  @ApiPropertyOptional({ description: 'Catégorie âge (S, V, SV, A...)' })
  @IsString()
  @IsOptional()
  catea?: string;

  @ApiPropertyOptional({ description: 'Club du coureur' })
  @IsString()
  @IsOptional()
  club?: string;

  @ApiPropertyOptional({
    description: 'Classement scratch (si saisie résultats)',
  })
  @IsNumber()
  @IsOptional()
  rankingScratch?: number;
}
