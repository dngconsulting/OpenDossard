import { BadGatewayException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

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
