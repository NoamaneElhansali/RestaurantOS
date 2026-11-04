import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLanguages = ['fr', 'ar', 'en'] as const;
export type Language = (typeof supportedLanguages)[number];

const resources = {
  fr: { translation: {
    product: 'La plateforme de gestion pour restaurants',
    headline: 'Votre restaurant. Une expérience mieux organisée.',
    subtitle: 'La base technique de RestaurantOS est en cours de vérification. Les fonctions de menus, commandes et abonnements ne sont pas encore disponibles.',
    statusTitle: 'État de la connexion',
    statusDescription: 'Vérification réelle du service API — aucune donnée de démonstration.',
    service: 'API REST',
    version: 'Version',
    online: 'Connectée',
    offline: 'Indisponible',
    checking: 'Vérification…',
    retry: 'Réessayer',
    next: 'À venir',
    planned: 'Menus QR · Gestion des restaurants · Abonnements',
    phase: 'Fondations techniques · Phase 1',
    lang: 'Langue',
    security: 'Les données des restaurants ne sont pas encore accessibles.',
    footer: 'RestaurantOS · Conçu pour les restaurants au Maroc',
  } },
  ar: { translation: {
    product: 'منصة إدارة المطاعم',
    headline: 'مطعمك. إدارة أكثر تنظيماً.',
    subtitle: 'يجري التحقق من البنية التقنية لـ RestaurantOS. إدارة القوائم والطلبات والاشتراكات غير متاحة بعد.',
    statusTitle: 'حالة الاتصال',
    statusDescription: 'فحص حقيقي لخدمة API دون بيانات تجريبية.',
    service: 'واجهة API',
    version: 'الإصدار',
    online: 'متصل',
    offline: 'غير متاح',
    checking: 'جارٍ التحقق…',
    retry: 'إعادة المحاولة',
    next: 'قريباً',
    planned: 'قوائم QR · إدارة المطاعم · الاشتراكات',
    phase: 'الأساس التقني · المرحلة الأولى',
    lang: 'اللغة',
    security: 'بيانات المطاعم غير متاحة بعد.',
    footer: 'RestaurantOS · مصمم للمطاعم في المغرب',
  } },
  en: { translation: {
    product: 'The restaurant management platform',
    headline: 'Your restaurant. A more connected operation.',
    subtitle: 'The RestaurantOS foundation is being verified. Menus, ordering and subscriptions are not yet available.',
    statusTitle: 'Connection status',
    statusDescription: 'Real API service check — no demonstration data.',
    service: 'REST API',
    version: 'Version',
    online: 'Connected',
    offline: 'Unavailable',
    checking: 'Checking…',
    retry: 'Retry',
    next: 'Coming next',
    planned: 'QR menus · Restaurant management · Subscriptions',
    phase: 'Technical foundation · Phase 1',
    lang: 'Language',
    security: 'Restaurant data is not yet accessible.',
    footer: 'RestaurantOS · Built for restaurants in Morocco',
  } },
} as const;

function savedLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  const value = window.localStorage.getItem('restaurantos-language');
  return supportedLanguages.find((language) => language === value) ?? 'fr';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  initAsync: false,
});

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
  if (typeof window !== 'undefined') window.localStorage.setItem('restaurantos-language', language);
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
}

export default i18n;
