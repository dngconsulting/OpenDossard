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
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { HelloAssoPaymentService } from './helloasso-payment.service';

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
  constructor(private readonly payments: HelloAssoPaymentService) {}

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
}
