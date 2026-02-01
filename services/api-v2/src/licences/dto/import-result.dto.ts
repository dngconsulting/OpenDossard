export class ImportUpdatedDetailDto {
  licenceNumber: string;
  name: string;
  firstName: string;
  changes: string[];
}

export class ImportCreatedDetailDto {
  licenceNumber: string;
  name: string;
  firstName: string;
  club: string;
}

export class ImportWarningDto {
  licenceNumber: string;
  name: string;
  firstName: string;
  message: string;
}

export class ImportSkippedDto {
  rider: string;
  reason: string;
}

export class ImportResultDto {
  summary: {
    total: number;
    created: number;
    updated: number;
    unchanged: number;
    skipped: number;
  };
  details: {
    created: ImportCreatedDetailDto[];
    updated: ImportUpdatedDetailDto[];
    warnings: ImportWarningDto[];
    skipped: ImportSkippedDto[];
  };
}
