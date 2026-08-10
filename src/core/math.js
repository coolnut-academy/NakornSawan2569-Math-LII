// General mathematical helpers for LII and error calculations

export const clonePoints = (pts) => pts.map((p) => [p[0], p[1]]);

export const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export const lii = (pts) => {
  if (!pts || pts.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    sum += distance(pts[i], pts[i + 1]);
  }
  return sum;
};

export const ae = (a, b) => Math.abs(a - b);

export const re = (estimate, truth) => {
  if (truth === 0) return 0;
  return (Math.abs(estimate - truth) / Math.abs(truth)) * 100;
};

export const fmt = (v, d = 6) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toFixed(d);
};

export const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInDisk(radius, rng = Math.random) {
  const angle = rng() * Math.PI * 2;
  const r = Math.sqrt(rng()) * radius;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}
