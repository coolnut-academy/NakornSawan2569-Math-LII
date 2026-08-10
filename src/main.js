import '@ibm/plex-sans-thai/css/ibm-plex-sans-thai-default.css';
import '@ibm/plex-mono/css/ibm-plex-mono-default.css';
import { initTheme } from './ui/theme.js';
import { refreshIcons } from './ui/icons.js';
import { initPresetWorkflow } from './modules/00-preset-workflow.js';
import { initLiiBuilder } from './modules/01-lii-builder.js';
import { initHomographyLab } from './modules/02-homography-lab.js';
import { initErrorBound } from './modules/03-error-bound.js';
import { initMonteCarlo } from './modules/04-monte-carlo.js';
import { initReproduce18 } from './modules/05-reproduce-18.js';
import { initOwnerMode } from './modules/06-owner-mode.js';
import { initLiveDemo, stopLiveCamera } from './modules/07-live-demo.js';
import { runSelfTests } from './tests/self-tests.js';
import { generateTargetSVG, downloadTargetSVG, downloadTargetPNG } from './core/target-generator.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme System
  initTheme();

  // Initialize the interactive lab modules.
  initLiiBuilder();
  initHomographyLab();
  initErrorBound();
  initMonteCarlo();
  initReproduce18();
  initOwnerMode();
  initLiveDemo();

  // Keep target generation available for the download actions.
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
  const moduleNav = document.getElementById('moduleNav');

  function switchMode(mode) {
    if (mode === 'preset') {
      if (tabPreset) tabPreset.classList.add('active');
      if (tabLive) tabLive.classList.remove('active');
      tabPreset?.setAttribute('aria-pressed', 'true');
      tabLive?.setAttribute('aria-pressed', 'false');
      if (viewPreset) viewPreset.hidden = false;
      if (viewLive) viewLive.hidden = true;
      if (moduleNav) moduleNav.hidden = false;
      stopLiveCamera();
    } else if (mode === 'live') {
      if (tabLive) tabLive.classList.add('active');
      if (tabPreset) tabPreset.classList.remove('active');
      tabLive?.setAttribute('aria-pressed', 'true');
      tabPreset?.setAttribute('aria-pressed', 'false');
      if (viewLive) viewLive.hidden = false;
      if (viewPreset) viewPreset.hidden = true;
      if (moduleNav) moduleNav.hidden = true;
    }
  }

  initPresetWorkflow({
    onGoLive: () => {
      switchMode('live');
      document.getElementById('livedemo')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (tabPreset) {
    tabPreset.addEventListener('click', () => {
      switchMode('preset');
      document.getElementById('preset-workflow')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (tabLive) {
    tabLive.addEventListener('click', () => {
      switchMode('live');
      document.getElementById('livedemo')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  refreshIcons();

  // Bind All Navigation Anchor Links for Auto Mode Switch + Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      if (!targetId || targetId === 'top') return;

      e.preventDefault();
      if (targetId === 'livedemo') {
        switchMode('live');
      } else {
        switchMode('preset');
      }

      setTimeout(() => {
        const sec = document.getElementById(targetId);
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  });

  // Bind Beginner Guide Toggle Buttons
  document.querySelectorAll('[data-guide-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.guideToggle;
      const box = document.getElementById(targetId);
      if (box) {
        box.hidden = !box.hidden;
        btn.setAttribute('aria-expanded', String(!box.hidden));
        if (!box.hidden && window.renderMathInElement) {
          window.renderMathInElement(box, {
            delimiters: [
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
