import React, { useState, useEffect } from "react";
import { Button } from "./button";

interface EnhancedKeyboardProps {
  selectedKeys: string[];
  setSelectedKeys?: (keys: string[]) => void;
  onSelectionChange?: (keys: string[]) => void;
  layout?: 'qwerty' | 'azerty';
  keyboardLayout?: 'qwerty' | 'azerty';
  allowCombinations?: boolean;
  showLayoutToggle?: boolean;
  showModeToggle?: boolean;
  enablePhysicalKeyDetection?: boolean;
}

interface KeyProps {
  keyValue: string;
  isSelected: boolean;
  onClick: () => void;
  width?: string;
  isModifier?: boolean;
}

const Key: React.FC<KeyProps> = ({ 
  keyValue, 
  isSelected, 
  onClick, 
  width = "w-12", 
  isModifier = false 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${width} h-12 rounded-lg font-mono text-sm font-medium
        transition-all duration-150 ease-in-out
        transform active:scale-95
        ${isPressed ? 'translate-y-1 shadow-inner' : 'translate-y-0 shadow-lg'}
        hover:translate-y-0.5 hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-indigo-300
        ${
          isSelected
            ? 'bg-indigo-500 text-white border-2 border-indigo-600'
            : isModifier
            ? 'bg-blue-100 text-blue-800 border-2 border-blue-300 hover:border-blue-400'
            : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-gray-400'
        }
        ${isPressed ? 'bg-gray-100' : ''}
      `}
    >
      {keyValue === 'Space' ? '' : keyValue}
    </button>
  );
};

const KEYBOARD_LAYOUTS = {
  qwerty: {
    numberRow: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    topRow: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    middleRow: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
    bottomRow: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']
  },
  azerty: {
    numberRow: ['²', '&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à', ')', '='],
    topRow: ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '^', '$'],
    middleRow: ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'ù', '*'],
    bottomRow: ['W', 'X', 'C', 'V', 'B', 'N', ',', ';', ':', '!']
  }
};

const MODIFIER_KEYS = ['Ctrl', 'Alt', 'Shift', 'CapsLock'];
const FUNCTION_KEYS_ROW1 = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
const FUNCTION_KEYS_ROW2 = ['F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24'];
const FUNCTION_KEYS = [...FUNCTION_KEYS_ROW1, ...FUNCTION_KEYS_ROW2];

// Mapping des codes de touches vers les noms utilisés dans l'interface
const KEY_CODE_MAP: { [key: string]: string } = {
  // Touches spéciales
  'Escape': 'Esc',
  'Backspace': 'Backspace',
  'Tab': 'Tab',
  'Enter': 'Enter',
  'Space': 'Space',
  'CapsLock': 'CapsLock',
  'ShiftLeft': 'Shift',
  'ShiftRight': 'Shift',
  'ControlLeft': 'Ctrl',
  'ControlRight': 'Ctrl',
  'AltLeft': 'Alt',
  'AltRight': 'Alt',
  // Touches de fonction F1-F12
  'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
  'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  // Touches de fonction F13-F24
  'F13': 'F13', 'F14': 'F14', 'F15': 'F15', 'F16': 'F16', 'F17': 'F17', 'F18': 'F18',
  'F19': 'F19', 'F20': 'F20', 'F21': 'F21', 'F22': 'F22', 'F23': 'F23', 'F24': 'F24',
  // Chiffres
  'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
  'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9',
  // Lettres (seront converties selon le layout)
  'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E', 'KeyF': 'F',
  'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
  'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O', 'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R',
  'KeyS': 'S', 'KeyT': 'T', 'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X',
  'KeyY': 'Y', 'KeyZ': 'Z'
};

// Conversion des touches QWERTY vers AZERTY
const QWERTY_TO_AZERTY: { [key: string]: string } = {
  'Q': 'A', 'W': 'Z', 'A': 'Q', 'Z': 'W', 'M': 'M'
};

export default function EnhancedKeyboard({ 
  selectedKeys, 
  setSelectedKeys, 
  onSelectionChange,
  layout = 'azerty',
  keyboardLayout,
  allowCombinations = true,
  showLayoutToggle = false,
  showModeToggle = true,
  enablePhysicalKeyDetection = false
}: EnhancedKeyboardProps) {
  const [currentLayoutState, setCurrentLayoutState] = useState(keyboardLayout || layout);
  const [internalAllowCombinations, setInternalAllowCombinations] = useState(allowCombinations);
  const [isListening, setIsListening] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const currentLayoutData = KEYBOARD_LAYOUTS[currentLayoutState];

  // Fonction pour convertir un code de touche en nom de touche selon le layout
  const convertKeyCode = (code: string): string | null => {
    let keyName = KEY_CODE_MAP[code];
    if (!keyName) return null;

    // Conversion QWERTY vers AZERTY si nécessaire
    if (currentLayoutState === 'azerty' && QWERTY_TO_AZERTY[keyName]) {
      keyName = QWERTY_TO_AZERTY[keyName];
    }

    return keyName;
  };

  // Event listeners pour la détection des touches physiques
  useEffect(() => {
    if (!isListening || !enablePhysicalKeyDetection) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const keyName = convertKeyCode(event.code);
      if (!keyName) return;

      setPressedKeys(prev => new Set([...prev, keyName]));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      const keyName = convertKeyCode(event.code);
      if (!keyName) return;

      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyName);
        
        // Si on relâche toutes les touches, on applique la sélection
        if (newSet.size === 0 && prev.size > 0) {
          const keysArray = Array.from(prev);
          if (onSelectionChange) {
            onSelectionChange(keysArray);
          }
          setIsListening(false);
        }
        
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening, enablePhysicalKeyDetection, currentLayoutState, onSelectionChange]);
  
  // S'assurer que la layout est mise à jour quand les props changent
  useEffect(() => {
    const newLayout = keyboardLayout || layout;
    if (newLayout !== currentLayoutState) {
      setCurrentLayoutState(newLayout);
    }
  }, [keyboardLayout, layout]); // Retirer currentLayoutState des dépendances pour éviter la boucle

  const handleKeyClick = (key: string) => {
    let newKeys: string[];
    
    if (!internalAllowCombinations) {
      // Mode touche simple
      newKeys = [key];
    } else {
      // Mode combinaisons
      const isModifier = MODIFIER_KEYS.includes(key);
      const isSelected = selectedKeys.includes(key);

      if (isSelected) {
        // Désélectionner la touche
        newKeys = selectedKeys.filter(k => k !== key);
      } else {
        // Ajouter la touche
        if (isModifier) {
          // Les modificateurs peuvent être combinés
          newKeys = [...selectedKeys, key];
        } else {
          // Pour les touches normales, remplacer les non-modificateurs existants
          const modifiers = selectedKeys.filter(k => MODIFIER_KEYS.includes(k));
          newKeys = [...modifiers, key];
        }
      }
    }
    
    // Utiliser la fonction de callback appropriée
    if (onSelectionChange) {
      onSelectionChange(newKeys);
    } else if (setSelectedKeys) {
      setSelectedKeys(newKeys);
    }
  };

  const clearSelection = () => {
    const newKeys: string[] = [];
    if (onSelectionChange) {
      onSelectionChange(newKeys);
    } else if (setSelectedKeys) {
      setSelectedKeys(newKeys);
    }
  };

  const formatCombination = (keys: string[]) => {
    if (keys.length === 0) return '';
    if (keys.length === 1) return keys[0];
    
    // Trier : modificateurs d'abord, puis la touche principale
    const modifiers = keys.filter(k => MODIFIER_KEYS.includes(k)).sort();
    const mainKeys = keys.filter(k => !MODIFIER_KEYS.includes(k));
    
    return [...modifiers, ...mainKeys].join('+');
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-2xl border border-gray-300">
      {/* En-tête avec sélecteur de layout */}
      {(showLayoutToggle || showModeToggle || enablePhysicalKeyDetection) && (
        <div className="flex justify-between items-center mb-4">
          {showLayoutToggle && (
            <div className="flex gap-2">
              <Button
                variant={currentLayoutState === 'qwerty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentLayoutState('qwerty')}
              >
                QWERTY
              </Button>
              <Button
                variant={currentLayoutState === 'azerty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentLayoutState('azerty')}
              >
                AZERTY
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            {showModeToggle && (
              <div className="flex gap-2">
                <Button
                  variant={!internalAllowCombinations ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInternalAllowCombinations(false)}
                >
                  Touche simple
                </Button>
                <Button
                  variant={internalAllowCombinations ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInternalAllowCombinations(true)}
                >
                  Combinaison
                </Button>
              </div>
            )}
            {enablePhysicalKeyDetection && (
              <Button
                variant={isListening ? 'destructive' : 'default'}
                size="sm"
                onClick={() => {
                  setIsListening(!isListening);
                  if (!isListening) {
                    setPressedKeys(new Set());
                  }
                }}
              >
                {isListening ? 'Arrêter l\'écoute' : 'Écouter les touches'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Effacer
            </Button>
          </div>
          {isListening && pressedKeys.size > 0 && (
            <div className="text-sm text-gray-600">
              Touches pressées: {Array.from(pressedKeys).join(' + ')}
            </div>
          )}
        </div>
      )}

      {/* Touches de fonction - Ligne 1 (Esc, F1-F12) */}
      <div className="flex justify-center gap-1 mb-2">
        {FUNCTION_KEYS_ROW1.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
            width={key === 'Esc' ? 'w-12' : 'w-10'}
          />
        ))}
      </div>

      {/* Touches de fonction - Ligne 2 (F13-F24) */}
      <div className="flex justify-center gap-1 mb-4">
        {FUNCTION_KEYS_ROW2.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
            width="w-10"
          />
        ))}
      </div>

      {/* Rangée des chiffres */}
      <div className="flex justify-center gap-1 mb-2">
        {currentLayoutData.numberRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Backspace"
          isSelected={selectedKeys.includes('Backspace')}
          onClick={() => handleKeyClick('Backspace')}
          width="w-20"
        />
      </div>

      {/* Première rangée de lettres */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="Tab"
          isSelected={selectedKeys.includes('Tab')}
          onClick={() => handleKeyClick('Tab')}
          width="w-16"
        />
        {currentLayoutData.topRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
          />
        ))}
      </div>

      {/* Deuxième rangée de lettres */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="CapsLock"
          isSelected={selectedKeys.includes('CapsLock')}
          onClick={() => handleKeyClick('CapsLock')}
          width="w-18"
          isModifier={true}
        />
        {currentLayoutData.middleRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Enter"
          isSelected={selectedKeys.includes('Enter')}
          onClick={() => handleKeyClick('Enter')}
          width="w-20"
        />
      </div>

      {/* Troisième rangée de lettres */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="Shift"
          isSelected={selectedKeys.includes('Shift')}
          onClick={() => handleKeyClick('Shift')}
          width="w-24"
          isModifier={true}
        />
        {currentLayoutData.bottomRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKeys.includes(key)}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Shift"
          isSelected={selectedKeys.includes('Shift')}
          onClick={() => handleKeyClick('Shift')}
          width="w-24"
          isModifier={true}
        />
      </div>

      {/* Rangée du bas */}
      <div className="flex justify-center gap-1">
        <Key
          keyValue="Ctrl"
          isSelected={selectedKeys.includes('Ctrl')}
          onClick={() => handleKeyClick('Ctrl')}
          width="w-16"
          isModifier={true}
        />
        <Key
          keyValue="Alt"
          isSelected={selectedKeys.includes('Alt')}
          onClick={() => handleKeyClick('Alt')}
          width="w-16"
          isModifier={true}
        />
        <Key
          keyValue="Space"
          isSelected={selectedKeys.includes('Space')}
          onClick={() => handleKeyClick('Space')}
          width="w-64"
        />
        <Key
          keyValue="Alt"
          isSelected={selectedKeys.includes('Alt')}
          onClick={() => handleKeyClick('Alt')}
          width="w-16"
          isModifier={true}
        />
        <Key
          keyValue="Ctrl"
          isSelected={selectedKeys.includes('Ctrl')}
          onClick={() => handleKeyClick('Ctrl')}
          width="w-16"
          isModifier={true}
        />
      </div>

      {/* Affichage de la sélection */}
      <div className="mt-6 text-center">
        {selectedKeys.length > 0 ? (
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 border-2 border-indigo-300 rounded-lg">
            <span className="text-sm text-indigo-700 mr-2">
              {allowCombinations && selectedKeys.length > 1 ? 'Combinaison :' : 'Sélectionnée :'}
            </span>
            <kbd className="px-3 py-1 bg-white border border-indigo-200 rounded font-mono text-lg font-semibold text-indigo-900">
              {formatCombination(selectedKeys)}
            </kbd>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {allowCombinations 
              ? 'Cliquez sur une ou plusieurs touches pour créer une combinaison'
              : 'Cliquez sur une touche pour la sélectionner'
            }
          </div>
        )}
      </div>

      {/* Raccourcis prédéfinis */}
      {allowCombinations && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Raccourcis populaires :</h5>
          <div className="flex flex-wrap gap-2">
            {[
              ['Ctrl', 'Alt', 'D'],
              ['Ctrl', 'Shift', 'V'],
              ['Alt', 'F4'],
              ['Ctrl', 'Space'],
              ['F12']
            ].map((combo, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setSelectedKeys(combo)}
                className="text-xs"
              >
                {formatCombination(combo)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}