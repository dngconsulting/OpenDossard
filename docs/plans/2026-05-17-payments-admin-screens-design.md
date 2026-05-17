# Design — Écrans Paiements (admin / organisateur)

**Date** : 2026-05-17
**Branche** : `feature/hello-asso`
**Statut** : validé, prêt pour implémentation

## Contexte et objectif

Donner aux commissaires (rôles ADMIN, ORGANISATEUR) une visibilité sur les paiements HelloAsso :

- **Vue contextualisée** : un nouvel onglet "Paiements" dans l'écran des engagements d'une compétition, listant les transactions de cette compétition.
- **Vue globale** : un nouvel écran "Historique des paiements" accessible via le drawer (item "Paiements" sous "Statistiques"), listant toutes les transactions tous clubs/compétitions confondus, **réservé ADMIN**.

Les deux vues partagent un même composant React (`PaymentsTable`), paramétré par un scope (`'all'` vs `'competition'`).

## Contraintes de sécurité

- `Role.MOBILE` ne doit JAMAIS accéder à ces nouveaux endpoints. L'écran "Mes paiements" mobile existant reste sur l'endpoint `GET /helloasso/payments` (scope = me).
- `Role.ORGANISATEUR` : accès à la vue "par compétition" sur n'importe quelle compétition (scope large validé — pas de filtrage par club administré, simplification métier).
- `Role.ADMIN` : accès aux deux vues.

## Architecture backend

### Refacto

Le service existant `helloasso-payment.service.ts` fait 428 lignes — objectif < 350. Extraction des helpers purs dans un nouveau fichier :

- **Nouveau** : `services/api-v2/src/helloasso/helloasso-payment.mapper.ts`
  - `toPaymentDto(payment)` — déplacé
  - `toPaymentListDto(payment)` — déplacé
  - `parseTarifAmount(tarif)` — déplacé (export conservé pour les tests)
  - `truncate(s, max)` — déplacé
  - `appendPaymentId(url, id)` — déplacé

Le service `helloasso-payment.service.ts` reste responsable du flow payeur (`createCheckoutIntent`, `cancelByOwner`, `findByIdForOwner`, `listForOwner`).

### Nouveau service admin

**Fichier** : `services/api-v2/src/helloasso/helloasso-payments-admin.service.ts`

Responsabilité : lectures admin/orga des paiements (toutes scopes confondues, hors scope payeur).

```ts
@Injectable()
export class HelloAssoPaymentsAdminService {
  constructor(
    @InjectRepository(HelloAssoPaymentEntity)
    private readonly paymentRepo: Repository<HelloAssoPaymentEntity>,
  ) {}

  async list(
    filters: ListPaymentsAdminFilters,
  ): Promise<PaginatedResponse<PaymentAdminRowDto>>;
}

interface ListPaymentsAdminFilters {
  competitionId?: number;       // si présent → WHERE payment.competition_id = X
  offset?: number;              // default 0
  limit?: number;               // default 20, max 100
  orderBy?: string;             // whitelist : voir ci-dessous
  orderDirection?: 'ASC' | 'DESC';
  search?: string;              // search global sur n° licence + payer last name (optionnel)
  // Filtres par colonne (chaîne libre, ILIKE %X%)
  riderNumber?: string;
  licenceName?: string;         // last name licencié
  licenceFirstName?: string;
  club?: string;
  gender?: string;              // multi-select ('H,F')
  dept?: string;                // multi-select
  birthYear?: string;
  catea?: string;
  catev?: string;
  fede?: string;
  payerName?: string;           // user.first_name OR user.last_name ILIKE %X%
  checkoutIntentId?: string;
  orderId?: string;
  paymentId?: string;           // helloasso_payment_id
  status?: HelloAssoPaymentStatus;
  tarifId?: string;
  amount?: string;              // montant euros, recherche libre
  competitionName?: string;     // scope=all uniquement
  competitionDate?: string;     // scope=all uniquement
}
```

**Query SQL** (QueryBuilder TypeORM) :

