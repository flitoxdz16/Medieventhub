import React, { createContext, useState, useEffect } from "react";
import i18n from "i18next";
import { useAuth } from "@/hooks/useAuth";

export type Language = "en" | "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isRtl: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to browser language or "en"
    const savedLang = localStorage.getItem("language") as Language | null;
    const browserLang = navigator.language.split("-")[0] as Language;
    
    // Only accept our supported languages
    const supportedLang = ["en", "fr", "ar"].includes(browserLang) ? browserLang : "en";
    
    return savedLang || supportedLang;
  });
  
  // Check if the language is RTL (Arabic)
  const isRtl = language === "ar";

  // Set the language in i18n and update document attributes
  useEffect(() => {
    // Update i18n language
    i18n.changeLanguage(language);
    
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    // Save to localStorage
    localStorage.setItem("language", language);
  }, [language, isRtl]);
  
  // Use user's preferred language if available
  useEffect(() => {
    if (user?.preferredLanguage && ["en", "fr", "ar"].includes(user.preferredLanguage)) {
      setLanguageState(user.preferredLanguage as Language);
    }
  }, [user]);

  // Function to change language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};
