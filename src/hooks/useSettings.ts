import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getModelProvider, TranscriptionProviderId } from "../utils/languages";

export interface TranscriptionSettings {
  useLocalWhisper: boolean;
  whisperModel: string;
  allowOpenAIFallback: boolean;
  allowLocalFallback: boolean;
  fallbackWhisperModel: string;
  preferredLanguage: string;
  transcriptionProvider: TranscriptionProviderId;
  groqModel: string;
}

export interface ReasoningSettings {
  useReasoningModel: boolean;
  reasoningModel: string;
  reasoningProvider: string;
}

export type HotkeyMode = "toggle" | "push-to-talk";

export interface HotkeySettings {
  dictationKey: string;
  hotkeyMode: HotkeyMode;
}

export interface GeneralSettings {
  startOnBoot: boolean;
}

export interface ApiKeySettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  groqApiKey: string;
}

export function useSettings() {
  const [useLocalWhisper, setUseLocalWhisper] = useLocalStorage(
    "useLocalWhisper",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [whisperModel, setWhisperModel] = useLocalStorage(
    "whisperModel",
    "base",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [allowOpenAIFallback, setAllowOpenAIFallback] = useLocalStorage(
    "allowOpenAIFallback",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [allowLocalFallback, setAllowLocalFallback] = useLocalStorage(
    "allowLocalFallback",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [fallbackWhisperModel, setFallbackWhisperModel] = useLocalStorage(
    "fallbackWhisperModel",
    "base",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [preferredLanguage, setPreferredLanguage] = useLocalStorage(
    "preferredLanguage",
    "en",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // Transcription provider (local, openai, groq)
  const [transcriptionProvider, setTranscriptionProvider] = useLocalStorage<TranscriptionProviderId>(
    "transcriptionProvider",
    "local",
    {
      serialize: String,
      deserialize: (value) => (value as TranscriptionProviderId) || "local",
    }
  );

  // Groq settings
  const [groqApiKey, setGroqApiKey] = useLocalStorage("groqApiKey", "", {
    serialize: String,
    deserialize: String,
  });

  const [groqModel, setGroqModel] = useLocalStorage(
    "groqModel",
    "whisper-large-v3-turbo",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // Reasoning settings
  const [useReasoningModel, setUseReasoningModel] = useLocalStorage(
    "useReasoningModel",
    true,
    {
      serialize: String,
      deserialize: (value) => value !== "false", // Default true
    }
  );

  const [reasoningModel, setReasoningModel] = useLocalStorage(
    "reasoningModel",
    "gpt-3.5-turbo",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // API keys
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage("openaiApiKey", "", {
    serialize: String,
    deserialize: String,
  });

  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage(
    "anthropicApiKey",
    "",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // Hotkey
  const [dictationKey, setDictationKey] = useLocalStorage("dictationKey", "", {
    serialize: String,
    deserialize: String,
  });

  // Hotkey mode (toggle or push-to-talk)
  const [hotkeyMode, setHotkeyMode] = useLocalStorage<HotkeyMode>(
    "hotkeyMode",
    "toggle",
    {
      serialize: String,
      deserialize: (value) => (value === "push-to-talk" ? "push-to-talk" : "toggle"),
    }
  );

  // General settings
  const [startOnBoot, setStartOnBoot] = useLocalStorage(
    "startOnBoot",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  // Computed values
  const reasoningProvider = getModelProvider(reasoningModel);

  // Batch operations
  const updateTranscriptionSettings = useCallback(
    (settings: Partial<TranscriptionSettings>) => {
      if (settings.useLocalWhisper !== undefined)
        setUseLocalWhisper(settings.useLocalWhisper);
      if (settings.whisperModel !== undefined)
        setWhisperModel(settings.whisperModel);
      if (settings.allowOpenAIFallback !== undefined)
        setAllowOpenAIFallback(settings.allowOpenAIFallback);
      if (settings.allowLocalFallback !== undefined)
        setAllowLocalFallback(settings.allowLocalFallback);
      if (settings.fallbackWhisperModel !== undefined)
        setFallbackWhisperModel(settings.fallbackWhisperModel);
      if (settings.preferredLanguage !== undefined)
        setPreferredLanguage(settings.preferredLanguage);
      if (settings.transcriptionProvider !== undefined)
        setTranscriptionProvider(settings.transcriptionProvider);
      if (settings.groqModel !== undefined)
        setGroqModel(settings.groqModel);
    },
    [
      setUseLocalWhisper,
      setWhisperModel,
      setAllowOpenAIFallback,
      setAllowLocalFallback,
      setFallbackWhisperModel,
      setPreferredLanguage,
      setTranscriptionProvider,
      setGroqModel,
    ]
  );

  const updateReasoningSettings = useCallback(
    (settings: Partial<ReasoningSettings>) => {
      if (settings.useReasoningModel !== undefined)
        setUseReasoningModel(settings.useReasoningModel);
      if (settings.reasoningModel !== undefined)
        setReasoningModel(settings.reasoningModel);
    },
    [setUseReasoningModel, setReasoningModel]
  );

  const updateApiKeys = useCallback(
    (keys: Partial<ApiKeySettings>) => {
      if (keys.openaiApiKey !== undefined) setOpenaiApiKey(keys.openaiApiKey);
      if (keys.anthropicApiKey !== undefined)
        setAnthropicApiKey(keys.anthropicApiKey);
      if (keys.groqApiKey !== undefined) setGroqApiKey(keys.groqApiKey);
    },
    [setOpenaiApiKey, setAnthropicApiKey, setGroqApiKey]
  );

  const updateGeneralSettings = useCallback(
    (settings: Partial<GeneralSettings>) => {
      if (settings.startOnBoot !== undefined) setStartOnBoot(settings.startOnBoot);
    },
    [setStartOnBoot]
  );

  return {
    useLocalWhisper,
    whisperModel,
    allowOpenAIFallback,
    allowLocalFallback,
    fallbackWhisperModel,
    preferredLanguage,
    transcriptionProvider,
    groqApiKey,
    groqModel,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    dictationKey,
    hotkeyMode,
    startOnBoot,
    setUseLocalWhisper,
    setWhisperModel,
    setAllowOpenAIFallback,
    setAllowLocalFallback,
    setFallbackWhisperModel,
    setPreferredLanguage,
    setTranscriptionProvider,
    setGroqApiKey,
    setGroqModel,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider: (provider: string) => {
      const providerModels = {
        openai: "gpt-3.5-turbo",
        anthropic: "claude-3-haiku-20240307",
      };
      setReasoningModel(
        providerModels[provider as keyof typeof providerModels] ||
          "gpt-3.5-turbo"
      );
    },
    setOpenaiApiKey,
    setAnthropicApiKey,
    setDictationKey,
    setHotkeyMode,
    setStartOnBoot,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
    updateGeneralSettings,
  };
}
