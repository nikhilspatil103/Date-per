import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colorSchemes = {
  purple: { primary: '#8b9aee', headerBg: '#8b9aee' },
  pink: { primary: '#f472b6', headerBg: '#f472b6' },
  blue: { primary: '#60a5fa', headerBg: '#60a5fa' },
  green: { primary: '#34d399', headerBg: '#34d399' },
  orange: { primary: '#fb923c', headerBg: '#fb923c' },
  red: { primary: '#f87171', headerBg: '#f87171' },
  grey: { primary: '#9ca3af', headerBg: '#9ca3af' },
  teal: { primary: '#2dd4bf', headerBg: '#2dd4bf' },
};

const createTheme = (color: keyof typeof colorSchemes, isDark: boolean) => ({
  primary: colorSchemes[color].primary,
  headerBg: colorSchemes[color].headerBg,
  background: isDark ? '#0a0a0a' : '#f5f5f5',
  card: isDark ? '#1a1a1a' : '#ffffff',
  text: isDark ? '#ffffff' : '#1a1a1a',
  textSecondary: isDark ? 'rgba(255,255,255,0.6)' : '#666666',
  border: isDark ? 'rgba(255,255,255,0.08)' : '#e0e0e0',
  shadow: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
  overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
  online: '#22c55e',
  male: isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.2)',
  maleBorder: isDark ? 'rgba(37,99,235,0.5)' : 'rgba(37,99,235,0.4)',
  maleText: isDark ? '#60a5fa' : '#2563eb',
  female: isDark ? 'rgba(236,72,153,0.3)' : 'rgba(236,72,153,0.2)',
  femaleBorder: isDark ? 'rgba(236,72,153,0.5)' : 'rgba(236,72,153,0.4)',
  femaleText: isDark ? '#f472b6' : '#ec4899',
  headerText: '#ffffff',
  statBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  statBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
  inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
});

export const themes = {
  light: createTheme('purple', false),
  dark: createTheme('purple', true),
};

type Theme = ReturnType<typeof createTheme>;
type ThemeMode = 'light' | 'dark';
type ColorScheme = keyof typeof colorSchemes;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (color: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('purple');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then(saved => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
    AsyncStorage.getItem('colorScheme').then(saved => {
      if (saved && saved in colorSchemes) setColorSchemeState(saved as ColorScheme);
    });
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    AsyncStorage.setItem('themeMode', newMode);
  };

  const setColorScheme = (color: ColorScheme) => {
    setColorSchemeState(color);
    AsyncStorage.setItem('colorScheme', color);
  };

  const theme = createTheme(colorScheme, mode === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, colorScheme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const colorSchemeNames: Record<ColorScheme, string> = {
  purple: '💜 Purple',
  pink: '💗 Pink',
  blue: '💙 Blue',
  green: '💚 Green',
  orange: '🧡 Orange',
  red: '❤️ Red',
  grey: '🩶 Grey',
  teal: '💎 Teal',
};
