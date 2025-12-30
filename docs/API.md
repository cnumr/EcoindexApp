# API et Communication IPC

## APIs exposées au Renderer Process

### window.ipcRenderer

API basique pour la communication IPC (exposée pour compatibilité).

```typescript
window.ipcRenderer.on(channel: string, listener: Function)
window.ipcRenderer.off(channel: string, listener: Function)
window.ipcRenderer.send(channel: string, ...args: any[])
window.ipcRenderer.invoke(channel: string, ...args: any[]): Promise<any>
```

### window.electronAPI

API pour la gestion de la langue et des mises à jour Linux.

```typescript
// Changer la langue
window.electronAPI.changeLanguage(lang: string): Promise<void>

// Récupérer la langue actuelle
window.electronAPI.getLanguage(): Promise<string>

// Écouter les changements de langue
window.electronAPI.onLanguageChanged(
    callback: (lang: string) => void
): () => void  // Retourne une fonction pour se désabonner

// Écouter les notifications de mise à jour Linux (Linux uniquement)
window.electronAPI.handleNewLinuxVersion(
    callback: (linuxUpdate: LinuxUpdate) => void
): () => void  // Retourne une fonction pour se désabonner

// Écouter les commandes d'affichage du splash screen
window.electronAPI.displaySplashScreen(
    callback: (visibility: boolean) => void
): () => void  // Retourne une fonction pour se désabonner

// Afficher une boîte de dialogue de confirmation native
window.electronAPI.showConfirmDialog(options: {
    title: string
    message: string
    buttons: string[]
}): Promise<boolean>  // Retourne true si l'utilisateur clique sur le dernier bouton (généralement "Continuer")

// Type LinuxUpdate
interface LinuxUpdate {
    readonly latestReleaseVersion: string  // Version disponible (ex: "0.1.16", sans préfixe "v")
    readonly latestReleaseURL: string      // URL de la release GitHub
}
```

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
grep

### window.store

API pour le stockage persistant (electron-store).

```typescript
// Sauvegarder une valeur
window.store.set(key: string, value: unknown): Promise<void>

// Récupérer une valeur
window.store.get(key: string, defaultValue?: unknown): Promise<unknown>

// Supprimer une clé
window.store.delete(key: string): Promise<void>
```

### window.initialisationAPI

API pour l'initialisation de l'application.

```typescript
// Lancer l'initialisation (pour compatibilité, mais maintenant lancée automatiquement)
window.initialisationAPI.initializeApplication(
    forceInitialisation: boolean
): Promise<boolean>

// Écouter les messages d'initialisation
window.initialisationAPI.sendInitializationMessages(
    callback: (message: InitalizationMessage) => void
): () => void  // Retourne une fonction pour se désabonner

// Écouter les données de configuration
window.initialisationAPI.sendConfigDatasToFront(
    callback: (data: ConfigData) => void
): () => void  // Retourne une fonction pour se désabonner
```

**Note importante** : Les messages d'initialisation sont automatiquement traduits selon la langue sauvegardée dans le store. La langue est chargée et appliquée à i18next avant le démarrage de l'initialisation.

## Canaux IPC

### Initialisation

#### `initialization-app`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `forceInitialisation: boolean` (optionnel, défaut: `false`)

**Retour** : `Promise<boolean>`

Déclenche le processus d'initialisation. Retourne `true` si l'initialisation réussit, `false` sinon.

#### `initialization-messages`

**Direction** : Main → Renderer  
**Type** : `webContents.send`  
**Message** : `InitalizationMessage`

```typescript
type InitalizationMessage = {
    type: 'message' | 'data'
    modalType: 'started' | 'error' | 'completed'
    title: string
    message: string
    data?: InitalizationData
    step?: number
    steps?: number
    errorLink?: {
        label: string
        url: string
    }
}
```

Messages de progression et d'état de l'initialisation.

#### `host-informations-back`

**Direction** : Main → Renderer  
**Type** : `webContents.send`  
**Message** : `ConfigData`

Retour des données de configuration après chaque étape d'initialisation.

### Langue

#### `change-language`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `lang: string` ('fr' | 'en')

**Retour** : `Promise<void>`

Change la langue de l'application et met à jour le menu Electron.

#### `get-language`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Retour** : `Promise<string>`

Récupère la langue actuellement sauvegardée.

#### `language-changed`

**Direction** : Main → Renderer  
**Type** : `webContents.send`  
**Message** : `string` (langue)

