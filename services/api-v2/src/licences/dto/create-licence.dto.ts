import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Federation } from '../../common/enums';

export class CreateLicenceDto {
  @ApiProperty({ example: 'DUPONT' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @ApiProperty({ enum: ['H', 'F'], example: 'H' })
  @IsEnum(['H', 'F'])
  gender: string;

  @ApiProperty({ example: '1985' })
  @IsString()
  birthYear: string;

  @ApiProperty({ example: '31', maxLength: 3 })
  @IsString()
  @Length(2, 3)
  dept: string;

  @ApiProperty({ enum: Federation, example: Federation.FSGT })
  @IsEnum(Federation)
  fede: Federation;

  @ApiPropertyOptional({ example: 'VC Toulouse' })
  @IsOptional()
  @IsString()
  club?: string;

  @ApiProperty({ example: 'Senior 1' })
  @IsString()
  catea: string;

  @ApiPropertyOptional({ example: '2ème catégorie' })
  @IsOptional()
  @IsString()
  catev?: string;

  @ApiPropertyOptional({ example: '2ème catégorie' })
  @IsOptional()
  @IsString()
  catevCX?: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  saison: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
