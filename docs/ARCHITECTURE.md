# Architecture technique

## Stack technologique

### Frontend (Renderer Process)

- **React 19.2.1** : Framework UI
- **TypeScript 5.7.2** : Typage statique
- **Tailwind CSS 3.4.17** : Framework CSS utility-first
- **Shadcn/ui** : Composants React de qualité
- **Vite 7.2.6** : Build tool et dev server
- **react-i18next** : Internationalisation React

### Backend (Main Process)

- **Electron 39.2.5** : Framework desktop
- **Node.js 22+** : Runtime requis
- **electron-log 5.4.3** : Système de logging
- **electron-store 11.0.2** : Persistance des données
- **i18next 25.7.1** : Internationalisation (main process)
- **i18next-fs-backend 2.6.1** : Backend fichiers pour i18next
- **electron.autoUpdater** : Auto-updater natif d'Electron avec `update.electronjs.org` pour les mises à jour automatiques (macOS/Windows)

### Build & Tooling

- **Electron Forge 7.10.2** : Build tooling
- **ESLint 9.39.1** : Linter
- **Prettier** : Formateur de code
- **Husky 9.1.7** : Git hooks
- **Changeset 2.27.1** : Gestion de version
- **Babel** : Extraction des clés i18n

## Architecture Electron

L'application suit l'architecture standard Electron avec séparation stricte entre :

- **Main Process** (`src/main/`) : Processus principal Node.js
- **Renderer Process** (`src/renderer/`) : Processus de rendu React
- **Preload Script** (`src/main/preload.ts`) : Script de pont sécurisé

### Sécurité

- `contextIsolation: true` : Isolation du contexte
- `nodeIntegration: false` : Pas d'intégration Node.js directe dans le renderer
- Utilisation de `contextBridge` pour exposer des APIs sécurisées

## Composants UI (Renderer)

### InformationPopin

**Fichier** : `src/renderer/components/InformationPopin.tsx`

Composant de popin modal pour afficher les messages d'initialisation avec :

- Overlay semi-transparent
- Barre de progression
- Spinner animé
- Support des erreurs (mode alerte)
- Messages multilignes
- Liens d'aide cliquables

**Dépendances** :

- `@radix-ui/react-progress` : Barre de progression
- `@radix-ui/react-icons` : Icônes (ReloadIcon pour le spinner)

### DarkModeSwitcher

**Fichier** : `src/renderer/components/DarkModeSwitcher.tsx`

Composant de basculement entre mode clair et mode sombre avec :

- Détection automatique du mode système via `matchMedia('prefers-color-scheme: dark')`
- Écoute des changements de préférence système
- Application/retrait de la classe `dark` sur l'élément `<html>`
- Icônes `Sun` et `SunMoon` de `lucide-react`
- Switch basé sur `@radix-ui/react-switch`

**Fonctionnement** :

1. Au montage, détecte le mode système et initialise l'état
2. Écoute les changements de préférence système
3. Applique la classe `dark` sur `<html>` lorsque le mode sombre est activé
4. Permet le basculement manuel via le switch

**Dépendances** :

- `@radix-ui/react-switch` : Composant switch
- `lucide-react` : Icônes Sun et SunMoon

### SplashScreen

**Fichier** : `src/renderer/components/SplashScreen.tsx`

Composant modal pour afficher l'écran de démarrage avec contenu markdown :

- Affichage conditionnel basé sur les préférences utilisateur (via `electron-store`)
- Contenu markdown chargé depuis `src/extraResources/md/` (fichiers `.en.md` et `.fr.md`)
- Checkbox "Ne plus afficher" pour masquer définitivement le splash screen pour la version actuelle
- Bouton de fermeture
- Affichage de la version de l'application
- Support multilingue (français/anglais)

**Fonctionnement** :

1. Écoute les messages IPC `display-splash-screen` depuis le main process
2. Charge le contenu markdown selon la langue actuelle
3. Vérifie dans le store si l'utilisateur a choisi de ne plus afficher le splash screen
4. Permet de sauvegarder la préférence dans le store

**Dépendances** :

- `react-markdown` : Rendu du contenu markdown
- `@radix-ui/react-checkbox` : Checkbox pour "Ne plus afficher"
- `electron-store` : Persistance des préférences

### MarkdownReader

**Fichier** : `src/renderer/components/MarkdownReader.tsx`

Composant simple pour afficher du contenu markdown :

- Utilise `react-markdown` pour le rendu
- Accepte une chaîne de caractères markdown en prop `file`
- Utilisé par `SplashScreen` pour afficher le contenu des fichiers `.md`

**Dépendances** :

- `react-markdown` : Bibliothèque de rendu markdown

## Structure du projet

