import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { HelloAssoOrganizationEntity } from './helloasso-organization.entity';

/**
 * Rattachement d'un club OpenDossard à une organisation HelloAsso.
 *
 * Une seule ligne par club (`club_id` UNIQUE) ; plusieurs clubs peuvent se
 * rattacher à la même orga. La liaison OAuth (tokens) et la conformité
 * d'encaissement appartiennent à l'orga (`HelloAssoOrganizationEntity`,
 * chargée en eager) ; cette ligne ne date que le rattachement du club.
 *
 * Pas de relation TypeORM vers `ClubEntity` : les contraintes FK (avec
 * `ON DELETE CASCADE` côté club, `SET NULL` côté user, `RESTRICT` côté orga)
 * sont décrites dans les migrations.
 */
@Entity('helloasso_details')
export class HelloAssoDetailsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'club_id', type: 'int' })
  @Index({ unique: true })
  clubId: number;

  @Column({ name: 'organization_id', type: 'int' })
  @Index('IDX_helloasso_details_organization_id')
  organizationId: number;

  @ManyToOne(() => HelloAssoOrganizationEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'FK_helloasso_details_organization',
  })
  organization: HelloAssoOrganizationEntity;

  /** Audit : user qui a initié le rattachement. NULL si user supprimé (RGPD). */
  @Column({ name: 'linked_by_user_id', type: 'int', nullable: true })
  linkedByUserId: number | null;

  /** Date du (dernier) passage par la mire pour ce club. */
  @Column({ name: 'linked_at', type: 'timestamp' })
  linkedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
