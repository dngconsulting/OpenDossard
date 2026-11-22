/**
 * Fuseau dans lequel se lit le jour d'une épreuve : celui des organisateurs et
 * de l'app Dossardeur. Une épreuve « du 1er juin » est une épreuve dont
 * l'instant tombe le 1er juin à Paris, quel que soit le fuseau du serveur.
 */
export const EVENT_TIME_ZONE = 'Europe/Paris';

const PARTS_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: EVENT_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Décalage (ms) du fuseau des épreuves par rapport à UTC, à l'instant donné. */
function eventZoneOffsetMs(instant: number): number {
  const parts = Object.fromEntries(
    PARTS_FORMAT.formatToParts(instant).map(part => [part.type, Number(part.value)]),
  );
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Instant du début (00:00, heure de Paris) du jour `AAAA-MM-JJ`, décalé de
 * `addDays` jours. Sert à borner un filtre de dates par des instants : la
 * colonne `event_date` est comparée nue et son index reste utilisable.
 *
 * Le décalage est lu à minuit UTC du jour visé : les changements d'heure ayant
 * lieu à 01:00 UTC, il est identique à celui de minuit à Paris (22 h ou 23 h
 * UTC la veille).
 */
export function startOfEventDay(day: string, addDays = 0): Date {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, dayOfMonth + addDays);
  return new Date(utcMidnight - eventZoneOffsetMs(utcMidnight));
}
