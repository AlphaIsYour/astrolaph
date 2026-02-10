<!-- src/components/AccessibilityWidget.svelte - FIXED & ENHANCED VERSION -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { 
    theme, 
    language, 
    fontSize, 
    reducedMotion, 
    highContrast, 
    focusVisible, 
    effectiveTheme, 
    effectiveMotion, 
    systemPreferences,
    announcements, 
    a11yUtils,
    resetAllSettings 
  } from '../stores.js';
  import { t } from '../i18n.js';

  let isPopupOpen = false;
  let activeTab = 'display';
  let widget;
  let popupElement;
  let destroyFocusTrap;
  let uniqueId = a11yUtils.generateId('accessibility-widget');

  // Enhanced theme options
  const themes = [
    { id: 'light', icon: 'sun', labelKey: 'themeLight', descKey: 'themeLightDesc' },
    { id: 'dark', icon: 'moon', labelKey: 'themeDark', descKey: 'themeDarkDesc' },
    { id: 'retro', icon: 'cassette', labelKey: 'themeRetro', descKey: 'themeRetroDesc' },
    { id: 'high-contrast', icon: 'contrast', labelKey: 'themeHighContrast', descKey: 'themeHighContrastDesc' },
    { id: 'blue-light', icon: 'shield', labelKey: 'themeBlueLight', descKey: 'themeBlueLightDesc' }
  ];

  const languages = [
    { id: 'id', label: 'ID', nameKey: 'languageIndonesian', rtl: false },
    { id: 'en', label: 'EN', nameKey: 'languageEnglish', rtl: false },
    { id: 'jp', label: 'JP', nameKey: 'languageJapanese', rtl: false },
    { id: 'kr', label: 'KR', nameKey: 'languageKorean', rtl: false },
    { id: 'ar', label: 'AR', nameKey: 'languageArabic', rtl: true }
  ];

  const tabs = [
    { id: 'display', labelKey: 'display', icon: 'palette' },
    { id: 'motion', labelKey: 'motion', icon: 'animation' },
    { id: 'text', labelKey: 'text', icon: 'type' },
    { id: 'interaction', labelKey: 'interaction', icon: 'touch' }
  ];

  // Keyboard navigation
  function handleWidgetKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePopup();
    }
    if (event.key === 'Escape' && isPopupOpen) {
      event.preventDefault();
      closePopup();
    }
  }

  function handlePopupKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePopup();
    }
  }

  function togglePopup() {
    isPopupOpen = !isPopupOpen;
    
    if (isPopupOpen) {
      a11yUtils.announce(t('accessibility', $language) + ' panel opened', 'polite');
      setTimeout(() => {
        if (popupElement) {
          destroyFocusTrap = a11yUtils.setFocusTrap(popupElement);
        }
      }, 100);
    } else {
      a11yUtils.announce(t('accessibility', $language) + ' panel closed', 'polite');
      if (destroyFocusTrap) {
        destroyFocusTrap();
        destroyFocusTrap = null;
      }
      widget?.focus();
    }
  }

  function closePopup() {
    isPopupOpen = false;
    a11yUtils.announce(t('accessibility', $language) + ' panel closed', 'polite');
    if (destroyFocusTrap) {
      destroyFocusTrap();
      destroyFocusTrap = null;
    }
    widget?.focus();
  }

  // Font size controls
  function changeFontSize(amount) {
    fontSize.update(currentSize => {
      const newSize = currentSize + amount;
      const boundedSize = Math.max(75, Math.min(150, newSize));
      
      if (boundedSize !== currentSize) {
        a11yUtils.announce(`${t('fontSize', $language)} ${boundedSize}%`, 'polite');
      }
      
      return boundedSize;
    });
  }

  function resetFontSize() {
    fontSize.set(100);
    a11yUtils.announce(`${t('fontSize', $language)} reset to 100%`, 'polite');
  }

  // Theme change handler
  function changeTheme(newTheme) {
    theme.set(newTheme);
    const themeObj = themes.find(t => t.id === newTheme);
    const themeName = themeObj ? t(themeObj.labelKey, $language) : newTheme;
    a11yUtils.announce(`${t('theme', $language)}: ${themeName}`, 'polite');
  }

  // Language change handler
  function changeLanguage(newLang) {
    language.set(newLang);
    const langObj = languages.find(l => l.id === newLang);
    const langName = langObj ? t(langObj.nameKey, newLang) : newLang;
    a11yUtils.announce(`${t('language', $language)}: ${langName}`, 'polite');
  }

  // Advanced accessibility toggles
  function toggleReducedMotion() {
    reducedMotion.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? t('reducedMotion', $language) + ' ON' : t('reducedMotion', $language) + ' OFF', 
        'polite'
      );
      return newValue;
    });
  }

  function toggleHighContrast() {
    highContrast.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? t('highContrast', $language) + ' ON' : t('highContrast', $language) + ' OFF', 
        'polite'
      );
      return newValue;
    });
  }

  function toggleFocusVisible() {
    focusVisible.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? t('focusIndicator', $language) + ' ON' : t('focusIndicator', $language) + ' OFF', 
        'polite'
      );
      return newValue;
    });
  }

  // Click outside to close
  function handleClickOutside(event) {
    if (isPopupOpen && popupElement && !popupElement.contains(event.target) && !widget.contains(event.target)) {
      closePopup();
    }
  }

  onMount(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside, true);
      
      // Detect system preferences changes
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const handleSystemChange = () => {
        systemPreferences.set({
          prefersColorScheme: prefersDark.matches ? 'dark' : 'light',
          prefersReducedMotion: prefersReducedMotion.matches
        });
      };

      handleSystemChange();
      
      prefersDark.addEventListener('change', handleSystemChange);
      prefersReducedMotion.addEventListener('change', handleSystemChange);
      
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
        prefersDark.removeEventListener('change', handleSystemChange);
        prefersReducedMotion.removeEventListener('change', handleSystemChange);
        if (destroyFocusTrap) {
          destroyFocusTrap();
        }
      };
    }
  });

  onDestroy(() => {
    if (destroyFocusTrap) {
      destroyFocusTrap();
    }
  });
