# Refactorisation : Organisation des composants et utilitaires

## Date

27 décembre 2024

## Objectif

Réorganiser la structure du projet pour clarifier la séparation entre le code du main process et du renderer process.

## Changements effectués

### Déplacement des dossiers

1. **`src/components/` → `src/renderer/components/`**
    - Tous les composants React ont été déplacés dans `src/renderer/components/`
    - Cela inclut les composants fonctionnels et les composants UI (Shadcn/ui)

2. **`src/lib/` → `src/renderer/lib/`**
    - Les utilitaires spécifiques au renderer (ex: `utils.ts` avec la fonction `cn()`) ont été déplacés dans `src/renderer/lib/`

### Configuration des alias

**Avant** :

- Alias `@` pointait vers `./src/renderer` (tentative précédente)
- Alias spécifiques pour `@/types`, `@/interface`, `@/shared`, etc.

**Après** :

- Alias `@` pointe vers `./src/` (configuration simplifiée)
- Les imports utilisent le chemin complet : `@/renderer/components/...`, `@/renderer/lib/...`

**Fichiers modifiés** :

- `tsconfig.json` : `"@/*": ["./src/*"]`
- `vite.renderer.config.ts` : `'@': path.resolve(__dirname, './src')`

### Exemples d'imports

**Composants** :

```typescript
// Avant
import { Button } from '@/components/ui/button'

// Après
import { Button } from '@/renderer/components/ui/button'
```

**Utilitaires** :

```typescript
// Avant
import { cn } from '@/lib/utils'

// Après
import { cn } from '@/renderer/lib/utils'
```

**Code partagé** (inchangé) :

```typescript
import { store as storeConstants } from '@/shared/constants'
import { ConfigData } from '@/class/ConfigData'
import type { IKeyValue } from '@/interface'
```

## Avantages

1. **Séparation claire** : Tous les composants et utilitaires du renderer sont regroupés dans `src/renderer/`
2. **Organisation logique** : La structure reflète l'architecture Electron (main vs renderer)
3. **Configuration simplifiée** : Un seul alias `@` au lieu de multiples alias spécifiques
4. **Maintenabilité** : Plus facile de comprendre où se trouve le code selon le contexte (main ou renderer)

## Fichiers affectés

### Composants déplacés

- Tous les fichiers de `src/components/` vers `src/renderer/components/`
- Tous les fichiers de `src/components/ui/` vers `src/renderer/components/ui/`
- Tous les fichiers de `src/components/ui/typography/` vers `src/renderer/components/ui/typography/`

### Utilitaires déplacés

- `src/lib/utils.ts` → `src/renderer/lib/utils.ts`

### Imports mis à jour

- Tous les fichiers dans `src/renderer/` utilisent maintenant `@/renderer/components/...` et `@/renderer/lib/...`
- Les fichiers dans `src/main/` continuent d'utiliser les chemins relatifs ou `@/shared/...`, `@/class/...`, etc.

## Notes importantes

- Le dossier `lib/` à la racine du projet (scripts Node.js exécutés via `utilityProcess`) n'a **pas** été déplacé
- Les fichiers partagés (`src/shared/`, `src/class/`, `src/types.d.ts`, `src/interface.d.ts`) restent à leur emplacement d'origine
- La configuration i18n (`src/configs/`) reste inchangée
