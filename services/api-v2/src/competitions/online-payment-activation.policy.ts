import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HelloAssoDetailsEntity } from '../helloasso/entities/helloasso-details.entity';

/** État du paiement en ligne d'une épreuve qui intéresse le verrou. */
export interface OnlinePaymentState {
  onlineRegistrationEnabled?: boolean | null;
  clubId?: number | null;
}

/**
 * Verrou d'activation du paiement en ligne HelloAsso d'une épreuve.
 *
 * Activer le paiement en ligne (création à ON, passage OFF → ON, ou changement
 * de club avec le switch à ON) exige que le club organisateur soit lié à
 * HelloAsso ET que son drapeau `isCashInCompliant` soit `true`. Contrôlé côté
 * API : l'UI grise le switch, mais un appel direct ne doit pas pouvoir le
 * contourner. S'applique aussi aux ADMIN.
 *
 * Volontairement limité à l'ACTIVATION : une épreuve déjà à ON avec un club
 * non conforme reste éditable et ses coureurs peuvent toujours payer. La
 * désactivation n'est jamais contrôlée.
 *
 * Lecture directe du repository `helloasso_details` (comme le repository des
 * paiements dans `CompetitionsService`) pour éviter une dépendance circulaire
 * entre `CompetitionsModule` et `HelloAssoModule`.
 */
@Injectable()
export class OnlinePaymentActivationPolicy {
  constructor(
    @InjectRepository(HelloAssoDetailsEntity)
    private readonly detailsRepository: Repository<HelloAssoDetailsEntity>,
  ) {}

  /**
   * @param before état actuel en base (`null` pour une création)
   * @param after état qui va être enregistré
   */
  async assertActivable(
    before: OnlinePaymentState | null,
    after: OnlinePaymentState,
  ): Promise<void> {
    if (after.onlineRegistrationEnabled !== true) return;
    const isActivation =
      before === null ||
      before.onlineRegistrationEnabled !== true ||
      (before.clubId ?? null) !== (after.clubId ?? null);
    if (!isActivation) return;

    const link =
      after.clubId == null
        ? null
        : await this.detailsRepository.findOne({ where: { clubId: after.clubId } });
    if (!link) {
      throw new UnprocessableEntityException(
        'Paiement en ligne impossible : le club organisateur n’est pas lié à HelloAsso.',
      );
    }
    if (link.isCashInCompliant !== true) {
      throw new UnprocessableEntityException(
        'Paiement en ligne impossible : le compte HelloAsso du club n’est pas vérifié. ' +
          'Une fois les démarches faites auprès de HelloAsso, rafraîchissez le statut du club.',
      );
    }
  }
}
