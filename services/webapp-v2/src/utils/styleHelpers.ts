export function getPositionBadgeStyle(position: number): string {
  if (position <= 3) {
    return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
  }
  if (position <= 10) {
    return 'bg-green-50 text-green-700 ring-green-600/20';
  }
  return 'bg-gray-50 text-gray-600 ring-gray-500/10';
}

export function formatRaceDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
