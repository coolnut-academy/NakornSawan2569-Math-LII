// Module 01: LII calculation from one mode's confirmed measurement.
import { lii, distance, fmt } from '../core/math.js';
import { getAnalysisElement } from '../ui/analysis-context.js';
import { renderPlot } from '../ui/svg-renderer.js';

export function initLiiBuilder({ root, store }) {
  const get = (id) => getAnalysisElement(root, id);
  let confirmedPoints = [];
  let confirmedReference = null;
  let confirmedMeasurement = null;

  const datasetSelect = get('datasetSelect');
  if (datasetSelect) {
    datasetSelect.innerHTML = `<option value="">รอ Q1-Q6 จาก ${store.label}</option>`;
    datasetSelect.disabled = true;
  }

  get('resetBuilder')?.addEventListener('click', () => {
    if (confirmedMeasurement) applyMeasurement(confirmedMeasurement);
  });

  const equationExplain = get('equationExplain');
  get('equationReader')?.addEventListener('click', () => {
    if (equationExplain) equationExplain.hidden = !equationExplain.hidden;
  });

  function applyMeasurement(measurement) {
    confirmedMeasurement = measurement;
    confirmedPoints = measurement.result.recoveredPoints.map((point) => [...point]);
    confirmedReference = measurement.result.hasKnownReference
      ? measurement.result.referenceLii
      : null;

    if (datasetSelect) {
      datasetSelect.innerHTML = `<option value="CONFIRMED">Q1-Q6 · ${store.label} · ${measurement.targetWidth}×${measurement.targetHeight} cm</option>`;
      datasetSelect.disabled = false;
    }
    updateBuilder();
  }

  function updateBuilder() {
    const svg = get('builderPlot');
    if (!svg) return;

    renderPlot(svg, confirmedPoints.length
      ? [{ points: confirmedPoints, labelPrefix: 'Q' }]
      : [], { pad: 0.25 });

    const current = confirmedPoints.length === 6 ? lii(confirmedPoints) : null;
    const liveLii = get('liveLii');
    const refLii = get('refLii');
    const builderDelta = get('builderDelta');
    const badge = get('builderDatasetBadge');

    if (liveLii) liveLii.textContent = current === null ? '—' : fmt(current);
    if (refLii) refLii.textContent = confirmedReference === null ? '—' : fmt(confirmedReference);
    if (builderDelta) {
      builderDelta.textContent = current === null || confirmedReference === null
        ? '—'
        : fmt(Math.abs(current - confirmedReference));
    }
    if (badge) badge.textContent = confirmedPoints.length ? `Q ยืนยัน · ${store.label}` : 'รอข้อมูล';

    const body = get('coordBody');
    if (!body) return;
    body.innerHTML = '';
    if (!confirmedPoints.length) {
      body.innerHTML = `<tr><td colspan="4" class="muted">ยังไม่มี Q1-Q6 ที่ยืนยันจาก ${store.label}</td></tr>`;
      return;
    }

    confirmedPoints.forEach((point, index) => {
      const row = document.createElement('tr');
      const segment = index < confirmedPoints.length - 1
        ? distance(point, confirmedPoints[index + 1])
        : null;
      row.innerHTML = `
        <td><strong>Q${index + 1}</strong></td>
        <td class="num">${point[0].toFixed(3)}</td>
        <td class="num">${point[1].toFixed(3)}</td>
        <td class="num">${segment === null ? '—' : fmt(segment, 4)}</td>
      `;
      body.appendChild(row);
    });
  }

  store.subscribe(applyMeasurement);
  updateBuilder();
}
