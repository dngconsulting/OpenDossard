// Mock jsdom pour les tests E2E — jsdom v28+ utilise des dépendances ESM
// incompatibles avec Jest CJS. On le mock car les tests E2E n'ont pas besoin
// de générer des PDF avec fiche épreuve (qui utilise JSDOM pour le HTML).
export class JSDOM {
  window: Record<string, unknown>;
  constructor() {
    this.window = { document: { createElement: () => ({}) } };
  }
}
