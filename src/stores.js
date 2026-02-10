// src/stores.js (ENHANCED VERSION WITH THEME APPLICATION)
import { writable, derived } from "svelte/store";

//======================================================================
// UTILITY FUNCTIONS FOR BROWSER
//======================================================================
const isBrowser = typeof window !== "undefined";

//======================================================================
// A11Y UTILITIES
//======================================================================

// Store untuk pengumuman screen reader
export const announcements = writable([]);

// Objek utilitas aksesibilitas
export const a11yUtils = {
  /**
   * Menghasilkan ID unik untuk elemen aksesibilitas.
   * @param {string} prefix - Awalan untuk ID.
   * @returns {string} ID yang unik.
   */
  generateId: (prefix) =>
    `${prefix}-${Math.random().toString(36).substring(2, 9)}`,

  /**
   * Mengirim pesan ke screen reader.
   * @param {string} message - Pesan yang akan diumumkan.
   * @param {'polite'|'assertive'} politeness - Tingkat kepentingan pesan.
   */
  announce: (message, politeness = "polite") => {
    announcements.update((items) => {
      const newItems = items.filter((item) => Date.now() - item.id < 10000);
      return [...newItems.slice(-5), { id: Date.now(), message, politeness }];
    });
  },

  /**
   * Menetapkan focus trap di dalam sebuah elemen.
   * @param {HTMLElement} element - Elemen kontainer.
   * @returns {() => void} Fungsi untuk menghapus focus trap.
   */
  setFocusTrap: (element) => {
    if (!element) return () => {};
    const focusableElements = Array.from(
      element.querySelectorAll(
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  },
};

//======================================================================
// PERSISTENT STORE CREATOR
//======================================================================

function createPersistentStore(key, startValue, validator = null) {
  let initialValue = startValue;

  if (isBrowser) {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      try {
        const parsedValue = JSON.parse(storedValue);
        if (validator ? validator(parsedValue) : true) {
          initialValue = parsedValue;
        }
      } catch (error) {
        console.warn(
          `Gagal mem-parsing nilai dari localStorage untuk kunci "${key}", menggunakan nilai awal.`,
          error,
        );
        initialValue = startValue;
      }
    }
  }

  const store = writable(initialValue);

  store.subscribe((value) => {
    if (isBrowser) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(
          `Gagal menyimpan ke localStorage untuk kunci "${key}":`,
          error,
        );
      }
    }
  });

  return store;
}

//======================================================================
// VALIDATORS
//======================================================================

const validateTheme = (value) =>
  typeof value === "string" &&
  ["light", "dark", "retro", "high-contrast", "blue-light"].includes(value);

const validateLanguage = (value) =>
  typeof value === "string" && ["id", "en", "jp", "kr", "ar"].includes(value);

const validateFontSize = (value) =>
  typeof value === "number" && value >= 75 && value <= 150;

const validateBoolean = (value) => typeof value === "boolean";

//======================================================================
// MAIN SETTINGS STORES
//======================================================================

export const theme = createPersistentStore(
  "a11y-theme",
  "light",
  validateTheme,
);

export const language = createPersistentStore(
  "a11y-language",
  "id",
  validateLanguage,
);

export const fontSize = createPersistentStore(
  "a11y-fontSize",
  100,
  validateFontSize,
);

export const reducedMotion = createPersistentStore(
  "a11y-reducedMotion",
  false,
  validateBoolean,
);

export const highContrast = createPersistentStore(
  "a11y-highContrast",
  false,
  validateBoolean,
);

export const focusVisible = createPersistentStore(
  "a11y-focusVisible",
  true,
  validateBoolean,
);

//======================================================================
// SYSTEM PREFERENCES
//======================================================================

export const systemPreferences = writable({
  prefersColorScheme: "light",
  prefersReducedMotion: false,
});

//======================================================================
// DERIVED STORES
//======================================================================

export const effectiveTheme = derived(
  [theme, systemPreferences],
  ([$theme, $systemPreferences]) => {
    return $theme;
  },
);

export const effectiveMotion = derived(
  [reducedMotion, systemPreferences],
  ([$reducedMotion, $systemPreferences]) => {
    return $reducedMotion || $systemPreferences.prefersReducedMotion;
  },
);

//======================================================================
// APPLY SETTINGS TO DOM
//======================================================================

/**
 * Apply theme to document body
 * @param {string} themeName - Theme name (light, dark, retro, high-contrast, blue-light)
 */
export function applyTheme(themeName) {
  if (!isBrowser) return;

  const body = document.body;
  const validThemes = ["light", "dark", "retro", "high-contrast", "blue-light"];

  // Remove all theme classes
  validThemes.forEach((t) => body.classList.remove(`theme-${t}`));

  // Add new theme class
  if (validThemes.includes(themeName)) {
    body.classList.add(`theme-${themeName}`);
  } else {
    body.classList.add("theme-light"); // fallback
  }
}

/**
 * Apply language to document
 * @param {string} lang - Language code (id, en, jp, kr, ar)
 */
export function applyLanguage(lang) {
  if (!isBrowser) return;

  const html = document.documentElement;
  const validLanguages = ["id", "en", "jp", "kr", "ar"];

  if (validLanguages.includes(lang)) {
    html.setAttribute("lang", lang);

    // Set direction for RTL languages
    if (lang === "ar") {
      html.setAttribute("dir", "rtl");
    } else {
      html.setAttribute("dir", "ltr");
    }
  }
}

/**
 * Apply font size to document
 * @param {number} size - Font size percentage (75-150)
 */
export function applyFontSize(size) {
  if (!isBrowser) return;

  const root = document.documentElement;
  const boundedSize = Math.max(75, Math.min(150, size));
  root.style.fontSize = `${boundedSize}%`;
}

/**
 * Apply motion preference
 * @param {boolean} reduced - Whether to reduce motion
 */
export function applyMotionPreference(reduced) {
  if (!isBrowser) return;

  const body = document.body;
  if (reduced) {
    body.classList.add("reduced-motion");
  } else {
    body.classList.remove("reduced-motion");
  }
}

/**
 * Apply high contrast mode
 * @param {boolean} enabled - Whether high contrast is enabled
 */
export function applyHighContrast(enabled) {
  if (!isBrowser) return;

  const body = document.body;
  if (enabled) {
    body.classList.add("high-contrast-mode");
  } else {
    body.classList.remove("high-contrast-mode");
  }
}

/**
 * Apply focus visible mode
 * @param {boolean} enabled - Whether focus visible is enabled
 */
export function applyFocusVisible(enabled) {
  if (!isBrowser) return;

  const body = document.body;
  if (enabled) {
    body.classList.add("focus-visible");
  } else {
    body.classList.remove("focus-visible");
  }
}

//======================================================================
// SUBSCRIBE TO STORES AND AUTO-APPLY
//======================================================================

// Auto-apply theme changes
if (isBrowser) {
  theme.subscribe(applyTheme);
  language.subscribe(applyLanguage);
  fontSize.subscribe(applyFontSize);
  reducedMotion.subscribe(applyMotionPreference);
  highContrast.subscribe(applyHighContrast);
  focusVisible.subscribe(applyFocusVisible);
}

//======================================================================
// RESET FUNCTION
//======================================================================

export const resetAllSettings = () => {
  theme.set("light");
  language.set("id");
  fontSize.set(100);
  reducedMotion.set(false);
  highContrast.set(false);
  focusVisible.set(true);
  a11yUtils.announce("Semua pengaturan aksesibilitas telah direset", "polite");
};
