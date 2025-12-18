import React, { useState } from "react";

interface KeyboardProps {
  selectedKey?: string;
  setSelectedKey: (key: string) => void;
}

interface KeyProps {
  keyValue: string;
  isSelected: boolean;
  onClick: () => void;
  width?: string;
  disabled?: boolean;
}

const Key: React.FC<KeyProps> = ({ keyValue, isSelected, onClick, width = "w-12", disabled = false }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
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
            : disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-gray-400'
        }
        ${isPressed ? 'bg-gray-100' : ''}
      `}
    >
      {keyValue === 'Space' ? '' : keyValue}
    </button>
  );
};

export default function Keyboard({ selectedKey, setSelectedKey }: KeyboardProps) {
  const functionKeysRow1 = ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
  const functionKeysRow2 = ['F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24'];

  const numberRow = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  
  const qwertyRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'];
  
  const asdfRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"];
  
  const zxcvRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'];

  const handleKeyClick = (key: string) => {
    setSelectedKey(key);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-2xl border border-gray-300">
      {/* Function Keys Row 1 (Esc, F1-F12) */}
      <div className="flex justify-center gap-1 mb-2">
        {functionKeysRow1.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
            width={key === 'Esc' ? 'w-12' : 'w-10'}
          />
        ))}
      </div>

      {/* Function Keys Row 2 (F13-F24) */}
      <div className="flex justify-center gap-1 mb-4">
        {functionKeysRow2.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
            width="w-10"
          />
        ))}
      </div>

      {/* Number Row */}
      <div className="flex justify-center gap-1 mb-2">
        {numberRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Backspace"
          isSelected={selectedKey === 'Backspace'}
          onClick={() => handleKeyClick('Backspace')}
          width="w-20"
        />
      </div>

      {/* QWERTY Row */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="Tab"
          isSelected={selectedKey === 'Tab'}
          onClick={() => handleKeyClick('Tab')}
          width="w-16"
        />
        {qwertyRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
          />
        ))}
      </div>

      {/* ASDF Row */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="Caps"
          isSelected={selectedKey === 'CapsLock'}
          onClick={() => handleKeyClick('CapsLock')}
          width="w-18"
        />
        {asdfRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Enter"
          isSelected={selectedKey === 'Enter'}
          onClick={() => handleKeyClick('Enter')}
          width="w-20"
        />
      </div>

      {/* ZXCV Row */}
      <div className="flex justify-center gap-1 mb-2">
        <Key
          keyValue="Shift"
          isSelected={selectedKey === 'Shift'}
          onClick={() => handleKeyClick('Shift')}
          width="w-24"
        />
        {zxcvRow.map((key) => (
          <Key
            key={key}
            keyValue={key}
            isSelected={selectedKey === key}
            onClick={() => handleKeyClick(key)}
          />
        ))}
        <Key
          keyValue="Shift"
          isSelected={false}
          onClick={() => handleKeyClick('Shift')}
          width="w-24"
        />
      </div>

      {/* Bottom Row */}
      <div className="flex justify-center gap-1">
        <Key
          keyValue="Ctrl"
          isSelected={selectedKey === 'Ctrl'}
          onClick={() => handleKeyClick('Ctrl')}
          width="w-16"
        />
        <Key
          keyValue="Alt"
          isSelected={selectedKey === 'Alt'}
          onClick={() => handleKeyClick('Alt')}
          width="w-16"
        />
        <Key
          keyValue="Space"
          isSelected={selectedKey === 'Space'}
          onClick={() => handleKeyClick('Space')}
          width="w-64"
        />
        <Key
          keyValue="Alt"
          isSelected={false}
          onClick={() => handleKeyClick('Alt')}
          width="w-16"
        />
        <Key
          keyValue="Ctrl"
          isSelected={false}
          onClick={() => handleKeyClick('Ctrl')}
          width="w-16"
        />
      </div>

      {/* Selected Key Display */}
      {selectedKey && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 border-2 border-indigo-300 rounded-lg">
            <span className="text-sm text-indigo-700 mr-2">Sélectionnée :</span>
            <kbd className="px-3 py-1 bg-white border border-indigo-200 rounded font-mono text-lg font-semibold text-indigo-900">
              {selectedKey}
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}
