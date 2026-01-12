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

**Mesures** :

- `simple-mesures` : Lancer une mesure simple (une ou plusieurs URLs)
- `save-json-file` : Sauvegarder et/ou exécuter une mesure complexe (parcours)
- `read-reload-json-file` : Lire et recharger un fichier JSON de configuration
- `is-json-config-file-exist` : Vérifier si un fichier JSON de configuration existe
- `asynchronous-log` : Messages de log en temps réel pendant les mesures
- `show-confirm-dialog` : Afficher une boîte de dialogue de confirmation native

**Fichiers et dossiers** :

- `select-folder` : Sélectionner un répertoire de travail
- `select-puppeteer-file` : Sélectionner un fichier de script Puppeteer

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

### Popin de chargement pendant les mesures

**Fichier** : `src/renderer/components/PopinLoading.tsx`

Pendant l'exécution des mesures (simples ou complexes), une popin de chargement s'affiche avec :

- **Titre dynamique** : Affiche le type de mesure en cours (ex: "Url(s) Measure (Simple mode) started 🚀")
- **Console de logs intégrée** : Affiche les logs en temps réel du script de mesure
- **Filtrage intelligent** : N'affiche que les logs générés pendant la mesure en cours (filtre les messages précédents)
- **Fermeture automatique** : Se ferme automatiquement à la fin de la mesure (succès ou échec)
- **Gestion des erreurs** : Affiche les erreurs dans la console intégrée

Cette popin permet à l'utilisateur de suivre la progression des mesures en temps réel et de voir les messages de débogage si nécessaire.

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

## 8. Mesures Lighthouse/Ecoindex

L'application permet d'effectuer des mesures complètes de l'impact écologique de sites web en utilisant Lighthouse et les plugins Ecoindex. Deux modes de mesure sont disponibles : **mesures simples** et **mesures complexes (parcours)**.

### 8.1 Mesures simples

Les mesures simples permettent d'analyser une ou plusieurs URLs individuellement. Chaque URL est traitée séparément et génère son propre rapport.

**Interface** : `src/renderer/components/SimplePanMesure.tsx`

**Handler** : `src/main/handlers/HandleCollectAll.ts` → `handleSimpleCollect`

#### Fonctionnalités

- **Saisie d'URLs multiples** : L'utilisateur peut ajouter plusieurs URLs à analyser
  - **Mode formulaire** (par défaut) : Saisie via interface avec un champ séparé pour chaque URL
  - **Mode texte libre** : Saisie dans un textarea au format une URL par ligne, facilitant le copier-coller de listes d'URLs
  - Bascule entre les deux modes via un bouton avec icônes
  - Conversion bidirectionnelle automatique entre les deux formats
- **Configuration avancée** : Toutes les options de configuration sont disponibles (voir section 8.3)
- **Confirmation intelligente** : Si un fichier de configuration JSON (`ecoindex.json`) est détecté dans le répertoire de travail, une boîte de dialogue de confirmation s'affiche pour suggérer une mesure complexe
- **Génération de rapports** : Génère des rapports HTML, JSON et/ou Statement selon la configuration
- **Ouverture automatique** : À la fin de la mesure, l'explorateur de fichiers s'ouvre automatiquement sur le rapport HTML généré

#### Flux d'exécution

