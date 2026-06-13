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
   * Upsert d'un appareil, clé = l'identité STABLE `deviceId`. La ligne du
   * device est mise à jour (token éventuellement tourné, user après
   * logout/login → réaffectation au user courant).
   */
  async register(
    userId: number,
    token: string,
    platform: DevicePlatform,
    deviceId: string,
  ): Promise<void> {
    // 1) Ligne de CET appareil (par device_id) : on la met à jour si elle existe.
    let row = await this.repo.findOne({ where: { deviceId } });
    if (!row) {
      // 2) Sinon, le token peut déjà exister sous un autre device_id (réinstall
      //    iOS : le device_id MMKV est régénéré mais le token FCM survit via le
      //    keychain Firebase). On réutilise cette ligne au lieu d'INSERT un
      //    doublon qui violerait l'unicité du token.
      row = await this.repo.findOne({ where: { token } });
    }
    if (row) {
      row.token = token;
      row.userId = userId;
      row.platform = platform;
      row.deviceId = deviceId;
      await this.repo.save(row);
    } else {
      await this.repo.save(this.repo.create({ token, userId, platform, deviceId }));
    }
  }

  /**
   * Désenregistrement par identité d'appareil (opt-out fiable), SCOPÉ au user
   * courant (finding M6 préservé, comme `unregister()`). Indépendant du token
   * FCM courant → robuste à la rotation de token (root cause du bug d'opt-out
   * iOS où le delete par token ratait).
   *
   * Le changement de compte sur un même appareil (X opt-in puis Y prend le
   * device) est géré en amont par la RÉAFFECTATION à l'enregistrement : quand
   * Y (ré)enregistre par `device_id`, la ligne est réaffectée de X à Y (cf.
   * `register`, même modèle de sécurité que l'historique logout A → login B).
   *
   * Idempotent.
   */
  async unregisterByDevice(userId: number, deviceId: string): Promise<void> {
    await this.repo.delete({ userId, deviceId });
  }

  /** Tokens de tous les appareils d'un ensemble de users (fan-out push). */
  async findTokensByUsers(userIds: number[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await this.repo.find({
      where: { userId: In(userIds) },
      select: { token: true },
    });
    return rows.map(r => r.token);
  }

  /** Purge des tokens devenus invalides côté FCM. */
  async removeTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo.delete({ token: In(tokens) });
  }
}
