import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
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
import { HelloAssoPaymentService } from './helloasso-payment.service';

/**
 * Endpoints paiement HelloAsso côté payeur (app Dossardeur).
 *
 *   POST /api-v2/helloasso/payments/checkout-intent   [JWT, ADMIN|ORGANISATEUR|MOBILE]
 *   GET  /api-v2/helloasso/payments/:id               [JWT, ADMIN|ORGANISATEUR|MOBILE, owner only]
 *
 * Owner = user dont l'`id` correspond à `payment.payer_user_id`. Vérification
 * faite dans le service. Pas de filtre rôle sur l'identité du payeur (un MOBILE
 * peut payer pour sa propre licence ; un ADMIN peut payer pour la sienne aussi).
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
  @ApiResponse({ status: 422, description: 'Paiement en ligne désactivé / club non lié / tarif mal configuré' })
  @ApiResponse({ status: 502, description: 'HelloAsso indisponible ou access_token rejeté' })
  createCheckoutIntent(
    @Body() dto: CreateCheckoutIntentDto,
    @CurrentUser('id') payerUserId: number,
  ): Promise<CheckoutIntentCreatedDto> {
    return this.payments.createCheckoutIntent({ dto, payerUserId });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'État d\'un paiement HelloAsso (owner only)',
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
