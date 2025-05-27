import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ltrTheme, rtlTheme } from "../styles/theme";
import enCommon from "../locales/en/common";
import arCommon from "../locales/ar/common";

const enTranslations = { common: enCommon };
const arTranslations = { common: arCommon };

export type Language = "en" | "ar";

// Defining context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: "muiltr",
  stylisPlugins: [prefixer],
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // We will try to get initial language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || "en";
  });

  const isRTL = language === "ar";

  useEffect(() => {
    localStorage.setItem("language", language);

    document.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    const keys = key.split(".");
    let translation: any;

    if (language === "ar") {
      translation = arTranslations;
    } else {
      translation = enTranslations;
    }

    for (const k of keys) {
      if (translation && typeof translation === "object" && k in translation) {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return translation as string;
  };

  const value = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      <CacheProvider value={isRTL ? cacheRtl : cacheLtr}>
        <ThemeProvider theme={isRTL ? rtlTheme : ltrTheme}>
          {children}
        </ThemeProvider>
      </CacheProvider>
    </LanguageContext.Provider>
  );
};

// Thiis is a custom hook for using the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
