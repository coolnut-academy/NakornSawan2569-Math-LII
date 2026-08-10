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

export function normalizedToPixels(points, width, height) {
  return points.map(([x, y]) => [x * width, y * height]);
}

export function projectWorldPoints(corners, worldPoints) {
  const validation = validateQuadrilateral(corners);
  if (!validation.ok) throw new Error(validation.reason);
  const matrix = estimateHomography(WORLD_CORNERS, corners);
  return worldPoints.map((point) => applyHomography(point, matrix));
}

export function calculateCalibration({ corners, dataPoints, referencePoints = null }) {
  const validation = validateQuadrilateral(corners);
  if (!validation.ok) throw new Error(validation.reason);
  if (!Array.isArray(dataPoints) || dataPoints.length !== 6) {
    throw new Error('Select exactly 6 measurement points.');
  }

  const matrix = estimateHomography(WORLD_CORNERS, corners);
  const inverse = inverse3(matrix);
  const recoveredPoints = dataPoints.map((point) => applyHomography(point, inverse));
  const recoveredLii = lii(recoveredPoints);
  const result = {
    matrix,
    inverse,
    recoveredPoints,
    recoveredLii,
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
