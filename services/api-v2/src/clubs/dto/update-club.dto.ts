import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateClubDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  longName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  elicenceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({
    description:
      "Slug exact de l'association côté HelloAsso. Chaîne vide ou null pour réinitialiser.",
  })
  @IsOptional()
  @IsString()
  helloAssoSlug?: string | null;

  @ApiPropertyOptional({ description: 'If true, propagate longName change to races and licences' })
  @IsOptional()
  @IsBoolean()
  propagate?: boolean;
}
