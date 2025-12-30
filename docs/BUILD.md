# Build et Packaging

## Configuration

### Variables d'environnement

Fichier `.env` (optionnel, créé à la racine du projet) :

```env
# Signature macOS (optionnel)
APPLE_IDENTITY=Developer ID Application: Votre Nom (XXXXXXXXXX)
APPLE_ID=votre.email@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

**Note** : Ces variables ne sont nécessaires que pour la signature et la notarisation macOS.

### Configuration Electron Forge

Le fichier `forge.config.js` contient toute la configuration du build :

- Packagers (DMG, ZIP, DEB, RPM, Squirrel)
- Plugins (Vite, Fuses, AutoUnpackNatives)
- Ressources supplémentaires (`extraResource`)
- Configuration de signature macOS

## Commandes de build

### Build local

```bash
# Build l'application (sans installateur)
npm run package
```

Crée l'application packagée dans `out/{platform}-{arch}/`.

### Build avec installateurs

```bash
# Build avec tous les installateurs
npm run make
```

Crée les installateurs pour toutes les plateformes configurées :

- **macOS** : ZIP (et DMG si configuré)
- **Windows** : Squirrel installer (.exe)
- **Linux** : DEB et RPM

### Création DMG (macOS)

```bash
# Build + création DMG
npm run make:dmg
```

Cette commande :

1. Exécute `npm run make`
2. Extrait le fichier ZIP
3. Créer un DMG en utilisant `hdiutil` (outil natif macOS)

Le DMG sera créé dans `out/make/zip/darwin/{arch}/` à côté du fichier ZIP.

**Note** : La création du DMG utilise les outils natifs macOS et ne nécessite aucune dépendance externe.

### Préparation avant build

```bash
# Packager lib.asar avant le build
npm run asar:pack:lib
```

Cette commande crée l'archive `lib.asar` depuis le dossier `lib/`. Elle est automatiquement exécutée avant `npm run make` via le script `premake`.

## Structure de build

### Développement

```
.vite/
├── build/
│   ├── main.js          # Main process compilé
│   └── preload.js       # Preload script compilé
└── renderer/
    └── main_window/
        └── index.html   # Renderer HTML
```

### Production

```
out/
├── make/                        # Installateurs
│   ├── squirrel.windows/        # Installateur Windows
│   │   └── ecoindex-app-{version}-win32-setup.exe
│   ├── zip/darwin/              # ZIP macOS
│   │   └── {arch}/
│   │       └── EcoindexApp-{version}-{arch}.zip
│   └── deb/linux/               # DEB Linux
│       └── ecoindex-app_{version}_amd64.deb
└── {platform}-{arch}/           # Application packagée
    └── EcoindexApp.app/         # (macOS)
        ├── Contents/
        │   ├── MacOS/
        │   │   └── EcoindexApp
        │   ├── Resources/
        │   │   ├── app.asar     # Application principale
        │   │   ├── lib.asar     # Scripts utilitaires
        │   │   ├── locales/     # Traductions
        │   │   └── md/          # Fichiers markdown
        │   └── Info.plist
        └── ...
```

## Ressources packagées

Dans `forge.config.js`, la section `extraResource` inclut :

```javascript
extraResource: [
    './src/extraResources/md', // Fichiers markdown
    './src/locales', // Fichiers de traduction
    './src/extraResources/lib.asar', // Archive des scripts
]
```

Ces ressources sont accessibles via `process.resourcesPath` dans l'application packagée.

## Signature et notarisation (macOS)

### Prérequis

1. Certificat Apple Developer
2. Apple ID avec accès au certificat
3. App-specific password pour la notarisation

### Configuration

Les variables d'environnement doivent être définies dans `.env` :

```env
APPLE_IDENTITY=Developer ID Application: Votre Nom (XXXXXXXXXX)
APPLE_ID=votre.email@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX
```

### Processus

1. **Signature** : Automatique lors du build si `APPLE_IDENTITY` est défini
2. **Notarisation** : Automatique si toutes les variables sont définies

La signature et la notarisation sont configurées dans `forge.config.js` :

```javascript
osxSign: {
    identity: process.env.APPLE_IDENTITY,
    optionsForFile: () => ({
        entitlements: path.resolve(__dirname, 'entitlements.mac.plist'),
        hardenedRuntime: true,
    }),
},
osxNotarize: {
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
}
```

## Build pour plusieurs architectures

### macOS

Pour builder pour les deux architectures Mac (Intel et ARM) :

```bash
npm run make -- --arch=x64,arm64
```

**Note** :

- Sur Mac ARM : buildera automatiquement pour ARM64
- Sur Mac Intel : buildera automatiquement pour x64
- Utilisez `--arch=x64,arm64` pour les deux

### Windows

Par défaut, build pour l'architecture de la machine. Pour forcer une architecture :

```bash
npm run make -- --arch=x64
npm run make -- --arch=arm64
```

### Linux

Par défaut, build pour l'architecture de la machine. Pour forcer une architecture :

```bash
npm run make -- --arch=x64
npm run make -- --arch=arm64
```

## Fuses Electron

Les Fuses Electron sont configurées dans `forge.config.js` pour sécuriser l'application :

- `RunAsNode: false` : Désactive l'exécution en tant que Node.js
- `EnableCookieEncryption: true` : Active le chiffrement des cookies
- `EnableNodeOptionsEnvironmentVariable: false` : Désactive les options Node.js
- `EnableNodeCliInspectArguments: false` : Désactive l'inspection CLI
- `EnableEmbeddedAsarIntegrityValidation: true` : Active la validation d'intégrité ASAR
- `OnlyLoadAppFromAsar: true` : Charge uniquement depuis ASAR

## Workflows GitHub Actions

> **📖 Documentation complète** : Voir [RELEASE.md](./RELEASE.md) pour une documentation détaillée du processus de release, des changesets, et des workflows GitHub Actions.

### Vue d'ensemble

Le processus de release utilise deux workflows GitHub Actions :

1. **`changeset.yml`** : Détecte les changesets et crée une PR de version
2. **`release.yml`** : Build l'application pour toutes les plateformes et crée une Release GitHub

### Secrets GitHub requis

Pour les workflows GitHub Actions (macOS uniquement) :

- `APPLE_IDENTITY` : Identité de signature macOS
- `APPLE_ID` : Apple ID
- `APPLE_APP_SPECIFIC_PASSWORD` : Mot de passe spécifique
- `APPLE_TEAM_ID` : Team ID
- `APPLE_APPLICATION_CERT` : Certificat `.p12` encodé en base64
- `APPLE_APPLICATION_CERT_PASSWORD` : Mot de passe du certificat

Pour plus de détails, voir [RELEASE.md](./RELEASE.md).

## Dépannage

### Erreurs de build

1. **Erreur de signature macOS** : Vérifier les variables d'environnement
2. **Erreur de notarisation** : Vérifier l'App-specific password
3. **Erreur de ressources** : Vérifier que `lib.asar` existe (exécuter `npm run asar:pack:lib`)

### Build lent

Le build peut être lent, surtout pour la première fois :

- Téléchargement des dépendances natives
- Compilation TypeScript
- Packaging ASAR
- Signature et notarisation (macOS)

### Espace disque

Les builds prennent de l'espace :

- Application packagée : ~200-300 MB
- Installateurs : ~100-200 MB chacun
- Total : ~1-2 GB pour toutes les plateformes
