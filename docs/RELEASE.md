# Guide de Release et Workflow GitHub

Ce document décrit le processus complet de création de releases pour l'application EcoindexApp, incluant l'utilisation de Changesets, la gestion des versions, et la génération automatique des builds pour toutes les plateformes.

## Vue d'ensemble du processus

Le processus de release est entièrement automatisé via GitHub Actions et utilise Changesets pour la gestion des versions. Le workflow se compose de deux étapes principales :

1. **Changeset** : Création d'une Pull Request pour la version
2. **Release** : Build et publication automatique après merge de la PR

```
┌─────────────────┐
│  Développeur    │
│  Crée changeset │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push sur main  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Workflow: changeset.yml        │
│  - Détecte les changesets        │
│  - Crée PR "chore: version      │
│    packages"                     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Merge de la PR                 │
│  (commit "chore: version        │
│   packages")                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Workflow: release.yml          │
│  - Détecte le commit de version  │
│  - Build pour toutes les OS     │
│  - Crée Release GitHub          │
└─────────────────────────────────┘
```

## Étape 1 : Création d'un Changeset

### Qu'est-ce qu'un Changeset ?

Un changeset est un fichier Markdown dans `.changeset/` qui décrit les modifications apportées à l'application. Il permet de :

- Documenter les changements (features, fixes, breaking changes)
- Déterminer automatiquement le type de version (major, minor, patch)
- Générer automatiquement le changelog

### Créer un changeset

#### Méthode 1 : Via la ligne de commande (recommandé)

```bash
npm run changeset
```

Cette commande vous guide interactivement :

1. Sélection des packages à modifier (généralement `ecoindex-app`)
2. Choix du type de changement :
    - **patch** : Corrections de bugs, améliorations mineures
    - **minor** : Nouvelles fonctionnalités (rétrocompatible)
    - **major** : Changements incompatibles (breaking changes)
3. Description des changements (sera utilisé dans le changelog)

#### Méthode 2 : Création manuelle

Créez un fichier dans `.changeset/` avec un nom unique (ex: `fix-macos-runner.md`) :

```markdown
---
'ecoindex-app': patch
---

## Description des changements

Détails des modifications apportées...
```

**Format du fichier** :

- **En-tête YAML** : Définit le package et le type de version
- **Corps Markdown** : Description qui apparaîtra dans le changelog

### Types de version

- **`patch`** : Corrections de bugs, améliorations mineures, documentation
    - Exemple : `0.1.15` → `0.1.16`
- **`minor`** : Nouvelles fonctionnalités (rétrocompatibles)
    - Exemple : `0.1.15` → `0.2.0`
- **`major`** : Changements incompatibles (breaking changes)
    - Exemple : `0.1.15` → `1.0.0`

### Exemples de changesets

#### Patch (correction)

```markdown
---
'ecoindex-app': patch
---

## Fix

- Correction du runner macOS-13 vers macOS-15
- Correction des erreurs TypeScript
```

#### Minor (nouvelle fonctionnalité)

```markdown
---
'ecoindex-app': minor
---

## Nouvelles fonctionnalités

- Ajout d'une boîte de dialogue de confirmation avant mesure simple
- Affichage des logs de mesure dans la popin de chargement
```

#### Major (breaking change)

```markdown
---
'ecoindex-app': major
---

## Breaking Changes

- Changement de l'API IPC : `handleSimpleMesures` nécessite maintenant un paramètre supplémentaire
```

## Étape 2 : Workflow Changeset (changeset.yml)

### Déclenchement

Le workflow `changeset.yml` se déclenche automatiquement à chaque push sur la branche `main`.

### Fonctionnement

1. **Vérification** : Vérifie si le dernier commit est "chore: version packages"
    - Si oui : skip le workflow (évite les boucles infinies)
    - Si non : continue

2. **Détection des changesets** : Scanne le dossier `.changeset/` pour trouver les fichiers changeset