```sql
SELECT ... FROM helloasso_payment p
LEFT JOIN competition c   ON c.id = p.competition_id
LEFT JOIN licence l       ON l.id = p.licence_id
LEFT JOIN "user" u        ON u.id = p.payer_user_id
LEFT JOIN race r          ON r.competition_id = p.competition_id
                          AND r.licence_id = p.licence_id
WHERE [filters dynamiques]
ORDER BY <orderBy whitelisted>
       , p.paid_at DESC NULLS LAST  -- tie-breaker stable
       , p.created_at DESC
OFFSET <offset> LIMIT <limit>
```

**Tri par défaut** (les deux scopes) : `paid_at DESC NULLS LAST, created_at DESC`. Les paiements payés récents en haut, puis les pending/refused récents.

**Whitelist orderBy** (anti-SQL-injection) : `riderNumber`, `licenceName`, `licenceFirstName`, `club`, `gender`, `dept`, `birthYear`, `catea`, `catev`, `fede`, `payerName`, `status`, `tarifId`, `amount`, `createdAt`, `paidAt`, `competitionName`, `competitionDate`. Tout `orderBy` hors whitelist → fallback `paidAt`.

**Note race JOIN** : il peut y avoir 0 ou 1 race correspondante (un payment, une licence sur une compétition). Si 0 → riderNumber/raceCode = `null` (affichés `-` côté UI).

### Nouveaux DTOs

**Fichier** : `services/api-v2/src/helloasso/dto/payment-admin-row.dto.ts`

```ts
export class PaymentAdminRowDto {
  id: number;
  status: HelloAssoPaymentStatus;
  competitionId: number;
  competitionName: string | null;
  competitionDate: string | null;          // ISO 8601
  licenceId: number;
  licenceName: string | null;              // last name
  licenceFirstName: string | null;
  club: string | null;
  gender: string | null;
  dept: string | null;
  birthYear: string | null;
  catea: string | null;
  catev: string | null;
  fede: string | null;
  riderNumber: number | null;              // race.rider_number (peut être null)
  raceCode: string | null;                 // race.race_code
  payerUserId: number | null;
  payerFirstName: string | null;
  payerLastName: string | null;
  checkoutIntentId: string | null;
  orderId: string | null;                  // helloasso_order_id
  paymentId: string | null;                // helloasso_payment_id
  tarifId: string;
  amount: number;                          // euros (amount_cents / 100)
  createdAt: string;                       // ISO
  paidAt: string | null;                   // ISO
}
```

**Fichier** : `services/api-v2/src/helloasso/dto/list-payments-admin-query.dto.ts`

Class-validator sur tous les champs : `IsOptional`, `IsInt` (offset/limit/competitionId), `IsEnum(HelloAssoPaymentStatus)`, `IsString` sinon. `limit` borné à `Max(100)`.

### Controller — nouveaux endpoints

**Fichier modifié** : `services/api-v2/src/helloasso/helloasso-payment.controller.ts`

```ts
@Get('admin/all')
@Roles(Role.ADMIN)                          // override le @Roles class-level
@ApiOperation({ summary: 'Tous les paiements (ADMIN)' })
listAll(@Query() query: ListPaymentsAdminQueryDto) {
  return this.adminService.list({ ...query });
}

@Get('admin/competition/:competitionId')
@Roles(Role.ADMIN, Role.ORGANISATEUR)       // override : exclut MOBILE
@ApiOperation({ summary: 'Paiements d\'une compétition (ADMIN | ORGANISATEUR)' })
listByCompetition(
  @Param('competitionId', ParseIntPipe) competitionId: number,
  @Query() query: ListPaymentsAdminQueryDto,
) {
  return this.adminService.list({ ...query, competitionId });
}
```

**Important** : le `@Roles()` de classe inclut MOBILE. Les `@Roles()` de méthode l'overrident (comportement du `RolesGuard` OpenDossard). Vérifier ce comportement avant : si l'override n'est pas implémenté tel quel, faire un controller séparé ou retirer MOBILE du class-level (mais ça casserait les endpoints existants). Vérifier dans `roles.guard.ts` à l'étape 1.

### Module

**Fichier modifié** : `services/api-v2/src/helloasso/helloasso.module.ts` — déclarer `HelloAssoPaymentsAdminService` dans `providers`.

## Architecture frontend