```
EcoindexApp-2025/
├── src/
│   ├── main/                    # Main Process Electron
│   │   ├── main.ts              # Point d'entrée principal
│   │   ├── preload.ts           # Script preload (contextBridge)
│   │   ├── memory.ts            # Gestion de la mémoire (fenêtre principale)
│   │   ├── utils-node.ts       # Utilitaires Node.js
│   │   ├── handlers/            # Handlers de logique métier
│   │   │   ├── Initalization.ts # Orchestrateur d'initialisation
│   │   │   └── initHandlers/    # Handlers spécifiques d'initialisation
│   │   │       ├── getHomeDir.ts        # Récupération du dossier home
│   │   │       ├── getWorkDir.ts        # Récupération du dossier de travail
│   │   │       ├── IsNodeInstalled.ts   # Vérification Node.js
│   │   │       ├── isNodeVersionOK.ts  # Vérification version Node.js
│   │   │       ├── HandleExtractAsarLib.ts  # Extraction ASAR (Windows)
│   │   │       ├── HandleSplashScreen.ts    # Gestion du splash screen
│   │   │       ├── plugin_isInstalled.ts     # Vérification plugin Lighthouse
│   │   │       ├── plugin_installNormally.ts # Installation plugin Lighthouse
│   │   │       ├── puppeteerBrowser_isInstalled.ts    # Vérification Puppeteer
│   │   │       └── puppeteerBrowser_installation.ts   # Installation Puppeteer
│   │   └── utils/               # Utilitaires
│   │       ├── SendMessageToFrontConsole.ts
│   │       └── SendMessageToFrontLog.ts
│   ├── renderer/                # Renderer Process React
│   │   └── main_window/
│   │       ├── App.tsx          # Composant principal (refactorisé avec hooks)
│   │       ├── hooks/           # Hooks personnalisés pour App.tsx
│   │       │   ├── useAppState.ts
│   │       │   ├── useAppUtils.ts
│   │       │   ├── useAppHandlers.ts
│   │       │   ├── useIpcListeners.ts
│   │       │   └── useWorkDirEffect.ts
│   │       ├── main.tsx         # Point d'entrée React
│   │       ├── index.css        # Styles globaux
│   │       └── preload.d.ts     # Types TypeScript pour preload
│   ├── components/              # Composants React
│   │   ├── DarkModeSwitcher.tsx # Sélecteur de mode sombre
│   │   ├── LanguageSwitcher.tsx
│   │   └── ui/                  # Composants Shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── switch.tsx       # Composant switch
│   ├── configs/                 # Configurations
│   │   ├── i18next.config.ts    # i18n pour main process
│   │   └── i18nResources.ts     # i18n pour renderer process
│   ├── locales/                 # Fichiers de traduction
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── fr/
│   │       └── translation.json
│   ├── class/                   # Classes TypeScript
│   │   ├── ConfigData.ts
│   │   ├── InitalizationData.ts
│   │   └── LinuxUpdate.ts
│   ├── shared/                  # Code partagé
│   │   └── constants.ts         # Constantes et configuration par défaut
│   ├── extraResources/          # Ressources packagées
│   │   ├── lib.asar             # Archive des scripts
│   │   └── md/                  # Contenu markdown
│   ├── types.d.ts               # Types TypeScript globaux
│   ├── interface.d.ts           # Interfaces TypeScript
│   └── lib/                     # Scripts Node.js (développement)
│       ├── browser_isInstalled.mjs
│       ├── browser_install.mjs
│       ├── courses_index.mjs
│       └── package.json
├── docs/                        # Documentation
├── .github/                     # GitHub Actions
│   └── workflows/
│       ├── changeset.yml
│       └── release.yml
├── assets/                      # Ressources build
│   └── app-ico/                 # Icônes application
├── scripts/                     # Scripts utilitaires
│   └── create-dmg.js
├── forge.config.js              # Configuration Electron Forge
├── vite.*.config.ts             # Configurations Vite
├── eslint.config.js             # Configuration ESLint
├── prettier.config.mjs          # Configuration Prettier
├── .babelrc                     # Configuration Babel (i18n)
├── package.json
└── README.md
```

## Flux d'exécution

### Démarrage de l'application

1. **Main Process démarre** (`src/main/main.ts`)
    - Initialisation de `electron-log`
    - Configuration des chemins (APP_ROOT, etc.)
    - Création du menu Electron avec sélection de langue
    - Création de la fenêtre principale

2. **Fenêtre principale se charge**
    - En développement : chargement depuis Vite dev server (`http://localhost:5173`)
    - En production : chargement depuis fichier HTML packagé
    - Ouverture automatique des DevTools en développement

3. **Événement `did-finish-load`**
    - Délai de 1 seconde
    - Appel automatique de `initialization()`

