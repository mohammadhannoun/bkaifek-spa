import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ltrTheme, rtlTheme } from "../styles/theme";

// Import translations
import enCommon from "../locales/en/common";
import arCommon from "../locales/ar/common";

// Create translation objects
const enTranslations = { common: enCommon };
const arTranslations = { common: arCommon };

// Define language type
export type Language = "en" | "ar";

// Define context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Create emotion cache for RTL
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create emotion cache for LTR
const cacheLtr = createCache({
  key: "muiltr",
  stylisPlugins: [prefixer],
});

// Create provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Get initial language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || "en";
  });

  // Determine if the current language is RTL
  const isRTL = language === "ar";

  // Update document direction and language
  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem("language", language);

    // Update document direction
    document.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  // Translation function
  const t = (key: string): string => {
    const keys = key.split(".");
    let translation: any;

    if (language === "ar") {
      translation = arTranslations;
    } else {
      translation = enTranslations;
    }

    // Navigate through nested keys
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

  // Context value
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

// Create hook for using the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
