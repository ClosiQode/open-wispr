# Plan de Migration du Système de Mise à Jour

## État Actuel

### Configuration Actuelle (HeroTools)
Le système de mise à jour automatique est actuellement configuré pour utiliser le repository GitHub de HeroTools :
- **Owner**: HeroTools
- **Repository**: open-wispr
- **Provider**: GitHub

### Fichiers Concernés
1. **src/updater.js** (lignes 28-33) - Configuration principale du système de mise à jour
2. **electron-builder.json** (lignes 78-87) - Configuration de publication
3. **package.json** - Métadonnées du projet

## Tâches à Réaliser

### ✅ Tâches Terminées
- [x] Analyse du système de mise à jour existant
- [x] Identification des fichiers à modifier

### 🔄 Tâches en Cours
- [ ] Création du plan de migration

### 📋 Tâches à Faire

#### 1. Modification de la Configuration Auto-Updater
**Fichier**: `src/updater.js`
**Lignes à modifier**: 28-33
```javascript
// Remplacer cette configuration :
autoUpdater.setFeedURL({
  provider: "github",
  owner: "HeroTools",        // ← À changer
  repo: "open-wispr",        // ← Peut-être à changer
  private: false,
});
```

#### 2. Modification de la Configuration Electron Builder
**Fichier**: `electron-builder.json`
**Lignes à modifier**: 78-87
```json
"publish": {
  "provider": "github",
  "owner": "HeroTools",      // ← À changer
  "repo": "open-wispr",      // ← Peut-être à changer
  "private": false,
  "releaseType": "release"
}
```

#### 3. Mise à Jour des Métadonnées (Optionnel)
**Fichier**: `package.json`
- Modifier l'auteur si nécessaire
- Vérifier le nom du package

#### 4. Configuration du Repository GitHub
- Créer/configurer le repository de destination
- Configurer les GitHub Actions pour la build automatique
- Publier les releases avec les fichiers binaires

## Informations Importantes

### Types de Fichiers de Release Nécessaires
Pour Windows (votre adaptation), vous devrez publier :
- **NSIS Installer** (.exe) - Installateur Windows
- **Portable** (.exe) - Version portable
- **latest.yml** - Fichier de métadonnées pour l'auto-updater

### Structure des Releases GitHub
Les releases doivent contenir :
```
Release v1.0.3/
├── OpenWispr-Setup-1.0.3.exe     # Installateur NSIS
├── OpenWispr-1.0.3.exe           # Version portable
└── latest.yml                     # Métadonnées auto-updater
```

### Processus de Publication
1. **Build** : `npm run build:win`
2. **Upload** : Publier les fichiers dans une GitHub Release
3. **Auto-Update** : L'application vérifiera automatiquement les nouvelles versions

## Questions à Clarifier

1. **Quel est votre nom d'utilisateur GitHub ?**
2. **Voulez-vous garder le nom "open-wispr" ou le changer ?**
3. **Le repository sera-t-il public ou privé ?**
4. **Voulez-vous configurer des GitHub Actions pour automatiser la build ?**

## Prochaines Étapes

1. Obtenir les informations de votre repository GitHub
2. Modifier les fichiers de configuration
3. Tester le système de mise à jour
4. Documenter le processus de release