import fs from 'fs';
import { PNG } from 'pngjs';
import { estimateHomography, applyHomography } from './core/homography.js';
import { inverse3 } from './core/matrix.js';

const inputPath = './public/preset-dental-guide.png';
const outputPath = './public/preset-dental-guide-tilted.png';

const srcCorners = [
  [0, 0],
  [1000, 0],
  [1000, 1000],
  [0, 1000]
];

// Realistic top-tilted perspective projection
const dstCorners = [
  [160, 180], // Top-Left squeezed in
  [840, 180], // Top-Right squeezed in
  [950, 880], // Bottom-Right flared out
  [50, 880]   // Bottom-Left flared out
];

const H = estimateHomography(srcCorners, dstCorners);
const Hinv = inverse3(H);

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function () {
    const srcWidth = this.width;
    const srcHeight = this.height;

    const out = new PNG({ width: srcWidth, height: srcHeight });

    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const outIdx = (srcWidth * y + x) << 2;

        try {
          const [u, v] = applyHomography([x, y], Hinv);

          if (u >= 0 && u < srcWidth - 1 && v >= 0 && v < srcHeight - 1) {
            // Bilinear interpolation
            const u0 = Math.floor(u);
            const v0 = Math.floor(v);
            const u1 = u0 + 1;
            const v1 = v0 + 1;
            const du = u - u0;
            const dv = v - v0;

            const i00 = (srcWidth * v0 + u0) << 2;
            const i10 = (srcWidth * v0 + u1) << 2;
            const i01 = (srcWidth * v1 + u0) << 2;
            const i11 = (srcWidth * v1 + u1) << 2;

            for (let c = 0; c < 4; c++) {
              const top = this.data[i00 + c] * (1 - du) + this.data[i10 + c] * du;
              const bot = this.data[i01 + c] * (1 - du) + this.data[i11 + c] * du;
              out.data[outIdx + c] = Math.round(top * (1 - dv) + bot * dv);
            }
          } else {
            // Fill background with table wood tone
            out.data[outIdx] = 140;     // R
            out.data[outIdx + 1] = 115; // G
            out.data[outIdx + 2] = 85;  // B
            out.data[outIdx + 3] = 255; // A
          }
        } catch {
          out.data[outIdx] = 140;
          out.data[outIdx + 1] = 115;
          out.data[outIdx + 2] = 85;
          out.data[outIdx + 3] = 255;
        }
      }
    }

    out.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
      console.log('Perspective warped image generated successfully at:', outputPath);

      // Print new tilted C1-C4 coordinates (in normalized [0..1] range)
      const originalC1C4 = [
        [0.208 * srcWidth, 0.136 * srcHeight],
        [0.774 * srcWidth, 0.136 * srcHeight],
        [0.774 * srcWidth, 0.810 * srcHeight],
        [0.208 * srcWidth, 0.810 * srcHeight]
      ];

      const tiltedC1C4 = originalC1C4.map(pt => applyHomography(pt, H));
      const normalizedTilted = tiltedC1C4.map(([x, y]) => [
        Number((x / srcWidth).toFixed(3)),
        Number((y / srcHeight).toFixed(3))
      ]);

      console.log('New Tilted C1-C4 Normalized Coordinates:');
      console.log(JSON.stringify(normalizedTilted, null, 2));
    });
  });
