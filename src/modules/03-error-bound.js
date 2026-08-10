// Module 03: Error Bound Lab (10-epsilon theorem visual proof & slider)
import { DATASETS } from '../core/data.js';
import { clonePoints, lii, fmt, clamp, randomInDisk } from '../core/math.js';
import { boundsFor, svgMap } from '../ui/svg-renderer.js';
import { attachDrag } from '../ui/drag.js';

let eps = 0.25;
const errorBase = clonePoints(DATASETS.S3);
let perturbed = clonePoints(errorBase);
let errorMap = null;

export function initErrorBound() {
  const range = document.getElementById('epsilonRange');
  const epsLabel = document.getElementById('epsLabel');
  const randomBtn = document.getElementById('randomPerturb');
  const resetBtn = document.getElementById('resetPerturb');
  const svg = document.getElementById('errorPlot');

  if (range) {
    range.addEventListener('input', (e) => {
      eps = +e.target.value;
      if (epsLabel) epsLabel.textContent = eps.toFixed(2);
      perturbed = perturbed.map((p, i) => {
        let dx = p[0] - errorBase[i][0];
        let dy = p[1] - errorBase[i][1];
        let r = Math.hypot(dx, dy);
        if (r > eps) {
          dx *= eps / r;
          dy *= eps / r;
        }
        return [errorBase[i][0] + dx, errorBase[i][1] + dy];
      });
      renderErrorPlot();
    });
  }

  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      perturbed = errorBase.map((p) => {
        const d = randomInDisk(eps);
        return [p[0] + d[0], p[1] + d[1]];
      });
      renderErrorPlot();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      perturbed = clonePoints(errorBase);
      renderErrorPlot();
    });
  }

  if (svg) {
    attachDrag(
      svg,
      () => perturbed,
      (i, p) => {
        perturbed[i] = p;
        renderErrorPlot();
      },
      () => errorMap,
      (i, p) => {
        const b = errorBase[i];
        const dx = p[0] - b[0];
        const dy = p[1] - b[1];
        const r = Math.hypot(dx, dy);
        if (r <= eps) return p;
        return [b[0] + (dx / r) * eps, b[1] + (dy / r) * eps];
      }
    );
  }

  renderErrorPlot();
}

function renderErrorPlot() {
  const svg = document.getElementById('errorPlot');
  if (!svg) return;

  const vb = svg.viewBox.baseVal;
  const view = [vb.x, vb.y, vb.width, vb.height];
  const b = boundsFor([errorBase, perturbed], 0.35);
  const map = svgMap(view, b);
  errorMap = map;

  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  // Grid
  const grid = mk('g', { class: 'plot-grid' });
  for (let i = 0; i <= 6; i++) {
    let x = map.ox + (map.w * i) / 6;
    grid.appendChild(mk('line', { x1: x, y1: map.oy, x2: x, y2: map.oy + map.h }));
    let y = map.oy + (map.h * i) / 6;
    grid.appendChild(mk('line', { x1: map.ox, y1: y, x2: map.ox + map.w, y2: y }));
  }
  svg.appendChild(grid);

  // Epsilon circles and perturbation lines
  errorBase.forEach((p, i) => {
    const sp = map.toSvg(p);
    const pp = map.toSvg(perturbed[i]);
    svg.appendChild(mk('circle', { cx: sp[0], cy: sp[1], r: eps * map.scale, class: 'eps-circle' }));
    svg.appendChild(mk('line', { x1: sp[0], y1: sp[1], x2: pp[0], y2: pp[1], class: 'pert-line' }));
  });

  // Polyline for base and perturbed
  const p1 = errorBase.map(map.toSvg);
  const p2 = perturbed.map(map.toSvg);
  svg.appendChild(mk('polyline', { points: p1.map((p) => p.join(',')).join(' '), class: 'plot-poly' }));
  svg.appendChild(mk('polyline', { points: p2.map((p) => p.join(',')).join(' '), class: 'plot-poly raw' }));

  p1.forEach((p) => svg.appendChild(mk('circle', { cx: p[0], cy: p[1], r: 5, class: 'plot-point' })));
  p2.forEach((p, i) => {
    svg.appendChild(
      mk('circle', {
        cx: p[0],
        cy: p[1],
        r: 7,
        class: 'pert-point',
        'data-index': i,
        tabindex: '0',
        role: 'slider',
        'aria-label': `Perturbed point P${i + 1}`
      })
    );
    const t = mk('text', { x: p[0] + 9, y: p[1] - 8, class: 'point-label' });
    t.textContent = `P̂${i + 1}`;
    svg.appendChild(t);
  });

  updateBoundMetrics();
}

function updateBoundMetrics() {
  const E = Math.abs(lii(perturbed) - lii(errorBase));
  const B = 10 * eps;
  const ratio = B ? E / B : 0;

  const actualError = document.getElementById('actualError');
  const theoryBound = document.getElementById('theoryBound');
  const boundStatus = document.getElementById('boundStatus');
  const boundRatioText = document.getElementById('boundRatioText');
  const boundMeter = document.getElementById('boundMeter');

  if (actualError) actualError.textContent = fmt(E);
  if (theoryBound) theoryBound.textContent = fmt(B, 2);
  if (boundStatus) {
    const isPass = E <= B + 1e-12;
    boundStatus.textContent = isPass ? 'PASS' : 'CHECK';
    boundStatus.className = 'value ' + (isPass ? 'success' : 'danger');
  }
  if (boundRatioText) boundRatioText.textContent = `Uses ${fmt(ratio * 100, 1)}% of upper bound`;
  if (boundMeter) boundMeter.style.width = `${clamp(ratio * 100, 0, 100)}%`;
}
