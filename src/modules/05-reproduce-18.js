// Module 05: per-segment breakdown from one mode's confirmed measurement.
import { distance, fmt } from '../core/math.js';
import { getAnalysisElement } from '../ui/analysis-context.js';

export function initReproduce18({ root, store }) {
  const get = (id) => getAnalysisElement(root, id);
  let confirmedMeasurement = null;

  function renderResults() {
    const body = get('resultsBody');
    if (!body) return;
    body.innerHTML = '';

    if (!confirmedMeasurement) {
      body.innerHTML = `<tr><td colspan="6" class="muted">ยังไม่มี Q1-Q6 ที่ยืนยันจาก ${store.label}</td></tr>`;
      return;
    }

    const { imagePoints, result, targetWidth, targetHeight } = confirmedMeasurement;
    const recovered = result.recoveredPoints;
    const heading = document.createElement('tr');
    heading.className = 'confirmed-result-heading';
    heading.innerHTML = `<td colspan="6">Q1-Q6 · ${store.label} · calibration ${targetWidth}×${targetHeight} cm</td>`;
    body.appendChild(heading);

    let cumulative = 0;
    for (let index = 0; index < recovered.length - 1; index += 1) {
      const pixelLength = distance(imagePoints[index], imagePoints[index + 1]);
      const calibratedLength = distance(recovered[index], recovered[index + 1]);
      cumulative += calibratedLength;
      const row = document.createElement('tr');
      row.className = 'confirmed-result-row';
      row.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td>Q${index + 1} → Q${index + 2}</td>
        <td class="num">${fmt(pixelLength, 3)} px</td>
        <td class="num">${fmt(calibratedLength, 4)} cm</td>
        <td class="num">${fmt(cumulative, 4)} cm</td>
        <td class="num">${fmt((calibratedLength / result.recoveredLii) * 100, 2)}%</td>
      `;
      body.appendChild(row);
    }

    const total = document.createElement('tr');
    total.className = 'confirmed-result-total';
    total.innerHTML = `
      <td colspan="3"><strong>รวม LII จาก 5 ช่วง</strong></td>
      <td class="num"><strong>${fmt(result.recoveredLii, 4)} cm</strong></td>
      <td class="num"><strong>${fmt(cumulative, 4)} cm</strong></td>
      <td class="num"><strong>100%</strong></td>
    `;
    body.appendChild(total);
  }

  store.subscribe((measurement) => {
    confirmedMeasurement = measurement;
    renderResults();
  });
  renderResults();
}
