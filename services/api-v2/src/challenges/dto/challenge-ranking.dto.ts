import { ApiProperty } from '@nestjs/swagger';

export class ChallengeRaceRowDto {
  @ApiProperty({ description: 'Licence ID' })
  licenceId: string;

  @ApiProperty({ description: 'Competition ID' })
  competitionId: number;

  @ApiProperty({ description: 'Competition name' })
  competitionName: string;

  @ApiProperty({ description: 'Event date' })
  eventDate: Date;

  @ApiProperty({ description: 'Category (catev)' })
  catev: string;

  @ApiProperty({ description: 'Ranking scratch' })
  rankingScratch: number;

  @ApiProperty({ description: 'Number of participants' })
  nbParticipants: number;

  @ApiProperty({ description: 'Race comment (DNF, DNS, etc.)' })
  comment?: string;

  @ApiProperty({ description: 'Sprint challenge bonus' })
  sprintchallenge?: boolean;

  @ApiProperty({ description: 'Points for this race' })
  ptsRace?: number;

  @ApiProperty({ description: 'Explanation of points calculation' })
  explanation?: string;
}

export class ChallengeRiderDto {
  @ApiProperty({ description: 'Licence ID' })
  licenceId: string;

  @ApiProperty({ description: 'Last name' })
  name: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Gender (H/F)' })
  gender: string;

  @ApiProperty({ description: 'Current licence catev' })
  currentLicenceCatev: string;

  @ApiProperty({ description: 'Current licence catea' })
  currentLicenceCatea: string;

  @ApiProperty({ description: 'Current club' })
  currentClub: string;

  @ApiProperty({ description: 'Sprint challenge status' })
  sprintchallenge?: boolean;

  @ApiProperty({ description: 'Race results', type: [ChallengeRaceRowDto] })
  challengeRaceRows: ChallengeRaceRowDto[];

  @ApiProperty({ description: 'Total points for all races' })
  ptsAllRaces: number;

  @ApiProperty({ description: 'Explanation of total points calculation' })
  explanation?: string;
}
