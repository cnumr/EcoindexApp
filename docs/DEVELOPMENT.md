# Guide de développement

## Prérequis

- **Node.js 22+** : Version définie dans `.nvmrc`
- **npm** ou **yarn**
- **Git**

## Installation

```bash
# Installer les dépendances principales
npm install

# Installer les dépendances des scripts utilitaires
cd lib && npm ci && cd ..
```

## Scripts de développement

### Démarrage

```bash
npm start
```

Démarre l'application en mode développement avec :

- Hot reload pour le renderer (Vite)
- DevTools automatiquement ouverts
- Logs de debug activés

### Linting et formatage

```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint:fix

# Formater avec Prettier
npm run format
```

### Extraction des clés i18n

```bash
npm run localize:generate
```

Extrait les clés de traduction depuis le code source et les ajoute aux fichiers de traduction.

### Mise à jour des packages

```bash
npm run update-packages
```

Met à jour les packages Lighthouse dans le dossier `lib/`.

## Structure du code

### Conventions de code

- **TypeScript strict** : Typage strict activé
- **ESLint + Prettier** : Formatage automatique
- **Conventional Commits** : Format standardisé des commits
- **Accessibilité** : Règles ESLint jsx-a11y (désactivées pour Shadcn/ui)

### Organisation des fichiers

- **Main Process** : `src/main/`
- **Renderer Process** : `src/renderer/`
    - **Composants React** : `src/renderer/components/`
    - **Utilitaires renderer** : `src/renderer/lib/`
- **Configurations** : `src/configs/`
- **Traductions** : `src/locales/`
- **Code partagé** : `src/shared/`, `src/class/`, `src/types.d.ts`, `src/interface.d.ts`
- **Classes/Interfaces** : `src/class/`, `src/types.d.ts`, `src/interface.d.ts`
- **Constantes** : `src/shared/constants.ts`

### Handlers d'initialisation

Les handlers d'initialisation sont regroupés dans `src/main/handlers/initHandlers/` :

- **`getHomeDir.ts`** : Récupère le dossier home de l'utilisateur
- **`getWorkDir.ts`** : Récupère ou crée le dossier de travail
- **`IsNodeInstalled.ts`** : Vérifie si Node.js est installé
- **`isNodeVersionOK.ts`** : Vérifie si la version de Node.js est compatible
- **`HandleExtractAsarLib.ts`** : Extrait `lib.asar` sur Windows (nécessaire pour les utility processes)
- **`HandleSplashScreen.ts`** : Gère l'affichage du splash screen selon les préférences utilisateur
- **`plugin_isInstalled.ts`** : Vérifie si le plugin Lighthouse Ecoindex est installé
- **`plugin_installNormally.ts`** : Installe le plugin Lighthouse Ecoindex
- **`puppeteerBrowser_isInstalled.ts`** : Vérifie si le navigateur Puppeteer est installé
- **`puppeteerBrowser_installation.ts`** : Installe le navigateur Puppeteer

**Note** : `HandleExtractAsarLib` et `HandleSplashScreen` ont été déplacés dans `initHandlers/` pour regrouper tous les handlers liés à l'initialisation au même endroit.

### Gestion des erreurs

- Utilisation de `electron-log` pour tous les logs
- Try-catch autour des opérations critiques
- Messages d'erreur traduits via i18n
- Affichage d'erreurs dans l'UI avec liens d'aide

## Git hooks

### pre-commit

Exécute automatiquement :

- ESLint sur les fichiers modifiés
- Prettier pour formater le code

Les fichiers sont automatiquement formatés avant le commit.

### commit-msg

Valide le format des messages de commit selon **Conventional Commits** :

- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Formatage
- `refactor:` : Refactoring
- `test:` : Tests
- `chore:` : Maintenance

Exemple :

```
feat: add language switcher component
fix: resolve i18n initialization issue
docs: update API documentation
```

## Workflow de contribution

1. **Créer une branche** depuis `main`

    ```bash
    git checkout -b feat/ma-fonctionnalite
    ```

