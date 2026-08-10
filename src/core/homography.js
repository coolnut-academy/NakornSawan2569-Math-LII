// Homography transformation & DLT estimation module
import { solveLinearSystem } from './matrix.js';

export function applyHomography(p, m) {
  const x = p[0], y = p[1];
  const u = m[0][0] * x + m[0][1] * y + m[0][2];
  const v = m[1][0] * x + m[1][1] * y + m[1][2];
  const w = m[2][0] * x + m[2][1] * y + m[2][2];
  if (Math.abs(w) < 1e-12) {
    throw new Error('Point projected to infinity (w ≈ 0)');
  }
  return [u / w, v / w];
}

export function transformPoints(pts, m) {
  return pts.map((p) => applyHomography(p, m));
}

export function validateQuadrilateral(points, minArea = 1) {
  if (!Array.isArray(points) || points.length !== 4) {
    return { ok: false, reason: 'Select exactly 4 corner points.' };
  }

  if (points.some((p) => !Array.isArray(p) || p.length < 2 || !p.every(Number.isFinite))) {
    return { ok: false, reason: 'Every corner must contain finite x and y coordinates.' };
  }

  let twiceArea = 0;
  const turns = [];
  for (let i = 0; i < 4; i++) {
    const a = points[i];
    const b = points[(i + 1) % 4];
    const c = points[(i + 2) % 4];
    twiceArea += a[0] * b[1] - b[0] * a[1];
    turns.push((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]));
  }

  if (Math.abs(twiceArea) / 2 < minArea) {
    return { ok: false, reason: 'The selected corners cover too little area.' };
  }

  const hasPositive = turns.some((v) => v > 0);
  const hasNegative = turns.some((v) => v < 0);
  if (turns.some((v) => Math.abs(v) < 1e-9) || (hasPositive && hasNegative)) {
    return { ok: false, reason: 'Select the 4 corners in order around the target without crossing.' };
  }

  return { ok: true, reason: '' };
}

/**
 * Estimate 3x3 Homography Matrix from 4 point correspondences using DLT.
 * Maps srcPoints[i] -> dstPoints[i] for i = 0..3
 * @param {Array<[number, number]>} srcPoints 4 source 2D points [[x0,y0], [x1,y1], [x2,y2], [x3,y3]]
 * @param {Array<[number, number]>} dstPoints 4 destination 2D points [[x0',y0'], [x1',y1'], [x2',y2'], [x3',y3']]
 * @returns {Array<Array<number>>} 3x3 Homography Matrix with H[2][2] = 1
 */
export function estimateHomography(srcPoints, dstPoints) {
  if (srcPoints.length < 4 || dstPoints.length < 4) {
    throw new Error('At least 4 point correspondences required for Homography estimation');
  }

  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = srcPoints[i];
    const [u, v] = dstPoints[i];

    // Equation 1 for x-projection
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);

    // Equation 2 for y-projection
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  const h = solveLinearSystem(A, b);

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1.0]
  ];
}