4. **Processus d'initialisation**
    - Initialisation d'i18next (chargement des traductions)
    - Vérifications séquentielles (Node.js, dossiers, Puppeteer)
    - Messages envoyés au renderer via IPC
    - Finalisation et marquage comme initialisée

### Communication Main ↔ Renderer

```
Main Process                    Renderer Process
     │                                │
     │── IPC: initialization-messages ──>│
     │                                │  (Affichage modal)
     │<── IPC: initialization-app ────│
     │                                │
     │── IPC: host-informations-back ──>│
     │                                │  (Mise à jour UI)
     │<── IPC: change-language ───────│
     │                                │
     │── IPC: language-changed ───────>│
     │                                │  (Mise à jour i18n)
```

## Gestion des ressources

### Structure des ressources

```
src/extraResources/
├── lib.asar          # Archive ASAR contenant les scripts Node.js
└── md/
    ├── splash-content.en.md
    └── splash-content.fr.md
```

### Chemin des ressources

- **Développement** : `src/extraResources/`
- **Production** : `process.resourcesPath` (configuré dans `forge.config.js`)

### Extraction ASAR (Windows uniquement)

Sur **Windows uniquement**, `lib.asar` est automatiquement extrait vers `lib/` pendant l'initialisation car les archives ASAR ne peuvent pas être lues directement par `utilityProcess.fork` sur cette plateforme.

Sur **macOS et Linux**, `lib.asar` est utilisé directement sans extraction, car `utilityProcess.fork` peut accéder aux fichiers à l'intérieur de l'archive ASAR.

**Fichier responsable** : `src/main/handlers/initHandlers/HandleExtractAsarLib.ts`

### Scripts utilitaires

Les scripts dans `lib/` sont exécutés via `utilityProcess.fork` :

- `browser_isInstalled.mjs` : Vérifie si le navigateur Puppeteer est installé
- `browser_install.mjs` : Installe le navigateur Puppeteer
- `courses_index.mjs` : Gère l'exécution des mesures (simple et complexe)

#### Résolution des chemins des scripts

La résolution des chemins suit une logique cohérente dans tous les handlers (`HandleCollectAll.ts`, `puppeteerBrowser_installation.ts`, etc.) :

**1. Détection de l'environnement** :

```typescript
if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
    // Mode développement
} else if (process.resourcesPath) {
    // Mode production
} else {
    // Fallback
}
```

**2. Chemins selon l'environnement** :

- **Développement** (`!app.isPackaged || WEBPACK_SERVE === 'true'`) :
    - `__dirname/../../lib/` (chemin relatif depuis le fichier compilé)
    - Ou `process.cwd()/lib/` (selon le handler)