</script>

<!-- Enhanced SVG Icon Library -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="icon-accessibility" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
    </symbol>
    <symbol id="icon-sun" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.64 5.64c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.06 1.06c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L5.64 5.64zm12.73 12.73c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.06 1.06c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.06-1.06zM18.36 5.64l-1.06 1.06c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.06-1.06c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0zM6.7 17.3l-1.06 1.06c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.06-1.06c.39-.39.39-1.02 0-1.41-.39-.38-1.03-.38-1.41 0z"/>
    </symbol>
    <symbol id="icon-moon" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.64-.11 2.41-.31-1.1-1.52-1.8-3.32-1.8-5.19 0-4.42 3.58-8 8-8 .46 0 .91.04 1.35.12-2.31-2.65-5.5-4.32-9.06-4.62z"/>
    </symbol>
    <symbol id="icon-cassette" viewBox="0 0 24 24">
      <path fill="currentColor" d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7.5 16C6.67 16 6 15.33 6 14.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S17.33 16 16.5 16z"/>
    </symbol>
    <symbol id="icon-contrast" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/>
    </symbol>
    <symbol id="icon-shield" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
    </symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </symbol>
    <symbol id="icon-animation" viewBox="0 0 24 24">
      <path fill="currentColor" d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
    </symbol>
    <symbol id="icon-type" viewBox="0 0 24 24">
      <path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4z"/>
    </symbol>
    <symbol id="icon-touch" viewBox="0 0 24 24">
      <path fill="currentColor" d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>
    </symbol>
    <symbol id="icon-close" viewBox="0 0 24 24">
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </symbol>
  </defs>
</svg>