2. **Développer et tester**
    - Écrire le code
    - Tester manuellement
    - Vérifier avec `npm run lint`

3. **Créer un changeset** (si changement de version)

    ```bash
    npm run changeset
    ```

4. **Commit**

    ```bash
    git add .
    git commit -m "feat: description de la fonctionnalité"
    ```

5. **Push et Pull Request**
    ```bash
    git push origin feat/ma-fonctionnalite
    ```

## Tests

Actuellement, il n'y a pas de tests automatisés. Les tests sont effectués manuellement :

1. Tester sur la plateforme de développement
2. Vérifier les logs pour les erreurs
3. Tester les fonctionnalités principales :
    - Initialisation
    - Changement de langue
    - Persistance des données

### Test de l'auto-updater

Pour tester le système de mise à jour automatique avant de publier une release, consultez le guide détaillé : [TESTING_AUTO_UPDATER.md](./TESTING_AUTO_UPDATER.md)

**Méthode rapide** (en mode développement) :
1. Ouvrir les DevTools (`View > Toggle DevTools`)
2. Dans la console, exécuter :
   ```javascript
   window.electronAPI.testUpdateDialog()
   ```
3. La boîte de dialogue de mise à jour devrait apparaître

## Debugging

### Logs

Les logs sont disponibles dans :

- **Console** : Sortie directe dans le terminal
- **Fichier** : `~/Library/Logs/ecoindex-app/main.log` (macOS)

Le niveau de log est configuré en `debug` pour le développement.

### DevTools

Les DevTools sont automatiquement ouverts en mode développement. Utilisez-les pour :

- Inspecter le DOM
- Voir les erreurs JavaScript
- Déboguer le renderer process

### Debug du Main Process

Pour déboguer le main process, utilisez `console.log` ou `electron-log` :

```typescript
import { getMainLog } from '../main'

const mainLog = getMainLog().scope('mon-module')
mainLog.debug('Message de debug')
mainLog.info("Message d'information")
mainLog.error("Message d'erreur", error)
```

## Points d'attention

### Chemins de fichiers

- **Développement** : Utiliser `process.cwd()` ou `APP_ROOT`
- **Production** : Utiliser `process.resourcesPath` ou `app.getAppPath()`
- Toujours vérifier `app.isPackaged` avant d'utiliser `process.resourcesPath`

### Initialisation i18next

L'initialisation d'i18next est asynchrone. Toujours attendre :

```typescript
await initializeI18n()
// Maintenant on peut utiliser i18n.t()
```

**Important** : La langue doit être chargée depuis le store **avant** l'initialisation pour garantir que tous les messages sont traduits :

```typescript
// Dans main.ts
await initializeI18n()
const savedLanguage = (store.get('language') as string) || 'en'
await i18n.changeLanguage(savedLanguage)
// Maintenant l'initialisation peut commencer avec les bonnes traductions
```

### Menu Electron et changements de langue

Le menu Electron se met à jour automatiquement lors des changements de langue grâce à un écouteur d'événement dans `menuFactory.ts` :

**Fonctionnement** :

1. **Écouteur d'événement** : `menuFactory.ts` écoute l'événement `languageChanged` d'i18next
2. **Reconstruction automatique** : Quand la langue change, le menu est automatiquement reconstruit avec les nouvelles traductions
3. **Références conservées** : Les références à `app` et `mainWindow` sont conservées pour permettre la reconstruction

**Code** :

```typescript
// menuFactory.ts
i18n.on('languageChanged', () => {
    if (currentApp && currentMainWindow) {
        mainLog.debug('Language changed, rebuilding menu...')
        buildMenu(currentApp, currentMainWindow, i18n)
    }
})
```

**Changements de langue déclenchent la reconstruction** :

- Sélection d'une langue dans le menu Electron (menu "Language")
- Changement via le composant `LanguageSwitcher` dans le renderer
- Tout appel à `i18n.changeLanguage()` depuis n'importe où dans l'application

