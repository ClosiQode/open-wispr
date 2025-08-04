const { autoUpdater } = require("electron-updater");
const { ipcMain } = require("electron");

class UpdateManager {
  constructor() {
    this.mainWindow = null;
    this.controlPanelWindow = null;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.autoInstallAfterDownload = false;

    this.setupAutoUpdater();
    this.setupIPCHandlers();
  }

  setWindows(mainWindow, controlPanelWindow) {
    this.mainWindow = mainWindow;
    this.controlPanelWindow = controlPanelWindow;
  }

  setupAutoUpdater() {
    // Configure auto-updater for GitHub releases
    autoUpdater.setFeedURL({
      provider: "github",
      owner: "ClosiQode",
      repo: "open-wispr",
      private: false,
    });

    // Auto-updater logging
    autoUpdater.logger = console;

    // Set up event handlers
    this.setupEventHandlers();

    // Force dev update config for testing
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️ Development mode - forcing update config for testing");
      autoUpdater.forceDevUpdateConfig = true;
      // Set environment variable to force updates
      process.env.ELECTRON_IS_DEV = "false";
      // Also set the app as packaged for update purposes
      const { app } = require("electron");
      app.isPackaged = true;
      console.log("⚠️ Forced app.isPackaged =", app.isPackaged);
      console.log("⚠️ autoUpdater.forceDevUpdateConfig =", autoUpdater.forceDevUpdateConfig);
      
      // Debug: Check the isUpdaterActive method
      setTimeout(() => {
        console.log("⚠️ Debug - app.isPackaged:", app.isPackaged);
        console.log("⚠️ Debug - autoUpdater.forceDevUpdateConfig:", autoUpdater.forceDevUpdateConfig);
        console.log("⚠️ Debug - isUpdaterActive would return:", app.isPackaged || autoUpdater.forceDevUpdateConfig);
      }, 1000);
    }
  }

  setupEventHandlers() {
    autoUpdater.on("checking-for-update", () => {
      console.log("🔍 Checking for updates...");
    });

    autoUpdater.on("update-available", (info) => {
      console.log("📥 Update available:", info);
      this.updateAvailable = true;

      // Send notification to renderer processes
      this.notifyRenderers("update-available", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      console.log("✅ Update not available:", info);
      this.updateAvailable = false;

      // Send notification to renderer processes
      this.notifyRenderers("update-not-available", info);
    });

    autoUpdater.on("error", (err) => {
      console.error("❌ Auto-updater error:", err);
      this.updateAvailable = false;
      this.updateDownloaded = false;

      // Send error notification to renderer processes
      this.notifyRenderers("update-error", err);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      let logMessage = `📊 Download speed: ${progressObj.bytesPerSecond}`;
      logMessage += ` - Downloaded ${progressObj.percent}%`;
      logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
      console.log(logMessage);

      // Send progress to renderer processes
      this.notifyRenderers("update-download-progress", progressObj);
    });

    autoUpdater.on("update-downloaded", (info) => {
      console.log("✅ Update downloaded:", info);
      this.updateDownloaded = true;

      // Send notification to renderer processes
      this.notifyRenderers("update-downloaded", info);

      // Auto-install if requested
      if (this.autoInstallAfterDownload) {
        console.log("🔄 Auto-installing update...");
        this.autoInstallAfterDownload = false;
        setImmediate(() => {
          autoUpdater.quitAndInstall();
        });
      }
    });
  }

  notifyRenderers(channel, data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
    if (this.controlPanelWindow && this.controlPanelWindow.webContents) {
      this.controlPanelWindow.webContents.send(channel, data);
    }
  }

  setupIPCHandlers() {
    // Check for updates manually
    ipcMain.handle("check-for-updates", async () => {
      try {
        // Allow update checks in development for testing
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Development mode - allowing update check for testing");
        }

        console.log("🔍 Manual update check requested...");
        const result = await autoUpdater.checkForUpdates();

        if (result && result.updateInfo) {
          const { app } = require("electron");
          const currentVersion = app.getVersion();
          const availableVersion = result.updateInfo.version;
          
          console.log(`📋 Version comparison: current=${currentVersion}, available=${availableVersion}`);
          
          // Compare versions using simple version comparison
          const isUpdateAvailable = this.compareVersions(availableVersion, currentVersion) > 0;
          
          if (isUpdateAvailable) {
            console.log("📥 Update available:", result.updateInfo);
            return {
              updateAvailable: true,
              version: result.updateInfo.version,
              releaseDate: result.updateInfo.releaseDate,
              files: result.updateInfo.files,
              releaseNotes: result.updateInfo.releaseNotes,
            };
          } else {
            console.log(`✅ No update needed - current version ${currentVersion} is up to date`);
            return {
              updateAvailable: false,
              message: `You are running the latest version (${currentVersion})`,
            };
          }
        } else {
          console.log("✅ No updates available");
          return {
            updateAvailable: false,
            message: "You are running the latest version",
          };
        }
      } catch (error) {
        console.error("❌ Update check error:", error);
        throw error;
      }
    });

    // Download update
    ipcMain.handle("download-update", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Development mode - allowing update download for testing");
        }

        console.log("📥 Manual update download requested...");
        await autoUpdater.downloadUpdate();

        return { success: true, message: "Update download started" };
      } catch (error) {
        console.error("❌ Update download error:", error);
        throw error;
      }
    });

    // Install update
    ipcMain.handle("install-update", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Development mode - allowing update installation for testing");
        }

        if (!this.updateDownloaded) {
          console.error("❌ No update downloaded to install");
          return {
            success: false,
            message: "No update available to install",
          };
        }

        console.log("🔄 Installing update and restarting...");
        
        // Use setImmediate to ensure the response is sent before quitting
        setImmediate(() => {
          autoUpdater.quitAndInstall();
        });

        return { success: true, message: "Update installation started" };
      } catch (error) {
        console.error("❌ Update installation error:", error);
        throw error;
      }
    });

    // Auto-update (download and install)
    ipcMain.handle("auto-update", async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ Development mode - allowing auto-update for testing");
        }

        console.log("🚀 Auto-update requested (download + install)...");
        this.autoInstallAfterDownload = true;
        await autoUpdater.downloadUpdate();

        return { success: true, message: "Auto-update started" };
      } catch (error) {
        console.error("❌ Auto-update error:", error);
        this.autoInstallAfterDownload = false;
        throw error;
      }
    });

    // Get app version
    ipcMain.handle("get-app-version", async () => {
      try {
        const { app } = require("electron");
        const version = app.getVersion();
        return { version };
      } catch (error) {
        console.error("❌ Error getting app version:", error);
        throw error;
      }
    });

    // Get update status
    ipcMain.handle("get-update-status", async () => {
      try {
        return {
          updateAvailable: this.updateAvailable,
          updateDownloaded: this.updateDownloaded,
          isDevelopment: process.env.NODE_ENV === "development",
        };
      } catch (error) {
        console.error("❌ Error getting update status:", error);
        throw error;
      }
    });
  }

  // Method to compare two version strings (semver-like)
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    
    return 0; // versions are equal
  }

  // Method to check for updates on startup
  checkForUpdatesOnStartup() {
    // Wait a bit for the app to fully initialize
    setTimeout(() => {
      // Don't check if update is already available or downloaded
      if (this.updateAvailable || this.updateDownloaded) {
        console.log("⏭️ Skipping startup update check - update already available/downloaded");
        return;
      }
      
      console.log("🔄 Checking for updates on startup...");
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ Development mode - forcing update check");
      }
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
}

module.exports = UpdateManager;
