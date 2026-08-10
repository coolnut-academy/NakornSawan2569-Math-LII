# LII Lens Lab — Homography × Error Bound Analysis

> **Mathematical Proof of Concept for Little’s Irregularity Index (LII) under Homography Distortion and 10-Epsilon Error Bound Verification**

[![Build Status](https://img.shields.io/badge/Build-Vite%208-blue.svg)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Self--Tests-32%2F32%20Passed-brightgreen.svg)](#-automated-self-test-suite)

---

## 📌 ภาพรวมโครงการ (Project Overview)

**LII Lens Lab** เป็นเว็บแอปพลิเคชันเชิงคณิตศาสตร์สำหรับการพิสูจน์เชิงประวัติตัวแบบ (Proof of Concept) ในการวัดดัชนีความไม่เป็นระเบียบของฟัน (Little’s Irregularity Index: LII) จากภาพถ่าย 2D ที่เกิดความบิดเบี้ยวเชิงทัศนียภาพ (Perspective/Homography Distortion)

โครงการนี้มุ่งเน้นการพิสูจน์ความถูกต้องทางคณิตศาสตร์และขอบเขตความคลาดเคลื่อนตามทฤษฎีบท:

$$\left| \hat{L} - L_0 \right| \le 10\varepsilon$$

โดยพิสูจน์ว่าเมื่อจุดอ้างอิงบนระนาบ $2\text{D}$ คลาดเคลื่อนไม่เกิน $\varepsilon$ ต่อจุด ผลรวมระยะทาง $5$ ช่วง ($LII$) จะมีความคลาดเคลื่อนสะสมไม่เกิน $10\varepsilon$

> **⚠️ ข้อควรระวังทางวิชาการ (Claim Guardrails):**
> โครงการนี้เป็นเพียง **Mathematical Proof of Concept** บนตัวแบบคณิตศาสตร์ $2\text{D}$ ไม่ใช่โปรแกรมตรวจวินิจฉัยทางการแพทย์ทางคลินิกจริง (Not a clinical diagnostic tool)

## 🎯 การแยกโหมดใช้งานชัดเจน (Dual Mode Architecture)

แอปพลิเคชันแบ่งเป็น 2 โหมดหลักอย่างชัดเจนผ่านแถบสลับด้านบน:

1. **Preset Mode (โหมดสาธิตจากภาพถ่าย):**
   - ใช้ภาพถ่าย top-side view ที่ไม่มีจุดฝังอยู่ในไฟล์ แล้ววาง overlay แบบ SVG จากเว็บตามลำดับ $C_1-C_4$, สเกล 6×6 cm, $Q_1-Q_6$ และผลคำนวณ
   - ใช้ calibration pipeline เดียวกับ Live Studio และรวมแบบจำลอง $S_1-S_6$, Error Bound, Monte Carlo และตาราง 18 เงื่อนไขไว้ในโหมดเดียวกัน

2. **📷 Live Studio Mode (โหมดกล้องถ่ายภาพจริง):**
   - ส튜디오สำหรับเปิดกล้องถ่ายภาพจริง หรือ Upload รูปถ่ายแผ่นเป้าหมายบนโต๊ะ
   - ระบบคำนวณ 4-Point DLT, ย้อนพิกัด $H_{est}^{-1}$ และประมวลผลความคลาดเคลื่อนสดหน้างาน

---

## 🛠️ เทคโนโลยีและสถาปัตยกรรม (Tech Stack & Architecture)

โปรเจกต์นี้ได้รับการพัฒนาด้วยสถาปัตยกรรม **Modern Modular Vanilla JS** น้ำหนักเบา ปราศจาก Heavy Frameworks ทำให้ประมวลผลทางคณิตศาสตร์ได้อย่างรวดเร็วใน Browser และสามารถ Deploy บน **GitHub Pages** ได้ฟรี 100%

### 🧰 Tech Stack
- **Core Framework:** HTML5 + ES6 Modules (Vanilla JavaScript)
- **Build Tool:** [Vite 8](https://vite.dev/) (HMR and static production bundling)
- **Styling:** Custom CSS Design System (CSS Custom Properties, Dark Mode Tokens, Responsive Grid)
- **Typography:** Self-hosted IBM Plex Sans Thai + IBM Plex Mono
- **Icons:** Lucide
- **Deployment:** GitHub Pages / Any Static Web Server (`base: './'`)

### 🏗️ โครงสร้างไฟล์ในระบบ (Directory Architecture)

```text
NakornSawan2569-Math-LII/
├── index.html                    # HTML5 Main Entry Point (Semantic Structure)
├── vite.config.js               # Vite Configuration (Relative base output)
├── package.json                 # Project dependencies & scripts
├── README.md                    # Project Documentation
├── src/
│   ├── main.js                  # Application Bootstrap & Module Loader
│   ├── style.css                # CSS Design System + Dark Mode Tokens + Mobile Styles
│   ├── redesign.css             # Professional UI overrides and image-workspace layout
│   ├── core/                    # Engine ทางคณิตศาสตร์หลัก (Math Core)
│   │   ├── calibration-session.js # Shared Preset/Live calibration pipeline
│   │   ├── preset-session-data.js # Preset image, points and staged frames
│   │   ├── math.js              # Vector/Scalar Math, LII, Euclidean Distance, PRNG (mulberry32)
│   │   ├── matrix.js            # 3x3 Determinant, Matrix Inverse, Gaussian Elimination Solver
│   │   ├── homography.js        # Point Transformations & 4-Point DLT Homography Estimation
│   │   └── data.js              # Canonical Datasets (S1-S6), Homography Matrices (H1-H3), Published Results
│   ├── ui/                      # UI Visualization Renderers
│   │   ├── image-workspace.js   # Photo layer + dynamic SVG overlay renderer
│   │   ├── icons.js             # Lucide icon registry
│   │   ├── svg-renderer.js      # Interactive 2D Vector Plotting Engine
│   │   ├── drag.js              # Touch & Pointer Drag Interaction Handlers
│   │   ├── histogram.js         # Canvas Monte Carlo Error Distribution Renderer
│   │   └── theme.js             # Light / Dark Mode Toggle & State Management
│   ├── modules/                 # Interactive Application Modules (00 - 07)
│   │   ├── 00-preset-workflow.js # Staged photo-calibration demonstration
│   │   ├── 01-lii-builder.js    # Module 01: Interactive LII Builder
│   │   ├── 02-homography-lab.js # Module 02: Homography Distortion & Inverse Recovery Lab
│   │   ├── 03-error-bound.js    # Module 03: 10-Epsilon Interactive Proof
│   │   ├── 04-monte-carlo.js   # Module 04: Seeded Monte Carlo Simulation Lab
│   │   ├── 05-reproduce-18.js   # Module 05: 18 Primary Conditions Validation Table
│   │   ├── 06-owner-mode.js     # Module 06: Academic Presentation Q&A & Claim Guardrails
│   │   └── 07-live-demo.js      # Module 07: Live Camera / Photo DLT Homography Calibration (Physical Demo)
│   └── tests/
│       ├── self-tests.js        # Automated Test Suite (32 Tests)
│       └── run-tests.js         # Node.js test runner
└── dist/                        # Production Ready Static Bundle
```

---

## 📖 คู่มือการใช้งาน (User Guide)

แอปพลิเคชันประกอบด้วย 7 โมดูลหลัก สามารถใช้งานได้ทั้งบน Desktop, Tablet และ Mobile (iOS / Android):

### 📷 Module 07: Live Physical Demo (สแกนภาพถ่ายจริงหน้างาน)
โมดูลสำหรับเปิดกล้องถ่ายภาพกระดาษ Calibration Target จริงบนโต๊ะเพื่อทดสอบอัลกอริทึม DLT สดๆ
> ขอบเขตการใช้งาน: Homography สมมติว่าจุดสอบเทียบและจุดวัดอยู่บนระนาบเดียวกัน จึงไม่ใช่เครื่องมือวัดพื้นผิววัตถุ 3 มิติหรือเครื่องมือวินิจฉัย
1. **เตรียมแผ่น Calibration Target (6×6 cm):** วางแผ่นพิมพ์เป้าหมายบนโต๊ะในมุมเอียงตามต้องการ (หรือกดปุ่ม **✨ ใช้ภาพตัวอย่างจำลอง**)
2. **นำเข้าภาพถ่าย:** กด **📷 เปิดกล้องสด** (ระบบจะเลือกกล้องหลังให้อัตโนมัติบนมือถือ) หรือเลือกไฟล์ภาพถ่ายจากเครื่อง
3. **มาร์กจุดอ้างอิง 4 มุม ($C_1 - C_4$):** แตะมาร์กมุมกระดาษ 4 มุมเรียงตามลำดับ ระบบจะใช้ **4-point Direct Linear Transform (DLT)** สร้างเมทริกซ์ Homography $H_{est}$
4. **มาร์กจุดวัดระยะ ($Q_1 - Q_6$):** แตะมาร์กจุดฟันทั้ง 6 จุดบนภาพถ่าย
5. **ดูผลลัพธ์ย้อนพิกัด $H_{est}^{-1}$:** ระบบจะใช้ $H_{est}^{-1}$ แปลงพิกัดภาพพิกเซลกลับสู่พิกัดโลก $P̂_1 - P̂_6$ และคำนวณ $L_{rec}$ สำหรับภาพตัวอย่างที่รู้พิกัด S3 ระบบจึงจะตรวจสอบขอบเขต $|L̂ - L_0| \le 10\varepsilon$ ได้ ส่วนภาพที่ผู้ใช้อัปโหลดจะแสดงผลเป็น measurement only เพราะไม่มี ground truth สำหรับคำนวณ $\varepsilon$

### 📏 Module 01: LII Builder
- เลือกชุดพิกัดมาตรฐาน $S_1 - S_6$ หรือใช้เมาส์/นิ้วลากจุด $P_1 - P_6$ บนระนาบอ้างอิง $2\text{D}$
- ระบบจะคำนวณผลรวมระยะทาง 5 ช่วง ($LII$) และอัปเดตตารางพิกัดแบบ Real-time

### 🌀 Module 02: Homography Lab
- เลือก Dataset ($S_1-S_6$) และเมทริกซ์ Homography ($H_1-H_3$)
- เปรียบเทียบกราฟ 3 ช่อง: **Original** (พิกัดเดิม) → **Distorted** (บิดเบี้ยว $L_{raw}$) → **Recovered** (กู้คืนด้วย $H^{-1}$ ได้ $L_{rec}$)

### 🛡️ Module 03: Error Bound Lab ($10\varepsilon$ Proof)
- ปรับแถบสไลด์กำหนดค่าความคลาดเคลื่อน $\varepsilon$ ($0.05 - 0.50$ หน่วย)
- สุ่มจุดหรือลากจุดในวงกลมรัศมี $\varepsilon$ เพื่อพิสูจน์ว่าค่าความคลาดเคลื่อนจริง $|L̂ - L_0|$ จะไม่มีทางเกิน $10\varepsilon$

### 🎲 Module 04: Monte Carlo Lab
- จำลองการสุ่มความคลาดเคลื่อนความผิดพลาดจำนวน $100 - 18,000$ รอบ ด้วย Seeded PRNG (`mulberry32`)
- แสดงกราฟแท่งความถี่ (Histogram) บน Canvas และคำนวณสถิติ Mean, SD, P95, Max และ Pass Rate

### 📊 Module 05: Reproduce 18 Conditions
- ตารางแสดงผลการทดลอง $6 \text{ Datasets} \times 3 \text{ Homographies} = 18 \text{ เงื่อนไข}$ เปรียบเทียบกับค่าที่รายงานในเอกสารวิจัย

### 🎓 Module 06: Owner Mode
- คลังคำถาม-คำตอบ สำหรับทดสอบความเข้าใจในการนำเสนอโครงงานและป้องกันการกล่าวอ้างเกินหลักฐาน (Overclaim Detection)

---

## 💻 คู่มือสำหรับนักพัฒนา (Developer Guide)

### 1. การติดตั้งและการรันในเครื่อง (Local Setup)

```bash
# 1. Clone repository
git clone https://github.com/coolnut-academy/NakornSawan2569-Math-LII.git
cd NakornSawan2569-Math-LII

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

เปิด Browser ที่ `http://localhost:5173`

### 2. การรันชุดทดสอบอัตโนมัติ (Automated Self-Tests)

ระบบมีชุดทดสอบ 32 ข้อ ครอบคลุม Determinant, Matrix Inverse, DLT Homography estimation, Error bound และ shared Preset/Live calibration session:

```bash
# รันผ่าน Node.js ใน Terminal
npm test
```

หรือเปิดหน้าเว็บแล้วเติม Query parameter `?debug=1` เช่น: `http://localhost:5173/?debug=1`

### 3. การ Build และ Deploy (Production & GitHub Pages)

```bash
# Build production bundle
npm run build
```

ไฟล์ static จะถูกสร้างในโฟลเดอร์ `dist/` นำโฟลเดอร์นี้ไปอัปโหลดขึ้น GitHub Pages หรือ Web Server ได้ทันที

---

## 📜 ใบอนุญาต (License)

โครงการนี้เผยแพร่ภายใต้ใบอนุญาต **MIT License**