### Composant réutilisable PaymentsTable

**Fichier** : `services/webapp-v2/src/components/data/PaymentsTable.tsx`

Pattern : copie du squelette `LicencesTable.tsx` adaptée. Lazy backend via `DataTable` + `@tanstack/react-table`.

```ts
type PaymentsTableProps = {
  scope: { kind: 'all' } | { kind: 'competition'; competitionId: number };
};
```

### Hook usePayments

**Fichier** : `services/webapp-v2/src/hooks/usePayments.ts`

Clone allégé de `useLicences` :
- queryKey paramétrée par scope
- URL backend : `/helloasso/payments/admin/all` ou `/helloasso/payments/admin/competition/{id}`
- searchParams URL pour offset/limit/orderBy/orderDirection/filters (persistance refresh)
- defaults : `orderBy` non défini → backend applique le tri default

### Colonnes

Ordre d'affichage (de gauche à droite) :

| # | Colonne | Source DTO | Filter | Sort |
|---|---|---|---|---|
| 1 | Compétition | `competitionName` | ✓ | ✓ | (scope=all uniquement) |
| 2 | Date compét. | `competitionDate` (fr-FR) | ✓ | ✓ | (scope=all uniquement) |
| 3 | Dossard | `riderNumber` | ✓ | ✓ |
| 4 | Coureur | `licenceFirstName + licenceName` | ✓ (sur name) | ✓ |
| 5 | Club | `club` | ✓ | ✓ |
| 6 | H/F | `gender` (Badge) | ✓ multi | ✓ |
| 7 | Dept | `dept` | ✓ multi | ✓ |
| 8 | Année | `birthYear` | ✓ | ✓ |
| 9 | Caté.A | `catea` | ✓ | ✓ |
| 10 | Caté.V | `catev` | ✓ | ✓ |
| 11 | Fédé | `fede` (Badge) | ✓ | ✓ |
| 12 | Payeur | `payerFirstName + payerLastName` | ✓ | ✓ |
| 13 | N° demande | `checkoutIntentId` | ✓ | — |
| 14 | N° commande | `orderId` | ✓ | — |
| 15 | N° transaction | `paymentId` | ✓ | — |
| 16 | Statut | `status` (Badge coloré) | ✓ select | ✓ |
| 17 | Tarif | `tarifId` | ✓ | ✓ |
| 18 | Montant | `amount` (`NN,DD €`) | ✓ | ✓ |
| 19 | Date création | `createdAt` (fr-FR `dd/MM/yyyy HH:mm`) | — | ✓ |
| 20 | Date paiement | `paidAt` (fr-FR, `-` si null) | — | ✓ |

**Badges statut** : `pending` → gris, `paid` → vert, `refused` → rouge, `refunded` → bleu.

**Format montant** : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.

**`payerUserId === null`** (compte RGPD-supprimé) : afficher "—" pour le payeur.

### Page Historique des paiements

**Fichier** : `services/webapp-v2/src/pages/payment/PaymentsHistoryPage.tsx`

Pattern identique à `UsersPage` :

```tsx
export default function PaymentsHistoryPage() {
  return (
    <Layout title="Historique des paiements" toolbarLeft={<TotalCount />}>
      <PaymentsTable scope={{ kind: 'all' }} />
    </Layout>
  );
}
```

`TotalCount` lit `data?.meta?.total` via `usePayments({ kind: 'all' })`. Cible : composant page ≤ 80 lignes.

**Route** : ajoutée dans le router à `/payments` avec guard ADMIN (cohérent avec drawer).

### Drawer item

**Fichier modifié** : `services/webapp-v2/src/statics/app-data.ts`

Ajout après l'item "Statistiques" :

```ts
{
  name: 'Paiements',
  url: '/payments',
  icon: CreditCard,           // lucide-react
  requiredRoles: ['ADMIN'],
},
```

Le filtrage est déjà géré par `NavPages` via `user.roles`.

### Tab Paiements dans EngagementsPage

**Fichier modifié** : `services/webapp-v2/src/pages/engagement/EngagementsPage.tsx`

Sentinel `PAYMENTS_TAB_VALUE = '__payments__'` (préfixe `__` évite collision avec un raceCode utilisateur).

