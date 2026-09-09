import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * États possibles d'un paiement HelloAsso côté OpenDossard (synthèse de l'enum
 * `PaymentState` HelloAsso, qui en compte ~20). Mapping appliqué à la réception
 * du webhook par le service (cf. design `[[helloasso-implementation]]` §2.6.E) :
 *
 *   HelloAsso `Authorized` / `AuthorizedPreprod`  → `paid`
 *   HelloAsso `Refused` / `Error` / `Abandoned` / `Canceled` → `refused`
 *   HelloAsso `Refunding`                         → `refunding`  (refund en cours, pas encore confirmé bancairement)
 *   HelloAsso `Refunded`                          → `refunded`   (refund confirmé)
 *   Autres états transitoires (`Pending`, `Waiting*`, etc.) → log info + no-op
 */
export enum HelloAssoPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUSED = 'refused',
  REFUNDING = 'refunding',
  REFUNDED = 'refunded',
}

/**
 * QUI a écrit le `status` courant. Indispensable parce que `refused` agrège six
 * causes réellement différentes, dont deux — annulation par le coureur et
 * remplacement — ne produisent AUCUN événement HelloAsso et seraient donc
 * indiscernables sans ce marqueur.
 *
 * Volontairement stocké en `varchar` et non en enum PostgreSQL : ajouter une
 * valeur ne doit pas imposer une migration de type, et une valeur inconnue doit
 * retomber proprement sur le libellé « cause inconnue » plutôt que faire échouer
 * une lecture.
 */
export enum PaymentStatusSource {
  /** INSERT initial du checkout. */
  CHECKOUT_CREATED = 'checkout_created',
  /** Transition provoquée par un webhook HelloAsso. */
  HELLOASSO_WEBHOOK = 'helloasso_webhook',
  /** Le coureur a annulé lui-même depuis l'UI. */
  USER_CANCEL = 'user_cancel',
  /** Le même payeur a relancé un checkout : l'ancien pending libère le créneau. */
  SUPERSEDED = 'superseded',
  /** Re-synchronisation déclenchée par un ADMIN / ORGANISATEUR. */
  ADMIN_REFRESH = 'admin_refresh',
}

/**
 * Paiement HelloAsso d'une inscription. 1 ligne = 1 paiement = 1 licence engagée
 * sur une compétition. Pas de FK vers `race` : le lien implicite est
 * `(competition_id, licence_id)`. Quand la `race` est créée/importée plus tard
 * via CSV, on peut requêter "payments réussis pour cette competition+licence"
 * pour audit, sans coupler les deux tables.
 *
 * Anti-doublon : partial unique index `(competition_id, licence_id) WHERE
 * status IN ('pending', 'paid')` posé dans la migration — empêche d'engager
 * deux fois la même licence sur la même épreuve. Les statuts `refused`/
 * `refunded` autorisent une nouvelle tentative.
 */
@Entity('helloasso_payment')
export class HelloAssoPaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'competition_id', type: 'int' })
  @Index()
  competitionId: number;

  @Column({ name: 'licence_id', type: 'int' })
  @Index()
  licenceId: number;

  /**
   * User Firebase (Dossardeur) qui a initié le paiement. FK ON DELETE SET NULL :
   * la suppression du compte (RGPD) NULL-ifie cette colonne pour préserver
   * l'historique comptable. Les snapshots ci-dessous sont anonymisés en
   * parallèle par `AuthFirebaseService.deleteAccount`.
   */
  @Column({ name: 'payer_user_id', type: 'int', nullable: true })
  @Index()
  payerUserId: number | null;

  /**
   * Snapshot du `firebase_uid` au moment du paiement — audit indépendant
   * de la FK `payer_user_id` (résilient si la ligne users est purgée/migrée).
   * Nullable : un payeur ADMIN/ORGANISATEUR legacy peut ne pas avoir de
   * compte Firebase (email/password seulement). Renseigné dès que dispo.
   */
  @Column({ name: 'payer_firebase_uid', type: 'varchar', length: 128, nullable: true })
  payerFirebaseUid: string | null;

  /** Snapshot prénom payeur — pas d'email (règle métier). */
  @Column({ name: 'payer_first_name', type: 'varchar', length: 255, nullable: true })
  payerFirstName: string | null;

  @Column({ name: 'payer_last_name', type: 'varchar', length: 255, nullable: true })
  payerLastName: string | null;

  /**
   * ID retourné par `POST /v5/organizations/{slug}/checkout-intents`.
   * **Nullable au boot** : on INSERT la ligne payment AVANT l'appel HelloAsso
   * (pour avoir l'`openDossardPaymentId` dans la metadata) ; on UPDATE juste
   * après avec la valeur HelloAsso. Si l'API call échoue → on rollback en
   * supprimant la ligne. Si le process crash entre INSERT et UPDATE, la ligne
   * orpheline (intent_id=NULL) sera nettoyée par le cron pending>24h.
   */
  @Column({ name: 'helloasso_checkout_intent_id', type: 'varchar', length: 64, nullable: true })
  @Index({ unique: true })
  helloAssoCheckoutIntentId: string | null;

  /** ID de l'order HelloAsso — rempli au webhook quand le paiement aboutit. */
  @Column({ name: 'helloasso_order_id', type: 'varchar', length: 64, nullable: true })
  @Index({ unique: true })
  helloAssoOrderId: string | null;

  /**
   * ID du paiement HelloAsso — cache rempli au 1er webhook par paiement.
   * Permet le lookup direct sans appel HelloAsso sur les webhooks suivants
   * pour le même paiement (cf. design §2.6.F).
   */
  @Column({ name: 'helloasso_payment_id', type: 'varchar', length: 64, nullable: true })
  @Index({ unique: true })
  helloAssoPaymentId: string | null;

  @Column({
    type: 'enum',
    enum: HelloAssoPaymentStatus,
    enumName: 'helloasso_payment_status_enum',
    default: HelloAssoPaymentStatus.PENDING,
  })
  status: HelloAssoPaymentStatus;

  /**
   * Dernier `PaymentState` BRUT vu chez HelloAsso, y compris les états que le
   * mapping ignore (`Pending`, `WaitingAuthentication`, `Registered`…).
   *
   * C'est précisément l'écriture sur les états non mappés qui rend le support
   * possible : sans elle, un paiement figé en `pending` n'offre aucune trace de
   * ce que HelloAsso a répondu en dernier.
   */
  @Column({ name: 'helloasso_last_state', type: 'varchar', length: 32, nullable: true })
  helloAssoLastState: string | null;

  /** Quand HelloAsso a parlé pour la dernière fois — « figé depuis combien de temps ? ». */
  @Column({ name: 'helloasso_last_state_at', type: 'timestamp', nullable: true })
  helloAssoLastStateAt: Date | null;

  /** Voir `PaymentStatusSource`. `null` = ligne antérieure au suivi détaillé. */
  @Column({ name: 'status_source', type: 'varchar', length: 24, nullable: true })
  statusSource: PaymentStatusSource | null;

  /**
   * Snapshot du `PricingInfo.name` (= label affiché) au moment du paiement.
   * Le label sert à la fois de clé fonctionnelle (pour matcher côté admin)
   * et d'affichage utilisateur — on conserve donc une seule colonne plutôt
   * que de dupliquer entre `tarif_id` court et `tarif_label_snapshot` long.
   */
  @Column({ name: 'tarif_id', type: 'varchar', length: 255 })
  tarifId: string;

  /** Snapshot `PricingInfo.amountCents` — montant facturé HelloAsso. */
  @Column({ name: 'amount_cents', type: 'int' })
  amountCents: number;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