**Note** : Les handlers de clic dans `darwinMenu.ts` et `otherMenu.ts` utilisent `.then()` après `changeLanguage()` pour s'assurer que l'événement est bien émis avant de notifier les fenêtres.

**Synchronisation entre menu et interface** :

Pour garantir que toute l'interface (menu, bouton de langue, et contenu) se met à jour correctement lors d'un changement de langue, deux événements IPC sont envoyés :

1. **`language-changed`** : Notifie le composant `LanguageSwitcher` pour synchroniser l'état local
2. **`CHANGE_LANGUAGE_TO_FRONT`** : Notifie `App.tsx` pour mettre à jour i18n dans le renderer via `i18nResources.changeLanguage()`

**Flux complet** :

- **Depuis le menu Electron** :
    1. Clic sur une langue dans le menu
    2. `i18n.changeLanguage()` est appelé dans le main process
    3. Les deux événements IPC sont envoyés à toutes les fenêtres
    4. `App.tsx` reçoit `CHANGE_LANGUAGE_TO_FRONT` et met à jour i18n
    5. `LanguageSwitcher` reçoit `language-changed` et synchronise son état

- **Depuis le bouton `LanguageSwitcher`** :
    1. Clic sur un bouton de langue
    2. L'état local `currentLang` est mis à jour immédiatement (pour l'UI)
    3. `window.electronAPI.changeLanguage()` est appelé (IPC vers main)
    4. Le main process appelle `changeLanguage()` qui envoie les deux événements
    5. `App.tsx` reçoit `CHANGE_LANGUAGE_TO_FRONT` et met à jour i18n
    6. `LanguageSwitcher` écoute aussi `i18n.on('languageChanged')` pour synchroniser

**Important** : Le composant `LanguageSwitcher` est maintenant simplifié et utilise directement `i18n.language` comme source de vérité. Il ne maintient plus d'état local et délègue toujours le changement de langue au main process via IPC. Cela évite les conflits entre plusieurs sources de vérité et élimine le clignotement.

**Architecture simplifiée** :

- Le composant lit directement `i18n.language` via `useTranslation()`
- Au clic, il appelle `window.electronAPI.changeLanguage(lang)`
- Le main process change la langue et envoie `CHANGE_LANGUAGE_TO_FRONT`
- `App.tsx` reçoit l'événement et met à jour i18n via `i18nResources.changeLanguage()`
- `i18n.language` est mis à jour automatiquement
- Le composant se re-rend automatiquement grâce à `useTranslation()`

Plus de `useEffect` redondants, plus d'état local, plus de conflits.

### Affichage des messages de console

Le composant `ConsoleApp` affiche les messages envoyés depuis le main process via `_sendMessageToFrontConsole()` dans un `Textarea`.

**Flux** :

1. Le main process appelle `_sendMessageToFrontConsole(message, ...optionalParams)`
2. Cela envoie un événement IPC `asynchronous-log` au renderer
3. `useIpcListeners` écoute cet événement via `window.ipcRenderer.on('asynchronous-log', ...)`
4. Les messages sont accumulés dans l'état `consoleMessages` avec un timestamp
5. `ConsoleApp` reçoit `consoleMessages` via une prop et l'affiche dans le `Textarea`

**Gestion du cleanup et déduplication** :

Pour éviter les messages dupliqués lors des re-renders, plusieurs mécanismes sont en place :

1. **Référence stable** : La fonction de callback est stockée dans un `useRef` pour maintenir une référence stable
2. **Flag de suivi** : Un flag `isListenerAddedRef` garantit qu'un seul écouteur est ajouté
3. **Déduplication** : Un mécanisme de déduplication ignore les messages identiques reçus dans les 100ms

