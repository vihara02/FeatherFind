import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '../types';
import { getUserPreferences, saveUserPreferences } from '../services/storageService';

interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  reloadPreferences: () => Promise<void>;
}

const defaultPrefs: UserPreferences = {
  userName: 'Sri Lankan Explorer',
  profilePhotoUri: null,
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  autoGpsEnabled: true,
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: defaultPrefs,
  loading: true,
  updatePreferences: async () => {},
  reloadPreferences: async () => {},
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const p = await getUserPreferences();
      setPreferences(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const updated = await saveUserPreferences(updates);
    setPreferences(updated);
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
        reloadPreferences: load,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
