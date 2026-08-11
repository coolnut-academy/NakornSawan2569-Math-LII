export const PRESET_SESSION = {
  imageSrc: './preset-dental-guide.png',
  imageAlt: 'ภาพถ่าย Top-Down ของโมเดลฟันล่างบนแผ่นสอบเทียบ 6x6cm',
  tiltedImageSrc: './preset-dental-guide-tilted.png',
  tiltedImageAlt: 'ภาพถ่ายมุมเอียง (Tilted View) ของโมเดลฟันล่างบนแผ่นสอบเทียบ 6x6cm',
  cornerPointsNormalized: [
    [0.165, 0.165],
    [0.835, 0.165],
    [0.835, 0.810],
    [0.165, 0.810]
  ],
  tiltedCornerPointsNormalized: [
    [0.235, 0.198],
    [0.852, 0.228],
    [0.809, 0.776],
    [0.156, 0.730]
  ],
  referencePoints: [
    [2.10, 3.65],
    [2.50, 2.75],
    [2.85, 2.45],
    [3.15, 2.45],
    [3.50, 2.75],
    [3.90, 3.65]
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

