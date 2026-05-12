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
   */
  authorize: (): Promise<PreparedAuthorizationDto> =>
    apiClient<PreparedAuthorizationDto>('/helloasso/oauth/authorize', {
      method: 'POST',
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
