'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar' | 'hi' | 'zh';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const defaultLanguage: SupportedLanguage = 'en';

// Default translations
const translations: Record<string, Record<string, string>> = {
  en: {
    'quiz.loading': 'Loading question...',
    'quiz.submit': 'Submit',
    'quiz.next': 'Next',
    'quiz.correct': 'Correct!',
    'quiz.incorrect': 'Incorrect. The correct answer is: {{answer}}',
    'language.en': 'English',
    'language.es': 'Spanish',
    'language.fr': 'French',
    'language.ar': 'Arabic',
    'language.hi': 'Hindi',
    'language.zh': 'Chinese',
  },
  es: {
    'quiz.loading': 'Cargando pregunta...',
    'quiz.submit': 'Enviar',
    'quiz.next': 'Siguiente',
    'quiz.correct': '¡Correcto!',
    'quiz.incorrect': 'Incorrecto. La respuesta correcta es: {{answer}}',
    'language.en': 'Inglés',
    'language.es': 'Español',
    'language.fr': 'Francés',
    'language.ar': 'Árabe',
    'language.hi': 'Hindi',
    'language.zh': 'Chino',
  },
  // Add more languages as needed
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  // Simple translation function with variable substitution
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace placeholders with actual values
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{\\{${param}\\}\\}`), String(value));
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
