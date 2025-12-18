import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RefreshCw, Download, Keyboard, Mic, Shield, Lock, Cloud, Zap, Book, Plus, Trash2, Search } from "lucide-react";
import WhisperModelPicker from "./WhisperModelPicker";
import ApiKeyInput from "./ui/ApiKeyInput";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useSettings } from "../hooks/useSettings";
import { useDialogs } from "../hooks/useDialogs";
import { useAgentName } from "../utils/agentName";
import { useWhisper } from "../hooks/useWhisper";
import { usePermissions } from "../hooks/usePermissions";
import { useClipboard } from "../hooks/useClipboard";
import { useDictionary, DictionaryEntry } from "../hooks/useDictionary";
import { useAIModels } from "../hooks/useAIModels";
import { REASONING_PROVIDERS, TRANSCRIPTION_PROVIDERS, TranscriptionProviderId } from "../utils/languages";
import LanguageSelector from "./ui/LanguageSelector";
import PromptStudio from "./ui/PromptStudio";
const InteractiveKeyboard = React.lazy(() => import("./ui/Keyboard"));
const EnhancedKeyboard = React.lazy(() => import("./ui/EnhancedKeyboard"));

export type SettingsSectionType =
  | "general"
  | "transcription"
  | "dictionary"
  | "aiModels"
  | "agentConfig"
  | "prompts";

interface SettingsPageProps {
  activeSection?: SettingsSectionType;
}

