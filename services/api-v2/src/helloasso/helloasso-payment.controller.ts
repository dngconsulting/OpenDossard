import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums';
import { CheckoutIntentCreatedDto } from './dto/checkout-intent-created.dto';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { HelloAssoPaymentDto } from './dto/helloasso-payment.dto';
import { ListPaymentsAdminQueryDto } from './dto/list-payments-admin-query.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentAdminRowDto } from './dto/payment-admin-row.dto';
import { RefreshPaymentStatusDto } from './dto/refresh-payment-status.dto';
import { HelloAssoPaymentService } from './helloasso-payment.service';
import {
  HelloAssoPaymentsAdminService,
  PaymentsAdminListResponse,
} from './helloasso-payments-admin.service';

/**
 * Endpoints paiement HelloAsso côté payeur (app Dossardeur).
 *
 *   POST /api-v2/helloasso/payments/checkout-intent          [JWT, ADMIN|ORGANISATEUR|MOBILE]
 *   GET  /api-v2/helloasso/payments?competitionId=&status=   [JWT, ADMIN|ORGANISATEUR|MOBILE, scope=me]
 *   GET  /api-v2/helloasso/payments/:id                      [JWT, ADMIN|ORGANISATEUR|MOBILE, owner only]
 *
 * **Broken Access Control safeguard** : sur les 3 endpoints, l'identité du
 * payeur est lue depuis `@CurrentUser('id')` (issu du JWT validé) et JAMAIS
 * depuis une query string, header ou body. Aucun query param `userId` n'est
 * exposé (cf. `ListPaymentsQueryDto`). Un user ne peut donc voir / engager
 * que ses propres paiements.
 */
