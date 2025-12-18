import { useState, useCallback, useEffect } from "react";

export interface DictionaryEntry {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
  createdAt: number;
}

export interface DictionaryStats {
  totalEntries: number;
  enabledEntries: number;
}

const STORAGE_KEY = "customDictionary";

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Load dictionary from localStorage
const loadDictionary = (): DictionaryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load dictionary:", error);
  }
  return [];
};

// Save dictionary to localStorage
const saveDictionary = (entries: DictionaryEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to save dictionary:", error);
  }
};

/**
 * Apply dictionary replacements to text (case-insensitive)
 */
export const applyDictionaryReplacements = (text: string): string => {
  const entries = loadDictionary().filter((e) => e.enabled);

  if (entries.length === 0) return text;

  let result = text;

  for (const entry of entries) {
    // Create case-insensitive regex with word boundaries
    // Use \b for word boundaries to avoid partial replacements
    const escapedFrom = entry.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedFrom}\\b`, "gi");

    result = result.replace(regex, (match) => {
      // Preserve original case pattern if possible
      if (match === match.toUpperCase()) {
        return entry.to.toUpperCase();
      } else if (match === match.toLowerCase()) {
        return entry.to.toLowerCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return entry.to.charAt(0).toUpperCase() + entry.to.slice(1);
      }
      return entry.to;
    });
  }

  return result;
};

/**
 * Hook for managing custom dictionary
 */
export function useDictionary() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    setEntries(loadDictionary());
    setIsLoaded(true);
  }, []);

  // Save whenever entries change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveDictionary(entries);
    }
  }, [entries, isLoaded]);

  // Add new entry
  const addEntry = useCallback((from: string, to: string): DictionaryEntry | null => {
    const trimmedFrom = from.trim();
    const trimmedTo = to.trim();

    if (!trimmedFrom || !trimmedTo) {
      return null;
    }

    // Check for duplicate (case-insensitive)
    const isDuplicate = entries.some(
      (e) => e.from.toLowerCase() === trimmedFrom.toLowerCase()
    );

    if (isDuplicate) {
      return null;
    }

    const newEntry: DictionaryEntry = {
      id: generateId(),
      from: trimmedFrom,
      to: trimmedTo,
      enabled: true,
      createdAt: Date.now(),
    };

    setEntries((prev) => [...prev, newEntry]);
    return newEntry;
  }, [entries]);

  // Update entry
  const updateEntry = useCallback((id: string, updates: Partial<Omit<DictionaryEntry, "id" | "createdAt">>): boolean => {
    let found = false;
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          found = true;
          return { ...entry, ...updates };
        }
        return entry;
      })
    );
    return found;
  }, []);

  // Delete entry
  const deleteEntry = useCallback((id: string): boolean => {
    let found = false;
    setEntries((prev) => {
      const newEntries = prev.filter((entry) => {
        if (entry.id === id) {
          found = true;
          return false;
        }
        return true;
      });
      return newEntries;
    });
    return found;
  }, []);

  // Toggle entry enabled state
  const toggleEntry = useCallback((id: string): void => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
      )
    );
  }, []);

  // Clear all entries
  const clearAll = useCallback((): void => {
    setEntries([]);
  }, []);

  // Import entries from JSON
  const importEntries = useCallback((json: string): { success: boolean; count: number; error?: string } => {
    try {
      const imported = JSON.parse(json);

      if (!Array.isArray(imported)) {
        return { success: false, count: 0, error: "Format invalide: attendu un tableau" };
      }

      const validEntries: DictionaryEntry[] = [];
      const existingFroms = new Set(entries.map((e) => e.from.toLowerCase()));

      for (const item of imported) {
        if (item.from && item.to) {
          const from = String(item.from).trim();
          const to = String(item.to).trim();

          if (from && to && !existingFroms.has(from.toLowerCase())) {
            existingFroms.add(from.toLowerCase());
            validEntries.push({
              id: generateId(),
              from,
              to,
              enabled: item.enabled !== false,
              createdAt: Date.now(),
            });
          }
        }
      }

      if (validEntries.length > 0) {
        setEntries((prev) => [...prev, ...validEntries]);
      }

      return { success: true, count: validEntries.length };
    } catch (error) {
      return { success: false, count: 0, error: "JSON invalide" };
    }
  }, [entries]);

  // Export entries to JSON
  const exportEntries = useCallback((): string => {
    return JSON.stringify(
      entries.map(({ from, to, enabled }) => ({ from, to, enabled })),
      null,
      2
    );
  }, [entries]);

  // Get stats
  const getStats = useCallback((): DictionaryStats => {
    return {
      totalEntries: entries.length,
      enabledEntries: entries.filter((e) => e.enabled).length,
    };
  }, [entries]);

  // Search entries
  const searchEntries = useCallback((query: string): DictionaryEntry[] => {
    if (!query.trim()) return entries;

    const lowerQuery = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.from.toLowerCase().includes(lowerQuery) ||
        e.to.toLowerCase().includes(lowerQuery)
    );
  }, [entries]);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntry,
    clearAll,
    importEntries,
    exportEntries,
    getStats,
    searchEntries,
  };
}
