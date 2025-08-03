import React, { useState, useEffect } from "react";
import { Minus, Square, X, Maximize2, Minimize2 } from "lucide-react";

interface WindowControlsProps {
  className?: string;
}

export default function WindowControls({ className = "" }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximized state
    const checkMaximized = async () => {
      try {
        const maximized = await window.electronAPI.windowIsMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error("Error checking window state:", error);
      }
    };

    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    try {
      await window.electronAPI.windowMinimize();
    } catch (error) {
      console.error("Error minimizing window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      await window.electronAPI.windowMaximize();
      // Toggle the state
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error("Error maximizing window:", error);
    }
  };

  const handleClose = async () => {
    try {
      await window.electronAPI.windowClose();
    } catch (error) {
      console.error("Error closing window:", error);
    }
  };

  return (
    <div className={`flex items-center ${className}`} style={{ WebkitAppRegion: "no-drag" }}>
      {/* Minimize button */}
      <button
        onClick={handleMinimize}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors duration-150 rounded"
        title="Réduire"
      >
        <Minus size={14} className="text-gray-600" />
      </button>

      {/* Maximize/Restore button */}
      <button
        onClick={handleMaximize}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors duration-150 rounded"
        title={isMaximized ? "Restaurer" : "Agrandir"}
      >
        {isMaximized ? (
          <Minimize2 size={14} className="text-gray-600" />
        ) : (
          <Maximize2 size={14} className="text-gray-600" />
        )}
      </button>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors duration-150 rounded"
        title="Fermer"
      >
        <X size={14} className="text-gray-600 hover:text-white" />
      </button>
    </div>
  );
}