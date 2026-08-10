// Module 02: Homography Lab (Original, Distorted, Recovered comparison)
import { DATASETS, HOMOGRAPHIES, H_LEVELS } from '../core/data.js';
import { lii, ae, re, fmt } from '../core/math.js';
import { determinant3, inverse3 } from '../core/matrix.js';
import { transformPoints } from '../core/homography.js';
import { boundsFor, renderPlot } from '../ui/svg-renderer.js';

let hDataset = 'S3';
let hKey = 'H2';

export function initHomographyLab() {
  const datasetSelect = document.getElementById('hDataset');
  const matrixSelect = document.getElementById('hMatrix');

  if (datasetSelect) {
    datasetSelect.innerHTML = Object.keys(DATASETS)
      .map(
        (k) =>
          `<option value="${k}" ${k === 'S3' ? 'selected' : ''}>${k}</option>`
      )
      .join('');
    datasetSelect.addEventListener('change', (e) => {
      hDataset = e.target.value;
      updateHomography();
    });
  }

  if (matrixSelect) {
    matrixSelect.addEventListener('change', (e) => {
      hKey = e.target.value;
      updateHomography();
    });
  }

  updateHomography();
}

function updateHomography() {
  const pts = DATASETS[hDataset];
  const H = HOMOGRAPHIES[hKey];
  const dist = transformPoints(pts, H);
  const inv = inverse3(H);
  const rec = transformPoints(dist, inv);

  const common = boundsFor([pts, dist, rec], 0.22);

  const origPlot = document.getElementById('originalPlot');
  const distPlot = document.getElementById('distortedPlot');
  const recPlot = document.getElementById('recoveredPlot');

  if (origPlot) renderPlot(origPlot, [{ points: pts, labelPrefix: 'P' }], { bounds: common });
  if (distPlot) renderPlot(distPlot, [{ points: dist, labelPrefix: 'Q', className: 'raw' }], { bounds: common });
  if (recPlot) renderPlot(recPlot, [{ points: rec, labelPrefix: 'P̂', className: 'recovered' }], { bounds: common });

  const L0 = lii(pts);
  const Lraw = lii(dist);
  const Lrec = lii(rec);

  const hL0 = document.getElementById('hL0');
  const hLraw = document.getElementById('hLraw');
  const hRe = document.getElementById('hRe');
  const hLrec = document.getElementById('hLrec');
  const hRecErr = document.getElementById('hRecoveredError');
  const matrixLevel = document.getElementById('matrixLevel');
  const detBadge = document.getElementById('detBadge');
  const matrixGrid = document.getElementById('matrixGrid');

  if (hL0) hL0.textContent = fmt(L0);
  if (hLraw) hLraw.textContent = fmt(Lraw);
  if (hRe) hRe.textContent = `${fmt(re(Lraw, L0), 4)}%`;
  if (hLrec) hLrec.textContent = fmt(Lrec);
  if (hRecErr) hRecErr.textContent = `recovered AE ${ae(Lrec, L0).toExponential(2)}`;

  if (matrixLevel) matrixLevel.textContent = `${hKey} • ${H_LEVELS[hKey]}`;
  if (detBadge) detBadge.textContent = `det = ${determinant3(H).toFixed(8)}`;
  if (matrixGrid) {
    matrixGrid.innerHTML = H.flat()
      .map((v) => `<span>${v.toFixed(4)}</span>`)
      .join('');
  }
}
