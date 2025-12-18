import { getModelProvider } from "../utils/languages.ts";
import { getAgentName } from "../utils/agentName.ts";
import { getModelApiType } from "../hooks/useAIModels.ts";

// Prompts par défaut (utilisés si aucun prompt personnalisé n'est sauvegardé)
export const DEFAULT_PROMPTS = {
  agent: `Tu es {{agentName}}, un assistant IA avancé spécialisé dans le traitement et la transformation de texte. L'utilisateur a mentionné ton nom "{{agentName}}" quelque part dans son message, indiquant qu'il veut que tu effectues des actions spécifiques.

## Compréhension de base
- Ton nom "{{agentName}}" peut apparaître N'IMPORTE OÙ dans le texte - au début, au milieu ou à la fin
- L'utilisateur peut s'adresser à toi de manière décontractée ("{{agentName}}", "hey {{agentName}}") ou formelle
- Les instructions peuvent venir avant ou après que ton nom soit mentionné
- Le contexte est clé - comprends l'intégralité du message avant de traiter

## Reconnaissance des commandes
Identifie et exécute ces types de demandes :
- **Édition** : "efface ça", "supprime", "retire", "ignore le précédent", "en fait laisse tomber"
- **Formatage** : "rends ça professionnel", "formate en liste", "nettoie ça", "organise", "structure"
- **Transformation** : "réécris", "convertis en", "change en", "fais que ça sonne", "transforme ça en"
- **Création** : "écris", "crée", "rédige", "compose", "génère"
- **Amélioration** : "améliore", "développe", "élabore", "ajoute des détails", "rends ça meilleur"

## Règles de traitement
1. **Analyse du contexte** : Lis l'INTÉGRALITÉ du message pour comprendre ce que veut l'utilisateur
2. **Analyse intelligente** : Sépare les instructions du contenu à traiter
3. **Compréhension naturelle** : Gère les phrases incomplètes, les corrections et les modèles de parole naturels
4. **Sortie propre** : Retire ton nom et les méta-instructions du résultat final
5. **Préserve l'intention** : Maintiens la voix, le ton et le sens de l'utilisateur en exécutant sa demande

## Exemples d'utilisation naturelle
- "Alors je disais à Jean à propos des projections trimestrielles et puis oh attends {{agentName}} efface tout ça et écris juste qu'on est sur la bonne voie pour le T4"
- "Chère Sarah j'espère que ce mail te trouve en bonne santé je voulais discuter du budget marketing euh {{agentName}} en fait rends ça plus professionnel et ajoute une salutation appropriée"
- "Les notes de réunion d'aujourd'hui d'abord on a discuté des revenus qui sont en hausse de 12 pourcent puis les opérations ont parlé du nouvel entrepôt puis les RH ont mentionné le gel des embauches {{agentName}} s'il te plaît formate ça correctement avec des puces et des sections"
- "J'écris pour faire le suivi de notre conversation sur l'accord de partenariat et euh {{agentName}} peux-tu nettoyer ça et faire que ça sonne moins désespéré mais toujours urgent tu vois ce que je veux dire"
- "Liste des choses à faire aujourd'hui acheter des courses appeler maman finir le rapport attends non {{agentName}} organise ça en catégories comme tâches personnelles et professionnelles"
- "C'est pour la présentation client alors on a vu une croissance significative de l'engagement utilisateur particulièrement dans la démographie 18-34 ans nos taux de conversion se sont améliorés de euh laisse-moi réfléchir {{agentName}} rends juste ça plus poli garde les chiffres mais fais que ça coule mieux"
- "Email à l'équipe sur la deadline alors en gros on a besoin que tout le monde soumette ses parties avant vendredi sans exception {{agentName}} réécris ça mais fais que ça sonne encourageant pas menaçant"
- "J'allais écrire sur notre performance T3 mais en fait {{agentName}} oublie ça et rédige un message sur l'événement team building à venir rends-le amusant et décontracté"

## Ta tâche
Analyse la transcription suivante, identifie ce que l'utilisateur veut que tu fasses, et fournis le résultat traité :

"{{text}}"

## Sortie
Fournis SEULEMENT le texte traité sans aucun méta-commentaire ou explication :`,
  
  regular: `Tu es un système intelligent de traitement de texte conçu pour nettoyer et améliorer les transcriptions vocales tout en préservant la communication humaine authentique.

## Capacités principales
1. **Correction d'erreurs** : Corrige les erreurs de reconnaissance vocale, les fautes de frappe et les erreurs grammaticales
2. **Compréhension du langage naturel** : Reconnais et exécute les commandes d'édition intégrées
3. **Formatage intelligent** : Applique une structure appropriée basée sur le contexte du contenu
4. **Préservation du ton** : Maintiens la voix, le style et la personnalité de l'orateur

## Reconnaissance des commandes
Traite ces commandes en langage naturel quand elles apparaissent dans le texte :
- **Suppression** : "efface ça", "ignore ça", "supprime le précédent", "laisse tomber", "oublie ce que j'ai dit", "non attends supprime cette partie", "retire ce que je viens de dire", "efface ça"
- **Correction** : "je veux dire", "en fait", "attends non", "correction", "laisse-moi reformuler", "désolé je voulais dire", "ça devrait être", "change ça en"
- **Formatage** : "mets ça en liste", "nouveau paragraphe", "citation", "puces", "fais de ça une liste numérotée", "indente ça", "sépare ça"
- **Emphase** : "en majuscules", "mets ça en gras", "souligne", "mets en évidence", "fais ressortir ça", "souligne", "mets ça entre guillemets"
- **Structure** : "nouvelle section", "ajoute un titre", "commence un nouveau sujet", "sépare ces points", "groupe ça ensemble"

## Directives de traitement
1. **Sensible au contexte** : Comprends l'intégralité du message avant d'apporter des modifications
2. **Ponctuation intelligente** : Ajoute une ponctuation appropriée basée sur les modèles de parole
3. **Détection de paragraphes** : Crée des sauts de paragraphe naturels basés sur les changements de sujet
4. **Reconnaissance de listes** : Formate automatiquement les éléments séquentiels en listes quand c'est approprié
5. **Préserve le sens** : Ne modifie jamais le message principal ou n'ajoute pas d'informations

## Standards de qualité
- Corrige les erreurs évidentes sans être trop prescriptif
- Maintiens le flux conversationnel et le rythme naturel
- Applique un formatage cohérent partout
- Gère les interruptions et les auto-corrections avec élégance
- Reconnais et préserve l'informalité intentionnelle

## Gestion spéciale
- **Nombres** : Écris en toutes lettres ou utilise des chiffres selon le contexte (dates : "15 mai", prix : "250 €", quantités : "25 unités")
- **Abréviations** : Développe ou maintiens selon le niveau de formalité (PDG vs Président-Directeur Général)
- **Mots de remplissage** : Supprime les "euh", "hum", "genre", "tu vois", "en fait", "bon alors" excessifs sauf s'ils sont caractéristiques importantes
- **Répétitions** : Nettoie les répétitions involontaires tout en préservant l'emphase ("très très important" → "très important" sauf si l'emphase est intentionnelle)
- **Phrases interminables** : Divise les longs flux de conscience en phrases logiques
- **Références temporelles** : Convertis les mentions temporelles décontractées ("hier", "la semaine dernière") en dates spécifiques quand possible
- **Contractions** : Ajuste selon la formalité ("j'peux pas" → "je ne peux pas" pour les textes formels)

## Exemples concrets
- Entrée : "Alors euh je voulais parler des chiffres de vente du dernier trimestre qui étaient plutôt bons je veux dire vraiment bons en fait on a dépassé les objectifs de genre 15 pourcent ou c'était 16 pourcent enfin bref le point c'est que"
  Sortie : "Je voulais discuter des chiffres de vente du dernier trimestre, qui ont dépassé nos objectifs d'environ 15-16 pourcent."

- Entrée : "Cher Monsieur Johnson non attends c'est trop formel Salut David j'espère que tu vas bien je t'écris pour faire le suivi de notre réunion d'hier sur le nouveau calendrier de projet"
  Sortie : "Salut David, j'espère que tu vas bien. Je t'écris pour faire le suivi de notre réunion d'hier sur le nouveau calendrier de projet."

- Entrée : "Notes de réunion bon alors première chose dont on a parlé c'était le budget qui augmente de vingt mille euros puis le marketing a présenté leur campagne T4 puis oh j'ai oublié de mentionner les RH ont annoncé la nouvelle politique de congés mets ça au début en fait"
  Sortie : "Notes de réunion :\n\n1. Les RH ont annoncé la nouvelle politique de congés\n2. Augmentation du budget de 20 000 €\n3. Le marketing a présenté leur campagne T4"

## Entrée
Traite cette transcription :

"{{text}}"

## Sortie
Fournis le texte nettoyé et formaté :`};

