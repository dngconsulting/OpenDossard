# Design : Page Classements v2

**Date** : 2026-01-24
**Statut** : Validé
**Migration** : `services/webapp/src/pages/results/Results.tsx` → `services/webapp-v2/src/pages/ClassementsPage.tsx`

---

## 1. Vue d'ensemble

Page de saisie et gestion des classements pour une compétition. Permet de classer les coureurs engagés en saisissant leur numéro de dossard, avec support des abandons (ABD, NC, CHT, etc.), chronos, et réorganisation par drag & drop.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ {Nom compétition} [12/45 classés]    [Télécharger▼] [← Retour]│
├─────────────────────────────────────────────────────────────┤
│ [1/2/3] [A/B] [C] [D]  ← Onglets des courses avec badge     │
├─────────────────────────────────────────────────────────────┤
│ ┌───┬─────┬─────────┬─────────┬────────┬─────────┬────┬───┐ │
│ │ ⋮ │ Clt │ Dossard │ Chrono* │ Tours* │ Coureur │Club│...│ │
│ ├───┼─────┼─────────┼─────────┼────────┼─────────┼────┼───┤ │
│ │ ⋮ │  1  │ [___▼]  │ [__:__] │ [__]   │         │    │   │ │
│ │ ⋮ │  2  │ [___▼]  │         │        │         │    │   │ │
│ └───┴─────┴─────────┴─────────┴────────┴─────────┴────┴───┘ │
└─────────────────────────────────────────────────────────────┘
* Chrono/Tours visibles uniquement si competition.avecChrono
```

### Toolbar

- **Gauche** : Nom compétition (h1) + Badge `{classés}/{engagés}`
- **Droite** : Bouton "Télécharger" (dropdown CSV) + Bouton "← Retour"

### Onglets

- Identiques à EngagementsPage (même styling, scroll indicators, hash routing)
- Badge par onglet : nombre de classés dans cette course

---

## 2. Colonnes du tableau

| Col | Contenu | Éditable | Notes |
|-----|---------|----------|-------|
| ⋮ | Drag handle | - | Désactivé si ligne vide |
| Clt | `{scratch} ({catégorie})` ou code DNF | Non | Auto-incrémenté |
| Dossard | Combobox hybride | **Oui** | Input + dropdown DNF |
| Chrono | Input time HH:MM:SS | **Oui** | Si `avecChrono` |
| Tours | Input number | **Oui** | Si `avecChrono` |
| Coureur | Nom + icônes podium/challenge | Non | Rempli après saisie dossard |
| Club | Nom du club | Non | |
| H/F | Genre | Non | |
| Dept | Département | Non | |
| Catév | Catégorie vélo | Non | |
| Fédé | Fédération | Non | |
| Actions | Toggle challenge | Oui | Icône cliquable |

---

## 3. Combobox Hybride (RankingInput)

### Comportement

```
┌─────────────────────────────┐
│ [  ] ▼                      │  ← Input vide, focus → ouvre dropdown
└─────────────────────────────┘
        ↓ (on focus ou click ▼)
┌─────────────────────────────┐
│ [045_] ▼                    │  ← Tape un numéro = dossard
├─────────────────────────────┤
│  ABD - Abandon              │
│  CHT - Chute                │
│  NC  - Non classé           │
│  NP  - Non partant          │
│  DSQ - Disqualifié          │
│  HD  - Hors délai           │
│  DNV - Dossard non visible  │
└─────────────────────────────┘
```

### Interactions

1. **Focus** → Dropdown s'ouvre
2. **Tape un numéro** → Valide sur blur/Tab/Enter
3. **Clique code DNF** → Remplit avec ABD, NC, etc.
4. **Validation onBlur** :
   - Numérique → vérifie dossard existe ET non déjà classé
   - DNF code → applique directement

### Appel API

```typescript
useUpdateRanking({
  riderNumber: number,
  raceCode: string,
  competitionId: number,
  rankingScratch?: number,  // Si classement numérique
  comment?: string          // Si DNF (ABD, NC, etc.)
})
```

### Navigation clavier

- `Tab` → Champ suivant (Chrono si avecChrono, sinon Dossard ligne suivante)
- `↓` → Ligne suivante
- `Enter` → Valide et passe à la ligne suivante
- `Escape` → Annule et ferme dropdown

### Validation

- **Dossard inexistant** → Toast erreur "Le dossard XXX n'existe pas dans les engagés"
- **Dossard déjà classé** → Toast erreur "Le dossard XXX est déjà classé"

---

## 4. Lignes du tableau

### Affichage initial

- Exactement **N lignes = N engagés** de la course
- Toutes les lignes sont vides (classement pré-numéroté 1, 2, 3...)
- Pas de lignes supplémentaires

### Transformation des données

```typescript
function transformRows(engagements: RaceRowType[], raceCode: string) {
  const raceEngagements = engagements.filter(e => e.raceCode === raceCode);

  // Séparer classés et non-classés
  const ranked = raceEngagements
    .filter(e => e.rankingScratch != null || e.comment != null)
    .sort((a, b) => {
      if (a.comment && !b.comment) return 1;  // DNF en bas
      if (!a.comment && b.comment) return -1;
      return (a.rankingScratch ?? 999) - (b.rankingScratch ?? 999);
    });

  const unranked = raceEngagements
    .filter(e => e.rankingScratch == null && e.comment == null);

  // Générer les lignes avec classement auto
  const totalLines = raceEngagements.length;
  return Array.from({ length: totalLines }, (_, index) => {
    const rankedRow = ranked[index];
    return {
      position: index + 1,
      ...(rankedRow || { id: null, riderNumber: null, name: null })
    };
  });
}
```

---

## 5. Podiums & Classement Catégorie

### Icônes de médaille

```typescript
const MEDAL_COLORS = {
  1: '#efd807',  // Or
  2: '#D7D7D7',  // Argent
  3: '#6A3805', // Bronze
};