export default function SettingsPage({
  activeSection = "general",
}: SettingsPageProps) {
  // Use custom hooks
  const {
    confirmDialog,
    alertDialog,
    showConfirmDialog,
    showAlertDialog,
    hideConfirmDialog,
    hideAlertDialog,
  } = useDialogs();

  const {
    useLocalWhisper,
    whisperModel,
    allowOpenAIFallback,
    allowLocalFallback,
    fallbackWhisperModel,
    preferredLanguage,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    dictationKey,
    hotkeyMode,
    startOnBoot,
    transcriptionProvider,
    groqApiKey,
    groqModel,
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
    setReasoningProvider,
    setOpenaiApiKey,
    setAnthropicApiKey,
    setDictationKey,
    setHotkeyMode,
    setStartOnBoot,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
    updateGeneralSettings,
  } = useSettings();

  // Update state
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<{
    updateAvailable: boolean;
    updateDownloaded: boolean;
    isDevelopment: boolean;
  }>({ updateAvailable: false, updateDownloaded: false, isDevelopment: false });
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    releaseDate?: string;
    releaseNotes?: string;
  }>({});

  const whisperHook = useWhisper(showAlertDialog);
  const permissionsHook = usePermissions(showAlertDialog);
  const { pasteFromClipboardWithFallback } = useClipboard(showAlertDialog);
  const { agentName, setAgentName } = useAgentName();
  const dictionaryHook = useDictionary();
  const { openaiModels, anthropicModels, loading: modelsLoading, refreshModels } = useAIModels();

  // États pour le dictionnaire
  const [newDictFrom, setNewDictFrom] = useState("");
  const [newDictTo, setNewDictTo] = useState("");
  const [dictSearchQuery, setDictSearchQuery] = useState("");
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);

  // États pour le nouveau clavier amélioré
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [allowCombinations, setAllowCombinations] = useState(false);
  const [keyboardLayout, setKeyboardLayout] = useState<'qwerty' | 'azerty'>('azerty');
  
  // État pour le démarrage automatique
  const [autoStartLoading, setAutoStartLoading] = useState(false);

  // Synchroniser selectedKeys avec dictationKey
  useEffect(() => {
    if (dictationKey) {
      // Convertir la chaîne de dictationKey en tableau
      const keys = dictationKey.includes('+') ? dictationKey.split('+') : [dictationKey];
      setSelectedKeys(keys);
      setAllowCombinations(keys.length > 1);
    }
  }, [dictationKey]);

  // Mettre à jour dictationKey quand selectedKeys change
  useEffect(() => {
    if (selectedKeys.length > 0) {
      const newDictationKey = selectedKeys.join('+');
      if (newDictationKey !== dictationKey) {
        setDictationKey(newDictationKey);
      }
    }
  }, [selectedKeys, dictationKey, setDictationKey]);

  // Charger les modèles IA quand la clé API change
  useEffect(() => {
    if (openaiApiKey) {
      refreshModels(openaiApiKey);
    }
  }, [openaiApiKey, refreshModels]);

  // Synchroniser l'état du démarrage automatique au chargement
  useEffect(() => {
    const syncAutoStartStatus = async () => {
      try {
        const result = await window.electronAPI?.getAutoStartStatus();
        if (result?.success && result.enabled !== undefined) {
          setStartOnBoot(result.enabled);
        }
      } catch (error) {
        console.error("Failed to sync auto-start status:", error);
      }
    };
    
    syncAutoStartStatus();
  }, [setStartOnBoot]);

  // Defer heavy operations for better performance
  useEffect(() => {
    let mounted = true;

    // Defer version and update checks to improve initial render
    const timer = setTimeout(async () => {
      if (!mounted) return;
      
      const versionResult = await window.electronAPI?.getAppVersion();
      if (versionResult && mounted) setCurrentVersion(versionResult.version);

      const statusResult = await window.electronAPI?.getUpdateStatus();
      if (statusResult && mounted) {
        // Only update if current state is still at default values
        setUpdateStatus(prev => {
          // Don't overwrite if update is already available or downloaded
          if (prev.updateAvailable || prev.updateDownloaded) {
            return { ...prev, isDevelopment: statusResult.isDevelopment };
          }
          return statusResult;
        });
        subscribeToUpdates();
      }

      // Check whisper after initial render
      if (mounted) {
        whisperHook.checkWhisperInstallation();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      // Always clean up update listeners if they exist
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners?.("update-available");
        window.electronAPI.removeAllListeners?.("update-not-available");
        window.electronAPI.removeAllListeners?.("update-downloaded");
        window.electronAPI.removeAllListeners?.("update-error");
        window.electronAPI.removeAllListeners?.("update-download-progress");
      }
    };
  }, [whisperHook]);

  const subscribeToUpdates = () => {
    if (window.electronAPI) {
      const handleUpdateAvailable = (event, info) => {
        setUpdateStatus((prev) => ({ ...prev, updateAvailable: true }));
        setUpdateInfo({
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes,
        });
      };

      const handleUpdateDownloaded = (event, info) => {
        setUpdateStatus((prev) => ({ ...prev, updateDownloaded: true }));
        setDownloadingUpdate(false);
      };

      const handleUpdateProgress = (event, progressObj) => {
        setUpdateDownloadProgress(progressObj.percent || 0);
      };

      const handleUpdateNotAvailable = (event, info) => {
        setUpdateStatus((prev) => ({ ...prev, updateAvailable: false }));
        setCheckingForUpdates(false);
      };

      const handleUpdateError = (event, error) => {
        setCheckingForUpdates(false);
        setDownloadingUpdate(false);
        setUpdateStatus((prev) => ({ ...prev, updateAvailable: false }));
        console.error("Update error:", error);
      };

      window.electronAPI.onUpdateAvailable?.(handleUpdateAvailable);
      window.electronAPI.onUpdateNotAvailable?.(handleUpdateNotAvailable);
      window.electronAPI.onUpdateDownloaded?.(handleUpdateDownloaded);
      window.electronAPI.onUpdateDownloadProgress?.(handleUpdateProgress);
      window.electronAPI.onUpdateError?.(handleUpdateError);
    }
  };

  const saveReasoningSettings = useCallback(() => {
    updateReasoningSettings({ useReasoningModel, reasoningModel });
    updateApiKeys({
      ...(reasoningProvider === "openai" &&
        openaiApiKey.trim() && { openaiApiKey }),
      ...(reasoningProvider === "anthropic" &&
        anthropicApiKey.trim() && { anthropicApiKey }),
    });

    showAlertDialog({
      title: "Paramètres de raisonnement sauvegardés",
      description: `Amélioration de texte IA ${
        useReasoningModel ? "activée" : "désactivée"
      } avec ${
        REASONING_PROVIDERS[
          reasoningProvider as keyof typeof REASONING_PROVIDERS
        ]?.name || reasoningProvider
      } ${reasoningModel}`,
    });
  }, [
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    updateReasoningSettings,
    updateApiKeys,
    showAlertDialog,
  ]);

  const saveApiKey = useCallback(async () => {
    try {
      await window.electronAPI?.saveOpenAIKey(openaiApiKey);
      updateApiKeys({ openaiApiKey });
      updateTranscriptionSettings({ allowLocalFallback, fallbackWhisperModel });

      try {
        await window.electronAPI?.createProductionEnvFile(openaiApiKey);
        showAlertDialog({
          title: "Clé API sauvegardée",
          description: `Clé API OpenAI sauvegardée avec succès ! Vos identifiants ont été enregistrés de manière sécurisée pour les services de transcription.${
            allowLocalFallback ? " Le fallback Whisper local est activé." : ""
          }`,
        });
      } catch (envError) {
        showAlertDialog({
          title: "API Key Saved",
          description: `OpenAI API key saved successfully and will be available for transcription${
            allowLocalFallback ? " with Local Whisper fallback enabled" : ""
          }`,
        });
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      updateApiKeys({ openaiApiKey });
      updateTranscriptionSettings({ allowLocalFallback, fallbackWhisperModel });
      showAlertDialog({
        title: "API Key Saved",
        description: "OpenAI API key saved to localStorage (fallback mode)",
      });
    }
  }, [
    openaiApiKey,
    allowLocalFallback,
    fallbackWhisperModel,
    updateApiKeys,
    updateTranscriptionSettings,
    showAlertDialog,
  ]);

  const resetAccessibilityPermissions = () => {
    const message = `🔄 RÉINITIALISER LES PERMISSIONS D'ACCESSIBILITÉ\n\nSi vous avez reconstruit ou réinstallé OpenWispr et que l'inscription automatique ne fonctionne pas, vous pourriez avoir des permissions obsolètes de la version précédente.\n\n📋 RESTAURATION ÉTAPE PAR ÉTAPE :\n\n1️⃣ Ouvrir les Réglages Système (ou Préférences Système)\n   • macOS Ventura+ : Menu Apple → Réglages Système\n   • macOS plus ancien : Menu Apple → Préférences Système\n\n2️⃣ Naviguer vers Confidentialité et sécurité → Accessibilité\n\n3️⃣ Rechercher les entrées OpenWispr obsolètes :\n   • Toute entrée nommée "OpenWispr"\n   • Toute entrée nommée "Electron"\n   • Toute entrée avec des noms peu clairs ou génériques\n   • Entrées pointant vers d'anciens emplacements d'application\n\n4️⃣ Supprimer TOUTES les entrées obsolètes :\n   • Sélectionner chaque ancienne entrée\n   • Cliquer sur le bouton moins (-)\n   • Entrer votre mot de passe si demandé\n\n5️⃣ Ajouter l'OpenWispr actuel :\n   • Cliquer sur le bouton plus (+)\n   • Naviguer et sélectionner l'application OpenWispr ACTUELLE\n   • S'assurer que la case est COCHÉE\n\n6️⃣ Redémarrer OpenWispr complètement\n\n💡 C'est très courant pendant le développement lors de la reconstruction d'applications !\n\nCliquez sur OK quand vous êtes prêt à ouvrir les Réglages Système.`;

    showConfirmDialog({
      title: "Reset Accessibility Permissions",
      description: message,
      onConfirm: () => {
        showAlertDialog({
          title: "Opening System Settings",
          description:
            "Opening System Settings... Look for the Accessibility section under Privacy & Security.",
        });

        window.open(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
          "_blank"
        );
      },
    });
  };

  const saveKey = async () => {
    try {
      await window.electronAPI?.updateHotkey(dictationKey, hotkeyMode);
      const modeLabel = hotkeyMode === "push-to-talk" ? "Push-to-Talk" : "Toggle";
      showAlertDialog({
          title: "Raccourci sauvegardé",
          description: `Touche de dictée : ${dictationKey} (Mode: ${modeLabel})`,
        });
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      showAlertDialog({
        title: "Erreur",
        description: `Échec de la mise à jour du raccourci : ${error.message}`,
      });
    }
  };

  const handleAutoStartToggle = async (enabled: boolean) => {
    setAutoStartLoading(true);
    try {
      const result = await window.electronAPI?.setAutoStart(enabled);
      if (result?.success) {
        setStartOnBoot(enabled);
        showAlertDialog({
          title: enabled ? "Démarrage automatique activé" : "Démarrage automatique désactivé",
          description: enabled 
            ? "OpenWispr se lancera automatiquement au démarrage de votre ordinateur."
            : "OpenWispr ne se lancera plus automatiquement au démarrage.",
        });
      } else {
        throw new Error(result?.error || "Échec de la configuration du démarrage automatique");
      }
    } catch (error: any) {
      console.error("Failed to toggle auto-start:", error);
      showAlertDialog({
        title: "Erreur",
        description: `Impossible de modifier le démarrage automatique : ${error.message}`,
      });
    } finally {
      setAutoStartLoading(false);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-8">
            {/* App Updates Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mises à jour de l'application
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Maintenez OpenWispr à jour avec les dernières fonctionnalités et
                  améliorations.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    Version actuelle
                  </p>
                  <p className="text-xs text-neutral-600">
                    {currentVersion || "Chargement..."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {updateStatus.isDevelopment ? (
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      Mode développement
                    </span>
                  ) : updateStatus.updateAvailable ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Mise à jour disponible
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
                      À jour
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    setCheckingForUpdates(true);
                    try {
                      const result =
                        await window.electronAPI?.checkForUpdates();
                      if (result?.updateAvailable) {
                        setUpdateInfo({
                          version: result.version,
                          releaseDate: result.releaseDate,
                          releaseNotes: result.releaseNotes,
                        });
                        setUpdateStatus((prev) => ({
                          ...prev,
                          updateAvailable: true,
                        }));
                        showAlertDialog({
                          title: "Mise à jour disponible",
                          description: `Mise à jour disponible : v${result.version}`,
                        });
                      } else {
                        setUpdateStatus((prev) => ({
                          ...prev,
                          updateAvailable: false,
                        }));
                        showAlertDialog({
                          title: "Aucune mise à jour",
                          description:
                            result?.message || "Aucune mise à jour disponible",
                        });
                      }
                    } catch (error: any) {
                      setUpdateStatus((prev) => ({
                        ...prev,
                        updateAvailable: false,
                      }));
                      showAlertDialog({
                        title: "Échec de la vérification",
                        description: `Erreur lors de la vérification des mises à jour : ${error.message}`,
                      });
                    } finally {
                      setCheckingForUpdates(false);
                    }
                  }}
                  disabled={checkingForUpdates || updateStatus.isDevelopment}
                  className="w-full"
                >
                  {checkingForUpdates ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Vérification des mises à jour...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Vérifier les mises à jour
                    </>
                  )}
                </Button>

                {updateStatus.updateAvailable && !updateStatus.updateDownloaded && (
                  <div className="space-y-2">
                    <Button
                      onClick={async () => {
                        showConfirmDialog({
                          title: "Mise à jour automatique",
                          description: `Voulez-vous télécharger et installer automatiquement la mise à jour v${updateInfo.version} ? L'application redémarrera une fois l'installation terminée.`,
                          onConfirm: async () => {
                             setDownloadingUpdate(true);
                             setUpdateDownloadProgress(0);
                             try {
                               await window.electronAPI?.autoUpdate();
                               // L'installation se fera automatiquement après le téléchargement
                             } catch (error: any) {
                               setDownloadingUpdate(false);
                               showAlertDialog({
                                 title: "Échec de la mise à jour",
                                 description: `Échec de la mise à jour automatique : ${error.message}`,
                               });
                             }
                           },
                        });
                      }}
                      disabled={downloadingUpdate}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {downloadingUpdate ? (
                        <>
                          <Download size={16} className="animate-pulse mr-2" />
                          Mise à jour en cours... {Math.round(updateDownloadProgress)}%
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-2" />
                          Mettre à jour automatiquement v{updateInfo.version}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={async () => {
                        setDownloadingUpdate(true);
                        setUpdateDownloadProgress(0);
                        try {
                          await window.electronAPI?.downloadUpdate();
                        } catch (error: any) {
                          setDownloadingUpdate(false);
                          showAlertDialog({
                            title: "Échec du téléchargement",
                            description: `Échec du téléchargement de la mise à jour : ${error.message}`,
                          });
                        }
                      }}
                      disabled={downloadingUpdate}
                      className="w-full bg-green-600 hover:bg-green-700"
                      variant="outline"
                    >
                      {downloadingUpdate ? (
                        <>
                          <Download size={16} className="animate-pulse mr-2" />
                          Téléchargement... {Math.round(updateDownloadProgress)}%
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-2" />
                          Télécharger seulement v{updateInfo.version}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {updateStatus.updateDownloaded && (
                  <Button
                    onClick={async () => {
                      showConfirmDialog({
                        title: "Installer la mise à jour",
                        description: `Prêt à installer la mise à jour v${updateInfo.version}. L'application redémarrera pour terminer l'installation.`,
                        onConfirm: async () => {
                          try {
                            await window.electronAPI?.installUpdate();
                          } catch (error: any) {
                            showAlertDialog({
                              title: "Échec de l'installation",
                              description: `Échec de l'installation de la mise à jour : ${error.message}`,
                            });
                          }
                        },
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-2">🚀</span>
                    Installer la mise à jour et redémarrer
                  </Button>
                )}

                {updateInfo.version && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Mise à jour v{updateInfo.version}
                    </h4>
                    {updateInfo.releaseDate && (
                      <p className="text-sm text-blue-700 mb-2">
                        Publié le : {new Date(updateInfo.releaseDate).toLocaleDateString()}
                      </p>
                    )}
                    {updateInfo.releaseNotes && (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Nouveautés :</p>
                        <div 
                          className="text-sm leading-relaxed [&>h3]:font-semibold [&>h3]:text-blue-900 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1 [&>li]:text-blue-800 [&>p]:mb-2 [&>strong]:font-semibold [&>strong]:text-blue-900 [&>em]:italic [&>code]:bg-blue-100 [&>code]:px-1 [&>code]:rounded"
                          dangerouslySetInnerHTML={{ 
                            __html: updateInfo.releaseNotes
                              ?.replace(/\n/g, '<br>')
                              ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              ?.replace(/\*(.*?)\*/g, '<em>$1</em>')
                              ?.replace(/`(.*?)`/g, '<code>$1</code>')
                              || ''
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-start Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Démarrage automatique
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configurez OpenWispr pour se lancer automatiquement au démarrage de votre ordinateur.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    Lancer au démarrage
                  </p>
                  <p className="text-xs text-neutral-600">
                    {startOnBoot 
                      ? "OpenWispr se lancera automatiquement au démarrage" 
                      : "OpenWispr ne se lancera pas automatiquement"}
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startOnBoot}
                      onChange={(e) => handleAutoStartToggle(e.target.checked)}
                      disabled={autoStartLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {autoStartLoading && (
                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Conseil :</strong> Lorsque cette option est activée, OpenWispr se lancera 
                  discrètement dans la barre des tâches au démarrage de votre ordinateur, 
                  prêt à être utilisé à tout moment.
                </p>
              </div>
            </div>

            {/* Hotkey Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Raccourci de dictée
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configurez la touche ou combinaison de touches pour démarrer et arrêter la dictée vocale.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raccourci d'activation
                  </label>
                  <Input
                    placeholder="Par défaut : ` (backtick)"
                    value={dictationKey}
                    onChange={(e) => setDictationKey(e.target.value)}
                    className="text-center text-lg font-mono"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Utilisez le clavier ci-dessous pour sélectionner votre raccourci
                  </p>
                </div>
                
                {/* Mode de raccourci (Toggle / Push-to-Talk) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mode de déclenchement
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setHotkeyMode("toggle")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        hotkeyMode === "toggle"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">🔄</span>
                      <span className="font-medium">Toggle</span>
                      <span className="text-xs opacity-70 text-center">
                        Appuyez une fois pour démarrer,<br />une fois pour arrêter
                      </span>
                    </button>
                    <button
                      onClick={() => setHotkeyMode("push-to-talk")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        hotkeyMode === "push-to-talk"
                          ? "border-green-500 bg-green-50 text-green-900"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">🎤</span>
                      <span className="font-medium">Push-to-Talk</span>
                      <span className="text-xs opacity-70 text-center">
                        Maintenez appuyé pour parler,<br />relâchez pour arrêter
                      </span>
                    </button>
                  </div>
                </div>

                {/* Options de configuration du clavier */}
                <div className="flex gap-4 p-3 bg-blue-50 rounded-lg">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="keyboardMode"
                      checked={!allowCombinations}
                      onChange={() => setAllowCombinations(false)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-blue-800">Touche simple</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="keyboardMode"
                      checked={allowCombinations}
                      onChange={() => setAllowCombinations(true)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-blue-800">Combinaison de touches</span>
                  </label>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      {allowCombinations 
                        ? 'Sélectionnez votre combinaison de touches :' 
                        : 'Cliquez sur une touche pour la sélectionner :'}
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setKeyboardLayout(keyboardLayout === 'qwerty' ? 'azerty' : 'qwerty')}
                      >
                        {keyboardLayout.toUpperCase()}
                      </Button>
                    </div>
                  </div>
                  <React.Suspense
                    fallback={
                      <div className="h-32 flex items-center justify-center text-gray-500">
                        Chargement du clavier...
                      </div>
                    }
                  >
                    <EnhancedKeyboard
                      selectedKeys={selectedKeys}
                      setSelectedKeys={setSelectedKeys}
                      layout={keyboardLayout}
                      allowCombinations={allowCombinations}
                    />
                  </React.Suspense>
                </div>
                
                {allowCombinations && selectedKeys.length > 1 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>💡 Conseil :</strong> Les combinaisons avec Ctrl, Alt ou Shift sont recommandées 
                      pour éviter les conflits avec la saisie normale.
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={saveKey}
                  disabled={selectedKeys.length === 0}
                  className="w-full"
                >
                  Sauvegarder le raccourci
                </Button>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Permissions
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Testez et gérez les permissions de l'application pour le microphone et
                  l'accessibilité.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={permissionsHook.requestMicPermission}
                  variant="outline"
                  className="w-full"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Tester la permission du microphone
                </Button>
                <Button
                  onClick={permissionsHook.testAccessibilityPermission}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Tester la permission d'accessibilité
                </Button>
                <Button
                  onClick={resetAccessibilityPermissions}
                  variant="secondary"
                  className="w-full"
                >
                  <span className="mr-2">⚙️</span>
                  Corriger les problèmes de permissions
                </Button>
              </div>
            </div>

            {/* About Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  À propos d'OpenWispr
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  OpenWispr convertit votre parole en texte en utilisant l'IA. Appuyez sur votre
                  touche de raccourci, parlez, et nous taperons ce que vous avez dit là où se trouve votre
                  curseur.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Keyboard className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium text-gray-800 mb-1">
                    Touche de raccourci par défaut
                  </p>
                  <p className="text-gray-600 font-mono text-xs">
                    {dictationKey || "` (backtick)"}
                  </p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🏷️</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-1">Version</p>
                  <p className="text-gray-600 text-xs">
                    {currentVersion || "0.1.0"}
                  </p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-1">Statut</p>
                  <p className="text-green-600 text-xs font-medium">Actif</p>
                </div>
              </div>

              {/* System Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    showConfirmDialog({
                      title: "Réinitialiser l'intégration",
                      description:
                        "Êtes-vous sûr de vouloir réinitialiser le processus d'intégration ? Cela effacera votre configuration et affichera à nouveau le flux de bienvenue.",
                      onConfirm: () => {
                        localStorage.removeItem("onboardingCompleted");
                        window.location.reload();
                      },
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                  className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                >
                  <span className="mr-2">🔄</span>
                  Réinitialiser l'intégration
                </Button>
                <Button
                  onClick={() => {
                    showConfirmDialog({
                      title: "⚠️ DANGER : Nettoyer les données de l'application",
                      description:
                        "Ceci supprimera définitivement TOUTES les données d'OpenWispr incluant :\n\n• Base de données et transcriptions\n• Paramètres de stockage local\n• Modèles Whisper téléchargés\n• Fichiers d'environnement\n\nVous devrez supprimer manuellement les permissions de l'application dans les Réglages Système.\n\nCette action ne peut pas être annulée. Êtes-vous sûr ?",
                      onConfirm: () => {
                        window.electronAPI
                          ?.cleanupApp()
                          .then(() => {
                            showAlertDialog({
                              title: "Nettoyage terminé",
                              description:
                                "✅ Nettoyage terminé ! Toutes les données de l'application ont été supprimées.",
                            });
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          })
                          .catch((error) => {
                            showAlertDialog({
                              title: "Échec du nettoyage",
                              description: `❌ Échec du nettoyage : ${error.message}`,
                            });
                          });
                      },
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <span className="mr-2">🗑️</span>
                  Nettoyer toutes les données de l'application
                </Button>
              </div>
            </div>
          </div>
        );

      case "transcription":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Traitement de la parole en texte
              </h3>

              {/* Transcription Provider Selector - 3 boutons côte à côte */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Local */}
                <button
                  onClick={() => {
                    setTranscriptionProvider("local");
                    setUseLocalWhisper(true);
                    updateTranscriptionSettings({ transcriptionProvider: "local", useLocalWhisper: true });
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    transcriptionProvider === "local"
                      ? "border-purple-500 bg-purple-50 text-purple-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Lock className={`w-6 h-6 ${transcriptionProvider === "local" ? "text-purple-600" : "text-gray-500"}`} />
                  <span className="font-medium">Whisper Local</span>
                  <span className="text-xs opacity-70">Privé</span>
                </button>

                {/* OpenAI */}
                <button
                  onClick={() => {
                    setTranscriptionProvider("openai");
                    setUseLocalWhisper(false);
                    updateTranscriptionSettings({ transcriptionProvider: "openai", useLocalWhisper: false });
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    transcriptionProvider === "openai"
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Cloud className={`w-6 h-6 ${transcriptionProvider === "openai" ? "text-blue-600" : "text-gray-500"}`} />
                  <span className="font-medium">OpenAI</span>
                  <span className="text-xs opacity-70">Cloud</span>
                </button>

                {/* Groq */}
                <button
                  onClick={() => {
                    setTranscriptionProvider("groq");
                    setUseLocalWhisper(false);
                    updateTranscriptionSettings({ transcriptionProvider: "groq", useLocalWhisper: false });
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    transcriptionProvider === "groq"
                      ? "border-orange-500 bg-orange-50 text-orange-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Zap className={`w-6 h-6 ${transcriptionProvider === "groq" ? "text-orange-600" : "text-gray-500"}`} />
                  <span className="font-medium">Groq</span>
                  <span className="text-xs opacity-70">Ultra-rapide</span>
                </button>
              </div>
            </div>

            {/* Configuration OpenAI */}
            {transcriptionProvider === "openai" && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-900">Configuration de l'API OpenAI</h4>
                <ApiKeyInput
                  apiKey={openaiApiKey}
                  setApiKey={setOpenaiApiKey}
                  helpText="Obtenez votre clé API depuis platform.openai.com"
                />
              </div>
            )}

            {/* Configuration Groq */}
            {transcriptionProvider === "groq" && (
              <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <h4 className="font-medium text-orange-900">Configuration Groq</h4>

                {/* Clé API Groq */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-800">Clé API Groq</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      className="flex-1 text-sm border-orange-300 focus:border-orange-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pasteFromClipboardWithFallback(setGroqApiKey)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      Coller
                    </Button>
                  </div>
                  <p className="text-xs text-orange-600">
                    Obtenez votre clé API depuis console.groq.com
                  </p>
                </div>

                {/* Sélecteur de modèle Groq */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-800">Modèle Groq</label>
                  <select
                    value={groqModel}
                    onChange={(e) => {
                      setGroqModel(e.target.value);
                      updateTranscriptionSettings({ groqModel: e.target.value });
                    }}
                    className="w-full p-2 border border-orange-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo (rapide)</option>
                    <option value="whisper-large-v3">Whisper Large v3 (précis)</option>
                  </select>
                  <p className="text-xs text-orange-600">
                    Turbo : plus rapide et économique. Large v3 : meilleure précision.
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Whisper Local */}
            {transcriptionProvider === "local" && whisperHook.whisperInstalled && (
              <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="font-medium text-purple-900">
                  Modèle Whisper local
                </h4>
                <WhisperModelPicker
                  selectedModel={whisperModel}
                  onModelSelect={setWhisperModel}
                  variant="settings"
                />
              </div>
            )}

            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900">Langue préférée</h4>
              <LanguageSelector
                value={preferredLanguage}
                onChange={(value) => {
                  setPreferredLanguage(value);
                  updateTranscriptionSettings({ preferredLanguage: value });
                }}
                className="w-full"
              />
            </div>

            <Button
              onClick={() => {
                updateTranscriptionSettings({
                  useLocalWhisper: transcriptionProvider === "local",
                  whisperModel,
                  preferredLanguage,
                  transcriptionProvider,
                  groqModel,
                });

                if (transcriptionProvider === "openai" && openaiApiKey.trim()) {
                  updateApiKeys({ openaiApiKey });
                }
                if (transcriptionProvider === "groq" && groqApiKey.trim()) {
                  updateApiKeys({ groqApiKey });
                }

                const providerNames: Record<TranscriptionProviderId, string> = {
                  local: "Whisper local",
                  openai: "OpenAI",
                  groq: "Groq",
                };

                showAlertDialog({
                  title: "Paramètres sauvegardés",
                  description: `Mode de transcription : ${providerNames[transcriptionProvider]}. Langue : ${preferredLanguage}.`,
                });
              }}
              className="w-full"
            >
              Sauvegarder les paramètres de transcription
            </Button>
          </div>
        );

      case "dictionary":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dictionnaire personnalisé
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Ajoutez des remplacements automatiques pour corriger les mots souvent mal transcrits.
                Les remplacements sont appliqués après chaque transcription.
              </p>
            </div>

            {/* Formulaire d'ajout */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
              <h4 className="font-medium text-gray-900">
                {editingEntry ? "Modifier une entrée" : "Ajouter une entrée"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Mot mal transcrit</label>
                  <Input
                    placeholder="Ex: Claudi"
                    value={editingEntry ? editingEntry.from : newDictFrom}
                    onChange={(e) => editingEntry
                      ? setEditingEntry({...editingEntry, from: e.target.value})
                      : setNewDictFrom(e.target.value)
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Correction</label>
                  <Input
                    placeholder="Ex: Claude"
                    value={editingEntry ? editingEntry.to : newDictTo}
                    onChange={(e) => editingEntry
                      ? setEditingEntry({...editingEntry, to: e.target.value})
                      : setNewDictTo(e.target.value)
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {editingEntry ? (
                  <>
                    <Button
                      onClick={() => {
                        if (editingEntry.from.trim() && editingEntry.to.trim()) {
                          dictionaryHook.updateEntry(editingEntry.id, {
                            from: editingEntry.from.trim(),
                            to: editingEntry.to.trim(),
                          });
                          setEditingEntry(null);
                          showAlertDialog({
                            title: "Entrée modifiée",
                            description: `"${editingEntry.from}" sera remplacé par "${editingEntry.to}".`,
                          });
                        }
                      }}
                      disabled={!editingEntry.from.trim() || !editingEntry.to.trim()}
                      className="flex-1"
                    >
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingEntry(null)}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      const result = dictionaryHook.addEntry(newDictFrom, newDictTo);
                      if (result) {
                        setNewDictFrom("");
                        setNewDictTo("");
                        showAlertDialog({
                          title: "Entrée ajoutée",
                          description: `"${result.from}" sera automatiquement remplacé par "${result.to}".`,
                        });
                      } else {
                        showAlertDialog({
                          title: "Erreur",
                          description: "Impossible d'ajouter l'entrée. Vérifiez que les champs sont remplis et que l'entrée n'existe pas déjà.",
                        });
                      }
                    }}
                    disabled={!newDictFrom.trim() || !newDictTo.trim()}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter au dictionnaire
                  </Button>
                )}
              </div>
            </div>

            {/* Liste des entrées */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Entrées ({dictionaryHook.entries.length})
                </h4>
                {dictionaryHook.entries.length > 0 && (
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={dictSearchQuery}
                        onChange={(e) => setDictSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showConfirmDialog({
                          title: "Supprimer toutes les entrées",
                          description: "Êtes-vous sûr de vouloir supprimer toutes les entrées du dictionnaire ? Cette action est irréversible.",
                          onConfirm: () => {
                            dictionaryHook.clearAll();
                            showAlertDialog({
                              title: "Dictionnaire vidé",
                              description: "Toutes les entrées ont été supprimées.",
                            });
                          },
                          variant: "destructive",
                        });
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {dictionaryHook.entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune entrée dans le dictionnaire</p>
                  <p className="text-sm">Ajoutez des mots à corriger ci-dessus</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {dictionaryHook.searchEntries(dictSearchQuery).map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 ${
                          entry.enabled ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => dictionaryHook.toggleEntry(entry.id)}
                            className={`w-10 h-5 rounded-full transition-colors ${
                              entry.enabled ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                entry.enabled ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                          <div className="flex-1">
                            <span className={`font-mono ${entry.enabled ? "text-gray-900" : "text-gray-400"}`}>
                              {entry.from}
                            </span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className={`font-mono ${entry.enabled ? "text-green-600" : "text-gray-400"}`}>
                              {entry.to}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEntry(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Modifier</span>
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              showConfirmDialog({
                                title: "Supprimer l'entrée",
                                description: `Voulez-vous supprimer "${entry.from}" → "${entry.to}" ?`,
                                onConfirm: () => dictionaryHook.deleteEntry(entry.id),
                                variant: "destructive",
                              });
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Import/Export */}
            {dictionaryHook.entries.length > 0 && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const json = dictionaryHook.exportEntries();
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "openwispr-dictionary.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".json";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const text = await file.text();
                        const result = dictionaryHook.importEntries(text);
                        if (result.success) {
                          showAlertDialog({
                            title: "Import réussi",
                            description: `${result.count} entrée(s) importée(s).`,
                          });
                        } else {
                          showAlertDialog({
                            title: "Erreur d'import",
                            description: result.error || "Format de fichier invalide.",
                          });
                        }
                      }
                    };
                    input.click();
                  }}
                  className="flex-1"
                >
                  📥 Importer
                </Button>
              </div>
            )}
          </div>
        );

      case "aiModels":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Amélioration de texte IA
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configurez comment les modèles IA nettoient et formatent vos transcriptions.
                Cela gère les commandes comme "efface ça", crée des listes appropriées,
                et corrige les erreurs évidentes tout en préservant votre ton naturel.
              </p>

              {transcriptionProvider === "local" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Note :</span> L'amélioration de texte IA
                    nécessite un accès API et n'est actuellement disponible
                    qu'avec les fournisseurs basés sur le cloud.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-green-800">
                    Activer l'amélioration de texte IA
                  </label>
                  <p className="text-xs text-green-700">
                    Utiliser l'IA pour améliorer automatiquement la qualité de transcription
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={useReasoningModel}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setUseReasoningModel(enabled);
                      updateReasoningSettings({ useReasoningModel: enabled });
                    }}
                  />
                  <div
                    className={`w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ${
                      useReasoningModel ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ${
                        useReasoningModel ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>

            {useReasoningModel && (
              <>
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900">Fournisseur IA</h4>
                  <select
                    value={reasoningProvider}
                    onChange={(e) => {
                      setReasoningProvider(e.target.value);
                    }}
                    className="w-full text-sm border border-blue-300 rounded-md p-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(REASONING_PROVIDERS).map(
                      ([id, provider]) => (
                        <option key={id} value={id}>
                          {provider.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-indigo-900">Modèle IA</h4>
                    <button
                      onClick={() => refreshModels(openaiApiKey, true)}
                      disabled={modelsLoading}
                      className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-600 disabled:opacity-50 transition-colors"
                      title="Actualiser la liste des modèles"
                    >
                      <RefreshCw className={`w-4 h-4 ${modelsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <select
                    value={reasoningModel}
                    onChange={(e) => setReasoningModel(e.target.value)}
                    className="w-full text-sm border border-indigo-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {reasoningProvider === "openai" && openaiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}{model.description ? ` - ${model.description}` : ""}
                      </option>
                    ))}
                    {reasoningProvider === "anthropic" && anthropicModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}{model.description ? ` - ${model.description}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-600">
                    {modelsLoading ? "Chargement des modèles..." : "Différents modèles offrent des niveaux variés de qualité et de vitesse"}
                  </p>
                </div>

                {reasoningProvider === "openai" && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="font-medium text-blue-900">
                      Clé API OpenAI
                    </h4>
                    <ApiKeyInput
                      apiKey={openaiApiKey}
                      setApiKey={setOpenaiApiKey}
                      helpText="Identique à votre clé API de transcription"
                    />
                  </div>
                )}

                {reasoningProvider === "anthropic" && (
                  <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h4 className="font-medium text-purple-900">
                      Clé API Anthropic
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        className="flex-1 text-sm border-purple-300 focus:border-purple-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          pasteFromClipboardWithFallback(setAnthropicApiKey)
                        }
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        Coller
                      </Button>
                    </div>
                    <p className="text-xs text-purple-600">
                      Obtenez votre clé API depuis console.anthropic.com
                    </p>
                  </div>
                )}
              </>
            )}

            <Button onClick={saveReasoningSettings} className="w-full">
              Sauvegarder les paramètres du modèle IA
            </Button>
          </div>
        );

      case "agentConfig":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configuration de l'agent
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Personnalisez le nom et le comportement de votre assistant IA pour rendre
                les interactions plus personnelles et efficaces.
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <h4 className="font-medium text-purple-900 mb-3">
                💡 Comment utiliser les noms d'agent :
              </h4>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>
                  • Dites "Hey {agentName}, écris un email formel" pour des
                  instructions spécifiques
                </li>
                <li>
                  • Utilisez "Hey {agentName}, formate ceci en liste" pour des
                  commandes d'amélioration de texte
                </li>
                <li>
                  • L'agent reconnaîtra quand vous vous adressez directement à lui
                  par rapport à la dictée de contenu
                </li>
                <li>
                  • Rend les conversations plus naturelles et aide à distinguer
                  les commandes de la dictée
                </li>
              </ul>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900">Nom actuel de l'agent</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="ex: Assistant, Jarvis, Alex..."
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="flex-1 text-center text-lg font-mono"
                />
                <Button
                  onClick={() => {
                    setAgentName(agentName.trim());
                    showAlertDialog({
                      title: "Nom de l'agent mis à jour",
                      description: `Votre agent s'appelle maintenant "${agentName.trim()}". Vous pouvez vous adresser à lui en disant "Hey ${agentName.trim()}" suivi de vos instructions.`,
                    });
                  }}
                  disabled={!agentName.trim()}
                >
                  Sauvegarder
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Choisissez un nom qui semble naturel à dire et à retenir
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Exemples d'utilisation :
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  • "Hey {agentName}, écris un email à mon équipe à propos de la
                  réunion"
                </p>
                <p>
                  • "Hey {agentName}, rends ceci plus professionnel" (après
                  avoir dicté du texte)
                </p>
                <p>• "Hey {agentName}, convertis ceci en puces"</p>
                <p>
                  • Dictée normale : "Ceci est juste du texte normal" (pas besoin du nom de l'agent)
                </p>
              </div>
            </div>
          </div>
        );


      case "prompts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion des prompts IA
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Visualisez et personnalisez les prompts qui alimentent le traitement de texte IA d'OpenWispr. 
                Ajustez-les pour changer la façon dont vos transcriptions sont formatées et améliorées.
              </p>
            </div>
            
            <PromptStudio />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && hideConfirmDialog()}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => !open && hideAlertDialog()}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      {renderSectionContent()}
    </>
  );
}

