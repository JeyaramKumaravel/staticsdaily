
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // Try to get from local storage on initial client-side render
    if (typeof window !== 'undefined') {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) {
          return JSON.parse(storedValue);
        }
      } catch (error) {
        console.error(`Error reading localStorage key "${key}" on init:`, error);
        // Fall through to defaultValue if error
      }
    }
    return defaultValue;
  });

  // Effect to save to localStorage whenever state changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // console.log(`Writing to localStorage key "${key}":`, state);
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