// Afficher médaille si rankingScratch <= 3 OU rankOfCate <= 3
// Couleur = min(rankingScratch, rankOfCate)
```

### Classement par catégorie

```typescript
function rankOfCate(row: RaceRowType, allRows: RaceRowType[]): number | null {
  if (!row.rankingScratch || row.comment) return null;

  const validRows = allRows.filter(r => r.rankingScratch != null && !r.comment);

  if (row.gender === 'F') {
    // Femmes : classement parmi TOUTES les femmes
    const femmes = validRows.filter(r => r.gender === 'F');
    return femmes.findIndex(r => r.id === row.id) + 1;
  } else {
    // Hommes : classement parmi la même catégorie (catev)
    const sameCate = validRows.filter(r => r.catev === row.catev);
    return sameCate.findIndex(r => r.id === row.id) + 1;
  }
}
```

### Affichage du classement

```
1 (1)   ← 1er scratch, 1er de sa catégorie
2 (1)   ← 2ème scratch, 1er de sa catégorie (autre catev)
3 (2)   ← 3ème scratch, 2ème de sa catégorie
ABD     ← Abandon (pas de rang catégorie)
```

---

## 6. Challenge Sprint

- Icône `Users` (lucide-react) à côté du nom si `sprintchallenge === true`
- Colonne Actions : icône cliquable pour toggle
- API : `useToggleChallenge({ id, competitionId })`
- Tooltip : "Vainqueur du challenge sprint" / "Marquer comme vainqueur"

---

## 7. Drag & Drop

### Comportement

- Utilise `@dnd-kit` (déjà présent)
- Grip handle (⋮) à gauche de chaque ligne **classée**
- Désactivé pour les lignes vides
- Au drop → recalcul des positions

### Appel API

```typescript
useReorderRankings([
  { id: 123, rankingScratch: 1 },
  { id: 456, rankingScratch: 2 },
  // ...
])
```

---

## 8. Export CSV

### Menu dropdown

```
[Télécharger ▼]
├── CSV course actuelle ({raceCode})
└── CSV toutes les courses
```

### Colonnes CSV

```
Cl.Scratch | Dossard | Nom | Club | Sexe | Dept | Année | CatéV | CatéA | Chrono* | Tours* | Cl.Caté | Licence | Fédé | Course
```

---

## 9. Structure technique

### Fichiers à créer/modifier

```
services/webapp-v2/src/
├── pages/
│   └── ClassementsPage.tsx           # Page principale (réécrire)
├── components/
│   └── classements/
│       ├── index.ts                  # Exports
│       ├── ClassementsTable.tsx      # Table avec drag & drop
│       ├── RankingInput.tsx          # Combobox hybride
│       ├── PodiumIcon.tsx            # Médailles
│       └── ExportMenu.tsx            # Dropdown CSV
├── hooks/
│   └── useRaces.ts                   # + useReorderRankings, useUpdateTours
├── api/
│   └── races.api.ts                  # + reorderRankings
├── types/
│   └── races.ts                      # + ReorderRankingItemDto
└── utils/
    └── classements.ts                # Helpers (transform, export, etc.)
```

### APIs à ajouter

**races.api.ts :**
```typescript
reorderRankings: (items: ReorderRankingItemDto[]): Promise<{ success: boolean }> =>
  apiClient('/races/ranking/reorder', {
    method: 'PUT',
    body: JSON.stringify(items),
  }),
```

**types/races.ts :**
```typescript
export type ReorderRankingItemDto = {
  id: number;
  rankingScratch: number;
};
```

**useRaces.ts :**
```typescript
export function useReorderRankings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { items: ReorderRankingItemDto[]; competitionId: number }) =>
      racesApi.reorderRankings(data.items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}

export function useUpdateTours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; tours: number | null; competitionId: number }) =>
      racesApi.updateTours(data.id, data.tours),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: racesKeys.competition(variables.competitionId),
      });
    },
  });
}
```

---

## 10. Résumé des décisions

| Aspect | Choix |
|--------|-------|
| Layout | Identique à EngagementsPage |
| Saisie DNF | Combobox hybride (input + dropdown) |
| Navigation clavier | Tab horizontal, ↓ pour descendre |
| Lignes initiales | N lignes = N engagés (vides numérotées) |
| Validation dossard | Erreur toast si inexistant ou déjà classé |
| Export | CSV uniquement (course / toutes) |
| Drag & drop | @dnd-kit + PUT /races/ranking/reorder |
| Podiums | Médailles or/argent/bronze si top 3 scratch ou catégorie |
| Challenge | Toggle via icône dans colonne actions |
