'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'design';
export type Language = 'en' | 'ar';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('ar');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(
      'stylegrove-theme'
    ) as Theme | null;
    const storedLang = localStorage.getItem(
      'stylegrove-language'
    ) as Language | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    if (storedLang) {
      setLanguage(storedLang);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      root.className = '';
      root.classList.add(theme);
      localStorage.setItem('stylegrove-theme', theme);

      root.lang = language;
      root.dir = language === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('stylegrove-language', language);
    }
  }, [theme, language, isMounted]);

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, language, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
