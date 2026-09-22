import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Federation } from '../../common/enums';

@Entity('club')
export class ClubEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional()
  @Column({ name: 'short_name', nullable: true })
  @Index()
  shortName: string;

  @ApiProperty()
  @Column({ name: 'long_name' })
  longName: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  dept: string;

  @ApiPropertyOptional()
  @Column({ name: 'elicence_name', nullable: true })
  elicenceName: string;

  @ApiPropertyOptional({ enum: Federation })
  @Column({
    type: 'enum',
    enum: Federation,
    enumName: 'competition_fede_enum',
    default: Federation.FSGT,
    nullable: true,
  })
  fede: Federation;

  @ApiPropertyOptional({
    description:
      "Slug exact de l'association côté HelloAsso (visible dans l'URL de la page HelloAsso). Doit être renseigné avant la liaison OAuth : le callback compare ce champ à l'`organization_slug` renvoyé par HelloAsso.",
  })
  @Column({ name: 'helloasso_slug', type: 'text', nullable: true })
  helloAssoSlug: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  author: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'last_changed', type: 'timestamp', nullable: true })
  lastChanged: Date;

  // Champs calculés par ClubsService.findAllPaginated (liste du backoffice),
  // NON persistés : sous-requêtes sur helloasso_details et competition.
  // Absents des autres lectures (findOne, legacy…).
  @ApiPropertyOptional({
    description:
      'Date de liaison HelloAsso (ISO). null = club non lié. Calculé, liste paginée uniquement.',
  })
  helloAssoLinkedAt?: string | null;

  @ApiPropertyOptional({
    description:
      "Expiration du refresh token HelloAsso (ISO). Passée = liaison expirée, l'admin doit repasser par la mire. Calculé, liste paginée uniquement.",
  })
  helloAssoRefreshTokenExpiresAt?: string | null;

  @ApiPropertyOptional({
    description:
      'true si le club a au moins une épreuve (passée ou à venir). Calculé, liste paginée uniquement.',
  })
  organizer?: boolean;
}
