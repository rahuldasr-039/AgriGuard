"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TRANSLATIONS } from "./translations/index";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
];

export { TRANSLATIONS };

// Status aliases map for instant dynamic status translation
const STATUS_ALIASES = {
  safe: "status.safe",
  unsafe: "status.unsafe",
  warning: "status.warning",
  pending: "status.pending",
  approved: "status.approved",
  completed: "status.completed",
  active: "status.active",
  inactive: "status.inactive",
  expired: "status.expired",
  verified: "status.verified",
  notverified: "status.notVerified",
  quarantined: "status.quarantined",
  restricted: "status.restricted",
  compliant: "status.compliant",
  violation: "status.violation",
  disbursed: "status.disbursed",
  "disbursed (paid)": "status.disbursed",
  "pending fssai approval": "status.pendingApproval",
  "pending approval": "status.pendingApproval",
  "fssai approved": "status.fssaiApproved",
  "review in progress": "status.reviewInProgress",
  "mrl safe": "status.mrlSafe",
  "mrl not safe": "status.mrlNotSafe",
  "pending review": "status.pendingReview",
  "market ready (safe)": "status.marketReady",
  "fssai safe": "status.fssaiSafe",
  "not configured": "status.notConfigured",
  paused: "status.paused",
  on: "status.on",
  off: "status.off",
  passed: "status.passed",
  failed: "status.failed",
  withdrawal: "status.withdrawal",
  "mrl exceeded": "status.mrlExceeded",
  medicine: "medicine",
  vaccine: "vaccine",
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  translateStatus: (status) => status,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agriguard_lang");
      if (saved && LANGUAGES.some(l => l.code === saved)) {
        setLanguageState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch (e) {
      console.warn("Could not read localStorage for language:", e);
    }
  }, []);

  const setLanguage = (langCode) => {
    if (!LANGUAGES.some(l => l.code === langCode)) return;
    setLanguageState(langCode);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("agriguard_lang", langCode);
        document.documentElement.lang = langCode;
        // Dispatch custom event for components listening directly
        window.dispatchEvent(new CustomEvent("agriguard_language_change", { detail: langCode }));
      }
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  };

  const t = useCallback((key, fallback) => {
    if (key === undefined || key === null) return "";
    const keyStr = String(key).trim();
    if (!keyStr) return "";

    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const enDict = TRANSLATIONS.en || {};

    // 1. Direct match in active dictionary
    if (currentDict[keyStr] !== undefined) {
      return currentDict[keyStr];
    }

    // 2. Check status alias lookup (e.g. "SAFE", "Safe", "DISBURSED (PAID)")
    const lowerKey = keyStr.toLowerCase();
    const alias = STATUS_ALIASES[lowerKey];
    if (alias && currentDict[alias] !== undefined) {
      return currentDict[alias];
    }
    if (currentDict[lowerKey] !== undefined) {
      return currentDict[lowerKey];
    }

    // 3. Fallback to English dictionary
    if (enDict[keyStr] !== undefined) {
      return currentDict[keyStr] || enDict[keyStr];
    }
    if (alias && enDict[alias] !== undefined) {
      return enDict[alias];
    }
    if (enDict[lowerKey] !== undefined) {
      return enDict[lowerKey];
    }

    // 4. Fallback or key string
    return fallback !== undefined ? fallback : keyStr;
  }, [language]);

  const translateStatus = useCallback((status) => {
    if (!status) return "";
    return t(status, status);
  }, [t]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateStatus, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
