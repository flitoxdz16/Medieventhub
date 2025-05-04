import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enEvents from './locales/en/events.json';
import enUsers from './locales/en/users.json';
import enCertificates from './locales/en/certificates.json';

import frCommon from './locales/fr/common.json';
import frEvents from './locales/fr/events.json';
import frUsers from './locales/fr/users.json';
import frCertificates from './locales/fr/certificates.json';

import arCommon from './locales/ar/common.json';
import arEvents from './locales/ar/events.json';
import arUsers from './locales/ar/users.json';
import arCertificates from './locales/ar/certificates.json';

// Configure i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        events: enEvents,
        users: enUsers,
        certificates: enCertificates,
      },
      fr: {
        common: frCommon,
        events: frEvents,
        users: frUsers,
        certificates: frCertificates,
      },
      ar: {
        common: arCommon,
        events: arEvents,
        users: arUsers,
        certificates: arCertificates,
      },
    },
    ns: ['common', 'events', 'users', 'certificates'],
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;