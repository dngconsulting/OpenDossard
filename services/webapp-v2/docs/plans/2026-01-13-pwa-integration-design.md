# Design PWA OpenDossard

**Date**: 2026-01-13
**Statut**: Validé
**Auteur**: Claude + Sami

## Objectifs

- Permettre l'installation de l'app comme application native (icône écran d'accueil, plein écran)
- Minimiser l'utilisation réseau via le cache applicatif (JS, CSS, HTML, assets)
- Conserver l'exigence de connexion internet pour tous les appels API

## Contraintes

- Pas de cache pour les endpoints API (données toujours fraîches depuis le serveur)
- Connexion internet obligatoire pour accéder aux données (licences, courses, etc.)
- Notification utilisateur lors des mises à jour (pas de rechargement forcé)

## Architecture

### Vue d'ensemble

L'intégration suit le modèle "App Shell" avec `vite-plugin-pwa` et Workbox :

```
┌─────────────────────────────────────────────────────┐
│                    Navigateur                        │
├─────────────────────────────────────────────────────┤
│  Service Worker (généré par Workbox)                │
│  ├── Precache: JS bundles, CSS, HTML, fonts         │
│  ├── Runtime cache: images statiques                │
│  └── Network only: /api/* (pas de cache)            │
├─────────────────────────────────────────────────────┤
│  App React                                          │
│  ├── OfflineBanner (détecte navigator.onLine)       │
│  ├── UpdatePrompt (écoute SW updates via Sonner)    │
│  └── Reste de l'application inchangé                │
└─────────────────────────────────────────────────────┘
```

### Flux de fonctionnement

1. **Premier chargement** : Télécharge tout depuis le réseau, le SW met en cache les assets
2. **Chargements suivants** : App shell depuis le cache (instantané), données depuis l'API
3. **Mise à jour déployée** : SW détecte le changement → toast Sonner → utilisateur clique → rechargement
4. **Hors ligne** : App shell se charge, bannière apparaît, appels API échouent gracieusement

### Ce qui ne change pas

- React Query continue de gérer le cache mémoire des données (5 min stale time)
- L'authentification reste identique (localStorage/sessionStorage)
- Toutes les routes API passent directement au réseau

## Implémentation

### Dépendances

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^1.0.0",
    "@vite-pwa/assets-generator": "^0.2.6"
  }
}
```

### Configuration Vite

Fichier `vite.config.ts` :

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon-32x32.png', 'logood.png', 'logood.svg'],
      manifest: {
        name: 'OpenDossard',
        short_name: 'OpenDossard',
        description: 'Gestion des courses cyclistes',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [{
          urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: { maxEntries: 100 }
          }
        }]
      }
    })
  ]
})
```

### Générateur d'icônes

Fichier `pwa-assets.config.ts` :

```typescript
import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: minimalPreset,
  images: ['public/logood.svg']
})
```

Script dans `package.json` :

```json
{
  "scripts": {
    "generate-pwa-assets": "pwa-assets-generator"
  }
}
```

### Icônes générées

```
public/
├── logood.svg                  (source vectoriel)
├── pwa-64x64.png               (favicon)
├── pwa-192x192.png             (Android/Chrome)
├── pwa-512x512.png             (Android splash)
├── maskable-icon-512x512.png   (Android adaptive)
└── apple-touch-icon-180x180.png (iOS)
```

## Composants React

### UpdatePrompt.tsx

Affiche un toast Sonner quand une nouvelle version est disponible.

```typescript
// src/components/pwa/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      toast('Nouvelle version disponible', {
        description: 'Cliquez pour mettre à jour l\'application',
        duration: Infinity,
        action: {
          label: 'Actualiser',
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false),
      })
    }
  }, [needRefresh])

  return null
}
```

### useOnlineStatus.ts

Hook réactif pour détecter l'état de la connexion.

```typescript
// src/hooks/useOnlineStatus.ts
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
```

### OfflineBanner.tsx

Bannière affichée quand l'utilisateur est hors ligne.

```typescript
// src/components/pwa/OfflineBanner.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { IconWifiOff } from '@tabler/icons-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <IconWifiOff size={18} />
      <span>
        Mode hors ligne — Une connexion internet est nécessaire pour accéder aux données
      </span>
    </div>
  )
}
```

### Intégration App.tsx

```typescript
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt'
import { OfflineBanner } from '@/components/pwa/OfflineBanner'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UpdatePrompt />
      <OfflineBanner />
      {/* ... reste de l'app */}
    </QueryClientProvider>
  )
}
```

### Types PWA

Ajouter dans `src/vite-env.d.ts` :

```typescript
/// <reference types="vite-plugin-pwa/react" />
```

## Structure des fichiers

### Nouveaux fichiers

```
webapp-v2/
├── pwa-assets.config.ts
├── src/
│   ├── components/
│   │   └── pwa/
│   │       ├── UpdatePrompt.tsx
│   │       └── OfflineBanner.tsx
│   └── hooks/
│       └── useOnlineStatus.ts
└── public/
    └── logood.svg
```

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `package.json` | Dépendances + script generate-pwa-assets |
| `vite.config.ts` | Plugin VitePWA |
| `src/App.tsx` | Import UpdatePrompt + OfflineBanner |
| `src/vite-env.d.ts` | Types PWA |

## Commandes

```bash
# Générer les icônes (une fois, ou après changement logo)
pnpm generate-pwa-assets

# Build (inclut SW et manifest automatiquement)
pnpm build

# Test en local du build PWA
pnpm preview
```

## Comportements attendus

| Scénario | Comportement |
|----------|--------------|
| Premier chargement | Assets téléchargés et mis en cache par le SW |
| Chargement suivant | App shell instantané depuis cache, données depuis API |
| Nouvelle version déployée | Toast "Nouvelle version disponible" avec bouton Actualiser |
| Utilisateur hors ligne | Bannière amber en haut, app shell fonctionnel, requêtes API échouent |
| Retour en ligne | Bannière disparaît automatiquement |

## Limitations

- Les données ne sont jamais disponibles hors ligne (par design)
- Le cache d'images runtime ne concerne que les images externes (pas les assets buildés)
- La détection hors ligne via `navigator.onLine` peut avoir des faux positifs sur certains réseaux
