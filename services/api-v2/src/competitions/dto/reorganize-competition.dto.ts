import { IsArray, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorganizeCompetitionDto {
  @ApiProperty({ description: 'Competition ID' })
  @IsNumber()
  competitionId: number;

  @ApiProperty({ description: 'New races configuration', type: [String] })
  @IsArray()
  @IsString({ each: true })
  races: string[];
}
