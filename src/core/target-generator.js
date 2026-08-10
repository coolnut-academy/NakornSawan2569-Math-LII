// Pure Dynamic Vector Calibration Target Generator & Downloader

export function generateTargetSVG(width = 600, height = 600) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 600 600');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('style', 'background: #ffffff; font-family: system-ui, sans-serif;');

  // Background Paper
  const bg = document.createElementNS(svgNS, 'rect');
  bg.setAttribute('width', '600');
  bg.setAttribute('height', '600');
  bg.setAttribute('fill', '#ffffff');
  svg.appendChild(bg);

  // Outer Margin & 6cm x 6cm Main Box (Margin = 60px, Box = 480px, Scale = 80px/cm)
  const box = document.createElementNS(svgNS, 'rect');
  box.setAttribute('x', '60');
  box.setAttribute('y', '60');
  box.setAttribute('width', '480');
  box.setAttribute('height', '480');
  box.setAttribute('fill', 'none');
  box.setAttribute('stroke', '#0f172a');
  box.setAttribute('stroke-width', '3');
  svg.appendChild(box);

  // Grid Lines (1cm = 80px)
  for (let i = 1; i < 6; i++) {
    const x = 60 + i * 80;
    const y = 60 + i * 80;

    // Vertical line
    const vline = document.createElementNS(svgNS, 'line');
    vline.setAttribute('x1', x);
    vline.setAttribute('y1', 60);
    vline.setAttribute('x2', x);
    vline.setAttribute('y2', 540);
    vline.setAttribute('stroke', '#e2e8f0');
    vline.setAttribute('stroke-width', '1.5');
    vline.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(vline);

    // Horizontal line
    const hline = document.createElementNS(svgNS, 'line');
    hline.setAttribute('x1', 60);
    hline.setAttribute('y1', y);
    hline.setAttribute('x2', 540);
    hline.setAttribute('y2', y);
    hline.setAttribute('stroke', '#e2e8f0');
    hline.setAttribute('stroke-width', '1.5');
    hline.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(hline);
  }

  // Corner Calibration Target Checkerboards (C1..C4)
  const corners = [
    { x: 60, y: 60, label: 'C1 (0,0)' },
    { x: 540, y: 60, label: 'C2 (6,0)' },
    { x: 540, y: 540, label: 'C3 (6,6)' },
    { x: 60, y: 540, label: 'C4 (0,6)' }
  ];

  corners.forEach((c) => {
    const g = document.createElementNS(svgNS, 'g');
    
    // Outer Circle
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', c.x);
    circle.setAttribute('cy', c.y);
    circle.setAttribute('r', '20');
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('stroke', '#0f172a');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    // Crosshairs
    const h = document.createElementNS(svgNS, 'line');
    h.setAttribute('x1', c.x - 26);
    h.setAttribute('y1', c.y);
    h.setAttribute('x2', c.x + 26);
    h.setAttribute('y2', c.y);
    h.setAttribute('stroke', '#0f172a');
    h.setAttribute('stroke-width', '1.5');
    g.appendChild(h);

    const v = document.createElementNS(svgNS, 'line');
    v.setAttribute('x1', c.x);
    v.setAttribute('y1', c.y - 26);
    v.setAttribute('x2', c.x);
    v.setAttribute('y2', c.y + 26);
    v.setAttribute('stroke', '#0f172a');
    v.setAttribute('stroke-width', '1.5');
    g.appendChild(v);

    // Inner Fill Quarter
    const q = document.createElementNS(svgNS, 'path');
    q.setAttribute('d', `M ${c.x} ${c.y} L ${c.x + 20} ${c.y} A 20 20 0 0 1 ${c.x} ${c.y + 20} Z`);
    q.setAttribute('fill', '#0f172a');
    g.appendChild(q);

    const q3 = document.createElementNS(svgNS, 'path');
    q3.setAttribute('d', `M ${c.x} ${c.y} L ${c.x - 20} ${c.y} A 20 20 0 0 1 ${c.x} ${c.y - 20} Z`);
    q3.setAttribute('fill', '#0f172a');
    g.appendChild(q3);

    // Label
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', c.x + (c.x < 300 ? -28 : 28));
    text.setAttribute('y', c.y + (c.y < 300 ? -28 : 34));
    text.setAttribute('text-anchor', c.x < 300 ? 'start' : 'end');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', '#0f172a');
    text.textContent = c.label;
    g.appendChild(text);

    svg.appendChild(g);
  });

  // Reference Dental Points (S3 inside 6x6cm grid: 80px/cm)
  const s3Points = [
    [0.0, 3.0],
    [1.2, 3.1],
    [2.35, 3.65],
    [3.65, 2.45],
    [4.8, 2.9],
    [6.0, 3.0]
  ];

  // Polyline for Points
  const pointsString = s3Points
    .map((p) => `${60 + p[0] * 80},${540 - p[1] * 80}`)
    .join(' ');

  const poly = document.createElementNS(svgNS, 'polyline');
  poly.setAttribute('points', pointsString);
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#2563eb');
  poly.setAttribute('stroke-width', '2.5');
  svg.appendChild(poly);

  // Draw Point Circles P1..P6
  s3Points.forEach((p, idx) => {
    const px = 60 + p[0] * 80;
    const py = 540 - p[1] * 80;

    const g = document.createElementNS(svgNS, 'g');
    const pt = document.createElementNS(svgNS, 'circle');
    pt.setAttribute('cx', px);
    pt.setAttribute('cy', py);
    pt.setAttribute('r', '7');
    pt.setAttribute('fill', '#2563eb');
    pt.setAttribute('stroke', '#ffffff');
    pt.setAttribute('stroke-width', '2');
    g.appendChild(pt);

    const txt = document.createElementNS(svgNS, 'text');
    txt.setAttribute('x', px + 10);
    txt.setAttribute('y', py - 10);
    txt.setAttribute('font-size', '12');
    txt.setAttribute('font-weight', 'bold');
    txt.setAttribute('fill', '#1e293b');
    txt.textContent = `P${idx + 1}`;
    g.appendChild(txt);

    svg.appendChild(g);
  });

  // Title Text on Sheet
  const title = document.createElementNS(svgNS, 'text');
  title.setAttribute('x', '300');
  title.setAttribute('y', '36');
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#0f172a');
  title.textContent = 'LII CALIBRATION TARGET SHEET (6cm × 6cm GRID)';
  svg.appendChild(title);

  return svg;
}

export function downloadTargetSVG() {
  const svg = generateTargetSVG(1200, 1200);
  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'LII-Calibration-Target-6x6cm.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadTargetPNG() {
  const svg = generateTargetSVG(1200, 1200);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'LII-Calibration-Target-6x6cm.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.src = url;
}
