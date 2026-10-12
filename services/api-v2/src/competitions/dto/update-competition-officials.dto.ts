import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Seuls champs modifiables par un ORGANISATEUR non rattaché au club de
 * l'épreuve : le `ValidationPipe` global (`whitelist: true`) écarte tout le
 * reste du body.
 */
export class UpdateCompetitionOfficialsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commissaires?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboyeur?: string;

  @ApiPropertyOptional({ description: 'Note commissaire(s)' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
