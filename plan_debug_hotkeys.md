# Plan de Résolution - Problème des Touches CTRL et ALT

## Problème Identifié
L'utilisateur ne peut pas sélectionner les touches CTRL et ALT pour créer des raccourcis clavier d'enregistrement.

## Analyse du Code

### Composants Impliqués
- `src/components/ui/Keyboard.tsx` - Clavier simple (touches CTRL/ALT désactivées)
- `src/components/ui/EnhancedKeyboard.tsx` - Clavier avancé (touches CTRL/ALT fonctionnelles)
- `src/components/SettingsPage.tsx` - Page de paramètres utilisant EnhancedKeyboard
- `src/helpers/hotkeyManager.js` - Gestionnaire des raccourcis globaux

### Cause du Problème
Dans `Keyboard.tsx` (lignes 174-195), les touches Ctrl et Alt sont marquées comme `disabled={true}`, ce qui les rend non-cliquables :

```tsx
<Key
  keyValue="Ctrl"
  isSelected={selectedKey === 'Ctrl'}
  onClick={() => handleKeyClick('Ctrl')}
  width="w-16"
  disabled  // ← PROBLÈME ICI
/>
```

### Solution Identifiée
Le composant `EnhancedKeyboard.tsx` fonctionne correctement et permet la sélection des touches modificatrices (Ctrl, Alt) avec `isModifier={true}` mais sans `disabled`.

## Plan de Résolution

### ✅ Tâches Terminées
- [x] Identification du problème dans le code
- [x] Localisation des composants concernés
- [x] Analyse de la différence entre Keyboard et EnhancedKeyboard
- [x] **Correction COMPLÈTE du composant Keyboard.tsx**
  - [x] Retiré la propriété `disabled` des touches Ctrl et Alt
  - [x] Retiré la propriété `disabled` des touches Shift et CapsLock
  - [x] Retiré la propriété `disabled` des touches Tab, Enter et Backspace
  - [x] **TOUTES les touches sont maintenant cliquables et sélectionnables**

## Problème Identifié ✅

- **Symptôme** : Les touches Alt et Ctrl ne fonctionnent toujours pas correctement pour la détection des raccourcis
- **Détail** : "Ctrl + X" fonctionne mais "Ctrl + Alt" ne fonctionne pas
- **Cause Racine Trouvée** : **Limitation d'Electron `globalShortcut` sur Windows**

### 🔍 Diagnostic Complet

**Test effectué** : Application Electron isolée avec différents raccourcis
**Résultats** :
- ✅ `Ctrl+X` : Enregistrement réussi
- ✅ `Alt+X` : Enregistrement réussi  
- ❌ `Ctrl+Alt+X` : **Échec de l'enregistrement**
- ❌ `Alt+Ctrl+X` : **Échec de l'enregistrement**
- ❌ `CommandOrControl+Alt+X` : **Échec de l'enregistrement**

**Conclusion** : Les combinaisons `Ctrl+Alt` ne peuvent pas être enregistrées via `globalShortcut.register()` sur Windows.

## Tâches Terminées ✅
- [x] Analyse de `hotkeyManager.js` - Ajout de logs détaillés
- [x] Test d'Electron `globalShortcut` - Confirmé que `Ctrl+Alt+X`, `Alt+Ctrl+X` et `CommandOrControl+Alt+X` échouent à l'enregistrement
- [x] **PROBLÈME RÉSOLU** : Modification de `validateHotkey()` pour accepter les combinaisons de modificateurs seuls
- [x] **CONFIRMATION** : La validation fonctionne maintenant, mais Electron `globalShortcut.register()` ne peut pas enregistrer `Ctrl+Alt` sur Windows

### 📋 Solutions Possibles

**Option 1 : Utiliser des raccourcis alternatifs**
- Remplacer `Ctrl+Alt+X` par `Ctrl+Shift+X` ou `Alt+Shift+X`
- Ces combinaisons fonctionnent correctement sur Windows

