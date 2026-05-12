export interface PricingInfo {
  /**
   * Libellé du tarif — sert aussi de clé de lookup quand on engage un paiement
   * en ligne. Doit être unique dans `competition.pricing[]` quand
   * `competition.online_registration_enabled = true`.
   */
  name: string;
  /**
   * Valeur du tarif :
   *   - **paiement en ligne OFF** : string libre d'affichage (ex: "8 €", "10€ sur place")
   *   - **paiement en ligne ON** : MUST parser en `number` positif (en euros, décimales OK).
   *     Soit déjà un `number`, soit une string numérique ("8", "8.5", "8,50").
   * Le backend convertit en cents (`Math.round(amount * 100)`) au moment du
   * checkout HelloAsso. Le toggle ON côté UI nettoie les valeurs non-numériques.
   */
  tarif: string | number;
}
