# Fonctionnalités

## 1. Processus d'initialisation automatique

L'application effectue une série de vérifications et d'installations au démarrage.

### Étapes d'initialisation

1. **Vérification de Node.js**
    - Détection de la présence de Node.js
    - Vérification de la version (minimum Node.js 20)
    - Affichage d'un lien de téléchargement si Node.js n'est pas installé ou obsolète

2. **Extraction des fichiers (Windows uniquement)**
    - Extraction de `lib.asar` vers le dossier `lib/` si nécessaire
    - Nécessaire pour accéder aux scripts dans l'archive ASAR

3. **Détection des dossiers utilisateur**
    - Récupération du dossier home (`~`)
    - Récupération ou création du dossier de travail (workDir)
    - Persistance du dernier dossier de travail utilisé

4. **Vérification et installation du navigateur Puppeteer**
    - Vérification si le navigateur Chromium de Puppeteer est installé
    - Installation automatique si nécessaire
    - Vérification post-installation

5. **Finalisation**
    - Marquage de l'application comme initialisée
    - Affichage d'un message de succès
    - Fermeture de l'écran de démarrage (splash screen)

### Gestion des erreurs

- **Erreurs fatales** : Arrêt de l'initialisation avec message d'erreur
- **Liens d'aide** : Affichage de liens vers les ressources nécessaires (ex: téléchargement Node.js)
- **Logs détaillés** : Toutes les étapes sont loggées via `electron-log`

## 2. Mode sombre (Dark Mode)

L'application supporte le mode sombre avec détection automatique du mode système.

### Fonctionnalités

- **Détection automatique** : Détecte le mode système au démarrage via `matchMedia('prefers-color-scheme: dark')`
- **Écoute des changements** : Se met à jour automatiquement si l'utilisateur change le mode système
- **Basculement manuel** : Permet de basculer manuellement entre mode clair et sombre via un switch
- **Persistance visuelle** : La classe `dark` est appliquée sur l'élément `<html>` pour activer les styles sombres

### Composant DarkModeSwitcher

**Fichier** : `src/renderer/components/DarkModeSwitcher.tsx`

Le composant affiche :

- Une icône `Sun` (mode clair)
- Un switch pour basculer entre les modes
- Une icône `SunMoon` (mode sombre)

**Positionnement** : Par défaut positionné en `absolute left-2 top-2` dans l'interface principale.

### Configuration Tailwind

Le mode sombre utilise la configuration `darkMode: 'selector'` de Tailwind CSS, ce qui signifie que les styles sombres sont activés via la classe `.dark` sur un élément parent (ici `<html>`).

Les variables CSS définies dans `:root` et `.dark` permettent un changement de thème fluide sans rechargement de page.

## 3. Système d'internationalisation (i18n)

L'application supporte deux langues :

- **Français (fr)**
- **Anglais (en)**

### Configuration i18n

**Main Process** (`src/configs/i18next.config.ts`) :

- Utilise `i18next-fs-backend` pour charger les fichiers JSON
- Chemin des traductions :
    - Développement : `src/locales/{{lng}}/{{ns}}.json`
    - Production : `process.resourcesPath/locales/{{lng}}/{{ns}}.json`
- Initialisation asynchrone avec chargement explicite du namespace `translation`

**Renderer Process** (`src/configs/i18nResources.ts`) :

- Utilise `i18next-resources-to-backend` pour le chargement dynamique
- Chargement de la langue sauvegardée au démarrage
- Écoute des changements de langue depuis le main process

### Changement de langue

- **Menu Electron** : Menu "Language" avec sélection radio (macOS/Windows/Linux)
- **Composant UI** : `LanguageSwitcher` dans l'interface React
- **Persistance** : Langue sauvegardée dans `electron-store`
- **Synchronisation** : Changements propagés entre main et renderer via IPC
- **Mise à jour automatique du menu** : Le menu Electron se reconstruit automatiquement lors des changements de langue grâce à un écouteur d'événement `languageChanged` dans `menuFactory.ts`

## 3. Système de stockage (electron-store)

L'application utilise `electron-store` pour persister les préférences.

### Données stockées

- `language` : Langue sélectionnée (défaut: 'en')
- `lastWorkDir` : Dernier dossier de travail utilisé
- `app_installed_done_once` : Flag d'initialisation complète
- `npmDir` : Chemin du dossier npm global
- `nodeDir` : Chemin de l'exécutable Node.js
- `nodeVersion` : Version de Node.js détectée

### API exposée au renderer

Via `window.store` :

- `set(key, value)` : Sauvegarder une valeur
- `get(key, defaultValue?)` : Récupérer une valeur
- `delete(key)` : Supprimer une clé

## 4. Communication IPC (Inter-Process Communication)

Voir [API.md](API.md) pour la documentation complète des canaux IPC.

### Canaux IPC principaux

**Initialisation** :

