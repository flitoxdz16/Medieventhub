import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Resources will be dynamically loaded
const resources = {
  en: {
    common: {
      "app": {
        "name": "MedEvents",
        "tagline": "Medical Events Management Platform",
        "slogan": "Connecting Healthcare Professionals"
      },
      "navigation": {
        "dashboard": "Dashboard",
        "events": "Events",
        "users": "Users",
        "roles": "Roles",
        "certificates": "Certificates",
        "reports": "Reports",
        "settings": "Settings",
        "logout": "Logout",
        "profile": "Profile"
      },
      // Other English translations
    },
    // Other namespaces
  },
  fr: {
    common: {
      "app": {
        "name": "MedEvents",
        "tagline": "Plateforme de Gestion des Événements Médicaux",
        "slogan": "Connecter les Professionnels de la Santé"
      },
      "navigation": {
        "dashboard": "Tableau de Bord",
        "events": "Événements",
        "users": "Utilisateurs",
        "roles": "Rôles",
        "certificates": "Certificats",
        "reports": "Rapports",
        "settings": "Paramètres",
        "logout": "Déconnexion",
        "profile": "Profil"
      },
      // Other French translations
    },
    // Other namespaces
  },
  ar: {
    common: {
      "app": {
        "name": "ميد إيفنتس",
        "tagline": "منصة إدارة الفعاليات الطبية",
        "slogan": "ربط المتخصصين في الرعاية الصحية"
      },
      "navigation": {
        "dashboard": "لوحة التحكم",
        "events": "الفعاليات",
        "users": "المستخدمون",
        "roles": "الأدوار",
        "certificates": "الشهادات",
        "reports": "التقارير",
        "settings": "الإعدادات",
        "logout": "تسجيل الخروج",
        "profile": "الملف الشخصي"
      },
      // Other Arabic translations
    },
    // Other namespaces
  },
};

// Configure i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
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