const path = require("path");
const { nativeImage, app } = require("electron");
const fs = require("fs");

// Function to get the application icon path
function getAppIconPath() {
  const iconName = process.platform === "win32" ? "icon.ico" : "icon.png";
  
  if (process.env.NODE_ENV === "development") {
    const iconPath = path.join(__dirname, "..", "..", "assets", iconName);
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  } else {
    const possiblePaths = [
      path.join(process.resourcesPath, "assets", iconName),
      path.join(process.resourcesPath, "app.asar.unpacked", "assets", iconName),
      path.join(__dirname, "..", "..", "assets", iconName),
      path.join(process.resourcesPath, "app", "assets", iconName),
      path.join(app.getPath("exe"), "..", "Resources", "assets", iconName),
      path.join(app.getAppPath(), "assets", iconName),
    ];
    
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          return testPath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
  }
  
  return null;
}

// Main dictation window configuration
const MAIN_WINDOW_CONFIG = {
  width: 100,
  height: 100,
  type: 'panel',
  icon: getAppIconPath(),
  webPreferences: {
    preload: path.join(__dirname, "..", "..", "preload.js"),
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    sandbox: true,
    titleBarOverlay: false,
  },
  frame: false,
  titleBarStyle: 'hidden',
  title: '',
  alwaysOnTop: true,
  resizable: false,
  transparent: true,
  show: true,
  skipTaskbar: true,
  focusable: true,
  visibleOnAllWorkspaces: true,
  hiddenInMissionControl: true,
  minimizable: false,
  maximizable: false,
};

// Control panel window configuration
const CONTROL_PANEL_CONFIG = {
  width: 1200,
  height: 800,
  icon: getAppIconPath(),
  webPreferences: {
    preload: path.join(__dirname, "..", "..", "preload.js"),
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    sandbox: false,
    webSecurity: false,
    spellcheck: false,
    experimentalFeatures: false,
    allowRunningInsecureContent: false,
    enableWebSQL: false,
    enableBlinkFeatures: "",
    defaultEncoding: "UTF-8",
    disableHtmlFullscreenWindowResize: false,
    enableClipboardAccess: true,
    clipboard: true,
  },
  title: "OpenWispr Control Panel",
  resizable: true,
  show: false,
  titleBarStyle: "hiddenInset",
  trafficLightPosition: { x: 20, y: 20 },
  frame: false,
  transparent: false,
  backgroundColor: "#ffffff",
  minimizable: true,
  maximizable: true,
  closable: true,
  fullscreenable: true,
};

// Window positioning utilities
class WindowPositionUtil {
  static getMainWindowPosition(display) {
    const { width, height } = MAIN_WINDOW_CONFIG;
    const x = Math.max(
      0,
      display.bounds.x + display.workArea.width - width - 20
    );
    // Position the window at the bottom right, but visible (subtract window height + margin)
    const y = Math.max(
      0,
      display.bounds.y + display.workArea.height - height - 20
    );
    return { x, y, width, height };
  }

  static setupAlwaysOnTop(window) {
    if (process.platform === 'darwin') {
      window.setAlwaysOnTop(true, "screen-saver", 1);
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      window.setFullScreenable(false);
    } else {
      window.setAlwaysOnTop(true);
    }
  }
}

module.exports = {
  MAIN_WINDOW_CONFIG,
  CONTROL_PANEL_CONFIG,
  WindowPositionUtil,
};
