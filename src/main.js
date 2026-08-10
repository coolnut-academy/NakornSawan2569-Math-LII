import { initTheme } from './ui/theme.js';
import { initLiiBuilder } from './modules/01-lii-builder.js';
import { initHomographyLab } from './modules/02-homography-lab.js';
import { initErrorBound } from './modules/03-error-bound.js';
import { initMonteCarlo } from './modules/04-monte-carlo.js';
import { initReproduce18 } from './modules/05-reproduce-18.js';
import { initOwnerMode } from './modules/06-owner-mode.js';
import { initLiveDemo, loadSampleDentalModelPhoto } from './modules/07-live-demo.js';
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

  function triggerPresetDemo() {
    // 1. Open all beginner guides
    document.querySelectorAll('.guide-box').forEach((box) => {
      box.hidden = false;
      if (window.renderMathInElement) {
        window.renderMathInElement(box, {
          delims: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false }
          ]
        });
      }
    });

    // 2. Pre-load dental cast model photo & compute DLT
    loadSampleDentalModelPhoto();

    // 3. Smooth scroll to Live Demo
    const sec = document.getElementById('livedemo');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }

  const globalPresetBtn = document.getElementById('globalPresetBtn');
  const heroPresetBtn = document.getElementById('heroPresetBtn');

  if (globalPresetBtn) globalPresetBtn.addEventListener('click', triggerPresetDemo);
  if (heroPresetBtn) heroPresetBtn.addEventListener('click', triggerPresetDemo);

  // Bind Beginner Guide Toggle Buttons
  document.querySelectorAll('[data-guide-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.guideToggle;
      const box = document.getElementById(targetId);
      if (box) {
        box.hidden = !box.hidden;
        if (!box.hidden && window.renderMathInElement) {
          window.renderMathInElement(box, {
            delims: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false }
            ]
          });
        }
      }
    });
  });

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
