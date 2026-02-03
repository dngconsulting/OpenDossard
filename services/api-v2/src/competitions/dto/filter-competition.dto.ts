import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

export class FilterCompetitionDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by zip code (partial match)' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Filter by federation (partial match)' })
  @IsOptional()
  @IsString()
  fede?: string;

  @ApiPropertyOptional({ description: 'Filter by competition type (partial match)' })
  @IsOptional()
  @IsString()
  competitionType?: string;

  @ApiPropertyOptional({ description: 'Filter by department (partial match)' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ description: 'Filter by club name (partial match)' })
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple federations (comma-separated)' })
  @IsOptional()
  @IsString()
  fedes?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple competition types (comma-separated)' })
  @IsOptional()
  @IsString()
  competitionTypes?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple departments (comma-separated)' })
  @IsOptional()
  @IsString()
  depts?: string;

  @ApiPropertyOptional({ description: 'Show past competitions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  displayPast?: boolean;

  @ApiPropertyOptional({ description: 'Show future competitions' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  displayFuture?: boolean;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
