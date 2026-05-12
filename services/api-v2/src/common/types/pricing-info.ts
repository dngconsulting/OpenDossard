export interface PricingInfo {
  name: string;
  tarif: string;
  /**
   * Identifiant stable du tarif — REQUIS dès que la compétition active le
   * paiement en ligne (`competition.online_registration_enabled = true`).
   * Sert de clé snapshot dans la table `helloasso_payment.tarif_id` et dans
   * la metadata HelloAsso. Slug `[a-z0-9-]+`. Une fois utilisé dans un
   * paiement, devient read-only côté UI (rename = bris de cohérence).
   */
  id?: string;
  /**
   * Montant en centimes (entier ≥ 50) — REQUIS si paiement en ligne activé.
   * Source de vérité pour le `totalAmount` HelloAsso. Le champ `tarif`
   * (string libre) reste pour l'affichage (ex: "10€ (12€ sur place)").
   */
  amountCents?: number;
}
