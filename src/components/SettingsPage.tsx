import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RefreshCw, Download, Keyboard, Mic, Shield } from "lucide-react";
import WhisperModelPicker from "./WhisperModelPicker";
import ProcessingModeSelector from "./ui/ProcessingModeSelector";
import ApiKeyInput from "./ui/ApiKeyInput";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useSettings } from "../hooks/useSettings";
import { useDialogs } from "../hooks/useDialogs";
import { useAgentName } from "../utils/agentName";
import { useWhisper } from "../hooks/useWhisper";
import { usePermissions } from "../hooks/usePermissions";
import { useClipboard } from "../hooks/useClipboard";
import { REASONING_PROVIDERS } from "../utils/languages";
import LanguageSelector from "./ui/LanguageSelector";
import PromptStudio from "./ui/PromptStudio";
const InteractiveKeyboard = React.lazy(() => import("./ui/Keyboard"));
const EnhancedKeyboard = React.lazy(() => import("./ui/EnhancedKeyboard"));

export type SettingsSectionType =
  | "general"
  | "transcription"
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
    startOnBoot,
    setUseLocalWhisper,
    setWhisperModel,
    setAllowOpenAIFallback,
    setAllowLocalFallback,
    setFallbackWhisperModel,
    setPreferredLanguage,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider,
    setOpenaiApiKey,
    setAnthropicApiKey,
    setDictationKey,
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
        setUpdateStatus(statusResult);
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

      const handleUpdateError = (event, error) => {
        setCheckingForUpdates(false);
        setDownloadingUpdate(false);
        console.error("Update error:", error);
      };

      window.electronAPI.onUpdateAvailable?.(handleUpdateAvailable);
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
      await window.electronAPI?.updateHotkey(dictationKey);
      showAlertDialog({
          title: "Touche sauvegardée",
          description: `Touche de dictée sauvegardée : ${dictationKey}`,
        });
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      showAlertDialog({
        title: "Error",
        description: `Failed to update hotkey: ${error.message}`,
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
                        showAlertDialog({
                          title: "Aucune mise à jour",
                          description:
                            result?.message || "Aucune mise à jour disponible",
                        });
                      }
                    } catch (error: any) {
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
                  >
                    {downloadingUpdate ? (
                      <>
                        <Download size={16} className="animate-pulse mr-2" />
                        Téléchargement... {Math.round(updateDownloadProgress)}%
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Télécharger la mise à jour v{updateInfo.version}
                      </>
                    )}
                  </Button>
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
                        <div className="whitespace-pre-wrap">{updateInfo.releaseNotes}</div>
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
                
                {/* Options de configuration */}
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
              <ProcessingModeSelector
                useLocalWhisper={useLocalWhisper}
                setUseLocalWhisper={(value) => {
                  setUseLocalWhisper(value);
                  updateTranscriptionSettings({ useLocalWhisper: value });
                }}
              />
            </div>

            {!useLocalWhisper && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-900">Configuration de l'API OpenAI</h4>
                <ApiKeyInput
                  apiKey={openaiApiKey}
                  setApiKey={setOpenaiApiKey}
                  helpText="Obtenez votre clé API depuis platform.openai.com"
                />
              </div>
            )}

            {useLocalWhisper && whisperHook.whisperInstalled && (
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
                  useLocalWhisper,
                  whisperModel,
                  preferredLanguage,
                });

                if (!useLocalWhisper && openaiApiKey.trim()) {
                  updateApiKeys({ openaiApiKey });
                }

                showAlertDialog({
                  title: "Paramètres sauvegardés",
                  description: `Mode de transcription : ${
                    useLocalWhisper ? "Whisper local" : "API OpenAI"
                  }. Langue : ${preferredLanguage}.`,
                });
              }}
              className="w-full"
            >
              Sauvegarder les paramètres de transcription
            </Button>
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

              {useLocalWhisper && (
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
                  <h4 className="font-medium text-indigo-900">Modèle IA</h4>
                  <select
                    value={reasoningModel}
                    onChange={(e) => setReasoningModel(e.target.value)}
                    className="w-full text-sm border border-indigo-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {REASONING_PROVIDERS[
                      reasoningProvider as keyof typeof REASONING_PROVIDERS
                    ]?.models.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-600">
                    Différents modèles offrent des niveaux variés de qualité et de vitesse
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

