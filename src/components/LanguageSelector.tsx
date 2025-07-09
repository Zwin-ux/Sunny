'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  
  const languages = [
    { code: 'en', name: t('language.en') },
    { code: 'es', name: t('language.es') },
    { code: 'fr', name: t('language.fr') },
    { code: 'ar', name: t('language.ar') },
    { code: 'hi', name: t('language.hi') },
    { code: 'zh', name: t('language.zh') },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="secondary" size="sm" className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Select language</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <div key={lang.code} className="cursor-pointer px-4 py-2 hover:bg-gray-100" onClick={() => setLanguage(lang.code as any)}>
            {lang.name}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
