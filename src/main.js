import { initTheme } from './ui/theme.js';
import { initLiiBuilder } from './modules/01-lii-builder.js';
import { initHomographyLab } from './modules/02-homography-lab.js';
import { initErrorBound } from './modules/03-error-bound.js';
import { initMonteCarlo } from './modules/04-monte-carlo.js';
import { initReproduce18 } from './modules/05-reproduce-18.js';
import { initOwnerMode } from './modules/06-owner-mode.js';
import { initLiveDemo, loadSampleDentalModelPhoto } from './modules/07-live-demo.js';
import { runSelfTests } from './tests/self-tests.js';
import { generateTargetSVG, downloadTargetSVG, downloadTargetPNG } from './core/target-generator.js';

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

  // Render Vector Target Preview on Page
  const targetBox = document.getElementById('targetSVGContainer');
  if (targetBox) {
    targetBox.appendChild(generateTargetSVG(320, 320));
  }

  // Bind Target Downloader Buttons
  const btnSvg = document.getElementById('btnDownloadTargetSVG');
  const btnPng = document.getElementById('btnDownloadTargetPNG');

  if (btnSvg) btnSvg.addEventListener('click', downloadTargetSVG);
  if (btnPng) btnPng.addEventListener('click', downloadTargetPNG);

  // Bind Mode Switcher Tabs
  const tabPreset = document.getElementById('tabModePreset');
  const tabLive = document.getElementById('tabModeLive');
  const viewPreset = document.getElementById('viewPreset');
  const viewLive = document.getElementById('viewLive');

  const btnGoLive = document.getElementById('btnGoToLiveMode');
  if (btnGoLive) btnGoLive.addEventListener('click', () => switchMode('live'));

  function switchMode(mode) {
    if (mode === 'preset') {
      if (tabPreset) tabPreset.classList.add('active');
      if (tabLive) tabLive.classList.remove('active');
      if (viewPreset) viewPreset.hidden = false;
      if (viewLive) viewLive.hidden = true;
    } else if (mode === 'live') {
      if (tabLive) tabLive.classList.add('active');
      if (tabPreset) tabPreset.classList.remove('active');
      if (viewLive) viewLive.hidden = false;
      if (viewPreset) viewPreset.hidden = true;
    }
  }

  if (tabPreset) tabPreset.addEventListener('click', () => switchMode('preset'));
  if (tabLive) tabLive.addEventListener('click', () => switchMode('live'));

  function triggerPresetDemo() {
    switchMode('preset');

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

    // 2. Smooth scroll to Module 01
    const sec = document.getElementById('lii');
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