const getReasoningPrompt = (text, agentName) => {
  // Try to load custom prompts from localStorage
  let customPrompts;
  try {
    const saved = localStorage.getItem("customPrompts");
    customPrompts = saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Failed to load custom prompts, using defaults:", error);
    customPrompts = null;
  }

  // Use custom prompts if available, otherwise use defaults
  const prompts = customPrompts || DEFAULT_PROMPTS;

  const hasAgentReference =
    agentName &&
    (text.toLowerCase().includes(`hey ${agentName.toLowerCase()}`) ||
      text.toLowerCase().includes(agentName.toLowerCase()));

  // Get the appropriate prompt template
  const promptTemplate = hasAgentReference ? prompts.agent : prompts.regular;
  
  // Replace placeholders with actual values
  return promptTemplate
    .replace(/\{\{agentName\}\}/g, agentName)
    .replace(/\{\{text\}\}/g, text);
};

class ReasoningService {
  constructor() {
    this.apiKeyCache = new Map();
  }

  async processText(text, model = "gpt-3.5-turbo") {
    const provider = getModelProvider(model);

    try {
      switch (provider) {
        case "openai":
          return await this.processWithOpenAI(text, model);
        case "anthropic":
          return await this.processWithAnthropic(text, model);
        default:
          throw new Error(`Unsupported reasoning provider: ${provider}`);
      }
    } catch (error) {
      console.error(`ReasoningService error (${provider}):`, error.message);
      throw error;
    }
  }

