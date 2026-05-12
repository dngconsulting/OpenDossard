import { BadGatewayException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { HelloAssoConfig } from './helloasso.config';

/**
 * Client HTTP pour les endpoints HelloAsso v5 authentifiés par access_token
 * (hors OAuth — l'échange/refresh de tokens reste dans `HelloAssoOAuthService`).
 *
 * Lot 3 : checkout-intent. Lot 4+ : GET /payments/{id} et GET /checkout-intents/{id}
 * pour la réconciliation webhook.
 */
@Injectable()
export class HelloAssoApiClient {
  private readonly logger = new Logger(HelloAssoApiClient.name);

  constructor(private readonly config: HelloAssoConfig) {}

  async createCheckoutIntent(input: {
    organizationSlug: string;
    accessToken: string;
    body: CheckoutIntentRequestBody;
  }): Promise<CheckoutIntentResponse> {
    const url = `${this.config.apiBaseUrl}/v5/organizations/${encodeURIComponent(input.organizationSlug)}/checkout-intents`;
    const data = await this.postJson<CheckoutIntentResponse>(url, input.accessToken, input.body);
    return data;
  }

  /**
   * Récupère un paiement HelloAsso par son ID. Requis au webhook pour mapper
   * `data.id` (paymentId HelloAsso) → `order.checkoutIntentId` (clé locale).
   * À appeler avec un access_token partenaire (clientCredentials).
   */
  async getPayment(input: {
    helloAssoPaymentId: number;
    accessToken: string;
  }): Promise<HelloAssoPaymentDetailResponse> {
    const url = `${this.config.apiBaseUrl}/v5/payments/${input.helloAssoPaymentId}`;
    return this.getJson<HelloAssoPaymentDetailResponse>(url, input.accessToken);
  }

  private async getJson<T>(url: string, accessToken: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      this.logger.error(
        `getJson: network error to ${url}`,
        e instanceof Error ? e.stack : String(e),
      );
      throw new BadGatewayException('HelloAsso API unreachable');
    }
    if (!response.ok) {
      const bodyText = await safeReadText(response);
      this.logger.warn(
        `getJson: HelloAsso ${response.status} ${response.statusText} url=${url} body=${truncate(bodyText, 500)}`,
      );
      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('HelloAsso rejected access token');
      }
      if (response.status >= 400 && response.status < 500) {
        throw new BadGatewayException(`HelloAsso rejected request (${response.status})`);
      }
      throw new BadGatewayException('HelloAsso API failed');
    }
    return (await response.json()) as T;
  }

  private async postJson<T>(url: string, accessToken: string, body: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      this.logger.error(
        `postJson: network error to ${url}`,
        e instanceof Error ? e.stack : String(e),
      );
      throw new BadGatewayException('HelloAsso API unreachable');
    }

    if (!response.ok) {
      const bodyText = await safeReadText(response);
      this.logger.warn(
        `postJson: HelloAsso ${response.status} ${response.statusText} url=${url} body=${truncate(bodyText, 500)}`,
      );
      // 401/403 = access_token KO (expiré / révoqué / privilège manquant)
      // 400 = body invalide
      // 5xx = panne HelloAsso
      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('HelloAsso rejected access token');
      }
      if (response.status >= 400 && response.status < 500) {
        throw new BadGatewayException(`HelloAsso rejected request (${response.status})`);
      }
      throw new BadGatewayException('HelloAsso API failed');
    }

    return (await response.json()) as T;
  }
}

export interface CheckoutIntentRequestBody {
  totalAmount: number;
  initialAmount: number;
  itemName: string;
  backUrl: string;
  errorUrl: string;
  returnUrl: string;
  containsDonation: boolean;
  payer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CheckoutIntentResponse {
  id: number;
  redirectUrl: string;
}

/**
 * Sous-ensemble de la réponse `GET /v5/payments/{id}` (cf. spec MCP HelloAsso).
 * On ne lit que les champs utiles à la réconciliation webhook.
 */
export interface HelloAssoPaymentDetailResponse {
  id: number;
  amount: number;
  state: string;
  order?: {
    id?: number;
    formSlug?: string;
    formType?: string;
    organizationSlug?: string;
    checkoutIntentId?: number;
  };
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable>';
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}
