const { globalShortcut } = require("electron");

// Import uiohook-napi for push-to-talk mode (keydown/keyup detection)
let uIOhook = null;
try {
  const { uIOhook: hook } = require("uiohook-napi");
  uIOhook = hook;
} catch (err) {
  console.warn("[HotkeyManager] uiohook-napi not available, push-to-talk mode disabled:", err.message);
}

// Key code mapping for uiohook (from libuiohook/include/uiohook.h)
// See: https://github.com/wilix-team/iohook/blob/master/libuiohook/include/uiohook.h
const KEY_CODE_MAP = {
  // Function keys F1-F12
  'F1': 0x003B, 'F2': 0x003C, 'F3': 0x003D, 'F4': 0x003E, 'F5': 0x003F, 'F6': 0x0040,
  'F7': 0x0041, 'F8': 0x0042, 'F9': 0x0043, 'F10': 0x0044, 'F11': 0x0057, 'F12': 0x0058,
  // Function keys F13-F24 (extended)
  'F13': 0x005B, 'F14': 0x005C, 'F15': 0x005D, 'F16': 0x0063, 'F17': 0x0064, 'F18': 0x0065,
  'F19': 0x0066, 'F20': 0x0067, 'F21': 0x0068, 'F22': 0x0069, 'F23': 0x006A, 'F24': 0x006B,
  // Special keys
  'Esc': 0x0001, 'Tab': 0x000F, 'CapsLock': 0x003A, 'Shift': 0x002A, 'Ctrl': 0x001D, 'Alt': 0x0038,
  'Space': 0x0039, 'Enter': 0x001C, 'Backspace': 0x000E,
  // Number row
  '`': 0x0029, '1': 0x0002, '2': 0x0003, '3': 0x0004, '4': 0x0005, '5': 0x0006,
  '6': 0x0007, '7': 0x0008, '8': 0x0009, '9': 0x000A, '0': 0x000B, '-': 0x000C, '=': 0x000D,
  // Letters (QWERTY)
  'Q': 0x0010, 'W': 0x0011, 'E': 0x0012, 'R': 0x0013, 'T': 0x0014, 'Y': 0x0015,
  'U': 0x0016, 'I': 0x0017, 'O': 0x0018, 'P': 0x0019,
  'A': 0x001E, 'S': 0x001F, 'D': 0x0020, 'F': 0x0021, 'G': 0x0022, 'H': 0x0023,
  'J': 0x0024, 'K': 0x0025, 'L': 0x0026,
  'Z': 0x002C, 'X': 0x002D, 'C': 0x002E, 'V': 0x002F, 'B': 0x0030, 'N': 0x0031, 'M': 0x0032,
  // Punctuation
  '[': 0x001A, ']': 0x001B, '\\': 0x002B, ';': 0x0027, "'": 0x0028, ',': 0x0033, '.': 0x0034, '/': 0x0035,
};

// Reverse mapping for debugging
const CODE_TO_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_CODE_MAP).map(([key, code]) => [code, key])
);

class HotkeyManager {
  constructor() {
    this.currentHotkey = "`";
    this.currentMode = "toggle";
    this.isInitialized = false;
    this.uiohookStarted = false;
    this.keydownHandler = null;
    this.keyupHandler = null;
    this.targetKeyCode = null;
    this.targetModifiers = [];
    this.isKeyDown = false;
  }

