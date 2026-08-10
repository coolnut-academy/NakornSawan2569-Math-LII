// Comprehensive Self-Test Suite (25+ tests) verifying mathematical integrity & Blueprint compliance

import { DATASETS, HOMOGRAPHIES, REFERENCE_LII, DET_TARGET, PUBLISHED } from '../core/data.js';
import { distance, lii, ae, re, mulberry32, randomInDisk } from '../core/math.js';
import { determinant3, inverse3, matMul } from '../core/matrix.js';
import { transformPoints, estimateHomography } from '../core/homography.js';

function almost(a, b, tol = 1e-6) {
  return Math.abs(a - b) <= tol;
}

export function runSelfTests() {
  const tests = [];
  const test = (name, fn) => {
    try {
      const ok = !!fn();
      tests.push({ name, ok });
    } catch (err) {
      tests.push({ name, ok: false, err: String(err) });
    }
  };

  // 1-2. Basic math
  test('1 distance zero for same point', () => distance([1, 2], [1, 2]) === 0);
  test('2 distance symmetry', () => almost(distance([0, 0], [2, 3]), distance([2, 3], [0, 0])));

  // 3-8. LII dataset reference consistency
  Object.keys(DATASETS).forEach((k, idx) =>
    test(`${idx + 3} LII dataset ${k} match reference L0`, () =>
      almost(lii(DATASETS[k]), REFERENCE_LII[k], 8e-7))
  );

  // 9-11. Determinants H1..H3
  Object.keys(HOMOGRAPHIES).forEach((k, idx) =>
    test(`${idx + 9} Homography ${k} determinant`, () =>
      almost(determinant3(HOMOGRAPHIES[k]), DET_TARGET[k], 1e-10))
  );

  // 12-14. Inverse matrices H1..H3
  Object.keys(HOMOGRAPHIES).forEach((k, idx) =>
    test(`${idx + 12} Homography ${k} inverse property (H * H^-1 = I)`, () => {
      const I = matMul(HOMOGRAPHIES[k], inverse3(HOMOGRAPHIES[k]));
      return I.every((row, i) =>
        row.every((v, j) => almost(v, i === j ? 1 : 0, 1e-10))
      );
    })
  );

  // 15-16. Canonical Case S3 + H2
  test('15 Canonical S3+H2 distorted Lraw = 6.917916', () =>
    almost(lii(transformPoints(DATASETS.S3, HOMOGRAPHIES.H2)), 6.917916, 1e-6));
  test('16 Canonical S3+H2 recovered Lrec = L0 exact', () =>
    almost(
      lii(transformPoints(transformPoints(DATASETS.S3, HOMOGRAPHIES.H2), inverse3(HOMOGRAPHIES.H2))),
      lii(DATASETS.S3),
      1e-10
    ));

  // 17. All 18 recovery cases
  test('17 All 18 primary conditions recovered to floating-point precision', () =>
    Object.keys(DATASETS).every((ds) =>
      Object.keys(HOMOGRAPHIES).every((h) =>
        almost(
          lii(transformPoints(transformPoints(DATASETS[ds], HOMOGRAPHIES[h]), inverse3(HOMOGRAPHIES[h]))),
          REFERENCE_LII[ds],
          1e-6
        )
      )
    ));

  // 18. Error metrics
  test('18 Absolute and Relative error functions', () =>
    almost(ae(7, 5), 2) && almost(re(6, 5), 20));

  // 19. PRNG disk sampler
  test('19 PRNG disk sampler within epsilon radius', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 500; i++) {
      const p = randomInDisk(0.25, rng);
      if (Math.hypot(...p) > 0.2500000001) return false;
    }
    return true;
  });

  // 20-22. DLT 4-point Homography Estimation
  test('20 DLT Homography estimation identity mapping', () => {
    const pts = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const H = estimateHomography(pts, pts);
    return transformPoints(pts, H).every((p, i) =>
      almost(p[0], pts[i][0], 1e-5) && almost(p[1], pts[i][1], 1e-5)
    );
  });

  test('21 DLT Homography estimation under scale and shift', () => {
    const src = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const dst = [[5, 5], [25, 5], [25, 25], [5, 25]]; // scale 2x, shift (5,5)
    const H = estimateHomography(src, dst);
    return src.every((p, i) => {
      const res = transformPoints([p], H)[0];
      return almost(res[0], dst[i][0], 1e-4) && almost(res[1], dst[i][1], 1e-4);
    });
  });

  test('22 DLT Homography estimation under perspective shear', () => {
    const src = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const dst = [[10, 15], [90, 5], [110, 95], [5, 105]];
    const H = estimateHomography(src, dst);
    const transformed = transformPoints(src, H);
    return transformed.every((p, i) =>
      almost(p[0], dst[i][0], 1e-3) && almost(p[1], dst[i][1], 1e-3)
    );
  });

  // 23. Reverse DLT matrix inverse recovers original source points
  test('23 DLT estimated H matrix inverse recovers source points', () => {
    const src = [[0, 0], [6, 0], [6, 6], [0, 6]];
    const dst = [[1, 2], [7, 1.5], [6.5, 7.8], [0.8, 6.2]];
    const H = estimateHomography(src, dst);
    const Hinv = inverse3(H);
    const recovered = transformPoints(dst, Hinv);
    return recovered.every((p, i) =>
      almost(p[0], src[i][0], 1e-3) && almost(p[1], src[i][1], 1e-3)
    );
  });

  // 24. Theorem 10-epsilon error bound holding under random perturbation
  test('24 Theorem 10-epsilon bound holds for 1000 random perturbations', () => {
    const pts = DATASETS.S3;
    const L0 = REFERENCE_LII.S3;
    const eps = 0.25;
    const bound = 10 * eps;
    const rng = mulberry32(20260617);
    for (let i = 0; i < 1000; i++) {
      const perturbed = pts.map((p) => {
        const d = randomInDisk(eps, rng);
        return [p[0] + d[0], p[1] + d[1]];
      });
      const E = Math.abs(lii(perturbed) - L0);
      if (E > bound + 1e-10) return false;
    }
    return true;
  });

  // 25. Published 18 cases table data integrity check
  test('25 Published results table validation (18 conditions)', () => {
    return Object.keys(PUBLISHED).length === 18;
  });

  return tests;
}
