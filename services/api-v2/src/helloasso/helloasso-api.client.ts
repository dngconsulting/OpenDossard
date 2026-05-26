import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { truncate } from '../common/utils/string.util';
import { HelloAssoConfig } from './helloasso.config';

/**
 * Client HTTP pour les endpoints HelloAsso v5 authentifiés par access_token club.
 * L'OAuth (échange/refresh) reste dans `HelloAssoOAuthService`.
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
    return this.postJson<CheckoutIntentResponse>(url, input.accessToken, input.body);
  }

  /**
   * GET `/v5/organizations/{slug}` — fiche orga HelloAsso.
   *
   * Appelé une fois au moment de la liaison pour récupérer la valeur initiale
   * de `isCashInCompliant` (drapeau d'éligibilité à l'encaissement). Le suivi
   * continu de ce drapeau passe par le webhook `Organization.IsCashinCompliant`,
   * pas par un re-call périodique de cet endpoint.
   */
  async getOrganization(input: {
    organizationSlug: string;
    accessToken: string;
  }): Promise<OrganizationResponse> {
    const url = `${this.config.apiBaseUrl}/v5/organizations/${encodeURIComponent(input.organizationSlug)}`;
    return this.getJson<OrganizationResponse>(url, input.accessToken);
  }

  /**
   * Récupère l'état détaillé d'un checkout-intent existant. Utilisé par l'action
   * admin "refresh status" pour rapatrier l'état réel d'un paiement bloqué en
   * pending (cf. `HelloAssoPaymentService.refreshStatusFromHelloAsso`).
   *
   * 404 HelloAsso → `NotFoundException` (intent introuvable / périmé côté HA).
   * 401/403 → `UnauthorizedException` (token partenaire invalide / privilège
   *           `Checkout` manquant côté HelloAsso).
   */
  async getCheckoutIntent(input: {
    organizationSlug: string;
    accessToken: string;
    checkoutIntentId: string;
  }): Promise<CheckoutIntentDetailsResponse> {
    const url = `${this.config.apiBaseUrl}/v5/organizations/${encodeURIComponent(input.organizationSlug)}/checkout-intents/${encodeURIComponent(input.checkoutIntentId)}`;
    return this.getJson<CheckoutIntentDetailsResponse>(url, input.accessToken);
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

  private async getJson<T>(url: string, accessToken: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
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
      if (response.status === 404) {
        throw new NotFoundException('HelloAsso resource not found');
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
 * Sous-ensemble de la réponse `GET /v5/organizations/{slug}` — on ne consomme
 * que `isCashInCompliant`. Le reste (raison sociale, logo, etc.) reste hors
 * scope pour éviter de se coupler au schéma complet.
 */
export interface OrganizationResponse {
  organizationSlug?: string;
  isCashInCompliant?: boolean;
}

/**
 * Sous-ensemble de la réponse `GET /v5/organizations/{slug}/checkout-intents/{id}`.
 * On ne consomme que l'`order` et ses `payments` — le reste (metadata, payer,
 * itemName) reste typé `unknown` pour ne pas se coupler au schéma complet.
 */
export interface CheckoutIntentDetailsResponse {
  id?: number;
  order?: {
    id?: number;
    payments?: Array<{
      id?: number;
      state?: string;
      amount?: number;
      date?: string;
    }>;
  };
  metadata?: Record<string, unknown>;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '<unreadable>';
  }
}
