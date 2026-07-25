import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Bilan des performances d'un coureur d'un club, pour une catégorie de valeur
 * donnée, sur le périmètre défini par les filtres du dashboard.
 *
 * Un coureur monté de catégorie en cours de saison produit une entrée par
 * catégorie courue : la clé d'agrégation est (licence, catev), pas la licence
 * seule. Les compteurs portent sur le rang **dans la catégorie**, recalculé à
 * la volée (cf. DashboardService.getClubPerformances), et non sur le rang
 * scratch du départ.
 */
export class ClubPerformanceDto {
  @ApiProperty({ description: 'Identifiant de la licence du coureur' })
  licenceId: number;

  @ApiProperty({ description: 'Nom du coureur' })
  name: string;

  @ApiProperty({ description: 'Prénom du coureur' })
  firstName: string;

  @ApiPropertyOptional({
    description: 'Catégorie de valeur courue, telle que figée sur la ligne de résultat',
    nullable: true,
  })
  catev: string | null;

  @ApiProperty({ description: 'Nombre de premières places dans la catégorie' })
  wins: number;

  @ApiProperty({ description: 'Nombre de deuxièmes places dans la catégorie' })
  seconds: number;

  @ApiProperty({ description: 'Nombre de troisièmes places dans la catégorie' })
  thirds: number;

  @ApiProperty({ description: 'Nombre de challenges sprint remportés' })
  sprintChallenges: number;
}
