// Pure Light Theme Initialization

export function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  try {
    localStorage.removeItem('lii_lens_lab_theme');
  } catch {
    // Storage access fallback
  }
}

export function setTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
}
