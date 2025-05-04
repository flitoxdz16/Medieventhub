import { useContext } from 'react';
import { LanguageContext, Language } from '@/providers/LanguageProvider';

/**
 * Custom hook for accessing language context
 * 
 * @returns Language context with current language, setter, and RTL flag
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    isRtl: context.isRtl,
  };
}