import { estimateHomography, applyHomography, validateQuadrilateral } from './homography.js';
import { inverse3 } from './matrix.js';
import { lii, distance } from './math.js';

export const TARGET_SIZE_CM = 6;

export const WORLD_CORNERS = [
  [0, 0],
  [TARGET_SIZE_CM, 0],
  [TARGET_SIZE_CM, TARGET_SIZE_CM],
  [0, TARGET_SIZE_CM]
];

export function createWorldCorners(width = TARGET_SIZE_CM, height = TARGET_SIZE_CM) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Calibration width and height must be positive numbers.');
  }
  return [[0, 0], [width, 0], [width, height], [0, height]];
}

export function normalizedToPixels(points, width, height) {
  return points.map(([x, y]) => [x * width, y * height]);
}

export function projectWorldPoints(
  corners,
  worldPoints,
  targetWidth = TARGET_SIZE_CM,
  targetHeight = TARGET_SIZE_CM
) {
  const validation = validateQuadrilateral(corners);
  if (!validation.ok) throw new Error(validation.reason);
  const matrix = estimateHomography(createWorldCorners(targetWidth, targetHeight), corners);
  return worldPoints.map((point) => applyHomography(point, matrix));
}

export function calculateCalibration({
  corners,
  dataPoints,
  referencePoints = null,
  targetWidth = TARGET_SIZE_CM,
  targetHeight = TARGET_SIZE_CM
}) {
  const validation = validateQuadrilateral(corners);
  if (!validation.ok) throw new Error(validation.reason);
  if (!Array.isArray(dataPoints) || dataPoints.length !== 6) {
    throw new Error('Select exactly 6 measurement points.');
  }

  const matrix = estimateHomography(createWorldCorners(targetWidth, targetHeight), corners);
  const inverse = inverse3(matrix);
  const recoveredPoints = dataPoints.map((point) => applyHomography(point, inverse));
  const recoveredLii = lii(recoveredPoints);
  const result = {
    matrix,
    inverse,
    recoveredPoints,
    recoveredLii,
    targetWidth,
    targetHeight,
    hasKnownReference: Array.isArray(referencePoints) && referencePoints.length === 6
  };

  if (!result.hasKnownReference) return result;

  const referenceLii = lii(referencePoints);
  const epsilon = Math.max(
    ...recoveredPoints.map((point, index) => distance(point, referencePoints[index]))
  );
  const actualError = Math.abs(recoveredLii - referenceLii);
  const bound = 10 * epsilon;

  return {
    ...result,
    referenceLii,
    epsilon,
    actualError,
    bound,
    passed: actualError <= bound + 1e-9
  };
}
