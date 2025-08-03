import { useState, useCallback, useEffect } from "react";

export interface UsePermissionsReturn {
  // State
  micPermissionGranted: boolean;
  accessibilityPermissionGranted: boolean;
  micPermissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';

  requestMicPermission: () => Promise<void>;
  testAccessibilityPermission: () => Promise<void>;
  testMicrophoneAccess: () => Promise<boolean>;
  setMicPermissionGranted: (granted: boolean) => void;
  setAccessibilityPermissionGranted: (granted: boolean) => void;
}

export interface UsePermissionsProps {
  showAlertDialog: (dialog: { title: string; description?: string }) => void;
}

export const usePermissions = (
  showAlertDialog?: UsePermissionsProps["showAlertDialog"]
): UsePermissionsReturn => {
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [accessibilityPermissionGranted, setAccessibilityPermissionGranted] =
    useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  // Vérification automatique des permissions au démarrage
  useEffect(() => {
    checkMicrophonePermissions();
  }, []);

  const checkMicrophonePermissions = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermissionStatus(permission.state);
        setMicPermissionGranted(permission.state === 'granted');
        
        // Écouter les changements de permissions
        permission.onchange = () => {
          setMicPermissionStatus(permission.state);
          setMicPermissionGranted(permission.state === 'granted');
        };
      }
    } catch (error) {
      console.log('Permission API not supported, will check on first use');
    }
  }, []);

  const testMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Arrêter immédiatement le stream après le test
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      setMicPermissionStatus('granted');
      return true;
    } catch (err: any) {
      console.error("Microphone test failed:", err);
      setMicPermissionGranted(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionStatus('denied');
      }
      
      return false;
    }
  }, []);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Arrêter immédiatement le stream après l'autorisation
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionGranted(true);
      setMicPermissionStatus('granted');
      
      if (showAlertDialog) {
        showAlertDialog({
          title: "✅ Microphone autorisé",
          description: "L'accès au microphone a été accordé avec succès !",
        });
      }
    } catch (err: any) {
      console.error("Microphone permission denied:", err);
      setMicPermissionGranted(false);
      
      let errorTitle = "Permission microphone requise";
      let errorDescription = "Veuillez accorder les permissions microphone pour utiliser la dictée vocale.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionStatus('denied');
        errorTitle = "Accès au microphone refusé";
        errorDescription = "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur et réessayer.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorTitle = "Aucun microphone détecté";
        errorDescription = "Aucun microphone n'a été trouvé. Veuillez connecter un microphone et réessayer.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorTitle = "Microphone occupé";
        errorDescription = "Le microphone est utilisé par une autre application. Veuillez fermer les autres applications et réessayer.";
      }
      
      if (showAlertDialog) {
        showAlertDialog({
          title: errorTitle,
          description: errorDescription,
        });
      } else {
        alert(errorDescription);
      }
    }
  }, [showAlertDialog]);

  const testAccessibilityPermission = useCallback(async () => {
    try {
      await window.electronAPI.pasteText("OpenWispr accessibility test");
      setAccessibilityPermissionGranted(true);
      if (showAlertDialog) {
        showAlertDialog({
          title: "✅ Test d'accessibilité réussi",
          description:
            "Les permissions d'accessibilité fonctionnent ! Vérifiez si le texte de test est apparu dans une autre application.",
        });
      } else {
        alert(
          "✅ Les permissions d'accessibilité fonctionnent ! Vérifiez si le texte de test est apparu dans une autre application."
        );
      }
    } catch (err) {
      console.error("Accessibility permission test failed:", err);
      if (showAlertDialog) {
        showAlertDialog({
          title: "❌ Permissions d'accessibilité nécessaires",
          description:
            "Veuillez accorder les permissions d'accessibilité dans les Paramètres système pour activer le collage automatique de texte.",
        });
      } else {
        alert(
          "❌ Permissions d'accessibilité nécessaires ! Veuillez les accorder dans les Paramètres système."
        );
      }
    }
  }, [showAlertDialog]);

  return {
    micPermissionGranted,
    accessibilityPermissionGranted,
    micPermissionStatus,
    requestMicPermission,
    testAccessibilityPermission,
    testMicrophoneAccess,
    setMicPermissionGranted,
    setAccessibilityPermissionGranted,
  };
};
