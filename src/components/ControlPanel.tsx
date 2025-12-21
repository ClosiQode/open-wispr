import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, RefreshCw, Settings, FileText, Mic, BarChart3, Calendar, Clock, Type } from "lucide-react";
import SettingsModal from "./SettingsModal";
import TitleBar from "./TitleBar";
import SupportDropdown from "./ui/SupportDropdown";
import TranscriptionItem from "./ui/TranscriptionItem";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useDialogs } from "../hooks/useDialogs";
import { useHotkey } from "../hooks/useHotkey";
import { useToast } from "./ui/Toast";
import type { TranscriptionItem as TranscriptionItemType, TranscriptionStatistics } from "../types/electron";

export default function ControlPanel() {
  const [history, setHistory] = useState<TranscriptionItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [statistics, setStatistics] = useState<TranscriptionStatistics | null>(null);
  const { hotkey } = useHotkey();
  const { toast } = useToast();
  const [updateStatus, setUpdateStatus] = useState({
    updateAvailable: false,
    updateDownloaded: false,
    isDevelopment: false,
  });

  const {
    confirmDialog,
    alertDialog,
    showConfirmDialog,
    showAlertDialog,
    hideConfirmDialog,
    hideAlertDialog,
  } = useDialogs();

  useEffect(() => {
    // Load transcription history and statistics from database
    loadTranscriptions();
    loadStatistics();

    // Initialize update status
    const initializeUpdateStatus = async () => {
      try {
        const status = await window.electronAPI.getUpdateStatus();
        // Only update if current state is still at default values
        setUpdateStatus(prev => {
          // Don't overwrite if update is already available or downloaded
          if (prev.updateAvailable || prev.updateDownloaded) {
            return { ...prev, isDevelopment: status.isDevelopment };
          }
          return status;
        });
      } catch (error) {
        // Update status not critical for app function
      }
    };

    initializeUpdateStatus();

    // Set up update event listeners
    const handleUpdateAvailable = (_event: any, _info: any) => {
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: true }));
    };

    const handleUpdateDownloaded = (_event: any, _info: any) => {
      setUpdateStatus((prev) => ({ ...prev, updateDownloaded: true }));
    };

    const handleUpdateNotAvailable = (_event: any, _info: any) => {
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: false }));
    };

    const handleUpdateError = (_event: any, _error: any) => {
      // Update errors are handled by the update service
      setUpdateStatus((prev) => ({ ...prev, updateAvailable: false }));
    };

    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onUpdateNotAvailable?.(handleUpdateNotAvailable);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    window.electronAPI.onUpdateError(handleUpdateError);

    // Cleanup listeners on unmount
    return () => {
      window.electronAPI.removeAllListeners?.("update-available");
      window.electronAPI.removeAllListeners?.("update-not-available");
      window.electronAPI.removeAllListeners?.("update-downloaded");
      window.electronAPI.removeAllListeners?.("update-error");
    };
  }, []);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      const transcriptions = await window.electronAPI.getTranscriptions(50);
      setHistory(transcriptions);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await window.electronAPI.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié !",
        description: "Texte copié dans le presse-papiers",
        variant: "success",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Échec de la copie",
        description: "Impossible de copier le texte dans le presse-papiers",
        variant: "destructive",
      });
    }
  };

  const clearHistory = async () => {
    showConfirmDialog({
      title: "Effacer l'historique",
      description:
        "Êtes-vous certain de vouloir effacer tous les enregistrements ? Cette action ne peut pas être annulée.",
      onConfirm: async () => {
        try {
          const result = await window.electronAPI.clearTranscriptions();
          setHistory([]);
          await loadStatistics();
          showAlertDialog({
            title: "Historique effacé",
            description: `${result.cleared} transcriptions ont été supprimées avec succès de vos archives.`,
          });
        } catch (error) {
          showAlertDialog({
            title: "Erreur",
            description: "Impossible d'effacer l'historique. Veuillez réessayer.",
          });
        }
      },
      variant: "destructive",
    });
  };

  const deleteTranscription = async (id: number) => {
    showConfirmDialog({
      title: "Supprimer la transcription",
      description:
        "Êtes-vous certain de vouloir supprimer cette transcription de vos enregistrements ?",
      onConfirm: async () => {
        try {
          const result = await window.electronAPI.deleteTranscription(id);
          if (result.success) {
            // Remove from local state
            setHistory((prev) => prev.filter((item) => item.id !== id));
            await loadStatistics();
          } else {
            showAlertDialog({
              title: "Échec de la suppression",
              description:
                "Impossible de supprimer la transcription. Elle a peut-être déjà été supprimée.",
            });
          }
        } catch (error) {
          showAlertDialog({
            title: "Échec de la suppression",
            description: "Impossible de supprimer la transcription. Veuillez réessayer.",
          });
        }
      },
      variant: "destructive",
    });
  };

  const refreshHistory = async () => {
    await loadTranscriptions();
    await loadStatistics();
  };

  return (
    <div className="min-h-screen bg-white">
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={hideConfirmDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={hideAlertDialog}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      <TitleBar
        actions={
          <>
            {/* Update notification badge */}
            {!updateStatus.isDevelopment &&
              (updateStatus.updateAvailable ||
                updateStatus.updateDownloaded) && (
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            <SupportDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={16} />
            </Button>
          </>
        }
      />

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />

      {/* Main content */}
      <div className="p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Statistics Card */}
          {statistics && statistics.totalTranscriptions > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={18} className="text-indigo-600" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                      <FileText size={14} />
                      <span className="text-xs font-medium uppercase tracking-wide">Transcriptions</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {statistics.totalTranscriptions}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <Type size={14} />
                      <span className="text-xs font-medium uppercase tracking-wide">Mots</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {statistics.totalWords.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-4 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Calendar size={14} />
                      <span className="text-xs font-medium uppercase tracking-wide">Jours actifs</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {statistics.daysUsed}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Clock size={14} />
                      <span className="text-xs font-medium uppercase tracking-wide">Mots/min</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {statistics.averageWpm > 0 ? statistics.averageWpm : "—"}
                    </div>
                    {statistics.transcriptionsWithDuration > 0 && (
                      <div className="text-xs text-neutral-500 mt-1">
                        Basé sur {statistics.transcriptionsWithDuration} transcription{statistics.transcriptionsWithDuration > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                {statistics.totalDurationSeconds > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="text-xs text-neutral-500 text-center">
                      Temps total dicté : {Math.floor(statistics.totalDurationSeconds / 60)} min {Math.round(statistics.totalDurationSeconds % 60)} sec
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  Transcriptions récentes
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={refreshHistory} variant="ghost" size="icon">
                    <RefreshCw size={16} />
                  </Button>
                  {history.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto mb-3 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  <p className="text-neutral-600">Chargement des transcriptions...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                    <Mic className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Aucune transcription pour le moment
                  </h3>
                  <p className="text-neutral-600 mb-4 max-w-sm mx-auto">
                    Appuyez sur votre raccourci clavier pour commencer l'enregistrement et créer votre première transcription.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-neutral-800 mb-2">
                      Démarrage rapide :
                    </h4>
                    <ol className="text-sm text-neutral-600 text-left space-y-1">
                      <li>1. Cliquez dans n'importe quel champ de texte</li>
                      <li>
                        2. Appuyez sur{" "}
                        <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-neutral-300">
                          {hotkey}
                        </kbd>{" "}
                        pour commencer l'enregistrement
                      </li>
                      <li>3. Dictez votre texte</li>
                      <li>
                        4. Appuyez sur{" "}
                        <kbd className="bg-white px-2 py-1 rounded text-xs font-mono border border-neutral-300">
                          {hotkey}
                        </kbd>{" "}
                        à nouveau pour arrêter
                      </li>
                      <li>5. Votre texte apparaîtra automatiquement !</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((item, index) => (
                    <TranscriptionItem
                      key={item.id}
                      item={item}
                      index={index}
                      total={history.length}
                      onCopy={copyToClipboard}
                      onDelete={deleteTranscription}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
