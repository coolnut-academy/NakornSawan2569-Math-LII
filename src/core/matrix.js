// Matrix operations module (3x3 determinant/inverse, general linear solver)

export function determinant3(m) {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

export function inverse3(m) {
  const d = determinant3(m);
  if (Math.abs(d) < 1e-14) {
    throw new Error('Singular matrix');
  }
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d1 = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], i = m[2][2];

  return [
    [(e * i - f * h), (c * h - b * i), (b * f - c * e)],
    [(f * g - d1 * i), (a * i - c * g), (c * d1 - a * f)],
    [(d1 * h - e * g), (b * g - a * h), (a * e - b * d1)]
  ].map((row) => row.map((v) => v / d));
}

export function matMul(a, b) {
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, val, k) => sum + val * b[k][j], 0))
  );
}

// Solve A * x = b using Gaussian elimination with partial pivoting
// Used for DLT homography estimation (8x8 system for 4 point correspondences)
export function solveLinearSystem(A, b) {
  const n = A.length;
  // Deep copy A and b
  const M = A.map((row) => [...row]);
  const x = [...b];

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap maxRow with i
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    [x[i], x[maxRow]] = [x[maxRow], x[i]];

    if (Math.abs(M[i][i]) < 1e-12) {
      throw new Error('Linear system is singular or ill-conditioned');
    }

    // Eliminate column i
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j < n; j++) {
        M[k][j] -= factor * M[i][j];
      }
      x[k] -= factor * x[i];
    }
  }

  // Back substitution
  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * solution[j];
    }
    solution[i] = sum / M[i][i];
  }

  return solution;
}
