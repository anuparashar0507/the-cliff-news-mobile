import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

type Translations = {
  [key: string]: {
    en: string;
    hi: string;
  };
};

const translations: Translations = {
  newGame: {
    en: 'New Game',
    hi: 'नया खेल',
  },
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
  },
  language: {
    en: 'Language',
    hi: 'भाषा',
  },
  english: {
    en: 'English',
    hi: 'अंग्रेजी',
  },
  hindi: {
    en: 'Hindi',
    hi: 'हिंदी',
  },
  gameInstructions: {
    en: 'Game Instructions',
    hi: 'खेल निर्देश',
  },
  back: {
    en: 'Back',
    hi: 'वापस',
  },
  // Add more translations as needed
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}