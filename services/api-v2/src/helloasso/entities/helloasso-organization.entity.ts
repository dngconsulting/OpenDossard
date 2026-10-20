import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Organisation HelloAsso liée à OpenDossard : porte LA liaison OAuth (tokens)
 * et le drapeau de conformité d'encaissement.
 *
 * Une ligne par orga (`organization_slug` UNIQUE). Plusieurs clubs OpenDossard
 * peuvent s'y rattacher (`helloasso_details`) : une même entité juridique
 * organise sous un club par fédération (FSGT, UFOLEP…). HelloAsso ne garde
 * qu'un grant actif par (partenaire, orga) — une nouvelle autorisation révoque
 * la chaîne précédente —, la chaîne de tokens appartient donc à l'orga, pas au
 * club.
 *
 * Les tokens sont **chiffrés au repos** (AES-256-GCM via `util/token-crypto.util`).
 * Ne JAMAIS persister les valeurs en clair.
 */
@Entity('helloasso_organization')
// Contrainte (et non simple index) : identique au schéma des migrations, et
// requise par `ON CONFLICT (organization_slug)` de `HelloAssoDetailsService`.
@Unique('UQ_helloasso_organization_slug', ['organizationSlug'])
export class HelloAssoOrganizationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_slug', type: 'varchar', length: 255 })
  organizationSlug: string;

  /** Token d'accès HelloAsso chiffré (AES-256-GCM, format `iv.tag.ct`). */
  @Column({ name: 'access_token', type: 'text' })
  accessTokenEncrypted: string;

  /** Refresh token HelloAsso chiffré (AES-256-GCM, format `iv.tag.ct`). */
  @Column({ name: 'refresh_token', type: 'text' })
  refreshTokenEncrypted: string;

  @Column({ name: 'access_token_expires_at', type: 'timestamp' })
  accessTokenExpiresAt: Date;

  @Column({ name: 'refresh_token_expires_at', type: 'timestamp' })
  refreshTokenExpiresAt: Date;

  /** Dernier refresh OAuth réussi. NULL tant que pas encore rafraîchi. */
  @Column({ name: 'last_refreshed_at', type: 'timestamp', nullable: true })
  lastRefreshedAt: Date | null;

  /**
   * Éligibilité HelloAsso à encaisser. Reflet de `isCashInCompliant` côté HA.
   * NULL = inconnu (échec du GET orga au moment de la liaison). `false` = l'asso
   * n'a pas finalisé ses exigences administratives → aucun paiement ne sera
   * encaissé. Mise à jour par webhook `Organization.IsCashinCompliant`.
   */
  @Column({ name: 'is_cash_in_compliant', type: 'boolean', nullable: true })
  isCashInCompliant: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
