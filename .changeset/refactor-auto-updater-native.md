---
"ecoindex-app": patch
---

## Refactorisation de l'auto-updater

- **Utilisation de l'auto-updater natif d'Electron** : Remplacement de `electron-updater` par l'auto-updater natif d'Electron (`electron.autoUpdater`) pour simplifier la configuration et s'aligner avec l'ancien projet (cnumr/EcoindexApp).

- **Utilisation de update.electronjs.org** : Configuration de l'URL du feed pour utiliser `update.electronjs.org`, un service gratuit qui convertit les releases GitHub en format compatible avec l'auto-updater natif. L'URL est construite dynamiquement depuis `package.json` : `https://update.electronjs.org/{owner}/{repo}/{platform}-{arch}/{version}`.

- **Simplification** : Suppression du script `generate-update-files.js` et des fichiers YAML du workflow GitHub Actions, car ils ne sont plus nécessaires avec l'auto-updater natif.

- **Compatibilité** : Adaptation de la signature de `onUpdateDownloaded` pour correspondre à l'API de l'auto-updater natif d'Electron.