3. **Création de la PR** : Si des changesets sont détectés :
    - Exécute `npm run version-packages` qui :
        - Met à jour `package.json` avec la nouvelle version
        - Génère/met à jour `CHANGELOG.md`
        - Supprime les changesets utilisés
    - Crée une Pull Request avec le titre "chore: version packages"
    - Le commit créé contient "chore: version packages"

### Structure du workflow

```yaml
jobs:
    release:
        steps:
            - Checkout Repo
            - Check if this is a version commit (skip si oui)
            - Setup Node.js
            - Install dependencies
            - Create Release Pull Request (changesets/action@v1)
```

### Commande version-packages

La commande `npm run version-packages` (définie dans `package.json`) :

- Lit tous les changesets dans `.changeset/`
- Calcule la nouvelle version selon les types (major/minor/patch)
- Met à jour `package.json`
- Génère le changelog dans `CHANGELOG.md`
- Supprime les changesets utilisés

## Étape 3 : Workflow Release (release.yml)

### Déclenchement

Le workflow `release.yml` se déclenche :

- Automatiquement : à chaque push sur `main` (mais ne build que si le commit contient "chore: version packages")
- Manuellement : via `workflow_dispatch` dans l'interface GitHub

### Fonctionnement

#### Job 1 : check-release

Vérifie si un build doit être déclenché :

```bash
# Vérifie si le dernier commit contient "chore: version packages"
if echo "$LAST_COMMIT" | grep -q "chore: version packages"; then
  # ✅ Build déclenché
  # Extrait la version depuis package.json
else
  # ⏭️ Pas de build (skip)
fi
```

**Outputs** :

- `should-release` : `true` ou `false`
- `version` : Version extraite de `package.json`

#### Job 2 : build

Se déclenche uniquement si `should-release == 'true'`.

**Matrix de build** : Build parallèle sur 4 plateformes :

```yaml
matrix:
    os:
        - { name: 'linux', image: 'ubuntu-latest' }
        - { name: 'windows', image: 'windows-latest' }
        - { name: 'macos-intel', image: 'macos-15-intel' }
        - { name: 'macos-arm', image: 'macos-14' }
```

**Note importante** : Le runner `macos-15-intel` est utilisé pour macOS Intel au lieu de `macos-15` pour éviter les conflits de noms de fichiers lors de la création de la release. Les deux runners (`macos-15-intel` et `macos-14` pour ARM) génèrent des fichiers avec des noms similaires, et l'utilisation de `macos-15` pour Intel causait des conflits lors de la déduplication des fichiers.

**Étapes pour chaque plateforme** :

1. **Checkout** : Récupération du code
2. **Setup Node.js** : Installation de Node.js (version depuis `.nvmrc`)
3. **Setup Python** (macOS uniquement) : Python 3.12 pour les outils de build
4. **Cache** : Mise en cache de `node_modules` pour accélérer les builds
5. **Install dependencies** : `npm ci`
6. **Debug secrets** (macOS uniquement) : Vérification des secrets Apple
7. **Add macOS certificates** (macOS uniquement) : Installation des certificats de signature
8. **Verify signing configuration** (macOS uniquement) : Vérification de la config de signature
9. **Set macOS environment variables** (macOS uniquement) : Configuration des variables d'environnement
10. **Build application** : `npm run make`
    - Génère les installateurs pour chaque plateforme
    - Signe et notarise (macOS)
11. **Verify code signature** (macOS uniquement) : Vérification de la signature
12. **Create DMG** (macOS uniquement) : Création du DMG depuis le ZIP
13. **Verify DMG signature** (macOS uniquement) : Vérification de la signature dans le DMG
14. **Upload artifacts** : Upload des artefacts pour le job release

**Artefacts générés** :

- **Linux** : `.deb` (Debian/Ubuntu) et `.rpm` (RedHat/Fedora)
- **Windows** : `.exe` (Squirrel installer)
- **macOS Intel** : `.zip` et `.dmg`
- **macOS ARM** : `.zip` et `.dmg`

