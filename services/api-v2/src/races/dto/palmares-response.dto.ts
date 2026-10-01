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
  @ApiPropertyOptional() catea: string | null;
  @ApiPropertyOptional() club: string | null;
  @ApiPropertyOptional() rankingScratch: number | null;
  @ApiPropertyOptional() rankingInCategory: number | null;
  @ApiProperty() totalInCategory: number;
  @ApiPropertyOptional() comment: string | null;
  @ApiPropertyOptional() sprintchallenge: boolean | null;
}

/**
 * Classement d'un coureur dans un challenge multi-courses TERMINÉ (archivé à la clôture).
 * Les challenges en cours n'ont pas de rang (classement live) et ne figurent pas au palmarès.
 * Pas d'effectif « N classés » : l'archive ne garde que le top 20 par (sexe, catégorie).
 */
export class PalmaresChallengeDto {
  @ApiProperty() challengeId: number;
  @ApiProperty() challengeName: string;
  @ApiPropertyOptional() competitionType: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) closedAt: string;
  /** Date de la première épreuve courue : sert à ranger le challenge dans sa saison. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  firstEventDate: string | null;
  @ApiProperty() gender: string;
  @ApiProperty() catev: string;
  /** Rang dans (challenge, sexe, catégorie), départage inclus. Ex æquo possibles. */
  @ApiProperty() rank: number;
  @ApiProperty() ptsAllRaces: number;
  /** Nombre d'épreuves courues par le coureur dans le challenge. */
  @ApiProperty() nbRaces: number;
}

export class PalmaresResponseDto {
  @ApiProperty() licence: LicenceEntity;
  @ApiProperty() stats: PalmaresStatsDto;
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/PalmaresCategoryChangeDto' },
    },
  })
  categoryHistory: Record<string, PalmaresCategoryChangeDto[]>;
  @ApiProperty({ type: [PalmaresResultDto] }) results: PalmaresResultDto[];
  @ApiProperty({ type: [PalmaresChallengeDto] }) challenges: PalmaresChallengeDto[];
}
