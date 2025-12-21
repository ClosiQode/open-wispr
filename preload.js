const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  pasteText: (text) => ipcRenderer.invoke("paste-text", text),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  showDictationPanel: () => ipcRenderer.invoke("show-dictation-panel"),
  onToggleDictation: (callback) => ipcRenderer.on("toggle-dictation", (event, data) => callback(data)),

  // Database functions
  saveTranscription: (text, durationSeconds = null) =>
    ipcRenderer.invoke("db-save-transcription", text, durationSeconds),
  getTranscriptions: (limit) =>
    ipcRenderer.invoke("db-get-transcriptions", limit),
  clearTranscriptions: () => ipcRenderer.invoke("db-clear-transcriptions"),
  deleteTranscription: (id) =>
    ipcRenderer.invoke("db-delete-transcription", id),
  getStatistics: () => ipcRenderer.invoke("db-get-statistics"),

  // Environment variables
  getOpenAIKey: () => ipcRenderer.invoke("get-openai-key"),
  saveOpenAIKey: (key) => ipcRenderer.invoke("save-openai-key", key),
  createProductionEnvFile: (key) =>
    ipcRenderer.invoke("create-production-env-file", key),

  // Settings management
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // Clipboard functions
  readClipboard: () => ipcRenderer.invoke("read-clipboard"),
  writeClipboard: (text) => ipcRenderer.invoke("write-clipboard", text),

  // Python installation functions
  checkPythonInstallation: () =>
    ipcRenderer.invoke("check-python-installation"),
  installPython: () => ipcRenderer.invoke("install-python"),
  onPythonInstallProgress: (callback) =>
    ipcRenderer.on("python-install-progress", callback),

  // Local Whisper functions
  transcribeLocalWhisper: (audioBlob, options) =>
    ipcRenderer.invoke("transcribe-local-whisper", audioBlob, options),
  checkWhisperInstallation: () =>
    ipcRenderer.invoke("check-whisper-installation"),
  installWhisper: () => ipcRenderer.invoke("install-whisper"),
  onWhisperInstallProgress: (callback) =>
    ipcRenderer.on("whisper-install-progress", callback),
  downloadWhisperModel: (modelName) =>
    ipcRenderer.invoke("download-whisper-model", modelName),
  onWhisperDownloadProgress: (callback) =>
    ipcRenderer.on("whisper-download-progress", callback),
  checkModelStatus: (modelName) =>
    ipcRenderer.invoke("check-model-status", modelName),
  listWhisperModels: () => ipcRenderer.invoke("list-whisper-models"),
  deleteWhisperModel: (modelName) =>
    ipcRenderer.invoke("delete-whisper-model", modelName),
  cancelWhisperDownload: () => ipcRenderer.invoke("cancel-whisper-download"),
  checkFFmpegAvailability: () =>
    ipcRenderer.invoke("check-ffmpeg-availability"),

  // GPU/CUDA functions
  checkGpuStatus: () => ipcRenderer.invoke("check-gpu-status"),
  checkNvidiaGpu: () => ipcRenderer.invoke("check-nvidia-gpu"),
  installCudaTorch: () => ipcRenderer.invoke("install-cuda-torch"),
  onCudaInstallProgress: (callback) =>
    ipcRenderer.on("cuda-install-progress", callback),

  // Window control functions
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),
  windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Cleanup function
  cleanupApp: () => ipcRenderer.invoke("cleanup-app"),
  updateHotkey: (hotkey, mode) => ipcRenderer.invoke("update-hotkey", hotkey, mode),
  startWindowDrag: () => ipcRenderer.invoke("start-window-drag"),
  stopWindowDrag: () => ipcRenderer.invoke("stop-window-drag"),

  // Update functions
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  autoUpdate: () => ipcRenderer.invoke("auto-update"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getUpdateStatus: () => ipcRenderer.invoke("get-update-status"),

  // Auto-start functions
  getAutoStartStatus: () => ipcRenderer.invoke("get-auto-start-status"),
  setAutoStart: (enabled) => ipcRenderer.invoke("set-auto-start", enabled),

  // Update event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  onUpdateDownloadProgress: (callback) =>
    ipcRenderer.on("update-download-progress", callback),
  onUpdateError: (callback) => ipcRenderer.on("update-error", callback),

  // Audio event listeners
  onNoAudioDetected: (callback) =>
    ipcRenderer.on("no-audio-detected", callback),

  // External link opener
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  
  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