#### Job 3 : release

Se déclenche après le job `build` si `should-release == 'true'`.

**Étapes** :

1. **Checkout** : Récupération du code
2. **Setup Node.js** : Installation de Node.js
3. **Install dependencies** : `npm ci`
4. **Download all artifacts** : Téléchargement de tous les artefacts des builds
5. **Generate Release.txt** : Création d'un fichier avec le SHA du commit
6. **Create GitHub Release** : Création de la release GitHub avec :
    - Tag : `{version}` (ex: `0.1.16`) - Format SemVer sans préfixe pour compatibilité avec l'auto-updater natif d'Electron et `update.electronjs.org`
    - Titre : `Release Electron-app {version}`
    - Fichiers : Tous les artefacts (`.deb`, `.dmg`, `.exe`, `.rpm`, `.zip`)
    - Release notes : Générées automatiquement depuis les changesets
7. **Publish to npm** (optionnel) : Publication sur npm si `NPM_TOKEN` est configuré

## Secrets GitHub requis

Pour que les workflows fonctionnent correctement, les secrets suivants doivent être configurés dans les paramètres GitHub du repository :

### Secrets obligatoires (macOS)

Ces secrets sont nécessaires pour signer et notariser les applications macOS :

- **`APPLE_IDENTITY`** : Nom complet du certificat de signature
    - Format : `Developer ID Application: Votre Nom (XXXXXXXXXX)`
    - Trouvable via : `security find-identity -v -p codesigning`
- **`APPLE_ID`** : Email Apple ID associé au certificat
- **`APPLE_APP_SPECIFIC_PASSWORD`** : Mot de passe spécifique pour la notarisation
    - Créé sur : https://appleid.apple.com/account/manage
    - Section : "App-Specific Passwords"
- **`APPLE_TEAM_ID`** : Team ID Apple Developer
    - Format : `XXXXXXXXXX` (10 caractères)
- **`APPLE_APPLICATION_CERT`** : Certificat `.p12` encodé en base64
- **`APPLE_APPLICATION_CERT_PASSWORD`** : Mot de passe du certificat `.p12`

### Secrets optionnels

- **`NPM_TOKEN`** : Token npm pour publier le package (optionnel)

### Configuration des secrets

1. Aller dans : `Settings` → `Secrets and variables` → `Actions`
2. Cliquer sur `New repository secret`
3. Ajouter chaque secret avec son nom et sa valeur

## Processus complet de release

### 1. Développement et création de changeset

```bash
# Faire vos modifications
git add .
git commit -m "feat: nouvelle fonctionnalité"

# Créer un changeset
npm run changeset
# Sélectionner: ecoindex-app
# Type: minor
# Description: Ajout de la nouvelle fonctionnalité X

# Commit le changeset
git add .changeset/
git commit -m "chore: ajouter changeset"
git push
```

### 2. Workflow Changeset (automatique)

1. Le workflow `changeset.yml` se déclenche
2. Détecte le changeset
3. Crée une PR "chore: version packages"
4. La PR contient :
    - Mise à jour de `package.json` (version)
    - Mise à jour de `CHANGELOG.md`
    - Suppression du changeset utilisé

### 3. Review et merge de la PR

1. Review la PR (vérifier la version et le changelog)
2. Merge la PR dans `main`
3. Le commit "chore: version packages" est créé sur `main`

### 4. Workflow Release (automatique)

1. Le workflow `release.yml` se déclenche
2. Détecte le commit "chore: version packages"
3. Lance les builds sur les 4 plateformes en parallèle :
    - Linux (ubuntu-latest)
    - Windows (windows-latest)
    - macOS Intel (macos-15-intel)
    - macOS ARM (macos-14)
4. Chaque build :
    - Installe les dépendances
    - Build l'application
    - Génère les installateurs
    - Signe et notarise (macOS)
    - Upload les artefacts
