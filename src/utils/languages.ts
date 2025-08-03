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
export const REASONING_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: [
      {
        value: "gpt-3.5-turbo",
        label: "GPT-3.5 Turbo",
        description: "Rapide et efficace",
      },
      {
        value: "gpt-4o-mini",
        label: "GPT-4o Mini",
        description: "Qualité supérieure",
      },
    ],
  },
  anthropic: {
    name: "Anthropic",
    models: [
      {
        value: "claude-3-haiku-20240307",
        label: "Claude 3 Haiku",
        description: "Rapide et abordable",
      },
      {
        value: "claude-3-sonnet-20240229",
        label: "Claude 3 Sonnet",
        description: "Performance équilibrée",
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
