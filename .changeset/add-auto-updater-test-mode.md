---
"ecoindex-app": minor
---

## Ajout d'un mécanisme de test pour l'auto-updater

Ajout d'une fonctionnalité permettant de tester le système de mise à jour automatique avant de publier une release.

### Fonctionnalités ajoutées

1. **Méthode de test dans Updater** :
   - Nouvelle méthode publique `testUpdateDialog()` pour simuler l'événement `update-downloaded`
   - Permet de tester la boîte de dialogue et le flux de redémarrage sans avoir besoin d'une vraie mise à jour
   - Disponible uniquement en mode développement pour des raisons de sécurité

2. **API IPC pour le renderer** :
   - Nouveau channel IPC `TEST_UPDATE_DIALOG` pour déclencher le test depuis le renderer
   - Handler IPC dans `main.ts` (uniquement en mode développement)
   - API exposée dans `preload.ts` via `window.electronAPI.testUpdateDialog()`

3. **Documentation complète** :
   - Nouveau guide `docs/TESTING_AUTO_UPDATER.md` avec instructions détaillées
   - Référence ajoutée dans `docs/DEVELOPMENT.md`

### Utilisation

En mode développement, depuis la console du renderer :

```javascript
window.electronAPI.testUpdateDialog()
```

Cela déclenche la boîte de dialogue de mise à jour, permettant de tester :
- L'affichage de la boîte de dialogue
- Les traductions (FR/EN)
- Le comportement des boutons "Redémarrer" et "Plus tard"
- La fermeture propre des fenêtres
- Les logs de débogage

### Sécurité

- L'API de test est uniquement disponible en mode développement
- Non disponible en production pour éviter les abus
- Non disponible sur Linux (l'auto-updater natif ne fonctionne pas sur Linux)

### Fichiers modifiés

- `src/main/Updater.ts` : Ajout de la méthode `testUpdateDialog()`
- `src/main/main.ts` : Ajout du handler IPC `TEST_UPDATE_DIALOG`
- `src/main/preload.ts` : Exposition de l'API au renderer
- `src/shared/constants.ts` : Ajout du channel `TEST_UPDATE_DIALOG`
- `docs/TESTING_AUTO_UPDATER.md` : Guide de test complet
- `docs/DEVELOPMENT.md` : Référence au guide de test