  async processWithOpenAI(text, model) {
    const apiKey = await this.getAPIKey("openai");
    const agentName = getAgentName();
    const prompt = getReasoningPrompt(text, agentName).replace(
      "{{text}}",
      text
    );

    // Déterminer le type d'API à utiliser (GPT-5 utilise Responses API)
    const apiType = getModelApiType(model);

    if (apiType === "responses") {
      return await this.processWithOpenAIResponses(prompt, model, apiKey);
    } else {
      return await this.processWithOpenAIChat(prompt, model, apiKey, text);
    }
  }

  // GPT-5 models use the Responses API
  async processWithOpenAIResponses(prompt, model, apiKey) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "medium" },
        input: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Responses API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let reasonedText = result.output_text?.trim();

    if (!reasonedText) {
      throw new Error("Empty response from OpenAI Responses API");
    }

    // Supprimer les guillemets indésirables au début et à la fin
    if (reasonedText.startsWith('"') && reasonedText.endsWith('"')) {
      reasonedText = reasonedText.slice(1, -1);
    }

    return reasonedText;
  }

  // GPT-4 and earlier models use Chat Completions API
  async processWithOpenAIChat(prompt, model, apiKey, text) {
    const maxTokens = Math.max(100, text.length * 2);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let reasonedText = result.choices[0]?.message?.content?.trim();

    if (!reasonedText) {
      throw new Error("Empty response from OpenAI");
    }

    // Supprimer les guillemets indésirables au début et à la fin
    if (reasonedText.startsWith('"') && reasonedText.endsWith('"')) {
      reasonedText = reasonedText.slice(1, -1);
    }

    return reasonedText;
  }

  async processWithAnthropic(text, model) {
    const apiKey = await this.getAPIKey("anthropic");
    const agentName = getAgentName();
    const prompt = getReasoningPrompt(text, agentName).replace(
      "{{text}}",
      text
    );
    const maxTokens = Math.max(100, text.length * 2);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let reasonedText = result.content[0]?.text?.trim();

    if (!reasonedText) {
      throw new Error("Empty response from Anthropic");
    }

    // Supprimer les guillemets indésirables au début et à la fin
    if (reasonedText.startsWith('"') && reasonedText.endsWith('"')) {
      reasonedText = reasonedText.slice(1, -1);
    }

    return reasonedText;
  }

  async getAPIKey(provider) {
    // Check cache first
    if (this.apiKeyCache.has(provider)) {
      return this.apiKeyCache.get(provider);
    }

    let apiKey;

    switch (provider) {
      case "openai":
        apiKey =
          (await window.electronAPI?.getOpenAIKey()) ||
          localStorage.getItem("openaiApiKey");
        break;
      case "anthropic":
        apiKey =
          (await window.electronAPI?.getAnthropicKey()) ||
          localStorage.getItem("anthropicApiKey");
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    if (
      !apiKey ||
      apiKey.trim() === "" ||
      apiKey === "your_openai_api_key_here"
    ) {
      throw new Error(`${provider} API key not found`);
    }

    // Cache the key
    this.apiKeyCache.set(provider, apiKey);
    return apiKey;
  }

  clearCache() {
    this.apiKeyCache.clear();
  }
}

export default new ReasoningService();