- `initialization-app` : Déclencher l'initialisation
- `initialization-messages` : Messages d'état de l'initialisation
- `host-informations-back` : Retour des données d'initialisation

**Langue** :

- `change-language` : Changer la langue
- `get-language` : Récupérer la langue actuelle
- `language-changed` : Notification de changement de langue

**Store** :

- `store-set` : Sauvegarder une valeur
- `store-get` : Récupérer une valeur
- `store-delete` : Supprimer une clé

## 5. Écran de démarrage (Splash Screen) et Popin d'initialisation

L'application affiche une popin d'initialisation pendant le processus d'initialisation avec :

- **Messages de progression traduits** : Tous les messages sont traduits selon la langue sauvegardée dans le store
- **Indicateur de progression** : Barre de progression visuelle (étape X/Y)
- **Spinner animé** : Indicateur de chargement pendant les opérations
- **Gestion des erreurs** : Mode alerte (rouge) avec liens d'aide cliquables
- **Fermeture automatique** : La popin se ferme automatiquement après 2 secondes à la fin de l'initialisation
- **Support multiligne** : Les messages avec sauts de ligne sont correctement affichés
- **Responsive** : Largeur minimale/maximale pour s'adapter au contenu

### Composant InformationPopin

**Fichier** : `src/renderer/components/InformationPopin.tsx`

**Props** :

- `display: boolean` : Afficher/masquer la popin
- `title: string` : Titre de la popin
- `message: string` : Message principal (support multiligne)
- `showSpinner: boolean` : Afficher le spinner animé
- `showProgress: boolean` : Afficher la barre de progression
- `progress: number` : Valeur de progression (0-100)
- `isAlert: boolean` : Mode alerte (rouge pour les erreurs)
- `errorLink?: { label: string, url: string }` : Lien d'aide optionnel

### Chargement de la langue

La langue est chargée depuis le store **avant** l'initialisation pour garantir que tous les messages sont traduits :

1. **Dans `main.ts`** : La langue est lue depuis le store et appliquée à i18next avant la création de la fenêtre
2. **Dans `Initalization.ts`** : Double vérification pour s'assurer que la langue est correctement chargée

```typescript
// Dans main.ts
const savedLanguage = (store.get('language') as string) || 'en'
await i18n.changeLanguage(savedLanguage)

// Dans Initalization.ts
const savedLanguage = (store.get('language') as string) || 'en'
if (i18n.language !== savedLanguage) {
    await i18n.changeLanguage(savedLanguage)
}
```

## 6. Menu Electron

Le menu de l'application inclut :

- **View > Language** : Sélecteur de langue (FR/EN)
- **View > Reload** : Recharger la fenêtre
- **View > Toggle DevTools** : Ouvrir/fermer les DevTools
- **View > Zoom** : Contrôles de zoom
- **View > Fullscreen** : Mode plein écran

## 7. Système d'auto-update

L'application dispose de deux systèmes de mise à jour automatique selon la plateforme :

### 7.1 Auto-update pour macOS et Windows

**Implémentation** : `src/main/Updater.ts`

Utilise l'auto-updater natif d'Electron (`electron.autoUpdater`) avec `update.electronjs.org` pour vérifier et installer automatiquement les mises à jour.

#### Fonctionnalités

- **Vérification automatique** : Vérifie les mises à jour toutes les heures
- **Vérification au démarrage** : Vérifie les mises à jour au lancement de l'application (mode silencieux)
- **Source de mises à jour** : `update.electronjs.org` - service gratuit qui convertit les releases GitHub en format compatible avec l'auto-updater natif
- **Téléchargement en arrière-plan** : Les mises à jour sont téléchargées automatiquement
- **Notifications utilisateur** :
    - Message informatif lors de la disponibilité d'une mise à jour
    - Dialogue de confirmation pour redémarrer après téléchargement
    - Message de confirmation si l'application est à jour (mode non-silencieux uniquement)

#### Configuration

- **Mode production uniquement** : Désactivé en mode développement (utilise `app.isPackaged` pour détecter la production)
- **URL de feed** : Construite dynamiquement depuis `package.json` : `https://update.electronjs.org/{owner}/{repo}/{platform}-{arch}/{version}`
- **User-Agent** : Format `{productName}/{version} ({platform}: {arch})`
- **Repository** : Extrait automatiquement depuis `package.json.repository` (format GitHub : `owner/repo`)

#### Événements gérés

- `error` : Erreurs lors de la vérification/téléchargement
- `checking-for-update` : Début de la vérification
- `update-available` : Mise à jour disponible, téléchargement en cours
- `update-not-available` : Application à jour
- `update-downloaded` : Mise à jour téléchargée, prête à installer

#### Utilisation

```typescript
// Initialisation automatique dans main.ts
if (process.platform !== 'linux') {
    const updater = Updater.getInstance()
    updater.checkForUpdates(true) // Mode silencieux
}

// Vérification manuelle (mode non-silencieux)
updater.checkForUpdates(false)
```