```typescript
const handleConsoleMessageRef = useRef<
    ((_event: any, message: string, ...optionalParams: any[]) => void) | null
>(null)
const isListenerAddedRef = useRef<boolean>(false)
const lastMessageRef = useRef<{ message: string; timestamp: number } | null>(
    null
)

useEffect(() => {
    // Créer la fonction une seule fois
    if (!handleConsoleMessageRef.current) {
        handleConsoleMessageRef.current = (
            _event,
            message,
            ...optionalParams
        ) => {
            const logMessage =
                optionalParams && optionalParams.length > 0
                    ? `${message} ${optionalParams.join(' ')}`
                    : message || ''

            // Déduplication : ignorer les messages identiques reçus dans les 100ms
            const now = Date.now()
            const lastMessage = lastMessageRef.current
            if (
                lastMessage &&
                lastMessage.message === logMessage &&
                now - lastMessage.timestamp < 100
            ) {
                return // Message dupliqué, l'ignorer
            }

            lastMessageRef.current = { message: logMessage, timestamp: now }

            setConsoleMessages((prev) => {
                const timestamp = new Date().toLocaleTimeString()
                return `${prev}${prev ? '\n' : ''}[${timestamp}] ${logMessage}`
            })
        }
    }

    // Nettoyer l'écouteur existant avant d'en ajouter un nouveau
    if (window.ipcRenderer && handleConsoleMessageRef.current) {
        window.ipcRenderer.off(
            'asynchronous-log',
            handleConsoleMessageRef.current
        )

        // Ajouter le nouvel écouteur uniquement s'il n'a pas déjà été ajouté
        if (!isListenerAddedRef.current) {
            window.ipcRenderer.on(
                'asynchronous-log',
                handleConsoleMessageRef.current
            )
            isListenerAddedRef.current = true
        }
    }

    // Cleanup: retirer l'écouteur avec la même référence
    return () => {
        if (
            window.ipcRenderer &&
            handleConsoleMessageRef.current &&
            isListenerAddedRef.current
        ) {
            window.ipcRenderer.off(
                'asynchronous-log',
                handleConsoleMessageRef.current
            )
            isListenerAddedRef.current = false
        }
    }
}, [])
```

**Auto-scroll** :

Le `Textarea` de `ConsoleApp` scroll automatiquement vers le bas quand de nouveaux messages arrivent :

```typescript
const consoleTextareaRef = useRef<HTMLTextAreaElement>(null)

useEffect(() => {
    if (consoleTextareaRef.current) {
        const textarea = consoleTextareaRef.current
        textarea.scrollTop = textarea.scrollHeight
    }
}, [consoleMessages])
```

**Important** : `window.ipcRenderer` n'a pas de méthode `removeAllListeners()`. Il faut utiliser `off()` avec la même référence de fonction pour retirer l'écouteur correctement. Cela garantit qu'il n'y a qu'un seul écouteur actif à la fois et évite les messages dupliqués.

### Affichage des logs de mesure dans la popin

Lorsqu'une mesure est lancée (simple ou JSON), une popin `PopinLoading` s'affiche avec un `Textarea` dans le footer qui affiche uniquement les logs générés depuis le début de la mesure.

**Flux** :

1. Au début de `runSimpleMesures` ou `runJsonSaveAndCollect`, un snapshot de `consoleMessages` est capturé dans `consoleMessagesSnapshot`
2. Les messages continuent d'être ajoutés à `consoleMessages` via l'écouteur IPC
3. `measureConsoleMessages` calcule la différence entre `consoleMessages` et `consoleMessagesSnapshot` pour n'afficher que les nouveaux messages
4. Le `Textarea` dans le footer de `PopinLoading` affiche `measureConsoleMessages`

**Implémentation** :

