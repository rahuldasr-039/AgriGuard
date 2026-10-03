"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * GoogleTranslateScript component
 * Enables whole-page dynamic translation using Google Website Translator.
 * Automatically translates headings, paragraphs, cards, tables, and buttons
 * while preserving technical identifiers tagged with class="notranslate" or translate="no".
 */
export default function GoogleTranslateScript() {
  const { language } = useLanguage();
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || scriptInjectedRef.current) return;
    scriptInjectedRef.current = true;

    // 1. Define the Google Translate global callback before the script loads
    window.googleTranslateElementInit = function () {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ta,hi,te,kn,ml,bn,mr,gu,pa,or,as",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    // 2. Inject Google Translate Element Script
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // 3. Synchronize active language with Google Translate
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLanguage = () => {
      const targetLang = language || "en";
      const cookieVal = targetLang === "en" ? "/en/en" : `/en/${targetLang}`;
      const host = window.location.hostname;

      // Set cookie across root and domain
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      document.cookie = `googtrans=${cookieVal}; domain=${host}; path=/;`;
      if (host !== "localhost" && host !== "127.0.0.1") {
        document.cookie = `googtrans=${cookieVal}; domain=.${host}; path=/;`;
      }

      // Trigger Google Translate hidden combo box
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        if (select.value !== targetLang) {
          select.value = targetLang;
          select.dispatchEvent(new Event("change"));
        }
      }
    };

    syncLanguage();

    // Re-check periodically in case script is still downloading/parsing
    const t1 = setTimeout(syncLanguage, 400);
    const t2 = setTimeout(syncLanguage, 1200);
    const t3 = setTimeout(syncLanguage, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [language]);

  return (
    <div
      id="google_translate_element"
      style={{ display: "none" }}
      aria-hidden="true"
    />
  );
}
