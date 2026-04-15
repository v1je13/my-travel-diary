/**
 * Кастомный хук для работы с localStorage
 */

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue = []) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export function useLocalStorageSet(key) {
  const [set, setSet] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
      console.error(`Error reading localStorage Set "${key}":`, error);
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify([...set]));
    } catch (error) {
      console.error(`Error setting localStorage Set "${key}":`, error);
    }
  }, [key, set]);

  const addToSet = useCallback((item) => {
    setSet(prev => new Set([...prev, item]));
  }, []);

  const removeFromSet = useCallback((item) => {
    setSet(prev => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  }, []);

  const hasInSet = useCallback((item) => set.has(item), [set]);

  return [set, addToSet, removeFromSet, hasInSet];
}
