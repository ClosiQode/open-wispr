# Plan de débogage - Délai inattendu dans le collage

## Problème identifié
Lorsque le mode agent n'est pas activé (pas de nom d'agent dans le texte), il y a un délai inattendu avant le collage du texte transcrit, alors que ça devrait être instantané.

## Analyse du problème

### Source du problème
- **Fichier**: `src/helpers/audioManager.js`
- **Lignes**: 410-418
- **Problème**: Même quand il n'y a pas de nom d'agent, si `useReasoningModel` est activé, le système fait quand même appel à `processWithReasoningModel()` qui utilise l'API IA avec le prompt `regular`
- **Conséquence**: Délai de plusieurs secondes pour traiter le texte avec l'IA alors que ce n'est pas nécessaire

### Logique actuelle problématique
```javascript
if (useReasoning) {
  const reasonedText = await this.processWithReasoningModel(rawText);
  return {
    success: true,
    text: reasonedText,
    source: "openai-reasoned",
  };
}
```

### Logique attendue
Le système devrait :
1. Vérifier si le texte contient le nom d'agent
2. Si OUI et `useReasoning` activé → utiliser l'API IA
3. Si NON → utiliser seulement le nettoyage local (`cleanTranscription`)

## Plan de résolution

### Étapes à réaliser

#### ✅ 1. Analyser le problème
- [x] Identifier la source du délai dans `audioManager.js`
- [x] Comprendre la logique de `useReasoningModel`
- [x] Localiser la fonction de détection d'agent

#### ✅ 2. Implémenter la solution
- [x] Modifier la logique dans `processWithOpenAIAPI()` pour vérifier la présence du nom d'agent
- [x] Utiliser la logique `hasAgentReference` similaire à `ReasoningService.js`
- [x] Appliquer la même logique dans `processWithLocalWhisper()`
- [ ] Tester la solution

#### 📝 3. Tests et validation
- [ ] Tester avec texte sans nom d'agent → doit être instantané
- [ ] Tester avec texte avec nom d'agent → doit utiliser l'IA
- [ ] Vérifier que les paramètres `useReasoningModel` fonctionnent correctement

## Solution proposée

Modifier la logique pour inclure une vérification de la présence du nom d'agent :

```javascript
if (useReasoning) {
  // Vérifier si le texte contient le nom d'agent
  const agentName = getAgentName();
  const hasAgentReference = agentName && 
    (rawText.toLowerCase().includes(`hey ${agentName.toLowerCase()}`) ||
     rawText.toLowerCase().includes(agentName.toLowerCase()));
  
  if (hasAgentReference) {
    const reasonedText = await this.processWithReasoningModel(rawText);
    return {
      success: true,
      text: reasonedText,
      source: "openai-reasoned",
    };
  }
}

// Pas d'agent détecté ou useReasoning désactivé → nettoyage local seulement
const finalText = AudioManager.cleanTranscription(rawText);
return { success: true, text: finalText, source: "openai" };
```

## Modifications apportées

### 1. Fonction `processWithOpenAIAPI()` (lignes 410-430)
**Avant**: Le système utilisait toujours l'API IA si `useReasoningModel` était activé
**Après**: Le système vérifie maintenant la présence du nom d'agent avant d'utiliser l'API IA

```javascript
// Nouvelle logique ajoutée
if (useReasoning) {
  // Check if agent name is present in the text
  const { getAgentName } = await import("../utils/agentName.ts");
  const agentName = getAgentName();
  const hasAgentReference = agentName && 
    (rawText.toLowerCase().includes(`hey ${agentName.toLowerCase()}`) ||
     rawText.toLowerCase().includes(agentName.toLowerCase()));
  
  if (hasAgentReference) {
    // Seulement maintenant on utilise l'API IA
    const reasonedText = await this.processWithReasoningModel(rawText);
    return { success: true, text: reasonedText, source: "openai-reasoned" };
  }
}

// Sinon, nettoyage local seulement (instantané)
const finalText = AudioManager.cleanTranscription(rawText);
return { success: true, text: finalText, source: "openai" };
```

### 2. Fonction `processWithLocalWhisper()` (lignes 177-200)
**Avant**: Utilisait seulement le nettoyage local
**Après**: Applique la même logique de détection d'agent pour la cohérence

```javascript
// Même logique de détection d'agent ajoutée
if (useReasoning && hasAgentReference) {
  const reasonedText = await this.processWithReasoningModel(rawText);
  return { success: true, text: reasonedText, source: "local-reasoned" };
}
```

## Résultat attendu

### Comportement avec nom d'agent
- Texte: "Hey Claude, réécris ce message"
- Résultat: Utilise l'API IA (délai normal)
- Source: `openai-reasoned` ou `local-reasoned`

### Comportement sans nom d'agent
- Texte: "Voici mon message à transcrire"
- Résultat: Nettoyage local seulement (instantané)
- Source: `openai` ou `local`

## État actuel
- ✅ Problème identifié et analysé
- ✅ Solution implémentée
- 📝 Tests en attente