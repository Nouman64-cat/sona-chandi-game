"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  gender: string | null;
  toggleTheme: () => void;
  refreshGender: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [gender, setGender] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const applyGenderClass = (currentGender: string | null) => {
    document.documentElement.classList.remove('gender-female', 'gender-male');
    if (!currentGender) return;
    
    const normalizedGender = currentGender.toLowerCase();
    if (normalizedGender === 'female') {
      document.documentElement.classList.add('gender-female');
    } else if (normalizedGender === 'male') {
      document.documentElement.classList.add('gender-male');
    }
  };

  const refreshGender = () => {
    const savedGender = localStorage.getItem('gender');
    setGender(savedGender);
    applyGenderClass(savedGender);
  };

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
      }
    }

    // Load saved gender
    const savedGender = localStorage.getItem('gender');
    setGender(savedGender);
    applyGenderClass(savedGender);

    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, gender, toggleTheme, refreshGender }}>
      {!mounted ? (
        <div style={{ visibility: 'hidden' }}>{children}</div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
