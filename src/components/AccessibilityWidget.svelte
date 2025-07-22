<!-- src/components/AccessibilityWidget.svelte - Modern Complex Version -->
<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { 
    theme, language, fontSize, reducedMotion, highContrast, 
    focusVisible, effectiveTheme, effectiveMotion, systemPreferences,
    announcements, a11yUtils 
  } from '../stores.js';

  const dispatch = createEventDispatcher();
  
  let isPopupOpen = false;
  let activeTab = 'display';
  let widget;
  let popupElement;
  let destroyFocusTrap;
  let uniqueId = a11yUtils.generateId('accessibility-widget');

  // Enhanced theme options
  const themes = [
    { id: 'light', icon: 'sun', label: 'Terang', desc: 'Mode terang standar' },
    { id: 'dark', icon: 'moon', label: 'Gelap', desc: 'Mode gelap untuk mata' },
    { id: 'retro', icon: 'cassette', label: 'Retro', desc: 'Gaya vintage klasik' },
    { id: 'high-contrast', icon: 'contrast', label: 'Kontras Tinggi', desc: 'Untuk aksesibilitas visual' },
    { id: 'blue-light', icon: 'shield', label: 'Filter Biru', desc: 'Kurangi cahaya biru' }
  ];

  const languages = [
    { id: 'id', label: 'ID', name: 'Bahasa Indonesia', rtl: false },
    { id: 'en', label: 'EN', name: 'English', rtl: false },
    { id: 'jp', label: 'JP', name: '日本語', rtl: false },
    { id: 'kr', label: 'KR', name: '한국어', rtl: false },
    { id: 'ar', label: 'AR', name: 'العربية', rtl: true }
  ];

  const tabs = [
    { id: 'display', label: 'Tampilan', icon: 'palette' },
    { id: 'motion', label: 'Gerak', icon: 'animation' },
    { id: 'text', label: 'Teks', icon: 'type' },
    { id: 'interaction', label: 'Interaksi', icon: 'touch' }
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
    if (event.key === 'Tab') {
      // Focus trap is handled by a11yUtils.setFocusTrap
    }
  }

  function togglePopup() {
    isPopupOpen = !isPopupOpen;
    
    if (isPopupOpen) {
      a11yUtils.announce('Panel aksesibilitas dibuka', 'polite');
      // Set focus trap after transition
      setTimeout(() => {
        if (popupElement) {
          destroyFocusTrap = a11yUtils.setFocusTrap(popupElement);
        }
      }, 100);
    } else {
      a11yUtils.announce('Panel aksesibilitas ditutup', 'polite');
      if (destroyFocusTrap) {
        destroyFocusTrap();
        destroyFocusTrap = null;
      }
      widget?.focus();
    }
  }

  function closePopup() {
    isPopupOpen = false;
    a11yUtils.announce('Panel aksesibilitas ditutup', 'polite');
    if (destroyFocusTrap) {
      destroyFocusTrap();
      destroyFocusTrap = null;
    }
    widget?.focus();
  }

  // Font size controls with bounds checking
  function changeFontSize(amount) {
    fontSize.update(currentSize => {
      const newSize = currentSize + amount;
      const boundedSize = Math.max(75, Math.min(150, newSize));
      
      if (boundedSize !== currentSize) {
        a11yUtils.announce(`Ukuran font diubah ke ${boundedSize}%`, 'polite');
      }
      
      return boundedSize;
    });
  }

  function resetFontSize() {
    fontSize.set(100);
    a11yUtils.announce('Ukuran font direset ke default', 'polite');
  }

  // Theme change handler
  function changeTheme(newTheme) {
    theme.set(newTheme);
    const themeName = themes.find(t => t.id === newTheme)?.label || newTheme;
    a11yUtils.announce(`Tema diubah ke ${themeName}`, 'polite');
  }

  // Language change handler
  function changeLanguage(newLang) {
    language.set(newLang);
    const langName = languages.find(l => l.id === newLang)?.name || newLang;
    a11yUtils.announce(`Bahasa diubah ke ${langName}`, 'polite');
    
    // Update document lang and dir attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
      const langConfig = languages.find(l => l.id === newLang);
      document.documentElement.dir = langConfig?.rtl ? 'rtl' : 'ltr';
    }
  }

  // Advanced accessibility toggles
  function toggleReducedMotion() {
    reducedMotion.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? 'Animasi dikurangi' : 'Animasi normal', 
        'polite'
      );
      return newValue;
    });
  }

  function toggleHighContrast() {
    highContrast.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? 'Kontras tinggi diaktifkan' : 'Kontras normal', 
        'polite'
      );
      return newValue;
    });
  }

  function toggleFocusVisible() {
    focusVisible.update(current => {
      const newValue = !current;
      a11yUtils.announce(
        newValue ? 'Indikator fokus ditampilkan' : 'Indikator fokus disembunyikan', 
        'polite'
      );
      return newValue;
    });
  }

  // Apply CSS custom properties
  $: if (typeof document !== 'undefined') {
    applyThemeStyles($effectiveTheme, $fontSize, $effectiveMotion, $highContrast, $focusVisible);
  }

  function applyThemeStyles(currentTheme, currentFontSize, motionReduced, contrastHigh, focusVis) {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes before adding the new one
    themes.forEach(t => body.classList.remove(`theme-${t.id}`));
    body.classList.add(`theme-${currentTheme}`);
    
    // Apply font size
    root.style.fontSize = `${currentFontSize}%`;
    
    // Apply motion preferences
    if (motionReduced) {
      root.style.setProperty('--motion-duration', '0.01s');
      root.style.setProperty('--motion-easing', 'linear');
    } else {
      root.style.removeProperty('--motion-duration');
      root.style.removeProperty('--motion-easing');
    }
    
    // Apply focus visibility
    if (focusVis) {
      body.classList.add('focus-visible');
    } else {
      body.classList.remove('focus-visible');
    }
    
    // High contrast overrides
    if (contrastHigh) {
      body.classList.add('high-contrast-mode');
    } else {
      body.classList.remove('high-contrast-mode');
    }
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

      handleSystemChange(); // Initial check
      
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
      <path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10.5C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10.5V11H13.8V10.5C13.8,8.7 12.8,8.2 12,8.2Z"/>
    </symbol>
    <symbol id="icon-palette" viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-.56 2.5-1.25 0-.34-.11-.67-.28-.99-.18-.51-.42-.99-.75-1.43C13.73 18.67 14 18.26 14 17.75c0-.69-.56-1.25-1.25-1.25H9.5c-4.14 0-7.5-3.36-7.5-7.5C2 4.49 6.49 2 12 2z"/>
    </symbol>
    <symbol id="icon-animation" viewBox="0 0 24 24">
      <path fill="currentColor" d="M4,2A2,2 0 0,0 2,4V11H4V4H11V2H4M22,2H15V4H22V11H24V4A2,2 0 0,0 22,2M4,13H2V20A2,2 0 0,0 4,22H11V20H4V13M22,13V20H15V22H22A2,2 0 0,0 24,20V13H22M6,6V18H18V6H6M16,16H8V8H16V16Z"/>
    </symbol>
    <symbol id="icon-type" viewBox="0 0 24 24">
      <path fill="currentColor" d="M18,20H6V18H7V7H6V5H18V7H17V18H18V20M8,8V18H10V13H14V18H16V8H8Z"/>
    </symbol>
    <symbol id="icon-touch" viewBox="0 0 24 24">
      <path fill="currentColor" d="M9,11H7V9H9V11M13,11H11V9H13V11M17,11H15V9H17V11M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
    </symbol>
  </defs>
</svg>

<!-- Accessibility Widget Container -->
<div class="widget-container">
  <!-- Main FAB Button -->
  <button 
    bind:this={widget}
    class="fab" 
    class:reduced-motion={$effectiveMotion}
    on:click={togglePopup} 
    on:keydown={handleWidgetKeydown}
    aria-label="Buka menu pengaturan aksesibilitas"
    aria-expanded={isPopupOpen}
    aria-describedby="{uniqueId}-description"
    aria-haspopup="dialog"
    type="button"
  >
    <svg width="24" height="24" aria-hidden="true">
      <use href="#icon-accessibility" />
    </svg>
    
    <!-- Status indicators -->
    {#if $highContrast || $reducedMotion || $fontSize !== 100}
      <div class="status-indicator" aria-hidden="true"></div>
    {/if}
  </button>

  <!-- Hidden description for screen readers -->
  <div id="{uniqueId}-description" class="sr-only">
    Pengaturan aksesibilitas termasuk tema, ukuran font, bahasa, dan opsi gerakan
  </div>

  <!-- Enhanced Popup Panel -->
  {#if isPopupOpen}
      <div 
      bind:this={popupElement}
      class="popup" 
      class:reduced-motion={$effectiveMotion}
      transition:fly={{ y: 20, duration: $effectiveMotion ? 0 : 300 }}
      on:keydown={handlePopupKeydown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="{uniqueId}-title"
      aria-describedby="{uniqueId}-desc"
      tabindex="-1"
    >
      <!-- Popup Header -->
      <div class="popup-header">
        <div>
          <h3 id="{uniqueId}-title">Pengaturan Aksesibilitas</h3>
          <p id="{uniqueId}-desc" class="header-description">
            Sesuaikan tampilan dan interaksi
          </p>
        </div>
        <button 
          class="close-btn" 
          on:click={closePopup}
          aria-label="Tutup panel aksesibilitas"
          type="button"
        >
          ×
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-container" role="tablist" aria-label="Kategori pengaturan">
        {#each tabs as tab (tab.id)}
          <button
            class="tab-btn"
            class:active={activeTab === tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="{uniqueId}-panel-{tab.id}"
            id="{uniqueId}-tab-{tab.id}"
            on:click={() => activeTab = tab.id}
            type="button"
          >
            <svg width="16" height="16" aria-hidden="true">
              <use href="#icon-{tab.icon}" />
            </svg>
            <span>{tab.label}</span>
          </button>
        {/each}
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Display Tab -->
        {#if activeTab === 'display'}
          <div 
            id="{uniqueId}-panel-display" 
            role="tabpanel" 
            aria-labelledby="{uniqueId}-tab-display"
            class="panel-content"
            in:fade={{ duration: 150, delay: 150 }}
            out:fade={{ duration: 150 }}
          >
            <!-- Theme Selection -->
            <div class="setting-group">
              <div class="setting-header">
                <p class="setting-label" id="theme-group-label">Mode Tema</p>
                <p class="setting-description">Pilih tema visual yang nyaman</p>
              </div>
              
              <div class="theme-grid" role="group" aria-labelledby="theme-group-label">
                {#each themes as t (t.id)}
                  <button
                    class="theme-card"
                    class:active={t.id === $theme}
                    on:click={() => changeTheme(t.id)}
                    aria-pressed={t.id === $theme}
                    aria-describedby="theme-{t.id}-desc"
                    type="button"
                  >
                    <div class="theme-icon">
                      <svg width="20" height="20" aria-hidden="true">
                        <use href="#icon-{t.icon}" />
                      </svg>
                    </div>
                    <div class="theme-content">
                      <span class="theme-name">{t.label}</span>
                      <span id="theme-{t.id}-desc" class="theme-desc">{t.desc}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <!-- High Contrast Toggle -->
            <div class="setting-group">
              <div class="setting-header">
                <label for="contrast-toggle" class="setting-label">Kontras Tinggi</label>
                <p class="setting-description" id="contrast-desc">Meningkatkan kontras untuk keterbacaan</p>
              </div>
              
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="contrast-toggle"
                  bind:checked={$highContrast}
                  on:change={toggleHighContrast}
                  aria-describedby="contrast-desc"
                />
                <span class="toggle-slider" aria-hidden="true"></span>
                <span class="toggle-text">
                  {$highContrast ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>
          </div>
        {/if}

        <!-- Motion Tab -->
        {#if activeTab === 'motion'}
          <div 
            id="{uniqueId}-panel-motion" 
            role="tabpanel" 
            aria-labelledby="{uniqueId}-tab-motion"
            class="panel-content"
            in:fade={{ duration: 150, delay: 150 }}
            out:fade={{ duration: 150 }}
          >
            <!-- Reduced Motion -->
            <div class="setting-group">
              <div class="setting-header">
                <label for="motion-toggle" class="setting-label">Kurangi Gerakan</label>
                <p class="setting-description" id="motion-desc">Mengurangi animasi dan transisi</p>
              </div>
              
              <label class="toggle-switch">
                <input 
                  type="checkbox"
                  id="motion-toggle"
                  bind:checked={$reducedMotion}
                  on:change={toggleReducedMotion}
                  aria-describedby="motion-desc"
                />
                <span class="toggle-slider" aria-hidden="true"></span>
                <span class="toggle-text">
                  {$reducedMotion ? 'Animasi dikurangi' : 'Animasi normal'}
                </span>
              </label>
            </div>

            <!-- System Preferences Info -->
            <div class="info-panel">
              <h4>Preferensi Sistem</h4>
              <div class="system-info">
                <div class="info-item">
                  <span>Tema sistem:</span>
                  <span class="info-value">{$systemPreferences.prefersColorScheme}</span>
                </div>
                <div class="info-item">
                  <span>Gerakan sistem:</span>
                  <span class="info-value">
                    {$systemPreferences.prefersReducedMotion ? 'Dikurangi' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Text Tab -->
        {#if activeTab === 'text'}
          <div 
            id="{uniqueId}-panel-text" 
            role="tabpanel" 
            aria-labelledby="{uniqueId}-tab-text"
            class="panel-content"
            in:fade={{ duration: 150, delay: 150 }}
            out:fade={{ duration: 150 }}
          >
            <!-- Font Size Control -->
            <div class="setting-group">
              <div class="setting-header">
                <p class="setting-label" id="font-size-label">Ukuran Font</p>
                <p class="setting-description">Sesuaikan ukuran teks untuk keterbacaan</p>
              </div>
              
              <div class="font-control" role="group" aria-labelledby="font-size-label">
                <button 
                  class="font-btn decrease"
                  on:click={() => changeFontSize(-5)} 
                  disabled={$fontSize <= 75}
                  aria-label="Perkecil font"
                  type="button"
                >
                  A-
                </button>
                
                <div class="font-display">
                  <span class="font-percentage" aria-live="polite">{$fontSize}%</span>
                  <button 
                    class="reset-btn"
                    on:click={resetFontSize}
                    disabled={$fontSize === 100}
                    aria-label="Reset ukuran font ke default"
                    type="button"
                  >
                    Reset
                  </button>
                </div>
                
                <button 
                  class="font-btn increase"
                  on:click={() => changeFontSize(5)} 
                  disabled={$fontSize >= 150}
                  aria-label="Perbesar font"
                  type="button"
                >
                  A+
                </button>
              </div>
              
              <!-- Font size slider for precise control -->
              <div class="slider-control">
                <label for="font-slider" class="sr-only">Kontrol presisi ukuran font</label>
                <input
                  id="font-slider"
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  bind:value={$fontSize}
                  class="font-slider"
                  aria-valuemin="75"
                  aria-valuemax="150"
                  aria-valuenow={$fontSize}
                  aria-label="Slider ukuran font dari 75% hingga 150%"
                />
              </div>
            </div>

            <!-- Language Selection -->
            <div class="setting-group">
              <div class="setting-header">
                <p class="setting-label" id="lang-group-label">Bahasa Interface</p>
                <p class="setting-description">Pilih bahasa tampilan</p>
              </div>
              
              <div class="language-grid" role="group" aria-labelledby="lang-group-label">
                {#each languages as lang (lang.id)}
                  <button
                    class="lang-card"
                    class:active={lang.id === $language}
                    class:rtl={lang.rtl}
                    on:click={() => changeLanguage(lang.id)}
                    aria-pressed={lang.id === $language}
                    type="button"
                  >
                    <span class="lang-code">{lang.label}</span>
                    <span class="lang-name">{lang.name}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Interaction Tab -->
        {#if activeTab === 'interaction'}
          <div 
            id="{uniqueId}-panel-interaction" 
            role="tabpanel" 
            aria-labelledby="{uniqueId}-tab-interaction"
            class="panel-content"
            in:fade={{ duration: 150, delay: 150 }}
            out:fade={{ duration: 150 }}
          >
            <!-- Focus Visibility -->
            <div class="setting-group">
              <div class="setting-header">
                <label for="focus-toggle" class="setting-label">Indikator Fokus</label>
                <p class="setting-description" id="focus-desc">Tampilkan border saat navigasi keyboard</p>
              </div>
              
              <label class="toggle-switch">
                <input 
                  type="checkbox"
                  id="focus-toggle"
                  bind:checked={$focusVisible}
                  on:change={toggleFocusVisible}
                  aria-describedby="focus-desc"
                />
                <span class="toggle-slider" aria-hidden="true"></span>
                <span class="toggle-text">
                  {$focusVisible ? 'Ditampilkan' : 'Disembunyikan'}
                </span>
              </label>
            </div>

            <!-- Keyboard Shortcuts Info -->
            <div class="info-panel">
              <h4>Pintasan Keyboard</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Tutup panel</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Tab</kbd>
                  <span>Navigasi elemen</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Space/Enter</kbd>
                  <span>Aktivasi tombol</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="setting-group">
              <div class="setting-header">
                <p class="setting-label">Aksi Cepat</p>
                <p class="setting-description">Reset pengaturan ke default</p>
              </div>
              
              <div class="quick-actions">
                <button 
                  class="action-btn secondary"
                  on:click={() => {
                    fontSize.set(100);
                    theme.set('light');
                    language.set('id');
                    reducedMotion.set(false);
                    highContrast.set(false);
                    focusVisible.set(true);
                    a11yUtils.announce('Semua pengaturan direset', 'polite');
                  }}
                  type="button"
                >
                  Reset Semua
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Screen Reader Announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {#each $announcements as announcement (announcement.id)}
    <div>{announcement.message}</div>
  {/each}
</div>

<style>
  /* CSS Custom Properties for Dynamic Theming */
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --accent-color: #007bff;
    --accent-hover: #0056b3;
    --border-color: rgba(0, 0, 0, 0.1);
    --border-radius: 12px;
    --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
    --shadow-heavy: 0 8px 32px rgba(0, 0, 0, 0.15);
    --widget-bg: rgba(255, 255, 255, 0.95);
    --motion-duration: 0.3s;
    --motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(body.theme-dark) {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #f0f0f0;
    --text-secondary: #b0b0b0;
    --accent-color: #3391ff;
    --accent-hover: #1976d2;
    --border-color: rgba(255, 255, 255, 0.1);
    --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.3);
    --shadow-heavy: 0 8px 32px rgba(0, 0, 0, 0.4);
    --widget-bg: rgba(30, 30, 30, 0.95);
  }

  :global(body.theme-retro) {
    --bg-primary: #fdf3e5;
    --bg-secondary: #f5e6d3;
    --text-primary: #413529;
    --text-secondary: #8b7355;
    --accent-color: #b8001f;
    --accent-hover: #8b0015;
    --border-color: rgba(65, 53, 41, 0.2);
    --widget-bg: rgba(250, 235, 215, 0.95);
    font-family: 'Courier New', Courier, monospace;
  }

  :global(body.theme-high-contrast) {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #ffffff;
    --accent-color: #ffff00;
    --accent-hover: #cccc00;
    --border-color: #ffffff;
    --widget-bg: #000000;
  }

  :global(body.theme-blue-light) {
    --bg-primary: #fff8e1;
    --bg-secondary: #fff3c4;
    --text-primary: #3e2723;
    --text-secondary: #5d4037;
    --accent-color: #ff6f00;
    --accent-hover: #e65100;
    --border-color: rgba(62, 39, 35, 0.2);
    --widget-bg: rgba(255, 248, 225, 0.95);
    filter: sepia(0.1);
  }

  :global(body) {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color var(--motion-duration) var(--motion-easing),
                color var(--motion-duration) var(--motion-easing);
  }

  /* Focus Visible Styles */
  :global(body.focus-visible *:focus-visible) {
    outline: 3px solid var(--accent-color);
    outline-offset: 2px;
  }

  :global(body:not(.focus-visible) *:focus) {
    outline: none;
  }

  /* High Contrast Mode Enhancements */
  :global(body.high-contrast-mode) {
    filter: contrast(175%);
  }
  :global(body.high-contrast-mode) * {
    background-image: none !important;
  }

  /* Reduced Motion Overrides */
  .reduced-motion,
  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Screen Reader Only Content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Widget Container */
  .widget-container {
    position: fixed;
    bottom: 20px;
    right: 0;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Enhanced FAB Button */
  .fab {
    position: relative;
    width: 50px;
    height: 64px;
    border-radius: 50% 0 0 50%;
    background: #B8001F;
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-heavy);
    cursor: pointer;
    transition: transform var(--motion-duration) var(--motion-easing),
                box-shadow var(--motion-duration) var(--motion-easing);
  }

  .fab:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }

  .fab:active {
    transform: scale(0.95) translateX(-2px);
  }

  .status-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: #ff4444;
    border-radius: 50%;
    border: 2px solid white;
  }

  /* Enhanced Popup */
  .popup {
    position: absolute;
    bottom: 75px;
    right: 0;
    width: 360px;
    max-height: calc(100vh - 100px);
    background: var(--widget-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-heavy);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Popup Header */
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color);
    background: rgba(var(--bg-secondary-rgb), 0.5);
    flex-shrink: 0;
  }

  .popup-header h3 {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .header-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--motion-duration);
  }

  .close-btn:hover {
    background-color: var(--border-color);
    color: var(--text-primary);
  }

  /* Tab Navigation */
  .tab-container {
    display: flex;
    background: rgba(var(--bg-secondary-rgb), 0.5);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--motion-duration);
    border-bottom: 3px solid transparent;
    position: relative;
  }

  .tab-btn:hover {
    color: var(--text-primary);
    background: rgba(var(--border-color), 0.5);
  }
  
  .tab-btn:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: -2px;
  }

  .tab-btn.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
    background: var(--bg-primary);
  }

  .tab-btn span {
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Tab Content */
  .tab-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .panel-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Setting Groups */
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .setting-header {
    margin-bottom: 8px;
  }

  .setting-label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .setting-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Theme Grid */
  .theme-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .theme-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--motion-duration);
    text-align: left;
    color: var(--text-primary);
  }

  .theme-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-light);
  }

  .theme-card.active {
    border-color: var(--accent-color);
    background: var(--accent-color);
  }
  .theme-card.active, .theme-card.active .theme-desc {
    color: white;
  }

  .theme-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  .theme-card.active .theme-icon {
    background: rgba(255, 255, 255, 0.1);
  }

  .theme-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .theme-name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .theme-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.9;
  }

  /* Toggle Switch */
  .toggle-switch {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 4px;
  }

  .toggle-switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--border-color);
    border-radius: 12px;
    transition: background var(--motion-duration);
    flex-shrink: 0;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform var(--motion-duration) var(--motion-easing);
  }

  .toggle-switch input:checked + .toggle-slider {
    background: var(--accent-color);
  }

  .toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(24px);
  }

  .toggle-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  /* Font Controls */
  .font-control {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
  }

  .font-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-weight: 700;
    cursor: pointer;
    transition: all var(--motion-duration);
    flex-shrink: 0;
  }

  .font-btn:hover:not(:disabled) {
    border-color: var(--accent-color);
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
    color: var(--accent-color);
  }

  .reset-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--motion-duration);
  }

  .reset-btn:hover:not(:disabled) {
    border-color: var(--accent-color);
    color: var(--accent-color);
  }

  .reset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Font Slider */
  .slider-control {
    margin-top: 8px;
  }

  .font-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--border-color);
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
    background: var(--accent-color);
    cursor: pointer;
    box-shadow: var(--shadow-light);
    transition: transform var(--motion-duration);
  }
  .font-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .font-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: none;
    transition: transform var(--motion-duration);
  }
  .font-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
  }

  /* Language Grid */
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
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--motion-duration);
    color: var(--text-primary);
  }

  .lang-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-2px);
  }

  .lang-card.active {
    border-color: var(--accent-color);
    background: var(--accent-color);
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
    color: var(--text-secondary);
  }

  .lang-card.rtl {
    direction: rtl;
  }

  /* Info Panels */
  .info-panel {
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    border-left: 4px solid var(--accent-color);
  }

  .info-panel h4 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
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
    color: var(--accent-color);
    text-transform: capitalize;
  }

  /* Keyboard Shortcuts */
  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.875rem;
  }

  kbd {
    padding: 4px 8px;
    font-size: 0.75rem;
    font-family: monospace;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 12px 24px;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--motion-duration);
    border: 2px solid;
    width: 100%;
  }

  .action-btn.secondary {
    background: transparent;
    color: var(--accent-color);
    border-color: var(--accent-color);
  }

  .action-btn.secondary:hover {
    background: var(--accent-color);
    color: white;
  }

  /* Responsive Design */
  @media (max-width: 480px) {
    .popup {
      width: calc(100vw - 20px);
      right: 10px;
      bottom: 10px;
      max-height: calc(100vh - 20px);
    }
    
    .widget-container {
      bottom: 0;
      right: -10px;
    }

    .theme-grid {
      grid-template-columns: 1fr;
    }

    .language-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Print Styles */
  @media print {
    .widget-container {
      display: none;
    }
  }
</style>