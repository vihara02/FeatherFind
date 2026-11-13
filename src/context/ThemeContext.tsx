import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { getUserPreferences, saveUserPreferences } from '../services/storageService';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: typeof Colors.light;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeMode: 'system',
  colors: Colors.light,
  isDark: false,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    getUserPreferences().then(prefs => {
      setThemeModeState(prefs.theme || 'light');
    });
  }, []);

  const effectiveTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const colors = effectiveTheme === 'dark' ? Colors.dark : Colors.light;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveUserPreferences({ theme: mode });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        themeMode,
        colors,
        isDark: effectiveTheme === 'dark',
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