```typescript
// Dans useAppHandlers.ts
const runSimpleMesures = async () => {
    // Capturer l'état actuel des messages console pour filtrer ensuite
    setConsoleMessagesSnapshot(consoleMessages)
    // ... reste du code
}

// Dans App.tsx
const measureConsoleMessages = (() => {
    if (!consoleMessagesSnapshot || !consoleMessagesSnapshot.trim()) {
        return consoleMessages.trim()
    }

    if (!consoleMessages || !consoleMessages.trim()) {
        return ''
    }

    // Vérifier si consoleMessages commence par le snapshot
    if (consoleMessages.startsWith(consoleMessagesSnapshot)) {
        const newMessages = consoleMessages.slice(
            consoleMessagesSnapshot.length
        )
        return newMessages.replace(/^\n+/, '').trim()
    }

    // Si le snapshot n'est pas au début, chercher son index
    const snapshotIndex = consoleMessages.indexOf(consoleMessagesSnapshot)

    if (snapshotIndex === -1) {
        return consoleMessages.trim()
    }

    const newMessages = consoleMessages.slice(
        snapshotIndex + consoleMessagesSnapshot.length
    )
    return newMessages.replace(/^\n+/, '').trim()
})()

// Auto-scroll pour le Textarea de la popin
const popinTextareaRef = useRef<HTMLTextAreaElement>(null)

useEffect(() => {
    if (popinTextareaRef.current && displayPopin) {
        const textarea = popinTextareaRef.current
        textarea.scrollTop = textarea.scrollHeight
    }
}, [measureConsoleMessages, displayPopin])
```

**Auto-scroll** :

Le `Textarea` dans le footer de `PopinLoading` scroll automatiquement vers le bas quand de nouveaux messages arrivent, permettant à l'utilisateur de suivre la progression de la mesure en temps réel.

### Gestion des listeners IPC et prévention des fuites mémoire

**Problème** : Les listeners IPC peuvent être ajoutés plusieurs fois lors des re-renders du composant, causant des fuites mémoire et des avertissements `MaxListenersExceededWarning`.

**Solution** : Utiliser des `useRef` pour stocker les fonctions de cleanup retournées par les APIs IPC et les appeler dans le cleanup du `useEffect`.

**Implémentation dans `App.tsx`** :

```typescript
// Déclarer les refs pour stocker les fonctions de cleanup
const cleanupLinuxVersionRef = useRef<(() => void) | null>(null)
const cleanupSendDatasRef = useRef<(() => void) | null>(null)
const cleanupChangeLanguageRef = useRef<(() => void) | null>(null)
const cleanupInitializationRef = useRef<(() => void) | null>(null)

// Ref pour stocker la fonction de traduction la plus récente
const tRef = useRef(t)
useEffect(() => {
    tRef.current = t
}, [t])

useEffect(() => {
    // Nettoyer le listener précédent s'il existe
    if (cleanupLinuxVersionRef.current) {
        cleanupLinuxVersionRef.current()
    }
    // Stocker la nouvelle fonction de cleanup
    cleanupLinuxVersionRef.current = window.electronAPI.handleNewLinuxVersion(
        (linuxUpdate: LinuxUpdate) => {
            // Utiliser tRef.current au lieu de t pour les traductions
            const resp = window.confirm(
                tRef.current('A new version...', { version: ... })
            )
            // ... logique du handler
        }
    )

    // Répéter pour tous les autres listeners...

    // Cleanup: retirer tous les écouteurs IPC
    return () => {
        if (cleanupLinuxVersionRef.current) {
            cleanupLinuxVersionRef.current()
            cleanupLinuxVersionRef.current = null
        }
        // Répéter pour tous les autres listeners...
    }
}, []) // Tableau de dépendances vide : les listeners ne doivent être ajoutés qu'une seule fois
```

**Avantages** :

- Prévention des fuites mémoire
- Évite les avertissements `MaxListenersExceededWarning`
- Garantit qu'il n'y a qu'un seul listener actif par événement IPC
- Nettoyage automatique lors du démontage du composant ou des re-renders

**Listeners concernés** :

- `host-informations-back` (via `sendDatasToFront`)
- `alert-linux-update` (via `handleNewLinuxVersion`)
- `asynchronous-log` (via `window.ipcRenderer.on`)
- `change-language-to-front` (via `changeLanguageInFront`)
- `initialization-messages` (via `sendInitializationMessages`)

**Note importante sur `asynchronous-log`** :
Le listener `asynchronous-log` nécessite un traitement spécial car il utilise directement `window.ipcRenderer.on()` au lieu d'une API wrapper. Il faut :

