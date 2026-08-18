// Canvas renderer for Monte Carlo error distribution histograms (Light Theme)

export function drawHistogram(canvas, vals, bound) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#fbfdff';
  ctx.fillRect(0, 0, W, H);

  if (!vals || !vals.length) {
    ctx.fillStyle = '#6b7c90';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Run simulation to see distribution', 26, 42);
    return;
  }

  const maxVal = Math.max(...vals, bound * 0.15, 1e-9);
  const bins = 30;
  const counts = Array(bins).fill(0);
  vals.forEach((v) => counts[Math.min(bins - 1, Math.floor((v / maxVal) * bins))]++);

  const peak = Math.max(...counts, 1);
  const m = { l: 48, r: 22, t: 18, b: 36 };

  // Grid lines
  ctx.strokeStyle = '#dfe7f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = m.t + ((H - m.t - m.b) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(m.l, y);
    ctx.lineTo(W - m.r, y);
    ctx.stroke();
  }

  // Bars
  const bw = (W - m.l - m.r) / bins;
  counts.forEach((n, i) => {
    const h = ((H - m.t - m.b) * n) / peak;
    ctx.fillStyle = '#2f7af8';
    ctx.fillRect(m.l + i * bw + 1, H - m.b - h, Math.max(1, bw - 2), h);
  });

  // Theoretical Bound vertical line if within range
  if (bound <= maxVal) {
    const boundX = m.l + (bound / maxVal) * (W - m.l - m.r);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(boundX, m.t);
    ctx.lineTo(boundX, H - m.b);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = '11px monospace';
    ctx.fillText('10ε bound', boundX - 25, m.t - 4);
  }

  // Axes Labels
  ctx.fillStyle = '#62758b';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('0', m.l, H - 12);
  ctx.fillText(maxVal.toFixed(3), W - m.r - 44, H - 12);
  ctx.fillText('|L̂ − L₀|', W / 2 - 28, H - 12);
}
