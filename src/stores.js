// src/stores.js (FINAL CORRECTED VERSION)
import { writable, derived } from "svelte/store";

//======================================================================
// BAGIAN YANG HILANG (DIPERLUKAN OLEH AccessibilityWidget.svelte)
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
      // Hapus pengumuman lama setelah beberapa saat agar tidak menumpuk
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
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    // Kembalikan fungsi untuk cleanup
    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  },
};

//======================================================================
// LOGIKA STORE PERSISTEN ANDA (SUDAH DIPERBAIKI)
//======================================================================

const isBrowser = typeof window !== "undefined";

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
          error
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
          error
        );
      }
    }
  });

  return store;
}

// Validator functions
const validateTheme = (value) =>
  typeof value === "string" &&
  ["light", "dark", "retro", "high-contrast", "blue-light"].includes(value);
const validateLanguage = (value) =>
  typeof value === "string" && ["id", "en", "jp", "kr", "ar"].includes(value);
const validateFontSize = (value) =>
  typeof value === "number" && value >= 75 && value <= 150;
const validateBoolean = (value) => typeof value === "boolean";

// Main settings stores
export const theme = createPersistentStore(
  "a11y-theme",
  "light",
  validateTheme
);
export const language = createPersistentStore(
  "a11y-language",
  "id",
  validateLanguage
);
export const fontSize = createPersistentStore(
  "a11y-fontSize",
  100,
  validateFontSize
);
export const reducedMotion = createPersistentStore(
  "a11y-reducedMotion",
  false,
  validateBoolean
);
export const highContrast = createPersistentStore(
  "a11y-highContrast",
  false,
  validateBoolean
);
export const focusVisible = createPersistentStore(
  "a11y-focusVisible",
  true,
  validateBoolean
);

// System preferences store
export const systemPreferences = writable({
  prefersColorScheme: "light",
  prefersReducedMotion: false,
});

// Derived stores to combine user settings with system preferences
export const effectiveTheme = derived(
  [theme, systemPreferences],
  ([$theme, $systemPreferences]) => {
    // Jika tema diset ke 'sistem', gunakan preferensi sistem.
    // Untuk saat ini, kita akan langsung menggunakan tema yang dipilih.
    return $theme;
  }
);

export const effectiveMotion = derived(
  [reducedMotion, systemPreferences],
  ([$reducedMotion, $systemPreferences]) => {
    return $reducedMotion || $systemPreferences.prefersReducedMotion;
  }
);

// Function to reset all settings to their defaults
export const resetAllSettings = () => {
  theme.set("light");
  language.set("id");
  fontSize.set(100);
  reducedMotion.set(false);
  highContrast.set(false);
  focusVisible.set(true);
  a11yUtils.announce("Semua pengaturan aksesibilitas telah direset", "polite");
};