1. Nettoyer le listener avant de le réajouter : `window.ipcRenderer.off('asynchronous-log', handleConsoleMessageRef.current)` puis `window.ipcRenderer.on(...)`
2. Utiliser un tableau de dépendances vide `[]` pour le `useEffect` principal afin d'éviter les réexécutions
3. Si des traductions sont utilisées dans les callbacks, utiliser un `tRef` pour maintenir les traductions à jour sans réexécuter le `useEffect` :

```typescript
const tRef = useRef(t)
useEffect(() => {
    tRef.current = t
}, [t])

// Dans les callbacks, utiliser tRef.current au lieu de t
```

### Popin d'initialisation

Le composant `InformationPopin` affiche les messages d'initialisation dans le renderer. Pour l'utiliser :

1. **Écouter les messages** via `window.initialisationAPI.sendInitializationMessages()`
2. **Gérer les états** : `display`, `title`, `message`, `progress`, `isAlert`, etc.
3. **Afficher le composant** dans le JSX avec les props appropriées

**Exemple d'utilisation** : Voir `src/renderer/main_window/hooks/useIpcListeners.ts` pour une implémentation complète.

### Architecture modulaire avec hooks personnalisés

Le composant `App.tsx` a été refactorisé pour améliorer la maintenabilité et réduire sa taille (de 834 à 404 lignes, soit ~52% de réduction).

**Structure des hooks** :

1. **`useAppState.ts`** : Gère tous les états React du composant
    - États principaux (workDir, homeDir, appReady, etc.)
    - États pour les popins et notifications
    - États pour les mesures (urlsList, jsonDatas, envVars, etc.)
    - Gestion de la traduction avec `tRef` pour éviter les re-renders

2. **`useAppUtils.ts`** : Fonctions utilitaires mémorisées avec `useCallback`
    - `sleep` : Fonction d'attente avec gestion de timeout
    - `showNotification` : Affichage de notifications système
    - `blockScrolling` : Blocage/déblocage du scroll de la page
    - `showHidePopinDuringProcess` : Gestion de la popin de chargement

3. **`useAppHandlers.ts`** : Handlers pour les actions utilisateur
    - `runSimpleMesures` : Lancement des mesures simples
    - `runJsonReadAndReload` : Lecture et rechargement de la config JSON
    - `runJsonSaveAndCollect` : Sauvegarde et lancement des mesures JSON
    - `selectWorkingFolder` : Sélection du dossier de travail
    - `launchInitialization` : Lancement de l'initialisation

4. **`useIpcListeners.ts`** : Gestion de tous les listeners IPC
    - Listeners pour les mises à jour Linux
    - Listener pour les données depuis le main process
    - Listener pour les messages de console asynchrones
    - Listener pour les changements de langue
    - Listener pour les messages d'initialisation
    - Cleanup automatique de tous les listeners au démontage

5. **`useWorkDirEffect.ts`** : Effet pour détecter les changements de workDir
    - Vérifie l'existence d'un fichier JSON de configuration
    - Recharge automatiquement la configuration si elle existe

**Avantages de cette architecture** :

- **Séparation des responsabilités** : Chaque hook a un rôle précis
- **Réutilisabilité** : Les hooks peuvent être réutilisés dans d'autres composants
- **Testabilité** : Chaque hook peut être testé indépendamment
- **Maintenabilité** : Code plus facile à comprendre et modifier
- **Performance** : Fonctions mémorisées pour éviter les re-renders inutiles

**Exemple d'utilisation dans App.tsx** :

```typescript
function TheApp() {
    // États et traduction
    const state = useAppState()
    const { t, workDir, appReady, ... } = state

    // Utilitaires
    const { sleep, showNotification, blockScrolling } = useAppUtils()

    // Handlers
    const { runSimpleMesures, selectWorkingFolder, ... } = useAppHandlers({
        workDir,
        ...state,
        ...utils
    })

    // Listeners IPC (s'ajoutent automatiquement au montage)
    useIpcListeners({
        tRef: state.tRef,
        ...state,
        sleep
    })

    // Effet pour workDir
    useWorkDirEffect({
        workDir,
        runJsonReadAndReload
    })

    // JSX...
}
```

