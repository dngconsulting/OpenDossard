import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class DashboardChartFiltersDto {
  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Federations filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  fedes?: string[];

  @ApiPropertyOptional({ description: 'Competition types filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  competitionTypes?: string[];

  @ApiPropertyOptional({ description: 'Competition departments filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  competitionDepts?: string[];

  @ApiPropertyOptional({ description: 'Rider departments filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  riderDepts?: string[];

  @ApiPropertyOptional({ description: 'Clubs filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  clubs?: string[];
}