### 7.2 Auto-update spécifique Linux

**Implémentation** : `src/main/main.ts` (fonction `checkLinuxUpdater`)

Linux utilise un système différent car l'auto-updater natif d'Electron ne supporte pas nativement les packages DEB/RPM.

#### Fonctionnalités

- **Vérification via API GitHub** : Interroge l'API GitHub pour les dernières releases
- **Comparaison de versions** : Compare la version actuelle (`package.json`) avec la dernière release
- **Notification IPC** : Envoie un message au renderer si une mise à jour est disponible
- **Téléchargement manuel** : L'utilisateur doit télécharger manuellement depuis GitHub

#### Flux de mise à jour

1. Au démarrage de l'application (si `process.platform === 'linux'`)
2. Requête GET vers `https://api.github.com/repos/cnumr/EcoindexApp/releases/latest`
3. Comparaison de `tags.tag_name` avec `package.json.version`
4. Si différentes versions :
    - Création d'un objet `LinuxUpdate` avec version et URL
    - Envoi via IPC au renderer (`channels.ALERT_LINUX_UPDATE`)

#### API exposée au renderer

```typescript
// Dans preload.ts
window.electronAPI.handleNewLinuxVersion((linuxUpdate: LinuxUpdate) => {
    // linuxUpdate.latestReleaseVersion : Version disponible
    // linuxUpdate.latestReleaseURL : URL de la release GitHub
})
```

#### Classe LinuxUpdate

```typescript
export class LinuxUpdate {
    readonly latestReleaseVersion: string
    readonly latestReleaseURL: string
}
```

### 7.3 Traductions

Toutes les messages de mise à jour sont traduits dans `src/locales/{fr,en}/translation.json` :

**Clés de traduction** :

- `update.newVersionAvailable` : "Une nouvelle version est disponible"
- `update.downloadingInBackground` : "Téléchargement en arrière-plan"
- `update.upToDate` : "Vous êtes à jour"
- `update.currentVersionIsNewest` : "Version actuelle est la plus récente"
- `update.applicationUpdate` : "Mise à jour de l'application"
- `update.restartToApply` : "Redémarrer pour appliquer les mises à jour"
- `update.restart` : "Redémarrer"
- `update.later` : "Plus tard"
- `update.linuxNewVersionAvailable` : "Nouvelle version disponible ({{version}})"

### 7.4 Limitations

**macOS/Windows** :

- Nécessite une configuration correcte de `update.electronjs.org`
- Les tags GitHub doivent suivre la convention SemVer **sans préfixe "v"** (ex: `0.1.16` et non `v0.1.16`)
- Le repository doit être public sur GitHub
- Les releases doivent être publiées sur GitHub Releases avec les artefacts (DMG, ZIP, EXE)

**Linux** :

- Pas de téléchargement automatique
- Pas d'installation automatique
- L'utilisateur doit installer manuellement le nouveau package (DEB/RPM)

## Limitations actuelles

### Fonctionnalités non implémentées

1. **Mesures Lighthouse/Ecoindex** : Canaux IPC définis mais handlers manquants
2. **Interface de configuration avancée** : Non développée
3. **Gestion des rapports** : Non implémentée
4. **Installation/mise à jour des plugins Lighthouse** : Partiellement implémentée

### Dépendances externes

- Node.js 22+ requis sur le système hôte
- Installation automatique de Puppeteer (téléchargement ~300MB)

### Plateformes

- Testé principalement sur macOS
- Windows : extraction ASAR nécessaire
- Linux : support basique

## Évolutions futures prévues

D'après les canaux IPC et interfaces définis, les fonctionnalités suivantes sont prévues :

1. **Mesures simples** : Analyse d'une URL unique
    - **Confirmation si fichier JSON détecté** : Si un fichier de configuration JSON (`input-file.json`) est détecté dans le dossier de travail, une boîte de dialogue de confirmation s'affiche avant de lancer la mesure simple. Cette fonctionnalité permet d'éviter de lancer une mesure simple quand une configuration de mesure complexe existe déjà dans le dossier de travail.
        - Titre : "Voulez-vous vraiment lancer une mesure simple ?"
        - Message : "Un fichier de configuration de mesure complexe a été détecté dans le dossier sélectionné, il semble qu'une mesure de parcours (complexe) soit plus adaptée."
        - Boutons : [Annuler] [Continuer]
        - Si l'utilisateur clique sur "Annuler", la mesure simple n'est pas lancée.
2. **Mesures depuis JSON** : Analyse de plusieurs URLs depuis un fichier de configuration
3. **Gestion des parcours** : Support des "courses" (parcours d'analyse)
4. **Installation de plugins** : Installation/mise à jour des plugins Lighthouse Ecoindex
5. **Génération de rapports** : Création et affichage de rapports HTML
6. **Configuration avancée** : Interface pour configurer les options Lighthouse
