import { ApiProperty } from '@nestjs/swagger';

/**
 * Réponse de `GET /clubs/me/accessible` : décrit le scope de clubs sur lesquels
 * l'utilisateur courant peut éditer/supprimer (création autorisée pour tout
 * ORGA, avec auto-liaison du créateur).
 *
 * - `scope: 'ALL'` → ADMIN, accès non scopé.
 * - `scope: 'SCOPED'` → ORGANISATEUR (ou autre rôle non-ADMIN) ; `clubIds`
 *   liste exhaustive des clubs liés (peut être vide).
 *
 * Discriminé par `scope` pour que le front fasse `if (data.scope === 'ALL')`
 * sans relire `clubIds` côté ADMIN.
 */
export class AccessibleClubsScopeDto {
  @ApiProperty({ enum: ['ALL', 'SCOPED'] })
  scope: 'ALL' | 'SCOPED';

  @ApiProperty({
    type: [Number],
    required: false,
    description: 'Présent uniquement si scope=SCOPED',
  })
  clubIds?: number[];
}
