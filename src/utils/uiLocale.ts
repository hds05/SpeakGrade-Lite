export type UiLocale = "en" | "es";

const STORAGE_KEY = "speakgrade_ui_locale";

export function getStoredUiLocale(fallback: UiLocale = "en"): UiLocale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
    return fallback;
  } catch {
    return fallback;
  }
}

export function setStoredUiLocale(locale: UiLocale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