Modifications :
1. Après `races.map(...)`, ajout d'un `<RaceTabsTrigger value={PAYMENTS_TAB_VALUE}>` avec `<HelloAssoTabIcon />` (image PNG).
2. Sync hash : `'#payments'` ↔ `currentRaceCode = PAYMENTS_TAB_VALUE`.
3. Render conditionnel : si `currentRaceCode === PAYMENTS_TAB_VALUE`, render `<PaymentsTable scope={{ kind: 'competition', competitionId }} />` à la place d'`<EngagementsTable>`, et masquer `<EngagementForm>`.
4. Toolbar conditionnelle sur le tab paiements : masquer Réorganiser / Import / Export / Classements. Conserver Retour + RaceInfo.

### Asset logo

Copier `DossardeurV2/assets/images/helloasso-logo.png` → `services/webapp-v2/src/assets/helloasso-logo.png`.

Composant minimal `HelloAssoTabIcon` :

```tsx
import helloAssoLogo from '@/assets/helloasso-logo.png';

export function HelloAssoTabIcon() {
  return <img src={helloAssoLogo} alt="HelloAsso" className="h-5 w-auto" />;
}
```

Placé soit inline dans `EngagementsPage` soit dans `components/common/`.

## Tests

### Backend

- **`helloasso-payments-admin.service.spec.ts`** (nouveau) :
  - default sort `paidAt DESC NULLS LAST, createdAt DESC`
  - orderBy whitelist : valeur invalide → fallback default
  - filter `competitionId` → WHERE appliqué
  - chaque filtre colonne → ILIKE appliqué
  - JOIN licence/race/user — mapping vers DTO correct
  - pagination offset/limit + total count
- **`helloasso-payment.service.spec.ts`** (existant) : doit passer sans modif après extraction mapper.

### Frontend

Pas de test E2E demandé. Validation :
- `npm run build` + lint webapp-v2 verts
- Test manuel : login ADMIN → /payments OK, login ORGA → /payments redirige, login MOBILE → 403 sur l'API si appel direct.
- Test manuel : onglet Paiements dans une compétition avec / sans transactions.

## Plan d'exécution

| Étape | Description | Commit |
|---|---|---|
| 1 | Extraction `helloasso-payment.mapper.ts` + maj imports | 1 commit |
| 2 | Nouveau service admin + DTOs + spec | 1 commit |
| 3 | Endpoints controller + module wiring | regroupé avec étape 2 |
| 4 | Frontend : `usePayments` hook + types + API client | 1 commit |
| 5 | Frontend : `PaymentsTable` composant | 1 commit |
| 6 | Frontend : `PaymentsHistoryPage` + route + drawer item + asset logo | 1 commit |
| 7 | Frontend : intégration tab dans `EngagementsPage` | 1 commit |
| 8 | Build + lint + test manuel | aucun commit |

Chaque commit nécessite GO explicite de l'utilisateur (règle renforcée 2026-04-26 sur OpenDossard).

## Points de vigilance

- **Whitelist orderBy obligatoire** côté backend (SQL injection).
- **`@Roles()` override** : vérifier que `RolesGuard` honore les `@Roles()` au niveau méthode (override class-level). Si non, restructurer en 2 controllers.
- **Tri par défaut + NULLS LAST** : `paid_at DESC NULLS LAST, created_at DESC`. Tester sur des données mixtes (paid + pending).
- **payerUserId null** (RGPD) : affichage UI "—".
- **Index DB** : pas de nouvel index ajouté maintenant (YAGNI). À ajouter si > ~10k paiements.
- **MOBILE jamais sur admin endpoints** : ajouter assertion 403 dans une spec controller si possible.

## YAGNI explicites — non couvert

- Pas d'export CSV/PDF des paiements (peut être ajouté plus tard).
- Pas d'action ligne (refund, cancel manuel, voir détail) — vue lecture seule.
- Pas de graphique / agrégat / dashboard de stats.
- Pas de filtre par plage de date sur paidAt/createdAt — recherche par texte uniquement (filter colonne).
- Pas de tri secondaire user-customisable — seul le default est composé.