@ApiTags('helloasso-payments')
@Controller('helloasso/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
@ApiBearerAuth()
export class HelloAssoPaymentController {
  constructor(
    private readonly payments: HelloAssoPaymentService,
    private readonly adminPayments: HelloAssoPaymentsAdminService,
  ) {}

  /**
   * **MOBILE INTERDIT** : le `@Roles()` ci-dessous override le `@Roles()` de
   * classe (qui inclut MOBILE). Vérifié dans `RolesGuard.canActivate` via
   * `getAllAndOverride([handler, class])` — la valeur du handler prime.
   * Ne JAMAIS ajouter MOBILE ici : l'écran "Mes paiements" mobile passe par
   * `GET /helloasso/payments` (scope=me).
   */
  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Lister tous les paiements (ADMIN)',
    description: `Endpoint admin global : retourne tous les paiements (toutes
compétitions, tous clubs) avec pagination/tri/filtre serveur. Tri par défaut :
\`paid_at DESC NULLS LAST, created_at DESC\`. Whitelist orderBy stricte côté
service (anti-SQL injection). MOBILE explicitement exclu via override @Roles().`,
  })
  @ApiResponse({ status: 200, type: PaymentAdminRowDto, isArray: true })
  listAllAdmin(@Query() query: ListPaymentsAdminQueryDto): Promise<PaymentsAdminListResponse> {
    return this.adminPayments.list({ ...query });
  }

  /**
   * **MOBILE INTERDIT** : action admin uniquement. ORGANISATEUR autorisé pour
   * pouvoir débloquer un pending sur une compet d'un club dont il est lié
   * (cf. `assertCompetitionAccessById`).
   */
  @Post('admin/:id/refresh-status')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.ORGANISATEUR)
  @ApiOperation({
    summary: 'Re-synchroniser le statut HelloAsso (ADMIN | ORGANISATEUR)',
    description: `Interroge HelloAsso (\`GET /v5/organizations/{slug}/checkout-intents/{id}\`)
pour rapatrier l'état réel d'un paiement bloqué en \`pending\`. Typiquement
utilisé quand l'utilisateur a abandonné la mire sans déclencher d'event
webhook (\`Canceled\`/\`Abandoned\` jamais envoyé).

Si HelloAsso renvoie un \`payment\` dans un état terminal (Authorized, Refused,
Abandoned, Canceled, Refunded), applique la transition via le même UPDATE
guarded que le webhook (idempotent, race-safe).

Si HelloAsso ne renvoie aucun payment ou un état transitoire → no-op
(\`outcome: still_pending\`). Si le payment local n'est plus \`pending\` → no-op
(\`outcome: no_change\`).`,
  })
  @ApiResponse({ status: 200, type: RefreshPaymentStatusDto })
  @ApiResponse({ status: 404, description: 'Paiement introuvable côté local ou HelloAsso' })
  @ApiResponse({ status: 422, description: 'Payment sans intentId / club non lié HelloAsso' })
  @ApiResponse({ status: 502, description: 'HelloAsso indisponible ou access_token rejeté' })
  refreshStatus(@Param('id', ParseIntPipe) id: number): Promise<RefreshPaymentStatusDto> {
    // Pas de scope club ici : la philosophie OpenDossard est que les
    // organisateurs s'entraident sur les engagements/paiements même hors de
    // leur propre club (cohérent avec l'absence de scope sur les engagements
    // et licences). Toute action est tracée via les logs serveur.
    return this.payments.refreshStatusFromHelloAsso(id);
  }

  @Get('admin/competition/:competitionId')
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: "Lister les paiements d'une compétition (ADMIN | ORGANISATEUR | MOBILE)",
    description: `Endpoint scopé compétition pour l'onglet "Paiements" sur l'écran
des engagements. Accessible à tout ORGANISATEUR sans restriction par club —
les organisateurs se dépannent entre eux sur les engagements, et les paiements
en font partie. La vue globale \`/admin/all\` reste ADMIN-only.

MOBILE est autorisé (décision produit) pour alimenter l'onglet "Inscrits" de
l'écran classement de l'app Dossardeur : la liste des engagés d'une épreuve y
est affichée comme une start-list. ⚠️ Contrairement aux autres endpoints MOBILE
(scope=me), celui-ci renvoie le \`PaymentAdminRowDto\` complet — incluant
l'identité du payeur et les identifiants de transaction HelloAsso — à tout
utilisateur mobile authentifié. Trade-off de confidentialité assumé.`,
  })
  @ApiResponse({ status: 200, type: PaymentAdminRowDto, isArray: true })
  listByCompetitionAdmin(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Query() query: ListPaymentsAdminQueryDto,
  ): Promise<PaymentsAdminListResponse> {
    return this.adminPayments.list({ ...query, competitionId });
  }

  @Post('checkout-intent')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Créer une intention de paiement HelloAsso',
    description: `Valide la compétition (online_registration_enabled), le tarif, la licence,
le club lié HelloAsso ; insère une ligne \`helloasso_payment\` en \`pending\` ;
appelle HelloAsso \`POST /v5/organizations/{slug}/checkout-intents\` ; renvoie
le \`paymentId\` OpenDossard + l'\`redirectUrl\` HelloAsso à ouvrir côté app.`,
  })
  @ApiResponse({ status: 201, type: CheckoutIntentCreatedDto })
  @ApiResponse({ status: 404, description: 'Compétition, tarif ou licence introuvable' })
  @ApiResponse({ status: 409, description: 'Licence déjà engagée sur cette épreuve' })
  @ApiResponse({
    status: 422,
    description: 'Paiement en ligne désactivé / club non lié / tarif mal configuré',
  })
  @ApiResponse({ status: 502, description: 'HelloAsso indisponible ou access_token rejeté' })
  createCheckoutIntent(
    @Body() dto: CreateCheckoutIntentDto,
    @CurrentUser('id') payerUserId: number,
  ): Promise<CheckoutIntentCreatedDto> {
    return this.payments.createCheckoutIntent({ dto, payerUserId });
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORGANISATEUR, Role.MOBILE)
  @ApiOperation({
    summary: 'Lister les paiements du user courant (filtres optionnels)',
    description: `Retourne les paiements du user appelant, ordonnés par \`createdAt\`
décroissant. Filtres optionnels :
- \`competitionId\` : limite à une compétition (cas badge "déjà inscrit" sur l'écran épreuve)
- \`status\` : limite à un statut (\`pending\`/\`paid\`/\`refused\`/\`refunded\`)
- sans filtre : tous les paiements de toutes les compétitions (écran "Mes paiements")

Les champs \`competitionName\` / \`competitionDate\` / \`competitionFede\` sont
populés ici via LEFT JOIN (évite N+1 côté mobile). Pour le polling
\`GET /:id\`, ces champs sont omis.

**Scope strict** : \`payerUserId = currentUser.id\` (JWT). Pas d'option pour
interroger les paiements d'autres users — même pour ADMIN. Si un endpoint
admin global s'avère nécessaire, faire un endpoint dédié avec son propre
guard, pas un override sur celui-ci.`,
  })
  @ApiResponse({ status: 200, type: HelloAssoPaymentDto, isArray: true })
  listMyPayments(
    @Query() query: ListPaymentsQueryDto,
    @CurrentUser('id') payerUserId: number,
  ): Promise<HelloAssoPaymentDto[]> {
    return this.payments.listForOwner(payerUserId, {
      competitionId: query.competitionId,
      status: query.status,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: "État d'un paiement HelloAsso (owner only)",
    description: `Retourne le statut du paiement et la date paidAt si confirmé.
Utilisé par le polling app après retour deep link HelloAsso.`,
  })
  @ApiResponse({ status: 200, type: HelloAssoPaymentDto })
  @ApiResponse({ status: 403, description: 'Pas le payeur de ce paiement' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable' })
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') payerUserId: number,
  ): Promise<HelloAssoPaymentDto> {
    return this.payments.findByIdForOwner(id, payerUserId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Annuler un paiement pending (owner only)',
    description: `Appelé par l'app au retour du deep link \`payment/cancelled\` pour
libérer immédiatement le slot (competition, licence) dans l'index partial unique
sans attendre le webhook HelloAsso \`Canceled\` (latence variable, parfois jamais
si l'user a fermé le webview brutalement).

Comportement :
- \`status=pending\` → \`refused\` (UPDATE atomique guarded)
- \`status=paid|refused|refunded\` → no-op idempotent, renvoie l'état actuel
- Un webhook \`Canceled\` arrivant après ce cancel est lui-même no-op (même guard)
- 403 si l'appelant n'est pas le payeur du paiement`,
  })
  @ApiResponse({ status: 200, type: HelloAssoPaymentDto })
  @ApiResponse({ status: 403, description: 'Pas le payeur de ce paiement' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') payerUserId: number,
  ): Promise<HelloAssoPaymentDto> {
    return this.payments.cancelByOwner(id, payerUserId);
  }
}
