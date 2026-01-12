---
"ecoindex-app": minor
---

### Amélioration de la sécurité et de l'expérience utilisateur dans KeyValue

Le composant `KeyValue` a été amélioré avec deux nouvelles fonctionnalités pour améliorer la sécurité et l'expérience utilisateur :

#### 1. Masquage des valeurs avec bouton œil

- **Sécurité renforcée** : Les champs de valeur sont maintenant de type `password` par défaut pour masquer les informations sensibles (tokens, mots de passe, etc.)
- **Affichage conditionnel** : Un bouton avec icône œil (`Eye`/`EyeOff`) permet d'afficher ou masquer chaque valeur individuellement
- **Positionnement** : Le bouton est positionné en absolu à droite de chaque champ de valeur
- **Accessibilité** : Labels ARIA et tooltips traduits pour une meilleure accessibilité

#### 2. Vérification de clés dupliquées

- **Prévention des erreurs** : Lors de l'ajout d'un nouveau champ, le système vérifie si la clé "key" ou "KEY" (selon le mode) existe déjà
- **Alerte utilisateur** : Si la clé existe déjà, une alerte native (`window.alert`) informe l'utilisateur avec un message traduit
- **Protection des données** : Empêche la création accidentelle de clés en double qui écraseraient les valeurs existantes

#### Fichiers modifiés

- `src/renderer/components/KeyValue.tsx` : Ajout de la gestion de l'état de visibilité, fonction `toggleValueVisibility()`, et vérification dans `handleAddFields()`
- `src/locales/fr/translation.json` : Ajout des traductions `key-value.showValue`, `key-value.hideValue`, et `key-value.keyAlreadyExists`
- `src/locales/en/translation.json` : Ajout des traductions correspondantes en anglais
- `docs/FEATURES.md` : Mise à jour de la documentation pour décrire les nouvelles fonctionnalités
- `docs/STRUCTURE.md` : Mise à jour de la description du composant

Ces améliorations sont particulièrement utiles pour la saisie de données sensibles comme les tokens d'authentification dans les "Extra headers" et les variables d'environnement.
