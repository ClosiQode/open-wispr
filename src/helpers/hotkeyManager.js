const { globalShortcut } = require("electron");

class HotkeyManager {
  constructor() {
    this.currentHotkey = "`";
    this.isInitialized = false;
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
    const validKeys = /^[A-Za-z0-9]$|^F[1-9]|^F1[0-2]$|^(Esc|Tab|Space|Enter|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Up|Down|Left|Right|`|\\|\[|\]|;|'|"|,|\.|\/)$/;
    
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
      return { valid: true, normalized };
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
        warning: 'Recommandé: utilisez des modificateurs (Ctrl, Alt, Shift) pour éviter les conflits' 
      };
    }
    
    console.log(`[HotkeyManager] ✅ Raccourci valide: "${normalized}"`);
    return { valid: true, normalized };
  }

  setupShortcuts(hotkey = "`", callback) {
    if (!callback) {
      throw new Error("Callback function is required for hotkey setup");
    }

    console.log(`[HotkeyManager] Tentative d'enregistrement du raccourci: "${hotkey}"`);

    // Valider le raccourci
    const validation = this.validateHotkey(hotkey);
    console.log(`[HotkeyManager] Validation du raccourci:`, validation);
    
    if (!validation.valid) {
      console.error(`[HotkeyManager] Raccourci invalide: ${validation.error}`);
      return { success: false, error: validation.error };
    }

    const normalizedHotkey = validation.normalized;
    console.log(`[HotkeyManager] Raccourci normalisé: "${normalizedHotkey}"`);

    // Unregister all existing shortcuts
    globalShortcut.unregisterAll();
    console.log(`[HotkeyManager] Tous les raccourcis précédents ont été supprimés`);

    try {
      // Register the new hotkey
      console.log(`[HotkeyManager] Tentative d'enregistrement avec Electron globalShortcut...`);
      const success = globalShortcut.register(normalizedHotkey, callback);
      console.log(`[HotkeyManager] Résultat de l'enregistrement: ${success}`);

      if (success) {
        this.currentHotkey = normalizedHotkey;
        console.log(`[HotkeyManager] ✅ Raccourci enregistré avec succès: "${normalizedHotkey}"`);
        const result = { success: true, hotkey: normalizedHotkey };
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

  async initializeHotkey(mainWindow, callback) {
    if (!mainWindow || !callback) {
      throw new Error("mainWindow and callback are required");
    }

    // Set up default hotkey first
    this.setupShortcuts("`", callback);

    // Listen for window to be ready, then get saved hotkey
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

      if (savedHotkey && savedHotkey !== "`") {
        const result = this.setupShortcuts(savedHotkey, callback);
        if (result.success) {
          // Hotkey initialized from localStorage
        }
      }
    } catch (err) {
      console.error("Failed to get saved hotkey:", err);
    }
  }

  async updateHotkey(hotkey, callback) {
    if (!callback) {
      throw new Error("Callback function is required for hotkey update");
    }

    try {
      const result = this.setupShortcuts(hotkey, callback);
      if (result.success) {
        return { success: true, message: `Hotkey updated to: ${hotkey}` };
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

  unregisterAll() {
    globalShortcut.unregisterAll();
  }

  isHotkeyRegistered(hotkey) {
    return globalShortcut.isRegistered(hotkey);
  }
}

module.exports = HotkeyManager;
