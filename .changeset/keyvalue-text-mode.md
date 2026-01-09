---
"ecoindex-app": minor
---

## Amélioration du composant KeyValue

Ajout d'un mode de saisie texte libre dans le composant `KeyValue` pour faciliter la saisie et le copier-coller de configurations clé-valeur.

### Nouvelles fonctionnalités

- **Bascule entre deux modes de saisie** :
  - Mode formulaire (par défaut) : Interface avec champs séparés pour chaque paire clé-valeur
  - Mode texte libre : Textarea pour saisie au format `clé=valeur` (une paire par ligne)

- **Validation automatique** : Vérification du format en mode texte libre avec messages d'erreur détaillés

- **Conversion bidirectionnelle** : Synchronisation automatique entre les deux modes

- **Gestion des retours à la ligne** : Support complet des retours à la ligne dans le textarea pour ajouter plusieurs paires

### Utilisation

Cette fonctionnalité est disponible pour :
- **Extra headers** : Headers HTTP supplémentaires (cookies, authentification, etc.)
- **Variables d'environnement** : Variables personnalisées (clés automatiquement converties en majuscules)

### Composant

**Fichier** : `src/renderer/components/KeyValue.tsx`

**Nouvelles props** :
- `enableTextMode?: boolean` : Active/désactive le mode texte libre
- `placeholder?: string` : Placeholder personnalisé pour le textarea
- `textModeFormat?: string` : Message d'aide pour le format attendu
