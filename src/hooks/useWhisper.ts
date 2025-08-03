import { useState, useCallback, useEffect } from "react";
import { WhisperCheckResult, WhisperInstallResult } from "../types/electron";

export interface UseWhisperReturn {
  // State
  whisperInstalled: boolean;
  checkingWhisper: boolean;
  installingWhisper: boolean;
  installProgress: string;

  checkWhisperInstallation: () => Promise<void>;
  installWhisper: () => Promise<void>;
  setupProgressListener: () => void;
}

export interface UseWhisperProps {
  showAlertDialog: (dialog: { title: string; description?: string }) => void;
}

export const useWhisper = (
  showAlertDialog?: UseWhisperProps["showAlertDialog"]
): UseWhisperReturn => {
  const [whisperInstalled, setWhisperInstalled] = useState(false);
  const [checkingWhisper, setCheckingWhisper] = useState(false);
  const [installingWhisper, setInstallingWhisper] = useState(false);
  const [installProgress, setInstallProgress] = useState("");

  const checkWhisperInstallation = useCallback(async () => {
    try {
      setCheckingWhisper(true);
      const result: WhisperCheckResult =
        await window.electronAPI.checkWhisperInstallation();
      setWhisperInstalled(result.installed && result.working);
    } catch (error) {
      console.error("Error checking Whisper installation:", error);
      setWhisperInstalled(false);
    } finally {
      setCheckingWhisper(false);
    }
  }, []);

  const installWhisper = useCallback(async () => {
    try {
      setInstallingWhisper(true);
      setInstallProgress("Démarrage de l'installation de Whisper...");

      const result: WhisperInstallResult =
        await window.electronAPI.installWhisper();

      if (result.success) {
        setWhisperInstalled(true);
        setInstallProgress("Installation terminée !");
      } else {
        if (showAlertDialog) {
          showAlertDialog({
            title: "❌ Échec de l'installation de Whisper",
            description: `Échec de l'installation de Whisper : ${result.message}`,
          });
        } else {
          alert(`❌ Échec de l'installation de Whisper : ${result.message}`);
        }
      }
    } catch (error) {
      console.error("Error installing Whisper:", error);
      if (showAlertDialog) {
        showAlertDialog({
          title: "❌ Échec de l'installation de Whisper",
          description: `Échec de l'installation de Whisper : ${error}`,
        });
      } else {
        alert(`❌ Échec de l'installation de Whisper : ${error}`);
      }
    } finally {
      setInstallingWhisper(false);
      setTimeout(() => setInstallProgress(""), 2000); // Clear progress after 2 seconds
    }
  }, [showAlertDialog]);

  const setupProgressListener = useCallback(() => {
    // Remove any existing listeners first
    window.electronAPI?.removeAllListeners?.("whisper-install-progress");
    
    window.electronAPI.onWhisperInstallProgress((_, data) => {
      setInstallProgress(data.message);
    });
  }, []);

  // Check Whisper installation on mount
  useEffect(() => {
    checkWhisperInstallation();
  }, [checkWhisperInstallation]);

  return {
    whisperInstalled,
    checkingWhisper,
    installingWhisper,
    installProgress,
    checkWhisperInstallation,
    installWhisper,
    setupProgressListener,
  };
};
