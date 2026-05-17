import { HelloAssoMulticolorCircle } from './HelloAssoMulticolorCircle';

/**
 * Logo HelloAsso COMPLET (rond multicolore + wordmark "helloasso") en SVG inline.
 *
 * Source : https://www.helloasso.com/_nuxt/img/logo-helloasso-midnight.0e553e3.svg
 *
 * **Pourquoi inline vs PNG** : le wordmark "helloasso" doit suivre la couleur
 * du texte du parent (`currentColor`) pour rester lisible sur tous les fonds :
 *  - tab actif (fond vert `#047857`) → texte blanc → wordmark blanc
 *  - tab inactif dark mode → texte slate-300 → wordmark clair
 *  - tab inactif light mode → texte slate-700 → wordmark navy équivalent
 *
 * Le rond multicolore (3 dégradés officiels) est externalisé dans
 * `HelloAssoMulticolorCircle`, réutilisé par `HelloAssoRoundLogo`.
 */
type Props = {
  /** Hauteur en CSS units (default `1.25rem` pour s'aligner sur les icônes lucide). */
  height?: string | number;
  className?: string;
};

export function HelloAssoTabIcon({ height = '1.25rem', className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 43.5"
      style={{ height, width: 'auto' }}
      role="img"
      aria-label="HelloAsso"
      className={className}
    >
      {/* Wordmark "helloasso" — `currentColor` pour s'adapter au thème du parent. */}
      <path
        fill="currentColor"
        d="M71.1 19.3v13.3h-6.6v-12c0-1.4-.4-1.8-1-1.8-.7 0-1.5.6-2.2 1.8v12h-6.6v-25l6.6-.7v9.4c1.5-1.6 3-2.3 5-2.3 3-.1 4.8 1.9 4.8 5.3zM90.3 25.5H79.6c.4 2.6 1.6 3 3.6 3 1.3 0 2.5-.5 4-1.6l2.7 3.7c-2 1.7-4.7 2.7-7.3 2.7-6.5 0-9.6-4.1-9.6-9.6 0-5.3 3-9.7 8.9-9.7 5.2 0 8.7 3.4 8.7 9.4-.1.5-.2 1.4-.3 2.1zm-6.3-4c0-1.8-.4-3.3-2.1-3.3-1.4 0-2.1.8-2.4 3.6H84v-.3zM92.1 27.4V7.5l6.6-.7v20.3c0 .6.3.9.8.9.2 0 .5 0 .7-.2l1.2 4.7c-1.2.4-2.4.6-3.6.6-3.7.2-5.7-2-5.7-5.7zM102.1 27.4V7.5l6.6-.7v20.3c0 .6.3.9.8.9.2 0 .5 0 .7-.2l1.2 4.7c-1.2.4-2.4.6-3.6.6-3.7.2-5.7-2-5.7-5.7zM129.4 23.6c0 5.9-3.5 9.6-9.2 9.6-5.6 0-9.2-3.4-9.2-9.7 0-5.9 3.5-9.6 9.2-9.6 5.6 0 9.2 3.5 9.2 9.7zm-11.5 0c0 3.6.7 4.9 2.4 4.9 1.6 0 2.4-1.4 2.4-4.9 0-3.6-.7-4.9-2.4-4.9s-2.5 1.5-2.4 4.9zM147.8 28.9l-1.3 4.3c-2.3-.2-3.8-.8-4.8-2.5-1.3 2-3.3 2.6-5.4 2.6-3.6 0-5.9-2.4-5.9-5.7 0-4 3-6.2 8.6-6.2h1.3v-.5c0-1.8-.6-2.3-2.6-2.3-1.6.1-3.1.4-4.6.9l-1.4-4.2c2.2-.9 4.6-1.4 7-1.4 5.7 0 8 2.2 8 6.6v6.2c0 1.3.3 1.9 1.1 2.2zm-7.5-1.4v-2.7h-.7c-1.9 0-2.7.6-2.7 2 0 1 .6 1.7 1.5 1.7.7.1 1.5-.3 1.9-1zM163.6 16.3l-2.3 3.6c-1.3-.8-2.7-1.3-4.2-1.3-1.1 0-1.5.3-1.5.8 0 .6.2.9 3.6 1.9 3.4 1.1 5.2 2.5 5.2 5.8 0 3.7-3.5 6.2-8.4 6.2-3.1 0-6-1.1-7.8-2.9l3.1-3.5c1.3 1 2.9 1.8 4.5 1.8 1.2 0 1.9-.4 1.9-1.1 0-.9-.4-1.1-3.4-2-3.3-1-5.2-2.9-5.2-5.8 0-3.2 2.8-5.8 7.7-5.8 2.6-.1 5.2.8 6.8 2.3zM180.1 16.3l-2.3 3.6c-1.3-.8-2.7-1.3-4.2-1.3-1.1 0-1.5.3-1.5.8 0 .6.2.9 3.6 1.9 3.4 1.1 5.2 2.5 5.2 5.8 0 3.7-3.5 6.2-8.4 6.2-3.1 0-6-1.1-7.8-2.9l3.1-3.5c1.3 1 2.9 1.8 4.5 1.8 1.2 0 1.9-.4 1.9-1.1 0-.9-.4-1.1-3.4-2-3.3-1-5.2-2.9-5.2-5.8 0-3.2 2.8-5.8 7.7-5.8 2.6-.1 5.1.8 6.8 2.3zM200 23.6c0 5.9-3.5 9.6-9.2 9.6-5.6 0-9.2-3.4-9.2-9.7 0-5.9 3.5-9.6 9.2-9.6 5.6 0 9.2 3.5 9.2 9.7zm-11.5 0c0 3.6.7 4.9 2.4 4.9 1.6 0 2.4-1.4 2.4-4.9 0-3.6-.7-4.9-2.4-4.9s-2.5 1.5-2.4 4.9z"
      />
      <HelloAssoMulticolorCircle />
    </svg>
  );
}
