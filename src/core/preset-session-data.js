export const PRESET_SESSION = {
  imageSrc: new URL('../assets/preset-dental-guide-v3-top-down.png', import.meta.url).href,
  imageAlt: 'ภาพถ่ายมุมบนของโมเดลฟันล่างบนแผ่นสอบเทียบ',
  cornerPointsNormalized: [
    [0.208, 0.136],
    [0.774, 0.136],
    [0.774, 0.81],
    [0.208, 0.81]
  ],
  referencePoints: [
    [1.45, 4.38],
    [1.95, 4.72],
    [2.5, 4.9],
    [3.08, 4.92],
    [3.65, 4.7],
    [4.18, 4.36]
  ]
};

export const PRESET_FRAMES = [
  { phase: 0, corners: 0, points: 0, scale: false, result: false },
  { phase: 1, corners: 1, points: 0, scale: false, result: false },
  { phase: 1, corners: 2, points: 0, scale: false, result: false },
  { phase: 1, corners: 3, points: 0, scale: false, result: false },
  { phase: 1, corners: 4, points: 0, scale: false, result: false },
  { phase: 2, corners: 4, points: 0, scale: true, result: false },
  { phase: 3, corners: 4, points: 1, scale: true, result: false },
  { phase: 3, corners: 4, points: 2, scale: true, result: false },
  { phase: 3, corners: 4, points: 3, scale: true, result: false },
  { phase: 3, corners: 4, points: 4, scale: true, result: false },
  { phase: 3, corners: 4, points: 5, scale: true, result: false },
  { phase: 3, corners: 4, points: 6, scale: true, result: false },
  { phase: 4, corners: 4, points: 6, scale: true, result: true }
];

export const PRESET_PHASE_LABELS = [
  'ภาพต้นฉบับ',
  'จุดสอบเทียบ',
  'กำหนดสเกล',
  'จุดวัด LII',
  'ผลการคำนวณ'
];
