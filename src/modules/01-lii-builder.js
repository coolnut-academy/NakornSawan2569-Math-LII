// Module 01: LII Builder (Interactive Reference Plane & Live Formula)
import { DATASETS, DATASET_LABELS, REFERENCE_LII } from '../core/data.js';
import { clonePoints, distance, lii, fmt } from '../core/math.js';
import { renderPlot } from '../ui/svg-renderer.js';
import { attachDrag } from '../ui/drag.js';

let builderDataset = 'S3';
let builderPoints = clonePoints(DATASETS.S3);
let builderMap = null;

export function initLiiBuilder() {
  const datasetSelect = document.getElementById('datasetSelect');
  if (datasetSelect) {
    datasetSelect.innerHTML = Object.keys(DATASETS)
      .map(
        (k) =>
          `<option value="${k}" ${k === 'S3' ? 'selected' : ''}>${k} — ${DATASET_LABELS[k]}</option>`
      )
      .join('');

    datasetSelect.addEventListener('change', (e) => {
      builderDataset = e.target.value;
      builderPoints = clonePoints(DATASETS[builderDataset]);
      updateBuilder();
    });
  }

  const resetBtn = document.getElementById('resetBuilder');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      builderPoints = clonePoints(DATASETS[builderDataset]);
      updateBuilder();
    });
  }

  const eqReaderBtn = document.getElementById('equationReader');
  const eqExplain = document.getElementById('equationExplain');
  if (eqReaderBtn && eqExplain) {
    eqReaderBtn.addEventListener('click', () => {
      eqExplain.hidden = !eqExplain.hidden;
    });
  }

  const svg = document.getElementById('builderPlot');
  if (svg) {
    attachDrag(
      svg,
      () => builderPoints,
      (i, p) => {
        builderPoints[i] = p;
        updateBuilder();
        const announce = document.getElementById('builderAnnounce');
        if (announce) {
          announce.textContent = `P${i + 1} position updated. LII = ${fmt(lii(builderPoints), 4)}`;
        }
      },
      () => builderMap
    );
  }

  updateBuilder();
}

function updateBuilder() {
  const svg = document.getElementById('builderPlot');
  if (!svg) return;

  builderMap = renderPlot(svg, [{ points: builderPoints, draggable: true, labelPrefix: 'P' }], {
    pad: 0.25
  });

  const current = lii(builderPoints);
  const ref = REFERENCE_LII[builderDataset];

  const liveLii = document.getElementById('liveLii');
  const refLii = document.getElementById('refLii');
  const builderDelta = document.getElementById('builderDelta');
  const badge = document.getElementById('builderDatasetBadge');

  if (liveLii) liveLii.textContent = fmt(current);
  if (refLii) refLii.textContent = fmt(ref);
  if (builderDelta) builderDelta.textContent = fmt(Math.abs(current - ref));
  if (badge) badge.textContent = builderDataset;

  const body = document.getElementById('coordBody');
  if (body) {
    body.innerHTML = '';
    builderPoints.forEach((p, i) => {
      const tr = document.createElement('tr');
      const seg = i < 5 ? distance(p, builderPoints[i + 1]) : null;
      tr.innerHTML = `
        <td><strong>P${i + 1}</strong></td>
        <td><input class="coord-input" data-axis="0" data-index="${i}" type="number" step="0.01" value="${p[0].toFixed(2)}" aria-label="P${i + 1} x"></td>
        <td><input class="coord-input" data-axis="1" data-index="${i}" type="number" step="0.01" value="${p[1].toFixed(2)}" aria-label="P${i + 1} y"></td>
        <td class="num">${seg === null ? '—' : fmt(seg, 4)}</td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll('.coord-input').forEach((inp) =>
      inp.addEventListener('change', (e) => {
        const i = +e.target.dataset.index;
        const a = +e.target.dataset.axis;
        const v = +e.target.value;
        if (Number.isFinite(v)) {
          builderPoints[i][a] = v;
          updateBuilder();
        }
      })
    );
  }
}
