export const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Détection automatique" },
  { value: "af", label: "Afrikaans" },
  { value: "ar", label: "Arabe" },
  { value: "hy", label: "Arménien" },
  { value: "az", label: "Azéri" },
  { value: "be", label: "Biélorusse" },
  { value: "bs", label: "Bosniaque" },
  { value: "bg", label: "Bulgare" },
  { value: "ca", label: "Catalan" },
  { value: "zh", label: "Chinois" },
  { value: "hr", label: "Croate" },
  { value: "cs", label: "Tchèque" },
  { value: "da", label: "Danois" },
  { value: "nl", label: "Néerlandais" },
  { value: "en", label: "Anglais" },
  { value: "et", label: "Estonien" },
  { value: "fi", label: "Finnois" },
  { value: "fr", label: "Français" },
  { value: "gl", label: "Galicien" },
  { value: "de", label: "Allemand" },
  { value: "el", label: "Grec" },
  { value: "he", label: "Hébreu" },
  { value: "hi", label: "Hindi" },
  { value: "hu", label: "Hongrois" },
  { value: "is", label: "Islandais" },
  { value: "id", label: "Indonésien" },
  { value: "it", label: "Italien" },
  { value: "ja", label: "Japonais" },
  { value: "kn", label: "Kannada" },
  { value: "kk", label: "Kazakh" },
  { value: "ko", label: "Coréen" },
  { value: "lv", label: "Letton" },
  { value: "lt", label: "Lituanien" },
  { value: "mk", label: "Macédonien" },
  { value: "ms", label: "Malais" },
  { value: "mr", label: "Marathi" },
  { value: "mi", label: "Maori" },
  { value: "ne", label: "Népalais" },
  { value: "no", label: "Norvégien" },
  { value: "fa", label: "Persan" },
  { value: "pl", label: "Polonais" },
  { value: "pt", label: "Portugais" },
  { value: "ro", label: "Roumain" },
  { value: "ru", label: "Russe" },
  { value: "sr", label: "Serbe" },
  { value: "sk", label: "Slovaque" },
  { value: "sl", label: "Slovène" },
  { value: "es", label: "Espagnol" },
  { value: "sw", label: "Swahili" },
  { value: "sv", label: "Suédois" },
  { value: "tl", label: "Tagalog" },
  { value: "ta", label: "Tamoul" },
  { value: "th", label: "Thaï" },
  { value: "tr", label: "Turc" },
  { value: "uk", label: "Ukrainien" },
  { value: "ur", label: "Ourdou" },
  { value: "vi", label: "Vietnamien" },
  { value: "cy", label: "Gallois" },
];

export const getLanguageLabel = (code: string): string => {
  const option = LANGUAGE_OPTIONS.find((lang) => lang.value === code);
  return option?.label || code;
};

// Reasoning model configuration with provider abstraction
// Note: This is used as fallback. Dynamic models are fetched via useAIModels hook.
export const REASONING_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: [
      {
        value: "gpt-5-mini",
        label: "GPT-5 Mini",
        description: "Dernière génération",
      },
      {
        value: "gpt-4o",
        label: "GPT-4o",
        description: "Modèle le plus capable",
      },
      {
        value: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Rapide et économique",
      },
      {
        value: "gpt-4-turbo",
        label: "GPT-4 Turbo",
        description: "Haute performance",
      },
      {
        value: "gpt-3.5-turbo",
        label: "GPT-3.5 Turbo",
        description: "Classique",
      },
    ],
  },
  anthropic: {
    name: "Anthropic",
    models: [
      {
        value: "claude-3-5-sonnet-20241022",
        label: "Claude 3.5 Sonnet",
        description: "Meilleur rapport qualité/prix",
      },
      {
        value: "claude-3-5-haiku-20241022",
        label: "Claude 3.5 Haiku",
        description: "Ultra-rapide",
      },
      {
        value: "claude-3-opus-20240229",
        label: "Claude 3 Opus",
        description: "Le plus intelligent",
      },
    ],
  },
};

export const getAllReasoningModels = () => {
  return Object.entries(REASONING_PROVIDERS).flatMap(([providerId, provider]) =>
    provider.models.map((model) => ({
      ...model,
      provider: providerId,
      fullLabel: `${provider.name} ${model.label}`,
    }))
  );
};

export const getReasoningModelLabel = (modelId: string): string => {
  const allModels = getAllReasoningModels();
  const model = allModels.find((m) => m.value === modelId);
  return model?.fullLabel || modelId;
};

export const getModelProvider = (modelId: string): string => {
  const allModels = getAllReasoningModels();
  const model = allModels.find((m) => m.value === modelId);
  return model?.provider || "openai";
};

// Transcription provider configuration
export type TranscriptionProviderId = "local" | "openai" | "groq";

export interface TranscriptionModel {
  value: string;
  label: string;
  description: string;
}

export interface TranscriptionProvider {
  id: TranscriptionProviderId;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder?: string;
  apiKeyHelpUrl?: string;
  models?: TranscriptionModel[];
}

export const TRANSCRIPTION_PROVIDERS: Record<TranscriptionProviderId, TranscriptionProvider> = {
  local: {
    id: "local",
    name: "Whisper Local",
    description: "Transcription privée sur votre machine",
    requiresApiKey: false,
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "API cloud OpenAI (whisper-1)",
    requiresApiKey: true,
    apiKeyPlaceholder: "sk-...",
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
  },
  groq: {
    id: "groq",
    name: "Groq",
    description: "Transcription ultra-rapide (216x temps réel)",
    requiresApiKey: true,
    apiKeyPlaceholder: "gsk_...",
    apiKeyHelpUrl: "https://console.groq.com/keys",
    models: [
      {
        value: "whisper-large-v3-turbo",
        label: "Whisper Large v3 Turbo",
        description: "Rapide et économique",
      },
      {
        value: "whisper-large-v3",
        label: "Whisper Large v3",
        description: "Meilleure précision",
      },
    ],
  },
};

export const getTranscriptionProvider = (providerId: TranscriptionProviderId): TranscriptionProvider => {
  return TRANSCRIPTION_PROVIDERS[providerId] || TRANSCRIPTION_PROVIDERS.local;
};
