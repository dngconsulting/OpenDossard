import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportEngageInsertedDto {
  @ApiProperty()
  line: number;

  @ApiPropertyOptional()
  riderNumber?: number;

  @ApiProperty()
  rider: string;

  @ApiProperty()
  licenceNumber: string;

  @ApiProperty()
  raceCode: string;
}

export class ImportEngageDuplicateDto {
  @ApiProperty()
  line: number;

  @ApiProperty()
  rider: string;

  @ApiProperty()
  licenceNumber: string;

  @ApiProperty({ description: 'Course du CSV ignorée' })
  raceCode: string;

  @ApiProperty({ description: 'Course sur laquelle le coureur est déjà engagé' })
  existingRaceCode: string;
}

export class ImportEngageUnknownLicenceDto {
  @ApiProperty()
  line: number;

  @ApiProperty()
  licenceNumber: string;

  @ApiProperty()
  rider: string;
}

export type ImportEngageAnomalyKind = 'missing' | 'divergent' | 'dossardCollision';

export class ImportEngageFieldDiffDto {
  @ApiProperty()
  field: string;

  @ApiPropertyOptional()
  csv?: string;

  @ApiPropertyOptional()
  db?: string;
}

export class ImportEngageAnomalyDto {
  @ApiProperty()
  line: number;

  @ApiProperty({ enum: ['missing', 'divergent', 'dossardCollision'] })
  kind: ImportEngageAnomalyKind;

  @ApiPropertyOptional()
  licenceNumber?: string;

  @ApiPropertyOptional()
  rider?: string;

  @ApiPropertyOptional({ type: [String] })
  missingFields?: string[];

  @ApiPropertyOptional({ type: [ImportEngageFieldDiffDto] })
  diffs?: ImportEngageFieldDiffDto[];

  @ApiPropertyOptional()
  message?: string;
}

export class ImportEngagesSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  inserted: number;

  @ApiProperty()
  duplicates: number;

  @ApiProperty()
  unknownLicences: number;

  @ApiProperty()
  anomalies: number;
}

export class ImportEngagesDetailsDto {
  @ApiProperty({ type: [ImportEngageInsertedDto] })
  inserted: ImportEngageInsertedDto[];

  @ApiProperty({ type: [ImportEngageDuplicateDto] })
  duplicates: ImportEngageDuplicateDto[];

  @ApiProperty({ type: [ImportEngageUnknownLicenceDto] })
  unknownLicences: ImportEngageUnknownLicenceDto[];

  @ApiProperty({ type: [ImportEngageAnomalyDto] })
  anomalies: ImportEngageAnomalyDto[];
}

export class ImportEngagesResultDto {
  @ApiProperty({ type: ImportEngagesSummaryDto })
  summary: ImportEngagesSummaryDto;

  @ApiProperty({ type: ImportEngagesDetailsDto })
  details: ImportEngagesDetailsDto;
}
