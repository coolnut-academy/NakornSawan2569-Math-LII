// Main JS entry point bootstrapping theme, all 7 modules, and automated self-tests
import { initTheme } from './ui/theme.js';
import { initLiiBuilder } from './modules/01-lii-builder.js';
import { initHomographyLab } from './modules/02-homography-lab.js';
import { initErrorBound } from './modules/03-error-bound.js';
import { initMonteCarlo } from './modules/04-monte-carlo.js';
import { initReproduce18 } from './modules/05-reproduce-18.js';
import { initOwnerMode } from './modules/06-owner-mode.js';
import { initLiveDemo } from './modules/07-live-demo.js';
import { runSelfTests } from './tests/self-tests.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme System
  initTheme();

  // Initialize Modules 01-07
  initLiiBuilder();
  initHomographyLab();
  initErrorBound();
  initMonteCarlo();
  initReproduce18();
  initOwnerMode();
  initLiveDemo();

  // Run Self-Tests if URL query param ?debug=1 is set
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    const tests = runSelfTests();
    const panel = document.getElementById('debugPanel');
    if (panel) {
      panel.style.display = 'block';
      const passed = tests.filter((t) => t.ok).length;
      panel.innerHTML =
        `<strong>Self-tests: ${passed}/${tests.length} passed</strong><br><br>` +
        tests
          .map(
            (t) =>
              `<div style="color:${t.ok ? '#4ade80' : '#f87171'}">${t.ok ? '✓' : '✗'} ${t.name}${t.err ? ' — ' + t.err : ''}</div>`
          )
          .join('');
    }
  }
});
