'use client';

import { createContext, useContext, useEffect, useState } from 'react';
export type Language = 'de' | 'en';
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: 'de', setLanguage: () => {} });

export function LanguageProvider({ initial, children }: { initial: Language; children: React.ReactNode }) {
  const [language, update] = useState(initial);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function setLanguage(value: Language) {
    update(value);
    document.cookie = `language=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label={language === 'de' ? 'Sprache' : 'Language'}>
    {(['de', 'en'] as const).map(value => <button key={value} type="button" aria-pressed={language === value} lang={value} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}
  </div>;
}
