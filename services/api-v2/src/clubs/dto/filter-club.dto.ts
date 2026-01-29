import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

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
}
