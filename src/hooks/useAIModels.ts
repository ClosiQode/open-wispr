import { useState } from "react";

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
  description?: string;
  apiType?: "responses" | "chat"; // GPT-5 uses Responses API, others use Chat Completions
}

// Liste statique des modèles OpenAI (mise à jour décembre 2025)
const OPENAI_MODELS: AIModel[] = [
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", description: "Dernière génération (Responses API)", apiType: "responses" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "Modèle le plus capable", apiType: "chat" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", description: "Rapide et économique", apiType: "chat" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", description: "Haute performance", apiType: "chat" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", description: "Classique", apiType: "chat" },
];

// Liste statique des modèles Anthropic
const ANTHROPIC_MODELS: AIModel[] = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", description: "Meilleur rapport qualité/prix" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", description: "Ultra-rapide" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", description: "Le plus intelligent" },
];

export function useAIModels() {
  const [openaiModels] = useState<AIModel[]>(OPENAI_MODELS);
  const [anthropicModels] = useState<AIModel[]>(ANTHROPIC_MODELS);

  return {
    openaiModels,
    anthropicModels,
    allModels: [...openaiModels, ...anthropicModels],
    loading: false,
    error: null,
    // Fonction vide pour compatibilité (plus de fetch dynamique)
    refreshModels: () => {},
  };
}

// Helper pour déterminer le type d'API à utiliser
export function getModelApiType(modelId: string): "responses" | "chat" {
  const model = OPENAI_MODELS.find(m => m.id === modelId);
  return model?.apiType || "chat";
}

// Export des listes pour usage externe
export { OPENAI_MODELS, ANTHROPIC_MODELS };
