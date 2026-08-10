// Module 02: actual image-to-plane homography from one mode's confirmed measurement.
import { lii, re, fmt } from '../core/math.js';
import { determinant3 } from '../core/matrix.js';
import { getAnalysisElement } from '../ui/analysis-context.js';
import { renderPlot } from '../ui/svg-renderer.js';

export function initHomographyLab({ root, store }) {
  const get = (id) => getAnalysisElement(root, id);
  let confirmedMeasurement = null;
  const datasetSelect = get('hDataset');
  const matrixSelect = get('hMatrix');

  if (datasetSelect) {
    datasetSelect.innerHTML = `<option value="">รอ Q1-Q6 จาก ${store.label}</option>`;
    datasetSelect.disabled = true;
  }
  if (matrixSelect) {
    matrixSelect.innerHTML = `<option value="">รอ C1-C4 จาก ${store.label}</option>`;
    matrixSelect.disabled = true;
  }

  function clearMetrics() {
    ['hL0', 'hLraw', 'hRe', 'hLrec'].forEach((id) => {
      const element = get(id);
      if (element) element.textContent = '—';
    });
    const recoveredError = get('hRecoveredError');
    const matrixLevel = get('matrixLevel');
    const detBadge = get('detBadge');
    const matrixGrid = get('matrixGrid');
    if (recoveredError) recoveredError.textContent = 'รอข้อมูลจริง';
    if (matrixLevel) matrixLevel.textContent = 'รอ C1-C4 และขนาด calibration';
    if (detBadge) detBadge.textContent = 'det = —';
    if (matrixGrid) matrixGrid.innerHTML = '';
  }

  function updateHomography() {
    const originalPlot = get('originalPlot');
    const distortedPlot = get('distortedPlot');
    const recoveredPlot = get('recoveredPlot');

    if (!confirmedMeasurement) {
      if (originalPlot) renderPlot(originalPlot, [], { pad: 0.22 });
      if (distortedPlot) renderPlot(distortedPlot, [], { pad: 0.22 });
      if (recoveredPlot) renderPlot(recoveredPlot, [], { pad: 0.22 });
      clearMetrics();
      return;
    }

    const { imagePoints, referencePoints, result } = confirmedMeasurement;
    const recoveredPoints = result.recoveredPoints;
    if (originalPlot) {
      renderPlot(originalPlot, [{ points: imagePoints, labelPrefix: 'Q', className: 'raw' }], { pad: 0.22 });
    }
    if (distortedPlot) {
      renderPlot(distortedPlot, [{ points: recoveredPoints, labelPrefix: 'Q̂', className: 'recovered' }], { pad: 0.22 });
    }
    if (recoveredPlot) {
      const series = referencePoints
        ? [
            { points: referencePoints, labelPrefix: 'R' },
            { points: recoveredPoints, labelPrefix: 'Q̂', className: 'recovered' }
          ]
        : [{ points: recoveredPoints, labelPrefix: 'Q̂', className: 'recovered' }];
      renderPlot(recoveredPlot, series, { pad: 0.22 });
    }

    const rawPixelLength = lii(imagePoints);
    const recoveredLii = result.recoveredLii;
    const hL0 = get('hL0');
    const hLraw = get('hLraw');
    const hRe = get('hRe');
    const hLrec = get('hLrec');
    const hRecoveredError = get('hRecoveredError');
    const matrixLevel = get('matrixLevel');
    const detBadge = get('detBadge');
    const matrixGrid = get('matrixGrid');

    if (hL0) hL0.textContent = result.hasKnownReference ? `${fmt(result.referenceLii)} cm` : '—';
    if (hLraw) hLraw.textContent = `${fmt(rawPixelLength)} px`;
    if (hRe) {
      hRe.textContent = result.hasKnownReference
        ? `${fmt(re(recoveredLii, result.referenceLii), 4)}%`
        : 'N/A';
    }
    if (hLrec) hLrec.textContent = `${fmt(recoveredLii)} cm`;
    if (hRecoveredError) {
      hRecoveredError.textContent = result.hasKnownReference
        ? `actual error ${fmt(result.actualError, 4)} cm`
        : 'measurement only · ไม่มี ground truth';
    }
    if (matrixLevel) {
      matrixLevel.textContent = `${confirmedMeasurement.targetWidth}×${confirmedMeasurement.targetHeight} cm · ${store.label}`;
    }
    if (detBadge) detBadge.textContent = `det = ${determinant3(result.matrix).toFixed(8)}`;
    if (matrixGrid) {
      matrixGrid.innerHTML = result.matrix.flat()
        .map((value) => `<span>${value.toFixed(4)}</span>`)
        .join('');
    }
  }

  store.subscribe((measurement) => {
    confirmedMeasurement = measurement;
    if (datasetSelect) {
      datasetSelect.innerHTML = `<option value="CONFIRMED">Q1-Q6 · ${store.label}</option>`;
      datasetSelect.disabled = false;
    }
    if (matrixSelect) {
      matrixSelect.innerHTML = '<option value="EST">H จาก C1-C4 ที่ยืนยัน</option>';
      matrixSelect.disabled = false;
    }
    updateHomography();
  });

  updateHomography();
}
