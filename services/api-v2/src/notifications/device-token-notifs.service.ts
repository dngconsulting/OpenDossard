import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { DeviceTokenNotifEntity, type DevicePlatform } from './entities/device-token-notif.entity';

/**
 * Persistance des tokens FCM (table `device_token_notifs`).
 */
@Injectable()
export class DeviceTokenNotifsService {
  constructor(
    @InjectRepository(DeviceTokenNotifEntity)
    private readonly repo: Repository<DeviceTokenNotifEntity>,
  ) {}

  /**
   * Upsert par token : si le token existe déjà, on réaffecte `user_id`/`platform`
   * (logout A → login B sur le même appareil) et on rafraîchit `updated_at`
   * (via `save` → `@UpdateDateColumn`). Sinon insertion. L'unicité du token est
   * garantie par la contrainte DB.
   */
  async register(userId: number, token: string, platform: DevicePlatform): Promise<void> {
    const existing = await this.repo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      await this.repo.save(existing);
      return;
    }
    await this.repo.save(this.repo.create({ token, userId, platform }));
  }

  /**
   * Suppression scopée au user courant (finding audit M6) : supprimer le
   * token d'un autre user est un no-op silencieux (idempotent, pas de fuite
   * d'existence du token).
   */
  async unregister(userId: number, token: string): Promise<void> {
    await this.repo.delete({ userId, token });
  }

  async findTokensByUser(userId: number): Promise<string[]> {
    const rows = await this.repo.find({ where: { userId }, select: { token: true } });
    return rows.map(r => r.token);
  }

  /** Purge des tokens devenus invalides côté FCM. */
  async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo.delete({ token: In(tokens) });
  }
}
