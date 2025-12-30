# Documentation EcoindexApp

Bienvenue dans la documentation de **EcoindexApp**, une application desktop multiplateforme pour mesurer l'impact écologique de sites web avec Lighthouse et Ecoindex.

## Vue d'ensemble

**EcoindexApp** est une application Electron qui permet d'analyser des sites web pour évaluer leur performance environnementale en utilisant :

- **Lighthouse** : outil d'audit de performance web de Google
- **lighthouse-plugin-ecoindex-core** : plugin Lighthouse pour calculer l'écoindex
- **lighthouse-plugin-ecoindex-courses** : plugin pour gérer des parcours d'analyse

### Informations générales

- **Version** : `0.1.15`
- **Licence** : AGPL-3.0
- **Auteur** : Renaud Héluin / Association Green IT
- **Plateformes supportées** : Windows, macOS, Linux

## Structure de la documentation

Cette documentation est organisée en plusieurs fichiers thématiques :

### 📐 [Architecture](ARCHITECTURE.md)

Architecture technique de l'application, stack technologique, structure du projet et flux d'exécution.

### ⚙️ [Fonctionnalités](FEATURES.md)

Description détaillée de toutes les fonctionnalités : initialisation, i18n, stockage, communication IPC, etc.

### 🔧 [Développement](DEVELOPMENT.md)

Guide pour les développeurs : installation, scripts, workflow, conventions de code, etc.

### 📦 [Build et Packaging](BUILD.md)

Configuration du build, packaging, variables d'environnement, et création des installateurs.

### 🔌 [API et IPC](API.md)

Documentation des APIs exposées, canaux IPC, et interfaces de communication.

### 📝 [Structure du projet](STRUCTURE.md)

Arborescence détaillée du projet et description des dossiers et fichiers importants.

## Démarrage rapide

### Installation

```bash
npm install
cd lib && npm ci
```

### Développement

```bash
npm start
```

### Build

```bash
npm run make
```

## Liens utiles

- [Documentation Electron](https://www.electronjs.org/docs)
- [Documentation Electron Forge](https://www.electronforge.io/)
- [Documentation i18next](https://www.i18next.com/)
- [Documentation Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Ecoindex](https://www.ecoindex.fr/)

---

**Dernière mise à jour** : Décembre 2024