  /**
   * Valide et normalise un raccourci clavier
   * @param {string} hotkey - Le raccourci à valider
   * @returns {object} - Résultat de la validation
   */
  validateHotkey(hotkey) {
    console.log(`[HotkeyManager] Validation du raccourci: "${hotkey}"`);

    if (!hotkey || typeof hotkey !== 'string') {
      console.log(`[HotkeyManager] Raccourci invalide: type incorrect`);
      return { valid: false, error: 'Raccourci invalide' };
    }

    // Normaliser le raccourci (supprimer les espaces, etc.)
    const normalized = hotkey.trim().replace(/\s+/g, '');
    console.log(`[HotkeyManager] Raccourci normalisé: "${normalized}"`);

    // Vérifier les combinaisons valides
    const parts = normalized.split('+');
    console.log(`[HotkeyManager] Parties du raccourci:`, parts);

    const modifiers = ['Ctrl', 'Alt', 'Shift', 'CapsLock', 'Cmd', 'Super'];
    const validKeys = /^[A-Za-z0-9]$|^F([1-9]|1[0-9]|2[0-4])$|^(Esc|Tab|Space|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Up|Down|Left|Right|`|\\|\[|\]|;|'|"|,|\.|\/)$/;

    let hasModifier = false;
    let mainKey = null;
    let foundModifiers = [];

    for (const part of parts) {
      console.log(`[HotkeyManager] Analyse de la partie: "${part}"`);

      if (modifiers.includes(part)) {
        hasModifier = true;
        foundModifiers.push(part);
        console.log(`[HotkeyManager] Modificateur trouvé: "${part}"`);
      } else if (validKeys.test(part) || part.length === 1) {
        if (mainKey) {
          console.log(`[HotkeyManager] Erreur: plusieurs touches principales trouvées`);
          return { valid: false, error: 'Une seule touche principale autorisée' };
        }
        mainKey = part;
        console.log(`[HotkeyManager] Touche principale trouvée: "${part}"`);
      } else {
        console.log(`[HotkeyManager] Erreur: touche invalide "${part}"`);
        return { valid: false, error: `Touche invalide: ${part}` };
      }
    }

    console.log(`[HotkeyManager] Modificateurs trouvés:`, foundModifiers);
    console.log(`[HotkeyManager] Touche principale: "${mainKey}"`);

    // Permettre les combinaisons de modificateurs seuls (ex: Ctrl+Alt)
    if (!mainKey && foundModifiers.length >= 2) {
      console.log(`[HotkeyManager] ✅ Combinaison de modificateurs acceptée: "${normalized}"`);
      return { valid: true, normalized, mainKey: foundModifiers[foundModifiers.length - 1], modifiers: foundModifiers.slice(0, -1) };
    }

    if (!mainKey) {
      console.log(`[HotkeyManager] Erreur: aucune touche principale trouvée`);
      return { valid: false, error: 'Aucune touche principale trouvée' };
    }

    // Recommander l'utilisation de modificateurs pour éviter les conflits
    if (!hasModifier && parts.length === 1 && mainKey.length === 1 && /^[A-Za-z0-9]$/.test(mainKey)) {
      console.log(`[HotkeyManager] Avertissement: raccourci sans modificateur`);
      return {
        valid: true,
        normalized,
        mainKey,
        modifiers: foundModifiers,
        warning: 'Recommandé: utilisez des modificateurs (Ctrl, Alt, Shift) pour éviter les conflits'
      };
    }

    console.log(`[HotkeyManager] ✅ Raccourci valide: "${normalized}"`);
    return { valid: true, normalized, mainKey, modifiers: foundModifiers };
  }

  /**
   * Parse hotkey and get key code for uiohook
   */
  parseHotkeyForUIHook(hotkey) {
    const parts = hotkey.split('+');
    const modifierNames = ['Ctrl', 'Alt', 'Shift', 'CapsLock'];

    let mainKey = null;
    let modifiers = [];

    for (const part of parts) {
      if (modifierNames.includes(part)) {
        modifiers.push(part);
      } else {
        mainKey = part.toUpperCase();
      }
    }

    // Convert main key to key code
    const keyCode = KEY_CODE_MAP[mainKey] || KEY_CODE_MAP[mainKey?.toLowerCase()];

    return { keyCode, modifiers, mainKey };
  }

  /**
   * Check if modifiers match
   */
  checkModifiers(event, requiredModifiers) {
    const hasCtrl = requiredModifiers.includes('Ctrl');
    const hasAlt = requiredModifiers.includes('Alt');
    const hasShift = requiredModifiers.includes('Shift');

    // If no modifiers required, check that none are pressed
    if (requiredModifiers.length === 0) {
      return !event.ctrlKey && !event.altKey && !event.shiftKey;
    }

    // Check each required modifier
    if (hasCtrl && !event.ctrlKey) return false;
    if (hasAlt && !event.altKey) return false;
    if (hasShift && !event.shiftKey) return false;

    // Check that no extra modifiers are pressed
    if (!hasCtrl && event.ctrlKey) return false;
    if (!hasAlt && event.altKey) return false;
    if (!hasShift && event.shiftKey) return false;

    return true;
  }

  /**
   * Setup push-to-talk mode using uiohook
   */
  setupPushToTalk(hotkey, onKeyDown, onKeyUp) {
    if (!uIOhook) {
      console.error("[HotkeyManager] uiohook-napi not available for push-to-talk mode");
      return { success: false, error: "Push-to-talk non disponible. Utilisez le mode Toggle." };
    }

    const { keyCode, modifiers, mainKey } = this.parseHotkeyForUIHook(hotkey);

    if (!keyCode) {
      console.error(`[HotkeyManager] Unknown key code for: ${mainKey}`);
      return { success: false, error: `Touche inconnue: ${mainKey}` };
    }

    console.log(`[HotkeyManager] Setting up push-to-talk for key code: ${keyCode} (${mainKey}), modifiers:`, modifiers);

    this.targetKeyCode = keyCode;
    this.targetModifiers = modifiers;
    this.isKeyDown = false;

    // Remove previous handlers if any
    if (this.keydownHandler) {
      uIOhook.off('keydown', this.keydownHandler);
    }
    if (this.keyupHandler) {
      uIOhook.off('keyup', this.keyupHandler);
    }

    // Create new handlers with debug logging
    this.keydownHandler = (event) => {
      // Debug: log all keydown events to find the correct keycode
      console.log(`[HotkeyManager] DEBUG keydown: keycode=${event.keycode} (0x${event.keycode.toString(16)}), target=${this.targetKeyCode} (0x${this.targetKeyCode.toString(16)})`);

      if (event.keycode === this.targetKeyCode && this.checkModifiers(event, this.targetModifiers)) {
        if (!this.isKeyDown) {
          console.log(`[HotkeyManager] PTT: Key DOWN detected (${CODE_TO_KEY_MAP[event.keycode] || event.keycode})`);
          this.isKeyDown = true;
          onKeyDown();
        }
      }
    };

    this.keyupHandler = (event) => {
      // Debug: log all keyup events
      console.log(`[HotkeyManager] DEBUG keyup: keycode=${event.keycode} (0x${event.keycode.toString(16)}), target=${this.targetKeyCode} (0x${this.targetKeyCode.toString(16)})`);

      if (event.keycode === this.targetKeyCode) {
        if (this.isKeyDown) {
          console.log(`[HotkeyManager] PTT: Key UP detected (${CODE_TO_KEY_MAP[event.keycode] || event.keycode})`);
          this.isKeyDown = false;
          onKeyUp();
        }
      }
    };

    // Register handlers
    uIOhook.on('keydown', this.keydownHandler);
    uIOhook.on('keyup', this.keyupHandler);

    // Start uiohook if not already started
    if (!this.uiohookStarted) {
      try {
        uIOhook.start();
        this.uiohookStarted = true;
        console.log("[HotkeyManager] uiohook started for push-to-talk");
      } catch (err) {
        console.error("[HotkeyManager] Failed to start uiohook:", err);
        return { success: false, error: `Échec du démarrage de uiohook: ${err.message}` };
      }
    }

    this.currentHotkey = hotkey;
    return { success: true, hotkey };
  }

  /**
   * Stop push-to-talk mode
   */
  stopPushToTalk() {
    if (uIOhook && this.uiohookStarted) {
      if (this.keydownHandler) {
        uIOhook.off('keydown', this.keydownHandler);
        this.keydownHandler = null;
      }
      if (this.keyupHandler) {
        uIOhook.off('keyup', this.keyupHandler);
        this.keyupHandler = null;
      }
      // Don't stop uiohook entirely, just remove handlers
      // uIOhook.stop();
      // this.uiohookStarted = false;
    }
    this.isKeyDown = false;
  }

  setupShortcuts(hotkey = "`", callback, mode = "toggle") {
    if (!callback) {
      throw new Error("Callback function is required for hotkey setup");
    }

    console.log(`[HotkeyManager] Tentative d'enregistrement du raccourci: "${hotkey}" (mode: ${mode})`);

    // Valider le raccourci
    const validation = this.validateHotkey(hotkey);
    console.log(`[HotkeyManager] Validation du raccourci:`, validation);

    if (!validation.valid) {
      console.error(`[HotkeyManager] Raccourci invalide: ${validation.error}`);
      return { success: false, error: validation.error };
    }

    const normalizedHotkey = validation.normalized;
    console.log(`[HotkeyManager] Raccourci normalisé: "${normalizedHotkey}"`);

    // Stop any previous PTT mode
    this.stopPushToTalk();

    // Unregister all existing shortcuts
    globalShortcut.unregisterAll();
    console.log(`[HotkeyManager] Tous les raccourcis précédents ont été supprimés`);

    this.currentMode = mode;

    if (mode === "push-to-talk") {
      // Use uiohook for push-to-talk
      const result = this.setupPushToTalk(
        normalizedHotkey,
        () => callback("keydown"),
        () => callback("keyup")
      );

      if (result.success) {
        console.log(`[HotkeyManager] ✅ Push-to-talk activé pour: "${normalizedHotkey}"`);
        const response = { success: true, hotkey: normalizedHotkey, mode: "push-to-talk" };
        if (validation.warning) {
          response.warning = validation.warning;
        }
        return response;
      } else {
        // Fallback to toggle mode if PTT fails
        console.warn(`[HotkeyManager] Push-to-talk failed, falling back to toggle mode`);
        return this.setupShortcuts(hotkey, callback, "toggle");
      }
    } else {
      // Use globalShortcut for toggle mode
      try {
        console.log(`[HotkeyManager] Tentative d'enregistrement avec Electron globalShortcut...`);
        const success = globalShortcut.register(normalizedHotkey, () => callback("toggle"));
        console.log(`[HotkeyManager] Résultat de l'enregistrement: ${success}`);

        if (success) {
          this.currentHotkey = normalizedHotkey;
          console.log(`[HotkeyManager] ✅ Raccourci enregistré avec succès: "${normalizedHotkey}"`);
          const result = { success: true, hotkey: normalizedHotkey, mode: "toggle" };
          if (validation.warning) {
            result.warning = validation.warning;
          }
          return result;
        } else {
          console.error(`[HotkeyManager] ❌ Échec de l'enregistrement du raccourci: "${normalizedHotkey}"`);
          return {
            success: false,
            error: `Impossible d'enregistrer le raccourci: ${normalizedHotkey}. Il est peut-être déjà utilisé par une autre application.`,
          };
        }
      } catch (error) {
        console.error(`[HotkeyManager] ❌ Erreur lors de l'enregistrement:`, error);
        return { success: false, error: error.message };
      }
    }
  }

  async initializeHotkey(mainWindow, callback, mode = "toggle") {
    if (!mainWindow || !callback) {
      throw new Error("mainWindow and callback are required");
    }

    // Set up default hotkey first
    this.setupShortcuts("`", callback, mode);

    // Listen for window to be ready, then get saved hotkey and mode
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        this.loadSavedHotkey(mainWindow, callback);
      }, 1000);
    });

    this.isInitialized = true;
  }

  async loadSavedHotkey(mainWindow, callback) {
    try {
      const savedHotkey = await mainWindow.webContents.executeJavaScript(`
        localStorage.getItem("dictationKey") || "\`"
      `);

      const savedMode = await mainWindow.webContents.executeJavaScript(`
        localStorage.getItem("hotkeyMode") || "toggle"
      `);

      console.log(`[HotkeyManager] Loading saved hotkey: "${savedHotkey}", mode: "${savedMode}"`);

      if (savedHotkey) {
        const result = this.setupShortcuts(savedHotkey, callback, savedMode);
        if (result.success) {
          console.log(`[HotkeyManager] Hotkey initialized from localStorage: ${savedHotkey} (${savedMode})`);
        }
      }
    } catch (err) {
      console.error("Failed to get saved hotkey:", err);
    }
  }

  async updateHotkey(hotkey, callback, mode = "toggle") {
    if (!callback) {
      throw new Error("Callback function is required for hotkey update");
    }

    try {
      const result = this.setupShortcuts(hotkey, callback, mode);
      if (result.success) {
        return { success: true, message: `Hotkey updated to: ${hotkey} (mode: ${mode})` };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      return {
        success: false,
        message: `Failed to update hotkey: ${error.message}`,
      };
    }
  }

  getCurrentHotkey() {
    return this.currentHotkey;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  unregisterAll() {
    this.stopPushToTalk();
    globalShortcut.unregisterAll();
  }

  isHotkeyRegistered(hotkey) {
    return globalShortcut.isRegistered(hotkey);
  }

  /**
   * Check if push-to-talk mode is available
   */
  isPushToTalkAvailable() {
    return uIOhook !== null;
  }
}

module.exports = HotkeyManager;