Notification envoyée à toutes les fenêtres lors d'un changement de langue.

#### `asynchronous-log`

**Direction** : Main → Renderer  
**Type** : `webContents.send`  
**Payload** : `string` (message), `...any[]` (paramètres optionnels)

Notification envoyée pour afficher des messages de console dans le composant `ConsoleApp`. Les messages sont affichés dans le `Textarea` avec un timestamp.

**Utilisation dans le renderer** :

```typescript
// Dans App.tsx - Utiliser useRef pour conserver la référence de la fonction
const handleConsoleMessageRef = useRef<
    ((_event: any, message: string, ...optionalParams: any[]) => void) | null
>(null)

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
            setConsoleMessages((prev) => {
                const timestamp = new Date().toLocaleTimeString()
                return `${prev}${prev ? '\n' : ''}[${timestamp}] ${logMessage}`
            })
        }
    }

    if (window.ipcRenderer && handleConsoleMessageRef.current) {
        window.ipcRenderer.on(
            'asynchronous-log',
            handleConsoleMessageRef.current
        )
    }

    // Cleanup: retirer l'écouteur avec la même référence
    return () => {
        if (window.ipcRenderer && handleConsoleMessageRef.current) {
            window.ipcRenderer.off(
                'asynchronous-log',
                handleConsoleMessageRef.current
            )
        }
    }
}, [t])
```

**Note importante** : Utiliser `useRef` pour conserver la référence de la fonction de callback permet de retirer correctement l'écouteur avec `off()` et d'éviter les messages dupliqués lors des re-renders. `window.ipcRenderer` n'a pas de méthode `removeAllListeners()`.

### Mises à jour Linux

#### `alert-linux-update`

**Direction** : Main → Renderer  
**Type** : `webContents.send`  
**Message** : `LinuxUpdate`

```typescript
class LinuxUpdate {
    readonly latestReleaseVersion: string // Version disponible (ex: "v0.1.16")
    readonly latestReleaseURL: string // URL de la release GitHub
}
```

Notification envoyée uniquement sur Linux lorsqu'une nouvelle version est disponible sur GitHub. L'utilisateur doit télécharger et installer manuellement la nouvelle version.

**Note** : Ce canal n'est utilisé que sur Linux. macOS et Windows utilisent l'auto-updater natif d'Electron (`electron.autoUpdater`) avec `update.electronjs.org` pour les mises à jour automatiques.

### Store

#### `store-set`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `key: string`
- `value: unknown`

**Retour** : `Promise<void>`

Sauvegarde une valeur dans electron-store.

#### `store-get`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `key: string`
- `defaultValue?: unknown`

**Retour** : `Promise<unknown>`

Récupère une valeur depuis electron-store.

#### `store-delete`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `key: string`

**Retour** : `Promise<void>`

Supprime une clé de electron-store.

### Mesures

#### `simple-mesures`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `urlsList: ISimpleUrlInput[]` : Liste des URLs à analyser
- `advConfig: IAdvancedMesureData` : Configuration avancée
- `envVars: IKeyValue | null` : Variables d'environnement optionnelles

**Retour** : `Promise<void>`

