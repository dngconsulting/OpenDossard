import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DevicePlatform = 'ios' | 'android';

/**
 * Token de push notification (FCM) d'un appareil, rattaché à un user backend.
 *
 * 1 ligne = 1 install. `token` est UNIQUE : si un même appareil change
 * d'utilisateur (logout A → login B sur le même téléphone), l'enregistrement
 * réaffecte simplement `user_id` à B. Multi-device : un user peut avoir
 * plusieurs lignes (téléphone + tablette).
 *
 * `ON DELETE CASCADE` sur `user_id` : la suppression du compte (RGPD) purge
 * automatiquement les tokens. Les tokens devenus invalides côté FCM
 * (`registration-token-not-registered`) sont purgés inline par
 * `NotificationService` à l'envoi.
 */
@Entity('device_token_notifs')
export class DeviceTokenNotifEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token', type: 'varchar', length: 512 })
  @Index({ unique: true })
  token: string;

  @Column({ name: 'user_id', type: 'int' })
  @Index()
  userId: number;

  @Column({ name: 'platform', type: 'varchar', length: 16 })
  platform: DevicePlatform;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
