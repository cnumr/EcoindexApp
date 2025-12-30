---
"ecoindex-app": patch
---

## Test de la mise à jour automatique

- **Refactorisation de l'auto-updater** : Migration vers l'auto-updater natif d'Electron avec `update.electronjs.org` pour simplifier la configuration et s'aligner avec l'ancien projet.

- **Mise à jour de la documentation** : Documentation mise à jour pour refléter l'utilisation de l'auto-updater natif d'Electron au lieu de `electron-updater`.

- **Configuration simplifiée** : Plus besoin de générer des fichiers `latest-mac.yml` - `update.electronjs.org` gère automatiquement la conversion des releases GitHub.

