import { apiClient } from './client';

export interface PreparedAuthorizationDto {
  authorizeUrl: string;
  state: string;
}

export type HelloAssoLinkStatusDto =
  | { linked: false }
  | {
      linked: true;
      slug: string;
      linkedAt: string;
      refreshTokenExpiresAt: string;
      expired: boolean;
    };

export const helloAssoApi = {
  /**
   * Initie le flux OAuth HelloAsso pour le user courant. Le backend génère
   * un state lié à l'identité du JWT et renvoie l'URL de la mire à ouvrir.
   *
   * `originClubId` (optionnel) : mémorise la fiche club depuis laquelle la
   * mire est ouverte. En cas d'erreur du callback, le backend renverra le
   * navigateur sur `/club/{originClubId}` plutôt que sur la liste des clubs.
   */
  authorize: (originClubId?: number): Promise<PreparedAuthorizationDto> =>
    apiClient<PreparedAuthorizationDto>('/helloasso/oauth/authorize', {
      method: 'POST',
      body: JSON.stringify(originClubId !== undefined ? { originClubId } : {}),
      headers: { 'Content-Type': 'application/json' },
    }),

  /**
   * Statut local de la liaison pour un club (lecture DB pure, pas d'appel HelloAsso).
   */
  getStatus: (clubId: number): Promise<HelloAssoLinkStatusDto> =>
    apiClient<HelloAssoLinkStatusDto>(`/helloasso/clubs/${clubId}/status`),

  /**
   * Délie un club de HelloAsso (supprime la ligne `helloasso_details`).
   * Action réversible via la mire (re-link).
   */
  unlink: (clubId: number): Promise<void> =>
    apiClient<void>(`/helloasso/clubs/${clubId}`, {
      method: 'DELETE',
    }),
};
