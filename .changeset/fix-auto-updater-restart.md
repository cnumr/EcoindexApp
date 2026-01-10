---
"ecoindex-app": patch
---

## Correction du redémarrage après mise à jour automatique

Correction du problème où l'application ne redémarrait pas après qu'une mise à jour soit téléchargée et que l'utilisateur choisisse de redémarrer.

### Problème résolu

- **Symptôme** : La fenêtre de dialogue proposait de redémarrer, mais l'application ne redémarrait pas effectivement après le clic sur "Redémarrer".

### Corrections apportées

1. **Migration vers l'API Promise** : Remplacement du callback déprécié de `dialog.showMessageBox` par l'utilisation de la Promise (API moderne d'Electron).

2. **Fermeture propre des fenêtres** : Fermeture de toutes les fenêtres avant d'appeler `autoUpdater.quitAndInstall()` pour s'assurer que l'application est dans un état propre.

3. **Paramètres corrects pour quitAndInstall** : Appel de `autoUpdater.quitAndInstall(true, false)` avec le paramètre `restart=true` pour redémarrer automatiquement après l'installation.

4. **Gestion d'erreurs améliorée** : Ajout d'un bloc try-catch pour gérer les erreurs potentielles lors de l'affichage de la boîte de dialogue.

5. **Logging amélioré** : Ajout de logs supplémentaires pour faciliter le débogage du processus de redémarrage.

### Fichiers modifiés

- `src/main/Updater.ts` : Correction de la méthode `onUpdateDownloaded` pour utiliser async/await et appeler correctement `quitAndInstall()`.
