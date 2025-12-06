import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
};

// Get device language
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: deviceLanguage, // Default to device language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        compatibilityJSON: 'v4', // For Android compatibility
    });

// Handle RTL for Arabic
export const changeLanguage = async (lang: 'en' | 'fr' | 'ar') => {
    const isRTL = lang === 'ar';

    // Only reload if RTL status changes
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
        // Note: App reload might be required for RTL changes to fully take effect on some components
    }

    await i18n.changeLanguage(lang);
};

export default i18n;
