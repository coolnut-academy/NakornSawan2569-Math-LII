export const PRESET_SESSION = {
  imageSrc: './preset-dental-guide.png',
  imageAlt: 'ภาพถ่าย Top-Down ของโมเดลฟันล่างบนแผ่นสอบเทียบ 6x6cm',
  tiltedImageSrc: './preset-dental-guide-tilted.png',
  tiltedImageAlt: 'ภาพถ่ายมุมเอียง (Tilted View) ของโมเดลฟันล่างบนแผ่นสอบเทียบ 6x6cm',
  cornerPointsNormalized: [
    [0.18, 0.20],
    [0.82, 0.20],
    [0.82, 0.82],
    [0.18, 0.82]
  ],
  tiltedCornerPointsNormalized: [
    [0.14, 0.23],
    [0.86, 0.23],
    [0.91, 0.87],
    [0.07, 0.87]
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

export const PRESET_PHASES = [
  { id: 1, name: ' Top-Down: จุดสอบเทียบ (C1-C4)' },
  { id: 2, name: ' Top-Down: จุดอ้างอิง (P1-P6)' },
  { id: 3, name: ' บันทึกจุดอ้างอิง P' },
  { id: 4, name: ' Tilted: ภาพเอียง & C1-C4' },
  { id: 5, name: ' Tilted: กำหนดจุด Q1-Q6' },
  { id: 6, name: ' ประมวลผลไปยัง Module 1–5' }
];