Lance une mesure simple (analyse d'une ou plusieurs URLs). Les messages de progression sont envoyés via le canal `asynchronous-log`.

#### `save-json-file`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `jsonData: IJsonMesureData` : Données JSON à sauvegarder
- `workDir: string` : Dossier de travail où sauvegarder le fichier

**Retour** : `Promise<void>`

Sauvegarde un fichier JSON de configuration de mesure complexe.

#### `read-reload-json-file`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `workDir: string` : Dossier de travail où chercher le fichier JSON

**Retour** : `Promise<IJsonMesureData | null>`

Lit et recharge un fichier JSON de configuration depuis le dossier de travail. Retourne `null` si le fichier n'existe pas.

#### `is-json-config-file-exist`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `workDir: string` : Dossier de travail où chercher le fichier JSON

**Retour** : `Promise<boolean>`

Vérifie si un fichier de configuration JSON existe dans le dossier de travail.

#### `show-confirm-dialog`

**Direction** : Renderer → Main  
**Type** : `ipcMain.handle`  
**Paramètres** :

- `options: { title: string, message: string, buttons: string[] }` : Options de la boîte de dialogue

**Retour** : `Promise<boolean>`

Affiche une boîte de dialogue de confirmation native (OS). Retourne `true` si l'utilisateur clique sur le dernier bouton (généralement "Continuer"), `false` sinon.

**Utilisation** : Utilisé pour demander confirmation avant de lancer une mesure simple si un fichier JSON de configuration est détecté.

### Canaux prévus (non implémentés)

Les canaux suivants sont définis dans `src/shared/constants.ts` mais ne sont pas encore implémentés :

- `get-workdir` : Récupérer le dossier de travail
- `get-homedir` : Récupérer le dossier home
- `is-lighthouse-ecoindex-installed` : Vérifier l'installation du plugin
- `install-ecoindex-plugin` : Installer le plugin
- `open-report` : Ouvrir un rapport

## Types TypeScript

### InitalizationMessage

```typescript
type InitalizationMessage = {
    type: 'message' | 'data'
    modalType: 'started' | 'error' | 'completed'
    title: string
    message: string
    data?: InitalizationData
    step?: number
    steps?: number
    errorLink?: {
        label: string
        url: string
    }
}
```

### ConfigData

```typescript
class ConfigData {
    readonly type: string
    result?: object | string | boolean
    error?: any
    message?: string
    readonly errorType?: string
}
```

### LinuxUpdate

```typescript
class LinuxUpdate {
    readonly latestReleaseVersion: string // Version disponible (ex: "v0.1.16")
    readonly latestReleaseURL: string // URL de la release GitHub
}
```

Utilisé uniquement sur Linux pour notifier l'utilisateur d'une nouvelle version disponible.

### InitalizationData

```typescript
class InitalizationData {
    type: InitalizationDataType
    result: any
}

type InitalizationDataType =
    | 'workDir'
    | 'homeDir'
    | 'appReady'
    | 'puppeteer_browser_installed'
    | 'puppeteer_browser_installation'
    | 'app_can_not_be_launched'
    | 'node_installed'
    | 'node_version_ok'
```

## Exemples d'utilisation

### Écouter les messages d'initialisation

```typescript
useEffect(() => {
    const unsubscribe = window.initialisationAPI.sendInitializationMessages(
        async (message: InitalizationMessage) => {
            console.log('Initialization message:', message)

            // Gérer les messages de type 'data' et 'message'
            if (message.type === 'data') {
                // Traiter les données (ex: workDir, homeDir, etc.)
                console.log('Data message:', message.data)
            } else {
                // Mettre à jour le titre et le message
                setTitle(message.title)
                setMessage(message.message)
                setErrorLink(message.errorLink)
            }

            // Mettre à jour la progression
            if (message.step && message.steps) {
                const progress = (message.step / message.steps) * 100
                setProgress(progress)
            }

            // Gérer les différents types de modal
            if (message.modalType === 'started') {
                setDisplayPopin(true)
                setShowSpinner(true)
            } else if (message.modalType === 'completed') {
                // Attendre 2 secondes avant de fermer
                await new Promise((resolve) => setTimeout(resolve, 2000))
                setDisplayPopin(false)
            } else if (message.modalType === 'error') {
                setDisplayPopin(true)
                setShowSpinner(false)
                setIsAlert(true)
            }
        }
    )

    return () => {
        unsubscribe() // Nettoyer l'écouteur
    }
}, [])
```

**Note** : Les messages sont automatiquement traduits selon la langue sauvegardée dans le store. La langue est chargée avant l'initialisation dans le main process.

### Changer la langue

```typescript
const handleLanguageChange = async (lang: string) => {
    await window.electronAPI.changeLanguage(lang)
    // La langue sera automatiquement mise à jour via onLanguageChanged
}
```

### Utiliser le store

```typescript
// Sauvegarder
await window.store.set('myKey', { data: 'value' })

// Récupérer
const value = await window.store.get('myKey', 'defaultValue')

// Supprimer
await window.store.delete('myKey')
```

### Écouter les mises à jour Linux

```typescript
useEffect(() => {
    const unsubscribe = window.electronAPI.handleNewLinuxVersion(
        (linuxUpdate) => {
            const confirmMessage = t('update.linuxNewVersionAvailable', {
                version: linuxUpdate.latestReleaseVersion,
            })

            if (window.confirm(confirmMessage)) {
                // Ouvrir la page de release GitHub dans le navigateur
                window.open(linuxUpdate.latestReleaseURL, '_blank')
            }
        }
    )

    return () => {
        unsubscribe() // Nettoyer l'écouteur
    }
}, [])
```
