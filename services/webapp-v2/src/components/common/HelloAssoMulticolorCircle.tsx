import { useId } from 'react';

/**
 * Rond multicolore officiel HelloAsso (3 paths superposés avec dégradés
 * vert/magenta/orange). Brique partagée entre `HelloAssoTabIcon` (variante
 * complète avec wordmark) et `HelloAssoRoundLogo` (icône seule).
 *
 * Le composant ne porte PAS le wordmark — c'est volontaire : le wordmark
 * suit `currentColor` côté `HelloAssoTabIcon` pour s'adapter au thème.
 *
 * IDs de gradient uniques par instance via `useId()` pour supporter plusieurs
 * rendus simultanés (sinon collision DOM → tous pointent vers le 1er gradient).
 */
type Props = {
  /** Coordonnées du rond dans le viewBox parent. */
  transform?: string;
};

export function HelloAssoMulticolorCircle({ transform }: Props) {
  const reactId = useId();
  const safe = reactId.replace(/:/g, '');
  const g1 = `hac-g1-${safe}`;
  const g2 = `hac-g2-${safe}`;
  const g3 = `hac-g3-${safe}`;

  return (
    <g transform={transform}>
      <defs>
        <linearGradient
          id={g1}
          x1="4.322"
          x2="24.268"
          y1="33.651"
          y2="-.503"
          gradientTransform="matrix(1 0 0 -1 0 44.736)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#498a63" />
          <stop offset=".25" stopColor="#61b984" />
        </linearGradient>
        <linearGradient
          id={g2}
          x1="19.889"
          x2="40.524"
          y1="3.627"
          y2="36.697"
          gradientTransform="matrix(1 0 0 -1 0 44.736)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#89356d" />
          <stop offset=".21" stopColor="#b94794" />
        </linearGradient>
        <linearGradient
          id={g3}
          x1="3.242"
          x2="37.689"
          y1="35.782"
          y2="23.384"
          gradientTransform="matrix(1 0 0 -1 0 44.736)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".6" stopColor="#f59c1c" />
          <stop offset="1" stopColor="#c7702b" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g1})`}
        d="M12.9 34.9c-6.6-7.6-2.2-26.8.6-26.8C8.1 7.9-1.1 11.5.2 24.4c1.5 12 12.3 20.4 24.1 18.9 3.8-.5 7.3-2 10.3-4.3-10.4 7.5-17.4.8-21.7-4.1z"
      />
      <path
        fill={`url(#${g2})`}
        d="M37.2 21.9C31.7 33 14.8 37.7 12.9 34.8c3.3 4.9 11.5 11.6 21.8 4 9.4-7.3 11.1-21 3.8-30.5-2.3-3-5.4-5.3-8.9-6.8 11.7 5.3 10.5 14.6 7.6 20.4z"
      />
      <path
        fill={`url(#${g3})`}
        d="M13.5 8.1c11.9-1.3 25.4 11 23.7 13.9 3.3-5.8 4.1-15.1-7.5-20.4C18.6-2.9 6 2.5 1.6 13.7.2 17.2-.3 21 .2 24.7-.6 11.9 9.1 8.5 13.5 8.1z"
      />
    </g>
  );
}