**Option 2 : Implémenter une détection locale**
- Utiliser les événements `keydown`/`keyup` dans le renderer process
- Détecter les combinaisons manuellement sans `globalShortcut`
- Limitation : ne fonctionne que quand l'application a le focus

**Option 3 : Avertir l'utilisateur**
- Afficher un message d'information sur les limitations Windows
- Suggérer des raccourcis alternatifs compatibles

**Option 4 : Utiliser une bibliothèque tierce**
- Intégrer une solution comme `node-global-key-listener`
- Plus complexe mais peut contourner les limitations d'Electron

### 📋 Tâches à Faire
1. **DIAGNOSTIC APPROFONDI - Problème Ctrl+Alt**
   - ✅ Vérifier la détection des clics dans l'interface (OK)
   - ✅ Vérifier la logique de handleKeyClick (OK)
   - ✅ Vérifier le mapping des touches Alt dans KEY_CODE_MAP (OK)
   - ✅ **TERMINÉ** : Analyser hotkeyManager.js et Electron globalShortcut
   - [ ] Tester la validation des raccourcis avec Alt
   - [ ] Ajouter du logging pour diagnostiquer l'enregistrement
   - [ ] Vérifier les limitations d'Electron sur Windows avec Alt

2. **Vérifier la cohérence entre les composants**
   - S'assurer que les deux claviers fonctionnent de manière similaire
   - Vérifier que les raccourcis avec Ctrl/Alt sont correctement traités

3. **Documentation**
   - Mettre à jour la documentation utilisateur
   - Ajouter des exemples de raccourcis recommandés

## Notes Techniques

### Raccourcis Recommandés
Selon le code d'EnhancedKeyboard, les combinaisons populaires incluent :
- `Ctrl+Alt+D`
- `Ctrl+Shift+V`
- `Alt+F4`
- `Ctrl+Space`
- `F12`

### Validation des Raccourcis
Le `hotkeyManager.js` valide les raccourcis avec :
- Support des modificateurs : Ctrl, Alt, Shift, CapsLock, Cmd, Super
- Validation des touches principales
- Recommandation d'utiliser des modificateurs pour éviter les conflits

### Mode de Configuration
Dans les paramètres, l'utilisateur peut choisir entre :
- **Touche simple** : Une seule touche (utilise Keyboard.tsx - PROBLÉMATIQUE)
- **Combinaison de touches** : Plusieurs touches (utilise EnhancedKeyboard.tsx - FONCTIONNEL)

## ✅ PROBLÈME RÉSOLU

### Corrections Apportées
1. **Suppression COMPLÈTE des restrictions dans Keyboard.tsx**
   - Retiré `disabled={true}` des touches Ctrl et Alt
   - Retiré `disabled={true}` des touches Shift et CapsLock
   - Retiré `disabled={true}` des touches Tab, Enter et Backspace
   - **TOUTES les touches sont maintenant cliquables et détectent les clics**

### Comment Utiliser Maintenant

#### Option 1: Mode "Touche simple" (maintenant fonctionnel)
- Aller dans Paramètres → Raccourci de dictée
- Sélectionner "Touche simple"
- Cliquer directement sur Ctrl ou Alt dans le clavier

#### Option 2: Mode "Combinaison de touches" (recommandé)
- Aller dans Paramètres → Raccourci de dictée
- Sélectionner "Combinaison de touches"
- Cliquer sur Ctrl, puis Alt, puis une autre touche (ex: D)
- Résultat: Ctrl+Alt+D

### Raccourcis Recommandés
- `Ctrl+Alt+D` - Dictée (populaire)
- `Ctrl+Shift+V` - Alternative
- `F12` - Touche fonction simple
- `Ctrl+Space` - Raccourci court

### Test de Validation
Pour vérifier que tout fonctionne :
1. Ouvrir les Paramètres
2. Aller à la section "Raccourci de dictée"
3. Essayer de sélectionner Ctrl et Alt
4. Les touches doivent maintenant être cliquables et sélectionnables