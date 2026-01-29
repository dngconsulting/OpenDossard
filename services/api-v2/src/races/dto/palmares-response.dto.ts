import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenceEntity } from '../../licences/entities/licence.entity';

export class PalmaresStatsDto {
  @ApiProperty() totalRaces: number;
  @ApiProperty() wins: number;
  @ApiProperty() podiums: number;
  @ApiProperty() topTen: number;
  @ApiProperty() bestRanking: number;
}

export class PalmaresCategoryChangeDto {
  @ApiProperty() season: string;
  @ApiPropertyOptional() fromCategory: string | null;
  @ApiProperty() toCategory: string;
  @ApiProperty() direction: 'up' | 'down' | 'initial';
}

export class PalmaresResultDto {
  @ApiProperty() id: number;
  @ApiProperty() competitionId: number;
  @ApiProperty() date: string;
  @ApiProperty() competitionName: string;
  @ApiProperty() competitionType: string;
  @ApiProperty() raceCode: string;
  @ApiProperty() catev: string;
  @ApiPropertyOptional() rankingScratch: number | null;
  @ApiPropertyOptional() rankingInCategory: number | null;
  @ApiProperty() totalInCategory: number;
  @ApiPropertyOptional() comment: string | null;
}

export class PalmaresResponseDto {
  @ApiProperty() licence: LicenceEntity;
  @ApiProperty() stats: PalmaresStatsDto;
  @ApiProperty({ type: [PalmaresCategoryChangeDto] }) categoryHistory: PalmaresCategoryChangeDto[];
  @ApiProperty({ type: [PalmaresResultDto] }) results: PalmaresResultDto[];
}