- **Production** (`process.resourcesPath` disponible) :
    - **Windows** : `process.resourcesPath/lib/` (après extraction de `lib.asar`)
    - **macOS/Linux** : `process.resourcesPath/lib.asar/` (accès direct à l'archive)

**3. Vérification de `process.resourcesPath`** :

Avant d'utiliser `process.resourcesPath`, il est **toujours vérifié** qu'il existe, car il n'est disponible qu'en production packagée. Un fallback vers le chemin de développement est utilisé si nécessaire.

**Exemple d'implémentation** :

```typescript
let pathToScript: string
if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
    // Développement
    pathToScript = path.join(__dirname, '..', '..', 'lib', 'courses_index.mjs')
} else if (process.resourcesPath) {
    // Production
    pathToScript = path.join(
        process.resourcesPath,
        process.platform === 'win32' ? 'lib' : 'lib.asar',
        'courses_index.mjs'
    )
} else {
    // Fallback
    pathToScript = path.join(__dirname, '..', '..', 'lib', 'courses_index.mjs')
}
```

**Fichiers concernés** :

- `src/main/handlers/HandleCollectAll.ts` : Exécution des mesures
- `src/main/handlers/initHandlers/puppeteerBrowser_installation.ts` : Installation Puppeteer
- `src/main/handlers/initHandlers/puppeteerBrowser_isInstalled.ts` : Vérification Puppeteer

## Points techniques importants

### Chemin des ressources

- En développement : `process.cwd()` ou `APP_ROOT`
- En production : `process.resourcesPath` (configuré par Electron Forge)

**Important** : Toujours vérifier `process.resourcesPath` avant utilisation, car il n'existe qu'en production packagée. Utiliser `app.isPackaged` ou `process.env['WEBPACK_SERVE']` pour détecter l'environnement. Voir la section "Résolution des chemins des scripts" pour un exemple d'implémentation.

### Initialisation i18next

- Asynchrone dans le main process
- Nécessite `await initializeI18n()` avant utilisation
- Chargement explicite du namespace `translation`

### Menu Electron et internationalisation

Le menu Electron est construit dynamiquement avec les traductions i18next et se met à jour automatiquement lors des changements de langue.

**Architecture** :

- **`menuFactory.ts`** : Factory centralisée qui construit le menu selon la plateforme
- **`darwinMenu.ts`** : Template de menu pour macOS
- **`otherMenu.ts`** : Template de menu pour Windows/Linux

**Mise à jour automatique** :

- Un écouteur d'événement `i18n.on('languageChanged', ...)` dans `menuFactory.ts` reconstruit automatiquement le menu quand la langue change
- Les références à `app` et `mainWindow` sont conservées pour permettre la reconstruction
- Le menu est reconstruit immédiatement après chaque changement de langue, garantissant que tous les textes sont à jour

**Flux de changement de langue** :

1. L'utilisateur sélectionne une langue (menu Electron ou composant UI)
2. `i18n.changeLanguage()` est appelé dans le main process
3. L'événement `languageChanged` est émis par i18next
4. `menuFactory.ts` détecte l'événement et reconstruit le menu
5. Toutes les fenêtres sont notifiées via deux événements IPC :
    - `language-changed` : pour synchroniser le composant `LanguageSwitcher`
    - `CHANGE_LANGUAGE_TO_FRONT` : pour mettre à jour i18n dans le renderer via `App.tsx`
6. Le renderer met à jour son interface via `react-i18next` et `i18nResources.changeLanguage()`

**Synchronisation** : Le composant `LanguageSwitcher` est simplifié et utilise directement `i18n.language` comme source de vérité unique. Il ne maintient plus d'état local et délègue toujours le changement de langue au main process via IPC. Cela évite les conflits entre plusieurs sources de vérité et élimine complètement le clignotement. Le composant se re-rend automatiquement grâce à `useTranslation()` quand `i18n.language` change.

### Scripts utilitaires

- Exécutés via `utilityProcess.fork` (isolés du main process)
- Communication via messages IPC
- Gestion des erreurs et logs stdout/stderr
- Résolution des chemins standardisée (voir section "Résolution des chemins des scripts" ci-dessus)

### Logging

- `electron-log` pour les logs structurés
- Fichier de log : `~/Library/Logs/ecoindex-app/main.log` (macOS)
- Niveau debug activé pour le développement

## Configuration Tailwind CSS

### Version et plugins

L'application utilise **Tailwind CSS v3.4.17** avec les plugins suivants :

- `@tailwindcss/typography` : Styles typographiques pour le contenu markdown
- `@tailwindcss/forms` : Styles par défaut pour les formulaires
- `tailwindcss-animate` : Animations pour les composants (accordion, etc.)

### Couleurs personnalisées

Deux palettes de couleurs personnalisées sont définies dans `tailwind.config.js` :

#### `ecoindex-green`

Palette verte principale de l'application (50 à 950) :

- `DEFAULT` : `#008060` (couleur principale)
- Utilisée pour les boutons, liens, et éléments de marque

#### `ecoindex-red`

Palette rouge pour les erreurs et actions destructives (50 à 950) :

- `DEFAULT` : `#dd0055` (couleur principale)
- Utilisée pour les messages d'erreur et boutons destructifs

### Configuration du thème

- **darkMode** : `'selector'` (basé sur la classe `.dark`)
- **container** : Centré avec padding `2rem` et breakpoint `2xl` à `1400px`
- **borderRadius** : Variables CSS (`--radius`) pour cohérence
- **Animations** : `accordion-down` et `accordion-up` pour les composants accordion

### Styles personnalisés

Le fichier `src/renderer/main_window/index.css` contient des styles personnalisés dans `@layer components` :

#### Classes de boutons

- `.btn` : Style de base pour tous les boutons
- `.btn-green` : Bouton vert (style principal)
- `.btn-red` : Bouton rouge (style destructif)
- `.btn-green-outlined` : Bouton vert avec bordure
- `.btn-square` : Bouton carré
- `.btn-small` : Bouton de petite taille

#### Classes utilitaires

- `.echo` : Style pour les zones de code/console
- `.logo-ecoindex` : Style pour le logo Ecoindex
- `.mandatory` : Indicateur visuel pour les champs obligatoires
- `.tooltip` : Style pour les tooltips

#### Styles de formulaires

Styles spécifiques pour `#json-form` et `#simple-form` :

- Labels, inputs, checkboxes
- Fieldsets et legends
- Details/summary pour les sections collapsibles

### Variables CSS

Les couleurs du thème sont définies via des variables CSS dans `:root` et `.dark` :

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--card`, `--popover`
- `--chart-1` à `--chart-5`
- `--radius` : Rayon de bordure par défaut

Ces variables permettent un changement de thème dynamique (light/dark) et une cohérence visuelle.
