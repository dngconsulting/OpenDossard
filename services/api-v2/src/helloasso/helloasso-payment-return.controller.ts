import { Controller, Get, Req, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { HelloAssoPaymentReturnService } from './helloasso-payment-return.service';

const APP_SCHEME = 'dossardeur://';

type ReturnVariant = 'success' | 'error' | 'cancelled';

/**
 * Retours HelloAsso post-paiement (`returnUrl` / `errorUrl` / `backUrl` du
 * checkout-intent). Hors du préfixe `/api` (cf. `main.ts`).
 *
 * Qui appelle : le NAVIGATEUR du coureur, redirigé par HelloAsso en fin de
 * tunnel — pas HelloAsso lui-même (ça, c'est le webhook). Appel public, non
 * signé, non garanti (onglet fermé, réseau coupé).
 *
 * Comportement :
 * - iOS app installée + AASA en cache → Universal Link intercepté avant que
 *   cette route soit atteinte (associatedDomains + AASA /payment/*) → app
 *   ouverte directement.
 * - Sinon → 302 vers `dossardeur://payment/...?<query>` : le navigateur
 *   reçoit le redirect et ouvre le scheme custom (intercepté par l'OS) sans
 *   afficher la moindre page. Edge case "app non installée" : l'OS affiche
 *   une erreur browser (assumé acceptable, le user vient de l'app).
 *
 * Les query params reçus de HelloAsso (checkoutIntentId, code, orderId…)
 * sont propagés tels quels au deep link pour que `PaymentReturnRedirect`
 * côté app puisse les exploiter si besoin.
 */
@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class HelloAssoPaymentReturnController {
  constructor(private readonly paymentReturn: HelloAssoPaymentReturnService) {}

  /**
   * Redirection d'abord : le retour vers l'app ne dépend jamais de HelloAsso.
   * Puis confirmation SANS `await` (un seul GET checkout-intent) pour passer la
   * ligne en `paid` avant que l'app ou une relance ne puisse l'annuler.
   */
  @Get('payment/success')
  paymentSuccess(@Req() req: Request, @Res() res: Response) {
    redirectToDeepLink(req, res, 'success');
    void this.paymentReturn.confirmFromReturnUrl(req.query.paymentId, req.query.checkoutIntentId);
  }

  @Get('payment/error')
  paymentError(@Req() req: Request, @Res() res: Response) {
    redirectToDeepLink(req, res, 'error');
  }

  @Get('payment/cancelled')
  paymentCancelled(@Req() req: Request, @Res() res: Response) {
    redirectToDeepLink(req, res, 'cancelled');
  }
}

function redirectToDeepLink(req: Request, res: Response, variant: ReturnVariant): void {
  const queryIdx = req.originalUrl.indexOf('?');
  const queryString = queryIdx >= 0 ? req.originalUrl.substring(queryIdx) : '';
  res.redirect(302, `${APP_SCHEME}payment/${variant}${queryString}`);
}
