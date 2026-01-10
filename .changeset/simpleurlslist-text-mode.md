---
"ecoindex-app": minor
---

## Amélioration du composant SimpleUrlsList

Ajout d'un mode de saisie texte libre dans le composant `SimpleUrlsList` pour faciliter la saisie et le copier-coller de listes d'URLs.

### Nouvelles fonctionnalités

- **Bascule entre deux modes de saisie** :
  - Mode formulaire (par défaut) : Interface avec un champ séparé pour chaque URL
  - Mode texte libre : Textarea pour saisie au format une URL par ligne

- **Conversion bidirectionnelle** : Synchronisation automatique entre les deux modes

- **Gestion des retours à la ligne** : Support complet des retours à la ligne dans le textarea pour ajouter plusieurs URLs

### Utilisation

Cette fonctionnalité est disponible pour :
- **Mesures simples** : Saisie des URLs à analyser dans `SimplePanMesure`
- **Mesures complexes (parcours)** : Saisie des URLs pour chaque course dans `JsonPanMesure`

### Composant

**Fichier** : `src/renderer/components/SimpleUrlsList.tsx`

**Nouvelles props** :
- `enableTextMode?: boolean` : Active/désactive le mode texte libre
- `placeholder?: string` : Placeholder personnalisé pour le textarea
- `textModeFormat?: string` : Message d'aide pour le format attendu