5. Le job `release` :
    - Télécharge tous les artefacts
    - Crée la release GitHub avec le tag `{version}` (sans préfixe "v" pour compatibilité SemVer avec l'auto-updater natif d'Electron et `update.electronjs.org`)
    - Attache tous les fichiers d'installation

### 5. Résultat

Une release GitHub est créée avec :

- **Tag** : `0.1.16` (exemple, sans préfixe "v" pour compatibilité SemVer avec l'auto-updater natif d'Electron et `update.electronjs.org`)
- **Titre** : `Release Electron-app 0.1.16`
- **Release notes** : Générées depuis les changesets
- **Fichiers** :
    - `ecoindex-app_0.1.16_amd64.deb` (Linux Debian/Ubuntu)
    - `ecoindex-app-0.1.16.x86_64.rpm` (Linux RedHat/Fedora)
    - `ecoindex-app-0.1.16-win32-setup.exe` (Windows)
    - `EcoindexApp-0.1.16-x64.zip` (macOS Intel)
    - `EcoindexApp-0.1.16-x64.dmg` (macOS Intel)
    - `EcoindexApp-0.1.16-arm64.zip` (macOS ARM)
    - `EcoindexApp-0.1.16-arm64.dmg` (macOS ARM)

## Dépannage

### Le workflow changeset ne crée pas de PR

**Causes possibles** :

- Aucun changeset dans `.changeset/`
- Les changesets ont déjà été utilisés
- Le workflow a été skip (commit de version détecté)

**Solution** :

- Vérifier que des fichiers `.md` existent dans `.changeset/` (sauf `config.json` et `major-updates-*.md`)
- Vérifier les logs du workflow dans GitHub Actions

### Le workflow release ne se déclenche pas

**Causes possibles** :

- Le commit ne contient pas "chore: version packages"
- La PR de version n'a pas été mergée

**Solution** :

- Vérifier que le dernier commit sur `main` contient "chore: version packages"
- Vérifier les logs du job `check-release` dans GitHub Actions

### Erreurs de build macOS

**Erreur de signature** :

- Vérifier que tous les secrets Apple sont configurés
- Vérifier que `APPLE_IDENTITY` contient "Developer ID"
- Vérifier les logs du step "Verify signing configuration"

**Erreur de notarisation** :

- Vérifier que `APPLE_APP_SPECIFIC_PASSWORD` est valide
- Vérifier que le certificat n'a pas expiré
- Vérifier les logs du build pour les erreurs de notarisation

### Build échoue sur une plateforme

Le workflow utilise `fail-fast: false`, donc si un build échoue, les autres continuent. Vérifier les logs du job spécifique qui a échoué.

## Commandes utiles

### Vérifier les changesets en attente

```bash
# Lister les changesets
ls .changeset/*.md

# Voir le contenu d'un changeset
cat .changeset/nom-du-changeset.md
```

### Forcer un build manuel

Si vous voulez déclencher un build sans changeset (pour tester) :

1. Aller dans GitHub Actions
2. Sélectionner le workflow "Release Electron app"
3. Cliquer sur "Run workflow"
4. Sélectionner la branche et cliquer sur "Run workflow"

**Note** : Cela créera une release, mais sans changement de version automatique.

### Vérifier la version actuelle

```bash
# Version dans package.json
node -e "const pkg = require('./package.json'); console.log(pkg.version);"

# Version depuis git tags
git describe --tags --abbrev=0
```

## Bonnes pratiques

1. **Un changeset par feature/fix** : Créez un changeset pour chaque modification significative
2. **Descriptions claires** : Écrivez des descriptions claires dans les changesets (elles apparaîtront dans le changelog)
3. **Review la PR de version** : Vérifiez toujours la version et le changelog avant de merger
4. **Tests avant release** : Testez localement avant de créer un changeset pour une release
5. **Version cohérente** : Utilisez les types de version appropriés (patch/minor/major)

## Références

- [Documentation Changesets](https://github.com/changesets/changesets)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Forge Documentation](https://www.electronforge.io/)