1. L'utilisateur saisit une ou plusieurs URLs dans l'interface
2. Configuration des options avancées (formats de sortie, catégories d'audit, etc.)
3. Vérification du répertoire de travail (confirmation si dossier par défaut)
4. Détection d'un fichier JSON existant (confirmation si détecté)
5. Lancement de la mesure via IPC (`handleSimpleMesures`)
6. Exécution du script `courses_index.mjs` dans un processus séparé
7. Génération des rapports dans `{workDir}/{timestamp}/`
8. Ouverture automatique de l'explorateur de fichiers

#### Formats de sortie

Les rapports sont générés dans le répertoire `{workDir}/{timestamp}/` avec le format suivant :
- `generic.report.html` : Rapport HTML complet avec toutes les métriques
- `generic.report.json` : Rapport JSON avec toutes les données brutes (si activé)
- `generic.statement.json` : Statement JSON pour l'écoindex (si activé et JSON activé)

### 8.2 Mesures complexes (parcours)

Les mesures complexes permettent d'analyser des parcours utilisateur définis dans un fichier JSON. Chaque parcours (course) peut contenir plusieurs URLs et des options spécifiques.

**Interface** : `src/renderer/components/JsonPanMesure.tsx`

**Handler** : `src/main/handlers/HandleCollectAll.ts` → `handleJsonSaveAndCollect`

#### Fonctionnalités

- **Configuration de courses** : L'utilisateur peut définir plusieurs courses (parcours) avec :
  - Nom de la course
  - Target (cible)
  - Description
  - Liste d'URLs à analyser
    - **Mode formulaire** (par défaut) : Saisie via interface avec un champ séparé pour chaque URL
    - **Mode texte libre** : Saisie dans un textarea au format une URL par ligne, facilitant le copier-coller
    - Bascule entre les deux modes disponible pour chaque course
  - Flag "is-best-pages" (une seule course doit être marquée comme best-page)
- **Sauvegarde de configuration** : La configuration est sauvegardée dans `{workDir}/ecoindex.json`
- **Rechargement automatique** : Si un fichier `ecoindex.json` existe dans le répertoire de travail, il est automatiquement chargé au changement de répertoire
- **Exécution des courses** : Toutes les courses sont exécutées séquentiellement via Lighthouse
- **Génération de rapports** : Un rapport est généré pour chaque course

#### Structure d'une course

```json
{
  "name": "Nom de la course",
  "target": "Cible de la course",
  "course": "Description",
  "is-best-pages": false,
  "urls": [
    { "value": "https://www.example.com/" }
  ]
}
```

#### Validation

- **Best-page obligatoire** : Une et une seule course doit être marquée comme "best-page" (`is-best-pages: true`)
- **Statement nécessite JSON** : Si le format Statement est activé, le format JSON doit également être activé

#### Flux d'exécution

1. Configuration des courses dans l'interface
2. Sauvegarde de la configuration dans `ecoindex.json` (optionnel)
3. Lancement des mesures via IPC (`handleJsonSaveAndCollect`)
4. Si `andCollect = true` :
   - Sauvegarde du fichier JSON
   - Exécution du script `courses_index.mjs`
   - Génération des rapports pour chaque course
5. Ouverture automatique du répertoire de travail à la fin

### 8.3 Configuration avancée

L'interface de configuration avancée permet de personnaliser tous les paramètres des mesures Lighthouse.

**Composant** : `src/renderer/components/AdvConfiguration.tsx`

#### Formats de sortie

- **HTML** : Rapport HTML interactif avec visualisations
- **JSON** : Rapport JSON avec toutes les données brutes
- **Statement** : Statement JSON pour l'écoindex (nécessite JSON activé)

#### Catégories d'audit

- **SEO** : Optimisation pour les moteurs de recherche
- **Performance** : Performance et vitesse de chargement
- **Accessibility** : Accessibilité web
- **Best Practices** : Bonnes pratiques web
- **lighthouse-plugin-ecoindex-core** : Plugin Ecoindex (obligatoire, toujours activé)

#### Options avancées

- **Extra headers** : Headers HTTP supplémentaires (cookies, authentification, etc.)
  - Format : Clé-valeur (ex: `Authorization: Bearer token`)
  - Utilisé pour les sites nécessitant une authentification
  - **Mode de saisie** : Le composant `KeyValue` supporte deux modes de saisie :
    - **Mode formulaire** (par défaut) : Saisie via interface avec champs séparés pour chaque paire clé-valeur
      - Les valeurs sont masquées par défaut (type `password`) pour la sécurité
      - Bouton œil pour afficher/masquer chaque valeur individuellement
      - Vérification automatique : empêche l'ajout d'une clé "key" ou "KEY" si elle existe déjà
    - **Mode texte libre** : Saisie dans un textarea au format `clé=valeur` (une paire par ligne)
    - Bascule entre les deux modes via un bouton avec icônes
    - Validation automatique du format en mode texte libre
    - Conversion bidirectionnelle entre les deux formats

- **User-Agent personnalisé** : Personnalisation de l'User-Agent utilisé par Lighthouse

- **Script Puppeteer** : Script JavaScript personnalisé pour des interactions complexes
  - Permet d'effectuer des actions avant la mesure (clics, scrolls, remplissage de formulaires, etc.)
  - Format : Chemin vers un fichier `.js` ou `.mjs`
  - Exécuté avant chaque mesure pour préparer la page

- **Variables d'environnement** : Variables personnalisées à passer au script de mesure
  - Format : Clé-valeur (clés en majuscules)
  - Accessibles dans le script via `process.env.NOM_VARIABLE`
  - **Mode de saisie** : Même fonctionnalité de bascule formulaire/texte libre que pour les extra headers
    - Les valeurs sont masquées par défaut (type `password`) pour la sécurité
    - Bouton œil pour afficher/masquer chaque valeur individuellement
    - Vérification automatique : empêche l'ajout d'une clé "key" ou "KEY" si elle existe déjà
  - Les clés sont automatiquement converties en majuscules en mode texte libre

### 8.4 Gestion des rapports

#### Génération des rapports

Les rapports sont générés dans un répertoire avec timestamp au format ISO :
```
{workDir}/{timestamp}/
```

Exemple : `~/Documents/EcoindexApp/2025-01-15T10-30-45/`

#### Types de rapports

**Rapport HTML** (`generic.report.html`) :
- Rapport interactif avec visualisations
- Métriques Lighthouse (Performance, SEO, Accessibility, Best Practices)
- Métriques Ecoindex (score, émissions CO2, consommation eau)
- Recommandations et opportunités d'amélioration

**Rapport JSON** (`generic.report.json`) :
- Toutes les données brutes de Lighthouse
- Métriques détaillées
- Utilisable pour traitement automatisé

**Statement JSON** (`generic.statement.json`) :
- Statement formaté pour l'écoindex
- Nécessite le format JSON activé
- Utilisé pour générer des rapports consolidés

#### Ouverture automatique

- **Mesures simples** : L'explorateur de fichiers s'ouvre automatiquement sur le fichier `generic.report.html` à la fin de la mesure
- **Mesures complexes** : Le répertoire de travail s'ouvre automatiquement à la fin de toutes les mesures

#### Console de logs

Pendant l'exécution des mesures, tous les logs sont affichés en temps réel dans la console de l'application :
- Progression de chaque mesure
- Messages d'erreur éventuels
- Informations de débogage

### 8.5 Architecture technique des mesures

#### Flux d'exécution

```
Interface React (Renderer)
    ↓
IPC (handleSimpleMesures / handleJsonSaveAndCollect)
    ↓
Main Process (HandleCollectAll.ts)
    ↓
Préparation des données (URLs, config, timestamp)
    ↓
Écriture fichier temporaire command-data.json
    ↓
utilityProcess.fork(courses_index.mjs)
    ↓
Script Node.js isolé qui :
  - Lit command-data.json
  - Lance Lighthouse avec plugin ecoindex
  - Génère les rapports (HTML/JSON/Statement)
  - Envoie des messages de progression via IPC
    ↓
Rapports générés dans {workDir}/{timestamp}/
```

#### Script de mesure

Le script `lib/courses_index.mjs` est exécuté dans un processus séparé (`utilityProcess`) pour :
- Isoler l'exécution de Lighthouse du processus principal
- Éviter de bloquer l'interface utilisateur
- Permettre une meilleure gestion des erreurs

#### Communication IPC

Le script envoie des messages IPC au processus principal :
- `{ type: 'progress', data: string }` : Progression de la mesure
- `{ type: 'error', data: string }` : Erreur rencontrée
- `{ type: 'complete', data: string }` : Mesure terminée avec succès

Les logs stdout/stderr sont également capturés et affichés dans la console.

## Limitations actuelles

### Dépendances externes

- **Node.js 22+** requis sur le système hôte
- **Installation automatique de Puppeteer** : Téléchargement automatique du navigateur Chromium (~300MB) lors de la première utilisation

### Plateformes

- **macOS** : Testé et fonctionnel
- **Windows** : Extraction ASAR nécessaire (automatique)
- **Linux** : Support basique, mises à jour manuelles

### Fonctionnalités partiellement implémentées

- **Installation/mise à jour des plugins Lighthouse** : Vérification et installation automatique partiellement implémentée
