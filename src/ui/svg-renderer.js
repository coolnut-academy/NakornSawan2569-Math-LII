// SVG Plot rendering engine for coordinate systems and LII lines

export function boundsFor(sets, pad = 0.35) {
  const all = sets.flat();
  if (all.length === 0) return { minX: 0, maxX: 6, minY: -1, maxY: 1 };

  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);

  let minX = Math.min(...xs), maxX = Math.max(...xs);
  let minY = Math.min(...ys), maxY = Math.max(...ys);

  let dx = Math.max(0.5, maxX - minX);
  let dy = Math.max(0.5, maxY - minY);

  return {
    minX: minX - dx * pad,
    maxX: maxX + dx * pad,
    minY: minY - dy * pad,
    maxY: maxY + dy * pad
  };
}

export function svgMap(viewBox, bounds) {
  const [vx, vy, vw, vh] = viewBox;
  const margin = 42;
  const sx = (vw - 2 * margin) / (bounds.maxX - bounds.minX);
  const sy = (vh - 2 * margin) / (bounds.maxY - bounds.minY);
  const scale = Math.min(sx, sy);
  const w = (bounds.maxX - bounds.minX) * scale;
  const h = (bounds.maxY - bounds.minY) * scale;
  const ox = vx + (vw - w) / 2;
  const oy = vy + (vh - h) / 2;

  return {
    toSvg: (p) => [ox + (p[0] - bounds.minX) * scale, oy + h - (p[1] - bounds.minY) * scale],
    toData: (q) => [
      bounds.minX + (q[0] - ox) / scale,
      bounds.minY + (oy + h - q[1]) / scale
    ],
    scale, ox, oy, w, h
  };
}

export function renderPlot(svg, series, opts = {}) {
  const vb = svg.viewBox.baseVal;
  const view = [vb.x, vb.y, vb.width, vb.height];
  const sets = series.map((s) => s.points);
  const bounds = opts.bounds || boundsFor(sets, opts.pad ?? 0.35);
  const map = svgMap(view, bounds);

  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  // Grid
  const grid = mk('g', { class: 'plot-grid' });
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    let x = map.ox + (map.w * i) / steps;
    grid.appendChild(mk('line', { x1: x, y1: map.oy, x2: x, y2: map.oy + map.h }));
    let y = map.oy + (map.h * i) / steps;
    grid.appendChild(mk('line', { x1: map.ox, y1: y, x2: map.ox + map.w, y2: y }));
  }
  svg.appendChild(grid);

  // Series lines and points
  series.forEach((s, si) => {
    const pts = s.points.map(map.toSvg);
    const pl = mk('polyline', {
      points: pts.map((p) => p.join(',')).join(' '),
      class: `plot-poly ${s.className || ''}`
    });
    svg.appendChild(pl);

    pts.forEach((p, idx) => {
      const c = mk('circle', {
        cx: p[0],
        cy: p[1],
        r: s.radius || 6,
        class: `plot-point ${s.className || ''}`,
        'data-series': si,
        'data-index': idx,
        tabindex: s.draggable ? '0' : '-1',
        role: s.draggable ? 'slider' : 'img',
        'aria-label': `${s.labelPrefix || 'P'}${idx + 1}`
      });
      svg.appendChild(c);

      if (opts.labels !== false) {
        const t = mk('text', {
          x: p[0] + 9,
          y: p[1] - 9,
          class: 'point-label'
        });
        t.textContent = `${s.labelPrefix || 'P'}${idx + 1}`;
        svg.appendChild(t);
      }
    });
  });

  return { map, bounds };
}
