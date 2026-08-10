// Module 04: uncertainty simulation around one mode's confirmed measurement.
import { lii, fmt, mulberry32, randomInDisk } from '../core/math.js';
import { getAnalysisElement } from '../ui/analysis-context.js';
import { drawHistogram } from '../ui/histogram.js';

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  const fraction = index - low;
  return sorted[low] * (1 - fraction) + sorted[high] * fraction;
}

function computeStats(values) {
  const count = values.length;
  if (!count) return { mean: 0, sd: 0, p95: 0, max: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const sd = Math.sqrt(
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(1, count - 1)
  );
  const sorted = [...values].sort((a, b) => a - b);
  return { mean, sd, p95: percentile(sorted, 0.95), max: sorted.at(-1) || 0 };
}

export function initMonteCarlo({ root, store }) {
  const get = (id) => getAnalysisElement(root, id);
  let mcRunning = false;
  let confirmedPoints = null;
  let confirmedSource = '';
  const datasetSelect = get('mcDataset');
  const runButton = get('runMC');

  function resetSimulationOutput() {
    ['mcMean', 'mcSD', 'mcP95', 'mcMax', 'mcBound', 'mcPass'].forEach((id) => {
      const element = get(id);
      if (element) element.textContent = '—';
    });
    const meta = get('mcMeta');
    const passBadge = get('mcPassBadge');
    const progress = get('mcProgress');
    if (meta) meta.textContent = `พร้อมวิเคราะห์ Q ล่าสุด · ${confirmedSource}`;
    if (passBadge) {
      passBadge.className = 'badge badge-blue';
      passBadge.textContent = 'Ready';
    }
    if (progress) progress.style.width = '0%';
    const canvas = get('mcCanvas');
    if (canvas) drawHistogram(canvas, [], 1);
  }

  async function runSimulation() {
    if (mcRunning || !confirmedPoints) return;
    mcRunning = true;

    if (runButton) {
      runButton.disabled = true;
      runButton.textContent = 'Running…';
    }

    const epsilon = Number(get('mcEpsilon')?.value) || 0.25;
    const trials = Number(get('mcTrials')?.value) || 1000;
    const seed = Number(get('mcSeed')?.value) || 20260617;
    const referenceLii = lii(confirmedPoints);
    const random = mulberry32(seed);
    const errors = [];
    let passCount = 0;
    const bound = 10 * epsilon;
    const batch = 500;
    const progress = get('mcProgress');
    const passBadge = get('mcPassBadge');

    if (passBadge) {
      passBadge.className = 'badge badge-blue';
      passBadge.textContent = 'Running';
    }

    for (let start = 0; start < trials; start += batch) {
      const end = Math.min(trials, start + batch);
      for (let trial = start; trial < end; trial += 1) {
        const perturbed = confirmedPoints.map((point) => {
          const delta = randomInDisk(epsilon, random);
          return [point[0] + delta[0], point[1] + delta[1]];
        });
        const error = Math.abs(lii(perturbed) - referenceLii);
        errors.push(error);
        if (error <= bound + 1e-12) passCount += 1;
      }
      if (progress) progress.style.width = `${(end / trials) * 100}%`;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const stats = computeStats(errors);
    const values = {
      mcMean: fmt(stats.mean),
      mcSD: fmt(stats.sd),
      mcP95: fmt(stats.p95),
      mcMax: fmt(stats.max),
      mcBound: fmt(bound, 2),
      mcPass: `${fmt((passCount / trials) * 100, 2)}%`
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = get(id);
      if (element) element.textContent = value;
    });

    const meta = get('mcMeta');
    if (meta) meta.textContent = `${confirmedSource} · ε=${epsilon.toFixed(2)} · ${trials.toLocaleString()} trials · seed ${seed}`;
    if (passBadge) {
      passBadge.textContent = passCount === trials ? 'All within bound' : 'Review';
      passBadge.className = `badge ${passCount === trials ? 'badge-green' : 'badge-amber'}`;
    }
    const canvas = get('mcCanvas');
    if (canvas) drawHistogram(canvas, errors, bound);

    mcRunning = false;
    if (runButton) {
      runButton.disabled = false;
      runButton.textContent = 'Run simulation';
    }
  }

  if (datasetSelect) {
    datasetSelect.innerHTML = `<option value="">รอ Q1-Q6 จาก ${store.label}</option>`;
    datasetSelect.disabled = true;
  }
  if (runButton) {
    runButton.disabled = true;
    runButton.addEventListener('click', runSimulation);
  }

  store.subscribe((measurement) => {
    confirmedPoints = measurement.result.recoveredPoints.map((point) => [...point]);
    confirmedSource = `${store.label} · ${measurement.targetWidth}×${measurement.targetHeight} cm`;
    if (datasetSelect) {
      datasetSelect.innerHTML = `<option value="CONFIRMED">Q1-Q6 · ${confirmedSource}</option>`;
      datasetSelect.disabled = false;
    }
    if (runButton) runButton.disabled = false;
    resetSimulationOutput();
  });

  const canvas = get('mcCanvas');
  if (canvas) drawHistogram(canvas, [], 1);
}
