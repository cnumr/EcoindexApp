# Guide de test de l'auto-updater

Ce document explique comment tester le système de mise à jour automatique avant de publier une release.

## Méthodes de test

### 1. Test via la console du renderer (Recommandé)

En mode développement, vous pouvez tester la boîte de dialogue de mise à jour directement depuis la console du renderer :

1. **Ouvrir l'application en mode développement** :
   ```bash
   npm start
   ```

2. **Ouvrir les DevTools** (si ce n'est pas déjà fait) :
   - Menu : `View > Toggle DevTools`
   - Ou raccourci clavier : `Cmd+Option+I` (macOS) / `Ctrl+Shift+I` (Windows/Linux)

3. **Dans la console, exécuter** :
   ```javascript
   // Vérifier que l'API est disponible
   if (window.electronAPI && window.electronAPI.testUpdateDialog) {
       window.electronAPI.testUpdateDialog().then(result => {
           console.log('Test result:', result)
       })
   } else {
       console.error('API de test non disponible (mode production ou Linux)')
   }
   ```

4. **Résultat attendu** :
   - Une boîte de dialogue apparaît avec les options "Redémarrer" et "Plus tard"
   - Si vous cliquez sur "Redémarrer", la boîte de dialogue se ferme (mais l'application ne redémarre pas vraiment car il n'y a pas de vraie mise à jour)
   - Les logs dans la console du main process montrent les actions effectuées

### 2. Test avec une vraie mise à jour (Production)

Pour tester avec une vraie mise à jour, vous devez :

1. **Créer une release de test sur GitHub** :
   - Créer un tag de version supérieure à la version actuelle (ex: `v0.7.1-test`)
   - Créer une release GitHub avec ce tag
   - Attacher les fichiers de build (`.dmg` pour macOS, `.exe` pour Windows)

2. **Packager l'application** :
   ```bash
   npm run package
   ```

3. **Installer la version packagée** :
   - Installer l'application depuis le build créé
   - L'application doit être en mode production (`app.isPackaged === true`)

4. **Déclencher la vérification de mise à jour** :
   - L'application vérifie automatiquement les mises à jour au démarrage
   - Ou attendre 1 heure (vérification automatique périodique)
   - Ou utiliser le menu (si disponible) pour forcer une vérification

5. **Tester le redémarrage** :
   - Quand une mise à jour est détectée et téléchargée, la boîte de dialogue apparaît
   - Cliquer sur "Redémarrer" devrait redémarrer l'application avec la nouvelle version

### 3. Test avec FORCE_FOR_DEBUG (Avancé)

Pour forcer l'activation de l'auto-updater en mode développement :

1. **Modifier `src/main/Updater.ts`** :
   ```typescript
   const FORCE_FOR_DEBUG: boolean = true  // Passer à true
   ```

2. **Optionnellement, forcer une version** :
   ```typescript
   if (FORCE_FOR_DEBUG) {
       IS_PROD = true
       version = '0.7.0'  // Version inférieure à celle sur GitHub pour forcer la détection
   }
   ```

3. **Redémarrer l'application** :
   ```bash
   npm start
   ```

4. **Vérifier les logs** :
   - Les logs devraient montrer que l'auto-updater est activé
   - L'URL du feed devrait être construite correctement

**⚠️ Attention** : Cette méthode peut déclencher de vraies vérifications de mise à jour. Utilisez-la avec précaution.

## Vérification des logs

Les logs de l'auto-updater sont disponibles dans :

- **Console** : Sortie directe dans le terminal
- **Fichier** : `~/Library/Logs/ecoindex-app/main.log` (macOS)

Recherchez les messages avec le scope `main/Updater` :

```bash
# macOS
tail -f ~/Library/Logs/ecoindex-app/main.log | grep "main/Updater"

# Ou dans la console du terminal où l'application tourne
```

## Points à vérifier lors du test

1. **Boîte de dialogue** :
   - ✅ Les boutons "Redémarrer" et "Plus tard" sont visibles
   - ✅ Les traductions sont correctes (FR/EN)
   - ✅ Le message et les détails sont affichés correctement

2. **Clic sur "Plus tard"** :
   - ✅ La boîte de dialogue se ferme
   - ✅ L'application continue de fonctionner normalement
   - ✅ Les logs montrent "User chose to restart later"

3. **Clic sur "Redémarrer"** :
   - ✅ La boîte de dialogue se ferme
   - ✅ Les fenêtres se ferment proprement (logs : "Closing X window(s) before restart")
   - ✅ Les logs montrent "Calling autoUpdater.quitAndInstall(true, false)"
   - ⚠️ En mode test (sans vraie mise à jour), l'application ne redémarre pas vraiment
   - ✅ En mode production avec vraie mise à jour, l'application redémarre avec la nouvelle version

4. **Gestion d'erreurs** :
   - ✅ Si une erreur survient, elle est loggée correctement
   - ✅ L'application ne plante pas

## Limitations du test en mode développement

- **Pas de redémarrage réel** : En mode test, `autoUpdater.quitAndInstall()` ne redémarre pas vraiment l'application car il n'y a pas de mise à jour téléchargée
- **API de test uniquement en dev** : L'API `testUpdateDialog` n'est disponible qu'en mode développement pour des raisons de sécurité
- **Linux non supporté** : L'auto-updater natif d'Electron ne fonctionne pas sur Linux. Utilisez le système de notification Linux à la place

## Dépannage

### L'API de test n'est pas disponible

- Vérifiez que vous êtes en mode développement (`npm start`)
- Vérifiez que vous n'êtes pas sur Linux (l'auto-updater natif ne fonctionne pas sur Linux)
- Vérifiez les logs pour voir si l'auto-updater est initialisé

### La boîte de dialogue n'apparaît pas

- Vérifiez les logs pour voir s'il y a des erreurs
- Vérifiez que `dialog.showMessageBox` est appelé correctement
- Vérifiez que les traductions sont chargées (`i18n.t()` fonctionne)

### Le redémarrage ne fonctionne pas en production

- Vérifiez que l'application est bien packagée (`app.isPackaged === true`)
- Vérifiez que la mise à jour a bien été téléchargée (logs : "update-downloaded")
- Vérifiez les permissions de l'application (peut nécessiter des droits administrateur)
- Vérifiez les logs pour voir si `quitAndInstall()` est appelé

## Notes importantes

- **Sécurité** : L'API de test est uniquement disponible en mode développement pour éviter qu'elle soit utilisée en production
- **Production** : Pour tester en production, vous devez créer une vraie release sur GitHub avec les fichiers de build
- **Version** : Assurez-vous que la version de test est inférieure à la version sur GitHub pour que la mise à jour soit détectée
