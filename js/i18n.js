/*
 * Felles i18n-rammeverk for hele prosjektet.
 *
 * Bruk:
 *   1. Inkluder dette skriptet FØR navbar.js på hver side.
 *   2. Hvert verktøy laster sine egne språkfiler (f.eks. MSAT/lang/no.js og
 *      MSAT/lang/en.js) som kaller I18n.register('no', { ... }) /
 *      I18n.register('en', { ... }).
 *   3. Merk opp tekst i HTML med data-i18n="nøkkel.sti" (eller
 *      data-i18n-placeholder / data-i18n-title / data-i18n-html), eller
 *      hent strenger i JS med I18n.t('nøkkel.sti').
 *
 * Standardspråk er engelsk. Valget lagres i localStorage og huskes.
 */
(function () {
    "use strict";

    const STORAGE_KEY = "app_lang";
    const DEFAULT_LANG = "en";
    const SUPPORTED = ["en", "no"];

    // Sammenslåtte ordbøker per språk. Fylles av språkfilene via register().
    const dictionaries = { en: {}, no: {} };

    function isSupported(lang) {
        return SUPPORTED.indexOf(lang) !== -1;
    }

    function getLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return isSupported(stored) ? stored : DEFAULT_LANG;
    }

    function setLang(lang) {
        if (!isSupported(lang)) return;
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.setAttribute("lang", lang);
        apply();
        window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: lang } }));
    }

    function deepMerge(target, source) {
        Object.keys(source).forEach(function (key) {
            const val = source[key];
            if (val && typeof val === "object" && !Array.isArray(val)) {
                if (!target[key] || typeof target[key] !== "object") target[key] = {};
                deepMerge(target[key], val);
            } else {
                target[key] = val;
            }
        });
        return target;
    }

    // Registrer (slå sammen) en ordbok-bit for ett språk.
    function register(lang, dict) {
        if (!dictionaries[lang]) dictionaries[lang] = {};
        deepMerge(dictionaries[lang], dict || {});
        if (document.readyState !== "loading") apply();
    }

    function lookup(obj, key) {
        return key.split(".").reduce(function (o, k) {
            return o && o[k] != null ? o[k] : undefined;
        }, obj);
    }

    // Hent en oversatt streng. Faller tilbake til engelsk, så til selve nøkkelen.
    function t(key, fallback) {
        const lang = getLang();
        let val = lookup(dictionaries[lang], key);
        if (val == null) val = lookup(dictionaries.en, key);
        if (val == null) val = fallback != null ? fallback : key;
        return val;
    }

    // Bytt ut tekst i DOM-en for elementer som er merket opp med data-i18n*.
    function apply(root) {
        root = root || document;

        root.querySelectorAll("[data-i18n]").forEach(function (el) {
            const val = t(el.getAttribute("data-i18n"));
            if (val != null) el.textContent = val;
        });
        root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
            const val = t(el.getAttribute("data-i18n-html"));
            if (val != null) el.innerHTML = val;
        });
        root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
            const val = t(el.getAttribute("data-i18n-placeholder"));
            if (val != null) el.setAttribute("placeholder", val);
        });
        root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
            const val = t(el.getAttribute("data-i18n-title"));
            if (val != null) el.setAttribute("title", val);
        });
    }

    window.I18n = {
        t: t,
        getLang: getLang,
        setLang: setLang,
        register: register,
        apply: apply,
        SUPPORTED: SUPPORTED,
        DEFAULT_LANG: DEFAULT_LANG
    };

    document.addEventListener("DOMContentLoaded", function () {
        document.documentElement.setAttribute("lang", getLang());
        apply();
    });
})();