<!-- Screen Reader Announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {#each $announcements as announcement (announcement.id)}
    <div>{announcement.message}</div>
  {/each}
</div>

<!-- Main Widget Container -->
<div class="widget-container" bind:this={widget}>
  <!-- Widget Button -->
  <button
    class="widget-button"
    on:click={togglePopup}
    on:keydown={handleWidgetKeydown}
    aria-label={t('accessibility', $language)}
    aria-expanded={isPopupOpen}
    aria-controls={uniqueId}
    tabindex="0"
  >
    <svg class="widget-icon" aria-hidden="true">
      <use href="#icon-accessibility" />
    </svg>
  </button>

  <!-- Popup Panel -->
  {#if isPopupOpen}
    <div
      class="popup"
      bind:this={popupElement}
      on:keydown={handlePopupKeydown}
      id={uniqueId}
      role="dialog"
      aria-modal="true"
      aria-label={t('accessibility', $language)}
      transition:fly={{ y: 20, duration: 300 }}
    >
      <!-- Header -->
      <div class="popup-header">
        <h2 class="popup-title">{t('accessibility', $language)}</h2>
        <button
          class="close-button"
          on:click={closePopup}
          aria-label="Close"
        >
          <svg class="icon" aria-hidden="true">
            <use href="#icon-close" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs" role="tablist">
        {#each tabs as tab}
          <button
            class="tab"
            class:active={activeTab === tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            on:click={() => activeTab = tab.id}
          >
            <svg class="tab-icon" aria-hidden="true">
              <use href={`#icon-${tab.icon}`} />
            </svg>
            <span class="tab-label">{t(tab.labelKey, $language)}</span>
          </button>
        {/each}
      </div>

      <!-- Tab Panels -->
      <div class="tab-content">
        
        <!-- DISPLAY TAB -->
        {#if activeTab === 'display'}
          <div id="panel-display" role="tabpanel" class="panel" transition:fade={{ duration: 200 }}>
            
            <!-- Theme Selection -->
            <div class="section">
              <h3 class="section-title">{t('theme', $language)}</h3>
              <div class="theme-grid">
                {#each themes as themeOption}
                  <button
                    class="theme-card"
                    class:active={$theme === themeOption.id}
                    on:click={() => changeTheme(themeOption.id)}
                    aria-label={t(themeOption.labelKey, $language)}
                  >
                    <svg class="theme-icon" aria-hidden="true">
                      <use href={`#icon-${themeOption.icon}`} />
                    </svg>
                    <span class="theme-name">{t(themeOption.labelKey, $language)}</span>
                    <span class="theme-desc">{t(themeOption.descKey, $language)}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Language Selection -->
            <div class="section">
              <h3 class="section-title">{t('language', $language)}</h3>
              <div class="language-grid">
                {#each languages as lang}
                  <button
                    class="lang-card"
                    class:active={$language === lang.id}
                    class:rtl={lang.rtl}
                    on:click={() => changeLanguage(lang.id)}
                    aria-label={t(lang.nameKey, $language)}
                  >
                    <span class="lang-code">{lang.label}</span>
                    <span class="lang-name">{t(lang.nameKey, $language)}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- MOTION TAB -->
        {#if activeTab === 'motion'}
          <div id="panel-motion" role="tabpanel" class="panel" transition:fade={{ duration: 200 }}>
            
            <div class="section">
              <div class="toggle-item">
                <div class="toggle-info">
                  <span class="toggle-label">{t('reducedMotion', $language)}</span>
                  <span class="toggle-desc">Reduce animations and transitions</span>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={$reducedMotion}
                    on:change={toggleReducedMotion}
                    aria-label={t('reducedMotion', $language)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="info-panel">
              <h4>System Preferences</h4>
              <div class="system-info">
                <div class="info-item">
                  <span>Prefers Motion:</span>
                  <span class="info-value">
                    {$systemPreferences.prefersReducedMotion ? 'Reduced' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- TEXT TAB -->
        {#if activeTab === 'text'}
          <div id="panel-text" role="tabpanel" class="panel" transition:fade={{ duration: 200 }}>
            
            <div class="section">
              <h3 class="section-title">{t('fontSize', $language)}</h3>
              
              <!-- Font Size Buttons -->
              <div class="font-controls">
                <button
                  class="font-btn"
                  on:click={() => changeFontSize(-10)}
                  disabled={$fontSize <= 75}
                  aria-label="Decrease font size"
                >
                  A-
                </button>
                
                <div class="font-display">
                  <span class="font-percentage">{$fontSize}%</span>
                  <button
                    class="reset-btn"
                    on:click={resetFontSize}
                    disabled={$fontSize === 100}
                    aria-label="Reset font size"
                  >
                    Reset
                  </button>
                </div>
                
                <button
                  class="font-btn"
                  on:click={() => changeFontSize(10)}
                  disabled={$fontSize >= 150}
                  aria-label="Increase font size"
                >
                  A+
                </button>
              </div>

              <!-- Font Size Slider -->
              <div class="slider-control">
                <input
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  value={$fontSize}
                  on:input={(e) => fontSize.set(parseInt(e.target.value))}
                  class="font-slider"
                  aria-label={t('fontSize', $language)}
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- INTERACTION TAB -->
        {#if activeTab === 'interaction'}
          <div id="panel-interaction" role="tabpanel" class="panel" transition:fade={{ duration: 200 }}>
            
            <div class="section">
              <div class="toggle-item">
                <div class="toggle-info">
                  <span class="toggle-label">{t('highContrast', $language)}</span>
                  <span class="toggle-desc">Increase contrast for better visibility</span>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={$highContrast}
                    on:change={toggleHighContrast}
                    aria-label={t('highContrast', $language)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="toggle-item">
                <div class="toggle-info">
                  <span class="toggle-label">{t('focusIndicator', $language)}</span>
                  <span class="toggle-desc">Show enhanced focus indicators</span>
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={$focusVisible}
                    on:change={toggleFocusVisible}
                    aria-label={t('focusIndicator', $language)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Reset Button -->
            <div class="section">
              <div class="quick-actions">
                <button
                  class="action-btn secondary"
                  on:click={resetAllSettings}
                >
                  {t('resetSettings', $language)}
                </button>
              </div>
            </div>
          </div>
        {/if}

      </div>
    </div>
  {/if}
</div>

<style>
  /* ============================================
     BASE STYLES
     ============================================ */
  
  * {
    box-sizing: border-box;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ============================================
     WIDGET CONTAINER
     ============================================ */
  
  .widget-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* ============================================
     WIDGET BUTTON
     ============================================ */
  
  .widget-button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-color, #3b82f6);
    border: none;
    box-shadow: var(--shadow-heavy, 0 4px 12px rgba(0, 0, 0, 0.15));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: white;
  }

  .widget-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .widget-button:focus {
    outline: 3px solid var(--accent-color, #3b82f6);
    outline-offset: 2px;
  }

  .widget-icon {
    width: 28px;
    height: 28px;
  }

  /* ============================================
     POPUP PANEL
     ============================================ */
  
  .popup {
    position: absolute;
    bottom: 70px;
    right: 0;
    width: 400px;
    max-height: 600px;
    background: var(--bg-primary, #ffffff);
    border-radius: 16px;
    box-shadow: var(--shadow-heavy, 0 10px 40px rgba(0, 0, 0, 0.2));
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color, #e5e5e5);
  }

  /* ============================================
     HEADER
     ============================================ */
  
  .popup-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color, #e5e5e5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-secondary, #f8f9fa);
  }

  .popup-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary, #212529);
  }

  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    color: var(--text-secondary, #6c757d);
  }

  .close-button:hover {
    background: var(--bg-tertiary, #e9ecef);
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  /* ============================================
     TABS
     ============================================ */
  
  .tabs {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: var(--bg-secondary, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #e5e5e5);
    overflow-x: auto;
  }

  .tab {
    flex: 1;
    min-width: 80px;
    padding: 10px 8px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
    color: var(--text-secondary, #6c757d);
  }

  .tab:hover {
    background: var(--bg-tertiary, #e9ecef);
  }

  .tab.active {
    background: var(--accent-color, #3b82f6);
    color: white;
  }

  .tab-icon {
    width: 20px;
    height: 20px;
  }

  .tab-label {
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* ============================================
     TAB CONTENT
     ============================================ */
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #212529);
  }

  /* ============================================
     THEME GRID
     ============================================ */
  
  .theme-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: var(--bg-secondary, #f8f9fa);
    border: 2px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary, #212529);
  }

  .theme-card:hover {
    border-color: var(--accent-color, #3b82f6);
    transform: translateY(-2px);
  }

  .theme-card.active {
    border-color: var(--accent-color, #3b82f6);
    background: var(--accent-color, #3b82f6);
    color: white;
  }

  .theme-card.active .theme-desc {
    color: rgba(255, 255, 255, 0.8);
  }

  .theme-icon {
    width: 32px;
    height: 32px;
  }

  .theme-name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .theme-desc {
    font-size: 0.75rem;
    color: var(--text-tertiary, #adb5bd);
    text-align: center;
  }

  /* ============================================
     TOGGLE SWITCH
     ============================================ */
  
  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 12px;
  }

  .toggle-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toggle-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary, #212529);
  }

  .toggle-desc {
    font-size: 0.75rem;
    color: var(--text-tertiary, #adb5bd);
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 28px;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--border-color, #e5e5e5);
    transition: 0.3s;
    border-radius: 28px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background: var(--accent-color, #3b82f6);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  /* ============================================
     FONT CONTROLS
     ============================================ */
  
  .font-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 12px;
  }

  .font-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid var(--border-color, #e5e5e5);
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #212529);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .font-btn:hover:not(:disabled) {
    border-color: var(--accent-color, #3b82f6);
    transform: scale(1.05);
  }

  .font-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .font-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .font-percentage {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent-color, #3b82f6);
  }

  .reset-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    background: none;
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 4px;
    color: var(--text-secondary, #6c757d);
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover:not(:disabled) {
    border-color: var(--accent-color, #3b82f6);
    color: var(--accent-color, #3b82f6);
  }

  .reset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ============================================
     FONT SLIDER
     ============================================ */
  
  .slider-control {
    margin-top: 8px;
  }

  .font-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--border-color, #e5e5e5);
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .font-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-color, #3b82f6);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  }

  .font-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .font-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-color, #3b82f6);
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
  }

  .font-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
  }

  /* ============================================
     LANGUAGE GRID
     ============================================ */
  
  .language-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .lang-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 16px 8px;
    background: var(--bg-secondary, #f8f9fa);
    border: 2px solid var(--border-color, #e5e5e5);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary, #212529);
  }

  .lang-card:hover {
    border-color: var(--accent-color, #3b82f6);
    transform: translateY(-2px);
  }

  .lang-card.active {
    border-color: var(--accent-color, #3b82f6);
    background: var(--accent-color, #3b82f6);
    color: white;
  }

  .lang-card.active .lang-name {
    color: white;
  }

  .lang-code {
    font-size: 1rem;
    font-weight: 700;
  }

  .lang-name {
    font-size: 0.75rem;
    color: var(--text-secondary, #6c757d);
  }

  .lang-card.rtl {
    direction: rtl;
  }

  /* ============================================
     INFO PANELS
     ============================================ */
  
  .info-panel {
    padding: 16px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 12px;
    border-left: 4px solid var(--accent-color, #3b82f6);
  }

  .info-panel h4 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #212529);
  }

  .system-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .info-value {
    font-weight: 600;
    color: var(--accent-color, #3b82f6);
    text-transform: capitalize;
  }

  /* ============================================
     QUICK ACTIONS
     ============================================ */
  
  .quick-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid;
    width: 100%;
    font-size: 0.875rem;
  }

  .action-btn.secondary {
    background: transparent;
    color: var(--accent-color, #3b82f6);
    border-color: var(--accent-color, #3b82f6);
  }

  .action-btn.secondary:hover {
    background: var(--accent-color, #3b82f6);
    color: white;
  }

  /* ============================================
     RESPONSIVE DESIGN
     ============================================ */
  
  @media (max-width: 480px) {
    .popup {
      width: calc(100vw - 20px);
      right: 10px;
      bottom: 10px;
      max-height: calc(100vh - 20px);
    }
    
    .widget-container {
      bottom: 10px;
      right: 10px;
    }

    .theme-grid {
      grid-template-columns: 1fr;
    }

    .language-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ============================================
     PRINT STYLES
     ============================================ */
  
  @media print {
    .widget-container {
      display: none;
    }
  }
</style>