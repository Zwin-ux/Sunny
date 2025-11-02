'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translations - in a real app, this would be more comprehensive
const translations = {
  en: {
    welcome: 'Welcome',
    chat: 'Chat',
    dashboard: 'Dashboard',
    settings: 'Settings',
    logout: 'Logout'
  },
  es: {
    welcome: 'Bienvenido',
    chat: 'Chat',
    dashboard: 'Panel',
    settings: 'Configuración',
    logout: 'Cerrar sesión'
  },
  fr: {
    welcome: 'Bienvenue',
    chat: 'Chat',
    dashboard: 'Tableau de bord',
    settings: 'Paramètres',
    logout: 'Déconnexion'
  },
  de: {
    welcome: 'Willkommen',
    chat: 'Chat',
    dashboard: 'Dashboard',
    settings: 'Einstellungen',
    logout: 'Abmelden'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}