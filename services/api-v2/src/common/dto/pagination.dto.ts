import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Number of records to skip' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Number of records to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Global search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to order by' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ enum: OrderDirection, default: OrderDirection.ASC })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection = OrderDirection.ASC;
}

export class PaginationMeta {
  @ApiProperty({ description: 'Current offset' })
  offset: number;

  @ApiProperty({ description: 'Number of records returned' })
  limit: number;

  @ApiProperty({ description: 'Total number of records' })
  total: number;

  @ApiProperty({ description: 'Whether there are more records' })
  hasMore: boolean;
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], total: number, offset: number, limit: number) {
    this.data = data;
    this.meta = {
      offset,
      limit,
      total,
      hasMore: offset + data.length < total,
    };
  }
}
