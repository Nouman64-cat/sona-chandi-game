import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'dark' | 'light';
type Gender = 'Male' | 'Female' | 'Other' | string;

interface ThemeContextType {
  theme: Theme;
  gender: Gender;
  accentColor: string;
  toggleTheme: () => void;
  refreshGender: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [gender, setGender] = useState<Gender>('Other');

  useEffect(() => {
    (async () => {
      const [savedTheme, savedGender] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('gender'),
      ]);
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      if (savedGender) setGender(savedGender);
    })();
  }, []);

  const toggleTheme = async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    await AsyncStorage.setItem('theme', next);
  };

  const refreshGender = async () => {
    const g = await AsyncStorage.getItem('gender');
    if (g) setGender(g);
  };

  const accentColor =
    gender === 'Male' ? '#3b82f6' : gender === 'Female' ? '#ec4899' : '#D4AF37';

  return (
    <ThemeContext.Provider value={{ theme, gender, accentColor, toggleTheme, refreshGender }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
