/**
 * Forme du `user` injecté dans `request.user` après passage par `JwtAuthGuard`.
 * Correspond au retour de `JwtStrategy.validate()` (cf. `strategies/jwt.strategy.ts`).
 *
 * Ne PAS ajouter de champs ici sans toucher aussi le payload du JWT (`auth.service.ts`)
 * et `JwtStrategy.validate()`.
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: string[];
}
