// Module 05: Reproduce 18 Conditions (Live validation vs Published results)
import { DATASETS, HOMOGRAPHIES, PUBLISHED } from '../core/data.js';
import { lii, re, fmt } from '../core/math.js';
import { inverse3 } from '../core/matrix.js';
import { transformPoints } from '../core/homography.js';

export function initReproduce18() {
  renderResults();
}

function renderResults() {
  const body = document.getElementById('resultsBody');
  if (!body) return;

  body.innerHTML = '';
  Object.keys(DATASETS).forEach((ds) => {
    Object.keys(HOMOGRAPHIES).forEach((h) => {
      const L0 = lii(DATASETS[ds]);
      const raw = lii(transformPoints(DATASETS[ds], HOMOGRAPHIES[h]));
      const rec = lii(
        transformPoints(
          transformPoints(DATASETS[ds], HOMOGRAPHIES[h]),
          inverse3(HOMOGRAPHIES[h])
        )
      );
      const pub = PUBLISHED[`${ds}-${h}`];
      const diff = Math.abs(raw - pub.raw);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${ds} + ${h}</strong></td>
        <td class="num">${fmt(L0, 6)}</td>
        <td class="num">${fmt(raw, 4)}</td>
        <td class="num">${pub.raw.toFixed(4)}</td>
        <td class="num">${fmt(re(raw, L0), 4)}%</td>
        <td class="num">${fmt(rec, 6)}</td>
        <td class="num ${diff < 5e-5 ? 'match' : 'warn'}">${diff.toExponential(1)}</td>
      `;
      body.appendChild(tr);
    });
  });
}
