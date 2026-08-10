// Module 04: Monte Carlo Lab (Seeded PRNG simulation & histogram)
import { DATASETS } from '../core/data.js';
import { lii, fmt, mulberry32, randomInDisk } from '../core/math.js';
import { drawHistogram } from '../ui/histogram.js';

let mcRunning = false;

export function initMonteCarlo() {
  const datasetSelect = document.getElementById('mcDataset');
  if (datasetSelect) {
    datasetSelect.innerHTML = Object.keys(DATASETS)
      .map(
        (k) =>
          `<option value="${k}" ${k === 'S3' ? 'selected' : ''}>${k}</option>`
      )
      .join('');
  }

  const runBtn = document.getElementById('runMC');
  if (runBtn) {
    runBtn.addEventListener('click', runSimulation);
  }

  // Draw initial empty canvas
  const canvas = document.getElementById('mcCanvas');
  if (canvas) {
    drawHistogram(canvas, [], 1);
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const f = idx - lo;
  return sorted[lo] * (1 - f) + sorted[hi] * f;
}

function computeStats(vals) {
  const n = vals.length;
  if (n === 0) return { mean: 0, sd: 0, p95: 0, max: 0 };
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(
    vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, n - 1)
  );
  const s = [...vals].sort((a, b) => a - b);
  return { mean, sd, p95: percentile(s, 0.95), max: s[s.length - 1] || 0 };
}

async function runSimulation() {
  if (mcRunning) return;
  mcRunning = true;

  const runBtn = document.getElementById('runMC');
  if (runBtn) runBtn.textContent = 'Running…';

  const ds = document.getElementById('mcDataset')?.value || 'S3';
  const e = +document.getElementById('mcEpsilon')?.value || 0.25;
  const N = +document.getElementById('mcTrials')?.value || 1000;
  const seed = +document.getElementById('mcSeed')?.value || 20260617;

  const base = DATASETS[ds];
  const L0 = lii(base);
  const rng = mulberry32(seed);

  const vals = [];
  let pass = 0;
  const B = 10 * e;
  const batch = 500;

  const passBadge = document.getElementById('mcPassBadge');
  if (passBadge) {
    passBadge.className = 'badge badge-blue';
    passBadge.textContent = 'Running';
  }

  const progressBar = document.getElementById('mcProgress');

  for (let start = 0; start < N; start += batch) {
    const end = Math.min(N, start + batch);
    for (let k = start; k < end; k++) {
      const q = base.map((p) => {
        const d = randomInDisk(e, rng);
        return [p[0] + d[0], p[1] + d[1]];
      });
      const er = Math.abs(lii(q) - L0);
      vals.push(er);
      if (er <= B + 1e-12) pass++;
    }

    if (progressBar) progressBar.style.width = `${(end / N) * 100}%`;
    await new Promise((r) => setTimeout(r, 0));
  }

  const s = computeStats(vals);

  const mcMean = document.getElementById('mcMean');
  const mcSD = document.getElementById('mcSD');
  const mcP95 = document.getElementById('mcP95');
  const mcMax = document.getElementById('mcMax');
  const mcBound = document.getElementById('mcBound');
  const mcPass = document.getElementById('mcPass');
  const mcMeta = document.getElementById('mcMeta');

  if (mcMean) mcMean.textContent = fmt(s.mean);
  if (mcSD) mcSD.textContent = fmt(s.sd);
  if (mcP95) mcP95.textContent = fmt(s.p95);
  if (mcMax) mcMax.textContent = fmt(s.max);
  if (mcBound) mcBound.textContent = fmt(B, 2);
  if (mcPass) mcPass.textContent = `${fmt((pass / N) * 100, 2)}%`;
  if (mcMeta) {
    mcMeta.textContent = `${ds} • ε=${e.toFixed(2)} • ${N.toLocaleString()} trials • seed ${seed}`;
  }

  if (passBadge) {
    passBadge.textContent = pass === N ? 'All within bound' : 'Review';
    passBadge.className = 'badge ' + (pass === N ? 'badge-green' : 'badge-amber');
  }

  const canvas = document.getElementById('mcCanvas');
  if (canvas) drawHistogram(canvas, vals, B);

  mcRunning = false;
  if (runBtn) runBtn.textContent = 'Run simulation';
}