### Scripts utilitaires et résolution des chemins

Les scripts dans `lib/` sont exécutés via `utilityProcess.fork`. La résolution des chemins suit une logique standardisée dans tous les handlers.

#### Détection de l'environnement

La détection du mode développement/production utilise deux critères :

1. **`app.isPackaged`** : Indique si l'application est packagée (production)
2. **`process.env['WEBPACK_SERVE'] === 'true'`** : Indique si le serveur de développement Vite est actif

**Logique de détection** :

```typescript
if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
    // Mode développement
} else if (process.resourcesPath) {
    // Mode production
} else {
    // Fallback (développement)
}
```

#### Chemins selon l'environnement

**Développement** :

- `__dirname/../../lib/` (chemin relatif depuis le fichier compilé)
- Ou `process.cwd()/lib/` (selon le handler)

**Production** :

- **Windows** : `process.resourcesPath/lib/` (après extraction de `lib.asar` pendant l'initialisation)
- **macOS/Linux** : `process.resourcesPath/lib.asar/` (accès direct à l'archive, pas d'extraction nécessaire)

#### Vérification de `process.resourcesPath`

**Important** : `process.resourcesPath` n'existe qu'en production packagée. Il doit **toujours être vérifié** avant utilisation :

```typescript
if (process.resourcesPath) {
    // Utiliser process.resourcesPath
} else {
    // Fallback vers le chemin de développement
}
```

#### Extraction de `lib.asar` (Windows uniquement)

Sur Windows, `lib.asar` est automatiquement extrait vers `lib/` pendant l'initialisation par `HandleExtractAsarLib.ts`. Cette extraction est **uniquement nécessaire sur Windows** car `utilityProcess.fork` ne peut pas accéder directement aux fichiers dans `lib.asar` sur cette plateforme.

Sur macOS/Linux, aucune extraction n'est nécessaire car `utilityProcess.fork` peut accéder directement aux fichiers dans `lib.asar`.

#### Exemple d'implémentation standardisée

Tous les handlers utilisent la même logique pour garantir la cohérence :

```typescript
let pathToScript: string
if (!app.isPackaged || process.env['WEBPACK_SERVE'] === 'true') {
    // En développement : utiliser le dossier lib du projet
    pathToScript = path.join(__dirname, '..', '..', 'lib', 'courses_index.mjs')
    mainLog.debug(`Using development path: ${pathToScript}`)
} else if (process.resourcesPath) {
    // En production packagée : utiliser process.resourcesPath
    pathToScript = path.join(
        process.resourcesPath,
        process.platform === 'win32' ? 'lib' : 'lib.asar',
        'courses_index.mjs'
    )
    mainLog.debug(`Using production path: ${pathToScript}`)
} else {
    // Fallback : utiliser le dossier lib du projet
    pathToScript = path.join(__dirname, '..', '..', 'lib', 'courses_index.mjs')
    mainLog.warn(
        `process.resourcesPath not available, using fallback: ${pathToScript}`
    )
}
```

**Fichiers utilisant cette logique** :

- `src/main/handlers/HandleCollectAll.ts`
- `src/main/handlers/initHandlers/puppeteerBrowser_installation.ts`
- `src/main/handlers/initHandlers/puppeteerBrowser_isInstalled.ts`

### Variables d'environnement

Les variables d'environnement sont chargées depuis `.env` via `dotenv`. Voir [BUILD.md](BUILD.md) pour la liste complète.

## Styling avec Tailwind CSS

### Utilisation des classes

L'application utilise Tailwind CSS v3 avec des classes utilitaires. Exemples :

```tsx
// Bouton vert principal
<button className="btn btn-green">Action</button>

// Bouton rouge destructif
<button className="btn btn-red">Supprimer</button>

// Utilisation des couleurs personnalisées
<div className="bg-ecoindex-green-500 text-ecoindex-green-950">
  Contenu
</div>
```

### Classes personnalisées disponibles

#### Boutons

- `btn` : Style de base
- `btn-green` : Bouton vert principal
- `btn-red` : Bouton rouge destructif
- `btn-green-outlined` : Bouton vert avec bordure
- `btn-square` : Bouton carré
- `btn-small` : Bouton de petite taille

#### Utilitaires

- `echo` : Zone de code/console
- `logo-ecoindex` : Logo Ecoindex
- `mandatory` : Indicateur de champ obligatoire
- `tooltip` : Tooltip personnalisé

### Couleurs personnalisées

Les couleurs `ecoindex-green` et `ecoindex-red` sont disponibles avec toutes leurs nuances (50, 100, 200, ..., 950) :

```tsx
// Exemples
<div className="bg-ecoindex-green-500">...</div>
<div className="text-ecoindex-red-600">...</div>
<div className="border-ecoindex-green-800">...</div>
```

### Mode sombre

Le mode sombre est géré via la classe `.dark` sur l'élément `<html>`. Les variables CSS s'adaptent automatiquement.

#### Utilisation du composant DarkModeSwitcher

Le composant `DarkModeSwitcher` est déjà intégré dans `App.tsx`. Pour l'utiliser ailleurs :

```tsx
import { DarkModeSwitcher } from '@/components/DarkModeSwitcher'

// Utilisation basique
<DarkModeSwitcher />

// Avec positionnement personnalisé
<DarkModeSwitcher
    className="absolute left-2 top-2 z-20 flex gap-2"
    visible={true}
/>
```

**Props disponibles** :

- `visible` : Affiche ou masque le composant (défaut: `true`)
- `className` : Classes CSS personnalisées
- Toutes les props HTML standard pour un `<div>`

#### Fonctionnement interne

1. **Initialisation** : Détecte le mode système au montage
2. **Écoute** : Écoute les changements de préférence système
3. **Application** : Applique/retire la classe `dark` sur `<html>` selon l'état
4. **Basculement** : Permet le basculement manuel via le switch

#### Styles en mode sombre

Les styles sombres sont définis dans `src/renderer/main_window/index.css` :

```css
.dark {
    --background: 20 14.3% 4.1%;
    --foreground: 0 0% 95%;
    /* ... autres variables ... */
}
```

Tous les composants utilisant les variables CSS s'adaptent automatiquement au mode sombre.

### Ajout de nouveaux styles

Pour ajouter de nouveaux styles personnalisés :

1. **Styles utilitaires** : Ajouter dans `@layer components` dans `src/renderer/main_window/index.css`
2. **Nouvelles couleurs** : Ajouter dans `theme.extend.colors` dans `tailwind.config.js`
3. **Nouvelles animations** : Ajouter dans `theme.extend.animation` dans `tailwind.config.js`

**Exemple** :

```css
@layer components {
    .mon-style-personnalise {
        @apply flex items-center gap-2 rounded-lg px-4 py-2;
    }
}
```

## Dependencies

### Dépendances principales

- `electron` : Framework desktop
- `react`, `react-dom` : Framework UI
- `electron-store` : Persistance
- `electron-log` : Logging
- `i18next` : Internationalisation

### Dépendances de développement

- `@electron-forge/cli` : Build tooling
- `typescript` : Typage
- `eslint` : Linter
- `prettier` : Formateur
- `vite` : Build tool

### Scripts utilitaires (`lib/`)

Les scripts dans `lib/` ont leurs propres dépendances :

- `lighthouse`
- `lighthouse-plugin-ecoindex-core`
- `lighthouse-plugin-ecoindex-courses`

Installées via `npm ci` dans le dossier `lib/`.

## Ressources

- [Documentation Electron](https://www.electronjs.org/docs)
- [Documentation React](https://react.dev/)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation i18next](https://www.i18next.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
