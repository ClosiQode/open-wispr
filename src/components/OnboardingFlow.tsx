import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Settings,
  Mic,
  Download,
  Key,
  Shield,
  Keyboard,
  TestTube,
  Sparkles,
  Lock,
  X,
  User,
} from "lucide-react";
import TitleBar from "./TitleBar";
import WhisperModelPicker from "./WhisperModelPicker";
import ProcessingModeSelector from "./ui/ProcessingModeSelector";
import ApiKeyInput from "./ui/ApiKeyInput";
import PermissionCard from "./ui/PermissionCard";
import StepProgress from "./ui/StepProgress";
import { AlertDialog } from "./ui/dialog";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDialogs } from "../hooks/useDialogs";
import { useWhisper } from "../hooks/useWhisper";
import { usePython } from "../hooks/usePython";
import { usePermissions } from "../hooks/usePermissions";
import { useClipboard } from "../hooks/useClipboard";
import { useSettings } from "../hooks/useSettings";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useToast } from "./ui/Toast";
import { getLanguageLabel, getReasoningModelLabel } from "../utils/languages";
import LanguageSelector from "./ui/LanguageSelector";
import EnhancedKeyboard from "./ui/EnhancedKeyboard";
import { setAgentName as saveAgentName } from "../utils/agentName";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep, removeCurrentStep] = useLocalStorage(
    "onboardingCurrentStep",
    0,
    {
      serialize: String,
      deserialize: (value) => parseInt(value, 10),
    }
  );

  const {
    useLocalWhisper,
    whisperModel,
    preferredLanguage,
    useReasoningModel,
    reasoningModel,
    openaiApiKey,
    dictationKey,
    setUseLocalWhisper,
    setWhisperModel,
    setPreferredLanguage,
    setOpenaiApiKey,
    setDictationKey,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
  } = useSettings();

  const [apiKey, setApiKey] = useState(openaiApiKey);
  const [hotkey, setHotkey] = useState(dictationKey || "`");
  const [agentName, setAgentName] = useState("Agent");
  const { alertDialog, showAlertDialog, hideAlertDialog } = useDialogs();
  const practiceTextareaRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const whisperHook = useWhisper(showAlertDialog);
  const pythonHook = usePython(showAlertDialog);
  const permissionsHook = usePermissions(showAlertDialog);
  const { pasteFromClipboard } = useClipboard(showAlertDialog);
  const audioRecording = useAudioRecording(toast);

  const steps = [
    { title: "Bienvenue", icon: Sparkles },
    { title: "Confidentialité", icon: Lock },
    { title: "Configuration", icon: Settings },
    { title: "Permissions", icon: Shield },
    { title: "Raccourci", icon: Keyboard },
    { title: "Test", icon: TestTube },
    { title: "Nom de l'agent", icon: User },
    { title: "Terminer", icon: Check },
  ];

  useEffect(() => {
    whisperHook.setupProgressListener();
    return () => {
      // Clean up listeners on unmount
      window.electronAPI?.removeAllListeners?.("whisper-install-progress");
    };
  }, []);

  // Sauvegarder automatiquement le raccourci clavier quand il change
  useEffect(() => {
    if (hotkey && hotkey !== dictationKey) {
      setDictationKey(hotkey);
      // Mettre à jour le raccourci global immédiatement
      if (window.electronAPI?.updateHotkey) {
        window.electronAPI.updateHotkey(hotkey);
      }
    }
  }, [hotkey, dictationKey, setDictationKey]);

  const updateProcessingMode = (useLocal: boolean) => {
    updateTranscriptionSettings({ useLocalWhisper: useLocal });
  };

  useEffect(() => {
    if (currentStep === 5) {
      if (practiceTextareaRef.current) {
        practiceTextareaRef.current.focus();
      }
    }
  }, [currentStep]);

  const saveSettings = useCallback(async () => {
    updateTranscriptionSettings({ whisperModel, preferredLanguage });
    setDictationKey(hotkey);
    saveAgentName(agentName);

    localStorage.setItem(
      "micPermissionGranted",
      permissionsHook.micPermissionGranted.toString()
    );
    localStorage.setItem(
      "accessibilityPermissionGranted",
      permissionsHook.accessibilityPermissionGranted.toString()
    );
    localStorage.setItem("onboardingCompleted", "true");

    if (!useLocalWhisper && apiKey.trim()) {
      await window.electronAPI.saveOpenAIKey(apiKey);
      updateApiKeys({ openaiApiKey: apiKey });
    }
  }, [
    whisperModel,
    hotkey,
    preferredLanguage,
    agentName,
    permissionsHook.micPermissionGranted,
    permissionsHook.accessibilityPermissionGranted,
    useLocalWhisper,
    apiKey,
    updateTranscriptionSettings,
    updateApiKeys,
    setDictationKey,
  ]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      // Show dictation panel when moving from permissions step (3) to hotkey step (4)
      if (currentStep === 3 && newStep === 4) {
        if (window.electronAPI?.showDictationPanel) {
          window.electronAPI.showDictationPanel();
        }
      }
    }
  }, [currentStep, setCurrentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
    }
  }, [currentStep, setCurrentStep]);

  const finishOnboarding = useCallback(async () => {
    await saveSettings();
    // Clear the onboarding step since we're done
    removeCurrentStep();
    onComplete();
  }, [saveSettings, removeCurrentStep, onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div
            className="text-center space-y-6"
            style={{ fontFamily: "Noto Sans, sans-serif" }}
          >
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2
                className="text-2xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Bienvenue dans OpenWispr
              </h2>
              <p
                className="text-stone-600"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Configurons votre dictée vocale en quelques étapes simples.
              </p>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/60">
              <p
                className="text-sm text-blue-800"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                🎤 Transformez votre voix en texte instantanément
                <br />
                ⚡ Fonctionne partout sur votre ordinateur
                <br />
                🔒 Votre confidentialité est protégée
              </p>
            </div>
          </div>
        );

      case 1: // Choose Mode
        return (
          <div
            className="space-y-6"
            style={{ fontFamily: "Noto Sans, sans-serif" }}
          >
            <div className="text-center">
              <h2
                className="text-2xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Choisissez votre mode de traitement
              </h2>
              <p
                className="text-stone-600"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Comment souhaitez-vous convertir votre parole en texte ?
              </p>
            </div>

            <ProcessingModeSelector
              useLocalWhisper={useLocalWhisper}
              setUseLocalWhisper={updateProcessingMode}
            />
          </div>
        );

      case 2: // Setup Processing
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {useLocalWhisper
                  ? "Configuration du traitement local"
                  : "Configuration du traitement cloud"}
              </h2>
              <p className="text-gray-600">
                {useLocalWhisper
                  ? "Installons et configurons Whisper sur votre appareil"
                  : "Entrez votre clé API OpenAI pour commencer"}
              </p>
            </div>

            {useLocalWhisper ? (
              <div className="space-y-4">
                {/* Python Installation Section */}
                {!pythonHook.pythonInstalled ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <Download className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Installer Python
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Python est requis pour le traitement local. Nous l'installerons automatiquement pour vous.
                      </p>
                    </div>

                    {pythonHook.installingPython ? (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="font-medium text-blue-900">
                            Installation de Python...
                          </span>
                        </div>
                        {pythonHook.installProgress && (
                          <div className="text-xs text-blue-600 bg-white p-2 rounded font-mono">
                            {pythonHook.installProgress}
                          </div>
                        )}
                        <p className="text-xs text-blue-600 mt-2">
                          Cela peut prendre quelques minutes. Veuillez garder l'application ouverte.
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          pythonHook.installPython();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Installer Python
                      </Button>
                    )}
                  </div>
                ) : !whisperHook.whisperInstalled ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                      <Download className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Installer Whisper
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Python est prêt ! Nous allons maintenant installer Whisper pour la reconnaissance vocale.
                      </p>
                    </div>

                    {whisperHook.installingWhisper ? (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <span className="font-medium text-purple-900">
                            Installation...
                          </span>
                        </div>
                        {whisperHook.installProgress && (
                          <div className="text-xs text-purple-600 bg-white p-2 rounded font-mono">
                            {whisperHook.installProgress}
                          </div>
                        )}
                        <p className="text-xs text-purple-600 mt-2">
                          Cela peut prendre quelques minutes. Veuillez garder l'application ouverte.
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={whisperHook.installWhisper}
                        className="w-full"
                      >
                        Installer Whisper
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-green-900 mb-2">
                        Whisper installé !
                      </h3>
                      <p className="text-sm text-gray-600">
                        Choisissez maintenant la qualité de votre modèle :
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Choisissez la qualité de votre modèle ci-dessous
                      </label>
                      <p className="text-xs text-gray-500">
                        Téléchargez et sélectionnez le modèle qui correspond le mieux à vos besoins.
                      </p>
                    </div>

                    <WhisperModelPicker
                      selectedModel={whisperModel}
                      onModelSelect={setWhisperModel}
                      variant="onboarding"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <ApiKeyInput
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  label="Clé API OpenAI"
                  helpText="Obtenez votre clé API depuis platform.openai.com"
                />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Comment obtenir votre clé API :
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Allez sur platform.openai.com</li>
                    <li>2. Connectez-vous à votre compte</li>
                    <li>3. Naviguez vers les clés API</li>
                    <li>4. Créez une nouvelle clé secrète</li>
                    <li>5. Copiez et collez-la ici</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Language Selection - shown for both modes */}
            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-3">
                🌍 Langue préférée
              </h4>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quelle langue parlez-vous principalement ?
              </label>
              <LanguageSelector
                value={preferredLanguage}
                onChange={(value) => {
                  updateTranscriptionSettings({ preferredLanguage: value });
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                {useLocalWhisper
                  ? "Aide Whisper à mieux comprendre votre parole"
                  : "Améliore la vitesse et la précision de transcription d'OpenAI. L'amélioration de texte IA est activée par défaut."}
              </p>
            </div>
          </div>
        );

      case 3: // Permissions
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Accorder les permissions
              </h2>
              <p className="text-gray-600">
                OpenWispr a besoin de quelques permissions pour fonctionner correctement
              </p>
            </div>

            <div className="space-y-4">
              <PermissionCard
                icon={Mic}
                title="Accès au microphone"
                description="Requis pour enregistrer votre voix"
                granted={permissionsHook.micPermissionGranted}
                onRequest={permissionsHook.requestMicPermission}
                buttonText="Accorder l'accès"
              />
              
              {/* Bouton de test microphone */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TestTube className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">Test du microphone</h4>
                      <p className="text-sm text-blue-700">
                        Statut: {permissionsHook.micPermissionStatus === 'granted' ? '✅ Autorisé' : 
                                permissionsHook.micPermissionStatus === 'denied' ? '❌ Refusé' : 
                                permissionsHook.micPermissionStatus === 'prompt' ? '⏳ En attente' : '❓ Inconnu'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      const success = await permissionsHook.testMicrophoneAccess();
                      if (success) {
                        toast({
                          title: "✅ Test réussi",
                          description: "Le microphone fonctionne correctement !",
                          variant: "default",
                        });
                      } else {
                        toast({
                          title: "❌ Test échoué",
                          description: "Problème détecté avec le microphone. Consultez le guide de diagnostic.",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Tester
                  </Button>
                </div>
              </div>

              <PermissionCard
                icon={Shield}
                title="Permission d'accessibilité"
                description="Requis pour coller le texte automatiquement"
                granted={permissionsHook.accessibilityPermissionGranted}
                onRequest={permissionsHook.testAccessibilityPermission}
                buttonText="Tester et accorder"
              />
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">
                🔒 Note de confidentialité
              </h4>
              <p className="text-sm text-amber-800">
                OpenWispr utilise ces permissions uniquement pour la dictée.
                {useLocalWhisper
                  ? " Avec le traitement local, votre voix ne quitte jamais votre appareil."
                  : " Votre voix est envoyée aux serveurs d'OpenAI pour la transcription."}
              </p>
            </div>
          </div>
        );

      case 4: // Choose Hotkey
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choisissez votre touche de raccourci
              </h2>
              <p className="text-gray-600">
                Sélectionnez la touche que vous voulez presser pour démarrer/arrêter la dictée
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Touche d'activation
                </label>
                <Input
                  placeholder="Par défaut : ` (backtick)"
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Appuyez sur cette touche depuis n'importe où pour démarrer/arrêter la dictée
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Cliquez sur n'importe quelle touche pour la sélectionner :
                </h4>
                <EnhancedKeyboard 
                  selectedKeys={hotkey.includes('+') ? hotkey.split('+') : [hotkey]} 
                  onSelectionChange={(keys) => setHotkey(keys.length > 1 ? keys.join('+') : keys[0] || '`')}
                  allowCombinations={true}
                  keyboardLayout="azerty"
                  showLayoutToggle={true}
                  showModeToggle={true}
                  enablePhysicalKeyDetection={true}
                />
              </div>
            </div>
          </div>
        );

      case 5: // Test & Practice
        return (
          <div
            className="space-y-6"
            style={{ fontFamily: "Noto Sans, sans-serif" }}
          >
            <div className="text-center">
              <h2
                className="text-2xl font-bold text-stone-900 mb-2"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Test et pratique
              </h2>
              <p
                className="text-stone-600"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Testons votre configuration et pratiquons l'utilisation d'OpenWispr
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-200/60">
                <h3
                  className="font-semibold text-blue-900 mb-3"
                  style={{ fontFamily: "Noto Sans, sans-serif" }}
                >
                  Pratiquez avec votre touche de raccourci
                </h3>
                <p
                  className="text-sm text-blue-800 mb-4"
                  style={{ fontFamily: "Noto Sans, sans-serif" }}
                >
                  <strong>Étape 1 :</strong> Cliquez dans la zone de texte ci-dessous pour y placer
                  votre curseur.
                  <br />
                  <strong>Étape 2 :</strong> Appuyez sur{" "}
                  <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-blue-200">
                    {hotkey}
                  </kbd>{" "}
                  pour commencer l'enregistrement, puis dites quelque chose.
                  <br />
                  <strong>Étape 3 :</strong> Appuyez sur{" "}
                  <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-blue-200">
                    {hotkey}
                  </kbd>{" "}
                  à nouveau pour arrêter et voir votre texte transcrit apparaître où se trouve votre
                  curseur !
                </p>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-stone-600">
                      <Mic className={`w-4 h-4 ${
                        audioRecording.isRecording ? 'text-red-500 animate-pulse' : 
                        audioRecording.isProcessing ? 'text-yellow-500 animate-spin' : ''
                      }`} />
                      <span style={{ fontFamily: "Noto Sans, sans-serif" }}>
                        {audioRecording.isRecording ? 'Enregistrement en cours... Appuyez sur ' :
                         audioRecording.isProcessing ? 'Traitement en cours...' :
                         'Cliquez dans la zone de texte ci-dessous, puis appuyez sur '}
                        {!audioRecording.isProcessing && (
                          <kbd className="bg-white px-1 py-0.5 rounded text-xs font-mono border">
                            {hotkey}
                          </kbd>
                        )}
                        {audioRecording.isRecording ? ' pour arrêter' : 
                         audioRecording.isProcessing ? '' : ' pour commencer la dictée'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-stone-700 mb-2"
                      style={{ fontFamily: "Noto Sans, sans-serif" }}
                    >
                      Texte transcrit :
                    </label>
                    <Textarea
                      // ref={practiceTextareaRef}
                      rows={4}
                      placeholder="Cliquez ici pour placer votre curseur, puis utilisez votre touche de raccourci pour commencer la dictée..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/60">
                <h4
                  className="font-medium text-green-900 mb-2"
                  style={{ fontFamily: "Noto Sans, sans-serif" }}
                >
                  💡 Comment utiliser OpenWispr :
                </h4>
                <ol
                  className="text-sm text-green-800 space-y-1"
                  style={{ fontFamily: "Noto Sans, sans-serif" }}
                >
                  <li>1. Cliquez dans n'importe quel champ de texte (email, document, etc.)</li>
                  <li>
                    2. Appuyez sur{" "}
                    <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-green-200">
                      {hotkey}
                    </kbd>{" "}
                    pour commencer l'enregistrement
                  </li>
                  <li>3. Parlez votre texte clairement</li>
                  <li>
                    4. Appuyez sur{" "}
                    <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-green-200">
                      {hotkey}
                    </kbd>{" "}
                    à nouveau pour arrêter
                  </li>
                  <li>
                    5. Votre texte apparaîtra automatiquement là où vous
                    tapiez !
                  </li>
                </ol>
              </div>
            </div>
          </div>
        );

      case 6: // Agent Name
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                Nommez votre agent
              </h2>
              <p className="text-stone-600">
                Donnez un nom à votre agent pour pouvoir vous adresser à lui spécifiquement lors
                de vos instructions.
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <h4 className="font-medium text-purple-900 mb-3">
                💡 Comment cela aide :
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>
                  • Dites "Hey {agentName || "Agent"}, écris un email formel" pour
                  des instructions spécifiques
                </li>
                <li>
                  • Utilisez le nom pour distinguer entre dictée et commandes
                </li>
                <li>• Rend les interactions plus naturelles et personnelles</li>
              </ul>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'agent
              </label>
              <Input
                placeholder="ex : Assistant, Jarvis, Alex..."
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="text-center text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Vous pouvez changer ceci à tout moment dans les paramètres
              </p>
            </div>
          </div>
        );

      case 7: // Complete
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vous êtes prêt !
              </h2>
              <p className="text-gray-600">
                OpenWispr est maintenant configuré et prêt à utiliser.
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Résumé de votre configuration :
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Traitement :</span>
                  <span className="font-medium">
                    {useLocalWhisper
                      ? `Local (${whisperModel})`
                      : "OpenAI Cloud"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Touche de raccourci :</span>
                  <kbd className="bg-white px-2 py-1 rounded text-xs font-mono">
                    {hotkey}
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Langue :</span>
                  <span className="font-medium">
                    {getLanguageLabel(preferredLanguage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nom de l'agent :</span>
                  <span className="font-medium">{agentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Permissions :</span>
                  <span className="font-medium text-green-600">
                    {permissionsHook.micPermissionGranted &&
                    permissionsHook.accessibilityPermissionGranted
                      ? "✓ Accordées"
                      : "⚠ Révision nécessaire"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Conseil :</strong> Vous pouvez toujours modifier ces paramètres
                plus tard dans le panneau de contrôle.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return true; // Mode selection
      case 2:
        if (useLocalWhisper) {
          return pythonHook.pythonInstalled && whisperHook.whisperInstalled;
        } else {
          return apiKey.trim() !== "";
        }
      case 3:
        return (
          permissionsHook.micPermissionGranted &&
          permissionsHook.accessibilityPermissionGranted
        );
      case 4:
        return hotkey.trim() !== "";
      case 5:
        return true; // Practice step is always ready to proceed
      case 6:
        return agentName.trim() !== ""; // Agent name step
      case 7:
        return true;
      default:
        return false;
    }
  };

  // Load Google Font only in the browser
  React.useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div
      className="h-screen flex flex-col bg-gradient-to-br from-stone-50 via-white to-blue-50/30"
      style={{
        backgroundImage: `repeating-linear-gradient(
          transparent,
          transparent 24px,
          #e7e5e4 24px,
          #e7e5e4 25px
        )`,
        fontFamily: "Noto Sans, sans-serif",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => !open && hideAlertDialog()}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />
      {/* Left margin line for entire page */}
      <div className="fixed left-6 md:left-12 top-0 bottom-0 w-px bg-red-300/40 z-0"></div>

      {/* Title Bar */}
      <div className="flex-shrink-0 z-10">
        <TitleBar
          showTitle={true}
          className="bg-white/95 backdrop-blur-xl border-b border-stone-200/60 shadow-sm"
        ></TitleBar>
      </div>

      {/* Progress Bar */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-stone-200/60 p-6 md:px-16 z-10">
        <div className="max-w-4xl mx-auto">
          <StepProgress steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Content - This will grow to fill available space */}
      <div className="flex-1 px-6 md:pl-16 md:pr-6 py-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-xl border border-stone-200/60 shadow-lg rounded-2xl overflow-hidden">
            <CardContent
              className="p-12 md:p-16"
              style={{ fontFamily: "Noto Sans, sans-serif" }}
            >
              <div className="space-y-8">{renderStep()}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer - This will stick to the bottom */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-stone-200/60 px-6 md:pl-16 md:pr-6 py-8 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 0}
            className="px-8 py-3 h-12 text-sm font-medium"
            style={{ fontFamily: "Noto Sans, sans-serif" }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="flex items-center gap-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={finishOnboarding}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 h-12 text-sm font-medium"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                <Check className="w-4 h-4 mr-2" />
                Terminer la configuration
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-8 py-3 h-12 text-sm font-medium"
                style={{ fontFamily: "Noto Sans, sans-serif" }}
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
