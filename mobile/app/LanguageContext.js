import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from './i18n';

const LANG_KEY = '@food_app_language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    // Load saved language on mount
    useEffect(() => {
        AsyncStorage.getItem(LANG_KEY).then((saved) => {
            if (saved === 'en' || saved === 'hi') {
                setLanguage(saved);
            }
        });
    }, []);

    const toggleLanguage = () => {
        const next = language === 'en' ? 'hi' : 'en';
        setLanguage(next);
        AsyncStorage.setItem(LANG_KEY, next);
    };

    // Translation helper — falls back to key if missing
    const t = (key) => translations[language]?.[key] ?? key;

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
    return ctx;
}

export default LanguageProvider;
