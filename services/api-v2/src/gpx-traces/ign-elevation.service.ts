import { Injectable, Logger } from '@nestjs/common';

import type { LonLat } from './gpx/gpx-trace-profile';

const IGN_ELEVATION_URL = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
/** RGE ALTI (1 à 5 m) sur la France, complété par une ressource mondiale moins fine. */
const IGN_RESOURCE = 'ign_rge_alti_wld';
/** Limite de l'API : 5 000 points par appel. */
const BATCH_SIZE = 5000;
/**
 * L'API limite à un appel par seconde : tous les appels du service passent par
 * une file unique, y compris quand plusieurs dépôts sont calculés en même temps.
 */
const MIN_INTERVAL_MS = 1100;
/** Nouvelles tentatives d'un lot après un refus (429) ou une erreur serveur, espacées. */
const RETRY_DELAYS_MS = [2000, 5000];
const REQUEST_TIMEOUT_MS = 30_000;
/** Valeur renvoyée hors couverture. */
const NO_DATA = -99999;

type IgnElevationResponse = { elevations?: number[] };

class IgnHttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Altitudes RGE ALTI de l'IGN (Géoplateforme, gratuit, sans clé). Renvoie
 * `null` par point hors couverture, et `null` pour tout le tracé si l'API ne
 * répond pas : l'appelant retombe alors sur les altitudes du GPX.
 */
@Injectable()
export class IgnElevationService {
  private readonly logger = new Logger(IgnElevationService.name);
  /** Fin du dernier appel mis en file : le suivant part au moins `MIN_INTERVAL_MS` après. */
  private queue: Promise<unknown> = Promise.resolve();

  async elevations(coordinates: LonLat[]): Promise<(number | null)[] | null> {
    const result: (number | null)[] = [];
    try {
      for (let start = 0; start < coordinates.length; start += BATCH_SIZE) {
        result.push(...(await this.batchWithRetry(coordinates.slice(start, start + BATCH_SIZE))));
      }
      return result;
    } catch (error) {
      this.logger.warn(
        `Altimétrie IGN indisponible, altitudes du GPX utilisées : ${String(error)}`,
      );
      return null;
    }
  }

  private async batchWithRetry(coordinates: LonLat[]): Promise<(number | null)[]> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.enqueue(() => this.batch(coordinates));
      } catch (error) {
        const retryable =
          !(error instanceof IgnHttpError) || error.status === 429 || error.status >= 500;
        if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw error;
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  /** Exécute l'appel à son tour dans la file, puis respecte l'intervalle minimal. */
  private enqueue<T>(call: () => Promise<T>): Promise<T> {
    const run = this.queue.then(call);
    this.queue = run.catch(() => undefined).then(() => sleep(MIN_INTERVAL_MS));
    return run;
  }

  private async batch(coordinates: LonLat[]): Promise<(number | null)[]> {
    const response = await fetch(IGN_ELEVATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lon: coordinates.map(([lon]) => lon.toFixed(6)).join('|'),
        lat: coordinates.map(([, lat]) => lat.toFixed(6)).join('|'),
        resource: IGN_RESOURCE,
        delimiter: '|',
        zonly: 'true',
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new IgnHttpError(response.status);
    const { elevations } = (await response.json()) as IgnElevationResponse;
    if (!elevations || elevations.length !== coordinates.length) {
      throw new Error('réponse incomplète');
    }
    return elevations.map(e => (e === NO_DATA || !Number.isFinite(e) ? null : e));
  }
}
