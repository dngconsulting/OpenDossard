import { HelloAssoMulticolorCircle } from './HelloAssoMulticolorCircle';

/**
 * Logo HelloAsso (rond multicolore SEUL, sans wordmark) en SVG inline.
 *
 * Variante "icône" utilisée dans les boutons et chips où le wordmark n'a pas
 * la place. Pour la version complète avec wordmark, voir `HelloAssoTabIcon`.
 *
 * Réutilise `HelloAssoMulticolorCircle` (paths/dégradés mutualisés) avec un
 * viewBox recadré sur la zone du rond (0,0 → ~42×43.5 dans le SVG source).
 */
type Props = {
  /** Taille (carré) en CSS units. Default `1.25rem`. */
  size?: string | number;
  className?: string;
};

export function HelloAssoRoundLogo({ size = '1.25rem', className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 42 43.5"
      style={{ width: size, height: size }}
      role="img"
      aria-label="HelloAsso"
      className={className}
    >
      <HelloAssoMulticolorCircle />
    </svg>
  );
}
