import { useState, useCallback } from "react";

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
  description?: string;
}

// Fallback models (mise à jour décembre 2025)
const FALLBACK_OPENAI_MODELS: AIModel[] = [
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai", description: "Dernière génération" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "Modèle le plus capable" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", description: "Rapide et économique" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", description: "Haute performance" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", description: "Classique" },
];

const FALLBACK_ANTHROPIC_MODELS: AIModel[] = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", description: "Meilleur rapport qualité/prix" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", description: "Ultra-rapide" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", description: "Le plus intelligent" },
];

const CACHE_KEY = "ai_models_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export function useAIModels() {
  const [openaiModels, setOpenaiModels] = useState<AIModel[]>(FALLBACK_OPENAI_MODELS);
  const [anthropicModels, setAnthropicModels] = useState<AIModel[]>(FALLBACK_ANTHROPIC_MODELS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatModelName = (id: string): string => {
    // gpt-4o -> GPT-4o, gpt-3.5-turbo -> GPT-3.5 Turbo
    return id
      .replace("gpt-", "GPT-")
      .replace("-turbo", " Turbo")
      .replace("-preview", " Preview")
      .replace("-mini", " Mini");
  };

  const fetchOpenAIModels = useCallback(async (apiKey: string) => {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      if (!response.ok) throw new Error("Failed to fetch OpenAI models");

      const data = await response.json();

      // Filtrer les modèles chat uniquement
      const chatModels = data.data
        .filter((m: { id: string }) =>
          m.id.startsWith("gpt-") &&
          !m.id.includes("instruct") &&
          !m.id.includes("vision") &&
          !m.id.includes("realtime") &&
          !m.id.includes("audio")
        )
        .map((m: { id: string }) => ({
          id: m.id,
          name: formatModelName(m.id),
          provider: "openai" as const,
        }))
        // Trier par pertinence (gpt-5 en premier, puis gpt-4o)
        .sort((a: AIModel, b: AIModel) => {
          const order = ["gpt-5", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5"];
          const aIndex = order.findIndex(p => a.id.startsWith(p));
          const bIndex = order.findIndex(p => b.id.startsWith(p));
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

      setOpenaiModels(chatModels.length > 0 ? chatModels : FALLBACK_OPENAI_MODELS);

      // Cache les résultats
      localStorage.setItem(`${CACHE_KEY}_openai`, JSON.stringify({
        models: chatModels,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Failed to fetch OpenAI models:", err);
      setOpenaiModels(FALLBACK_OPENAI_MODELS);
    }
  }, []);

  const refreshModels = useCallback(async (openaiApiKey?: string, forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = localStorage.getItem(`${CACHE_KEY}_openai`);
        if (cached) {
          try {
            const { models, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL && models.length > 0) {
              setOpenaiModels(models);
              setLoading(false);
              return;
            }
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }

      // Fetch fresh data if API key available
      if (openaiApiKey) {
        await fetchOpenAIModels(openaiApiKey);
      }

      // Anthropic: toujours fallback (pas d'API publique)
      setAnthropicModels(FALLBACK_ANTHROPIC_MODELS);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchOpenAIModels]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(`${CACHE_KEY}_openai`);
    setOpenaiModels(FALLBACK_OPENAI_MODELS);
    setAnthropicModels(FALLBACK_ANTHROPIC_MODELS);
  }, []);

  return {
    openaiModels,
    anthropicModels,
    allModels: [...openaiModels, ...anthropicModels],
    loading,
    error,
    refreshModels,
    clearCache,
  };
}

// Export fallback models for use in other files
export { FALLBACK_OPENAI_MODELS, FALLBACK_ANTHROPIC_MODELS };
