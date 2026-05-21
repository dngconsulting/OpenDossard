import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Liaison HelloAsso d'un club OpenDossard.
 *
 * Une seule ligne par club (`club_id` UNIQUE). Le slug HelloAsso est lui aussi
 * UNIQUE pour empêcher qu'une même asso HelloAsso soit liée à deux clubs.
 *
 * Les tokens sont **chiffrés au repos** (AES-256-GCM via `util/token-crypto.util`).
 * Ne JAMAIS persister les valeurs en clair.
 *
 * Pas de relation TypeORM `@OneToOne(() => ClubEntity)` ici : les contraintes
 * FK (avec `ON DELETE CASCADE` côté club, `SET NULL` côté user) sont décrites
 * dans la migration. La navigation se fait côté service via les repos respectifs.
 */
@Entity('helloasso_details')
export class HelloAssoDetailsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'club_id', type: 'int' })
  @Index({ unique: true })
  clubId: number;

  @Column({ name: 'organization_slug', type: 'varchar', length: 255 })
  @Index({ unique: true })
  organizationSlug: string;

  /** Token d'accès HelloAsso chiffré (AES-256-GCM, format `iv.tag.ct`). */
  @Column({ name: 'access_token', type: 'text' })
  accessTokenEncrypted: string;

  /** Refresh token HelloAsso chiffré (AES-256-GCM, format `iv.tag.ct`). */
  @Column({ name: 'refresh_token', type: 'text' })
  refreshTokenEncrypted: string;

  @Column({ name: 'access_token_expires_at', type: 'timestamp' })
  @Index()
  accessTokenExpiresAt: Date;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamp' })
  refreshTokenExpiresAt: Date;

  /** Audit : user qui a initié la liaison. NULL si user supprimé (RGPD). */
  @Column({ name: 'linked_by_user_id', type: 'int', nullable: true })
  linkedByUserId: number | null;

  @Column({ name: 'linked_at', type: 'timestamp' })
  linkedAt: Date;

  /** Dernier refresh OAuth réussi. NULL tant que pas encore rafraîchi. */
  @Column({ name: 'last_refreshed_at', type: 'timestamp', nullable: true })
  lastRefreshedAt: Date | null;

  /**
   * Éligibilité HelloAsso à encaisser. Reflet de `isCashInCompliant` côté HA.
   * NULL = inconnu (liaison antérieure à l'intégration, ou échec du GET orga
   * au moment de la liaison). `false` = l'asso n'a pas finalisé ses exigences
   * administratives → aucun paiement ne sera encaissé. Mise à jour par webhook
   * `Organization.IsCashinCompliant`.
   */
  @Column({ name: 'is_cash_in_compliant', type: 'boolean', nullable: true })
  isCashInCompliant: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
