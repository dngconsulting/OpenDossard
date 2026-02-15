export function truncateLabel(label: string, maxLen = 40): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + '\u2026';
}
