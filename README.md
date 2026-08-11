# LII Lens Lab — Homography × Error Bound Analysis

> **Mathematical Proof of Concept for Little’s Irregularity Index (LII) under Homography Distortion and 10-Epsilon Error Bound Verification**

[![Build Status](https://img.shields.io/badge/Build-Vite%208-blue.svg)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Self--Tests-36%2F36%20Passed-brightgreen.svg)](#-automated-self-test-suite)

---

## 📌 ภาพรวมโครงการ (Project Overview)

**LII Lens Lab** เป็นเว็บแอปพลิเคชันเชิงคณิตศาสตร์สำหรับการพิสูจน์เชิงประวัติตัวแบบ (Proof of Concept) ในการวัดดัชนีความไม่เป็นระเบียบของฟัน (Little’s Irregularity Index: LII) จากภาพถ่าย 2D ที่เกิดความบิดเบี้ยวเชิงทัศนียภาพ (Perspective/Homography Distortion)

โครงการนี้มุ่งเน้นการพิสูจน์ความถูกต้องทางคณิตศาสตร์และขอบเขตความคลาดเคลื่อนบน **Polyline Path Length Model** ($LII = \sum_{i=1}^5 P_iP_{i+1}$) จากพิกัด landmark 6 จุดบนขอบฟัน (incisal edge) ตามทฤษฎีบท:

$$\left| \hat{L} - L_0 \right| \le 10\varepsilon$$

โดยพิสูจน์ว่าเมื่อจุดอ้างอิงบนระนาบ $2\text{D}$ คลาดเคลื่อนไม่เกิน $\varepsilon$ ต่อจุด ผลรวมระยะทาง $5$ ช่วง ($LII$) จะมีความคลาดเคลื่อนสะสมไม่เกิน $10\varepsilon$

> **⚠️ ข้อควรระวังทางวิชาการ (Claim Guardrails):**
> โครงการนี้เป็นเพียง **Mathematical Proof of Concept** บนตัวแบบคณิตศาสตร์ $2\text{D}$ ไม่ใช่โปรแกรมตรวจวินิจฉัยทางการแพทย์ทางคลินิกจริง (Not a clinical diagnostic tool) และค่า LII ในตัวแบบนี้คือ Polyline Path Length ไม่ใช่ Clinical Displacement Index แบบดั้งเดิมที่ใช้วัดระยะห่างที่จุดสัมผัสระหว่างฟัน

## 🎯 การแยกโหมดใช้งานชัดเจน (Dual Mode Architecture)

แอปพลิเคชันแบ่งเป็น 2 โหมดหลักอย่างชัดเจนผ่านแถบสลับด้านบน:

1. **Preset Mode (โหมดสาธิตจากภาพถ่าย):**
   - ใช้ภาพถ่าย top-side view ที่ไม่มีจุดฝังอยู่ในไฟล์ แล้ววาง overlay แบบ SVG จากเว็บตามลำดับ $C_1-C_4$, สเกล 6×6 cm, $Q_1-Q_6$ และผลคำนวณ
   - ผู้ใช้ปรับตำแหน่ง $Q_1-Q_6$ ได้ ผลหลักจะคำนวณใหม่ทุกครั้งที่ปล่อยจุด ส่วนปุ่ม **ประมวลผลไปยัง Module 1–5** จะบันทึก snapshot ล่าสุดให้โมดูลวิเคราะห์ใช้ร่วมกัน
   - ใช้ calibration pipeline เดียวกับ Live Studio และส่ง snapshot เดียวกันให้ Module 1–5 โดยไม่มี dataset จำลองในหน้าวิเคราะห์

2. **📷 Live Studio Mode (โหมดกล้องถ่ายภาพจริง):**
   - ส튜디오สำหรับเปิดกล้องถ่ายภาพจริง หรือ Upload รูปถ่ายแผ่นเป้าหมายบนโต๊ะ
   - กำหนดความกว้างและความสูงของพื้นที่สอบเทียบเป็น cm ได้เอง ไม่จำกัดที่ 6×6 cm
   - ระบบคำนวณ 4-Point DLT, ย้อนพิกัด $H_{est}^{-1}$ และประมวลผลความคลาดเคลื่อนสดหน้างาน

---

## 🛠️ เทคโนโลยีและสถาปัตยกรรม (Tech Stack & Architecture)

โปรเจกต์นี้ได้รับการพัฒนาด้วยสถาปัตยกรรม **Modern Modular Vanilla JS** น้ำหนักเบา ปราศจาก Heavy Frameworks ทำให้ประมวลผลทางคณิตศาสตร์ได้อย่างรวดเร็วใน Browser และสามารถ Deploy บน **GitHub Pages** ได้ฟรี 100%

### 🧰 Tech Stack
- **Core Framework:** HTML5 + ES6 Modules (Vanilla JavaScript)
- **Build Tool:** [Vite 8](https://vite.dev/) (HMR and static production bundling)
- **Styling:** Custom CSS Design System (CSS Custom Properties, Dark Mode Tokens, Responsive Grid)
- **Typography:** Self-hosted Anuphan variable font
- **Icons:** Local Lucide icon-node registry (no runtime CDN/package resolution)
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
│   │   ├── measurement-store.js # Separate Preset/Live snapshots with independent localStorage keys
│   │   └── data.js              # Canonical numerical fixtures used by automated math tests only
│   ├── ui/                      # UI Visualization Renderers
│   │   ├── analysis-context.js  # Scoped DOM instances for Preset and Live Module 1-5
│   │   ├── image-workspace.js   # Photo layer + dynamic SVG overlay renderer
│   │   ├── icons.js             # Lucide icon registry
│   │   ├── svg-renderer.js      # Interactive 2D Vector Plotting Engine
│   │   ├── drag.js              # Touch & Pointer Drag Interaction Handlers
│   │   ├── histogram.js         # Canvas Monte Carlo Error Distribution Renderer
│   │   └── theme.js             # Light / Dark Mode Toggle & State Management
│   ├── modules/                 # Measurement workflows and analysis modules
│   │   ├── 00-preset-workflow.js # Staged photo-calibration demonstration
│   │   ├── 01-lii-builder.js    # Module 01: Confirmed coordinates and LII
│   │   ├── 02-homography-lab.js # Module 02: Actual image calibration matrix
│   │   ├── 03-error-bound.js    # Module 03: Known-reference validation only
│   │   ├── 04-monte-carlo.js   # Module 04: Uncertainty around confirmed Q snapshot
│   │   ├── 05-reproduce-18.js   # Module 05: Confirmed Q segment breakdown
│   │   └── 07-live-demo.js      # Module 07: Live Camera / Photo DLT Homography Calibration (Physical Demo)
│   └── tests/
│       ├── self-tests.js        # Automated mathematical and state-isolation tests
│       └── run-tests.js         # Node.js test runner
└── dist/                        # Production Ready Static Bundle
```

---

## 📖 คู่มือการใช้งาน (User Guide)

แอปพลิเคชันประกอบด้วย workflow สำหรับ Preset และ Live Studio โดยแต่ละหน้ามี Module 1–5 และ snapshot ที่บันทึกแยกกัน สามารถใช้งานได้ทั้งบน Desktop, Tablet และ Mobile (iOS / Android):

### 📱 การรองรับการใช้งานบน iPad และอุปกรณ์หน้าจอสัมผัส (iPad & Touch Optimization)
- **Precision Nudge D-Pad:** เพิ่มแผงควบคุมลูกศร `▲` `▼` `◄` `►` บนหน้าจอสำหรับขยับจุดที่เลือกทีละ `1px` หรือ `5px` โดยไม่ต้องใช้คีย์บอร์ด PC
- **Touch Loupe Dynamic Offset:** ตัวแว่นขยาย (Loupe) จะลอยสูงขึ้นเหนือจุดสัมผัส 65px เพื่อไม่ให้นิ้วมือบังภาพขยายขอบฟันขณะลากจุด
- **Touch Hit Target (>44px):** ขยายรัศมีขอบเขตการสัมผัสของจุด SVG ให้กดติดง่าย ไม่หลุดมือ
- **Touch Mode Toggle:** เพิ่มปุ่มสลับโหมด `[ 📍 โหมดปรับจุด ]` vs `[ ✋ โหมดเลื่อนภาพ ]` เด่นชัดบน Toolbar
- **Tablet Ergonomics:** แถบนำทางขั้นตอนและปุ่มยืนยันถูกตรึงที่ด้านล่างแบบ Sticky Bottom Bar พร้อมปรับขนาดฟอนต์ input ป้องกัน iOS Safari แอบซูมเข้าหน้าจอ

### 📷 Module 07: Live Physical Demo (สแกนภาพถ่ายจริงหน้างาน)
โมดูลสำหรับเปิดกล้องถ่ายภาพกระดาษ Calibration Target จริงบนโต๊ะเพื่อทดสอบอัลกอริทึม DLT สดๆ
> ขอบเขตการใช้งาน: Homography สมมติว่าจุดสอบเทียบและจุดวัดอยู่บนระนาบเดียวกัน จึงไม่ใช่เครื่องมือวัดพื้นผิววัตถุ 3 มิติหรือเครื่องมือวินิจฉัย
1. **กำหนด Calibration Target:** กรอกความกว้างและความสูงจริงของพื้นที่ C1-C4 เป็น cm; ภาพ Preset ใช้ 6×6 cm แต่ Live ใช้ขนาดบวกอื่นได้
2. **นำเข้าภาพถ่าย:** กด **📷 เปิดกล้องสด** (ระบบจะเลือกกล้องหลังให้อัตโนมัติบนมือถือ) หรือเลือกไฟล์ภาพถ่ายจากเครื่อง
3. **มาร์กจุดอ้างอิง 4 มุม ($C_1 - C_4$):** แตะมาร์กมุมกระดาษ 4 มุมเรียงตามลำดับ ระบบจะใช้ **4-point Direct Linear Transform (DLT)** สร้างเมทริกซ์ Homography $H_{est}$
4. **มาร์กจุดวัดระยะ ($Q_1 - Q_6$):** แตะมาร์กจุดฟันทั้ง 6 จุดบนภาพถ่าย
5. **ตรวจและส่งชุดจุด:** ระบบใช้ $H_{est}^{-1}$ แปลงพิกัดภาพกลับสู่พิกัดโลก $P̂_1-P̂_6$ และคำนวณ $L_{rec}$ ใหม่ทุกครั้งที่ปล่อยจุด เมื่อลาก $Q_1-Q_6$ จนพอใจแล้ว กด **ประมวลผลไปยัง Module 1–5** เพื่อส่ง snapshot ล่าสุดไปยัง LII Builder, Homography, Error Bound, Monte Carlo และตาราง validation การขยับ Q หลังจากนั้นยังอัปเดตผลหลักแบบ realtime แต่ Module 1–5 จะคง snapshot เดิมจนกดปุ่มอีกครั้ง สำหรับภาพตัวอย่างที่รู้พิกัดอ้างอิง ระบบจึงจะตรวจสอบขอบเขต $|L̂-L_0| \le 10\varepsilon$ ได้ ส่วนภาพที่ผู้ใช้อัปโหลดจะแสดงผลเป็น measurement only เพราะไม่มี ground truth สำหรับคำนวณ $\varepsilon$

### 📏 Module 01: LII Measurement
- แสดงพิกัด Q1-Q6 หน่วย cm, ระยะทั้ง 5 ช่วง และ LII จาก snapshot ที่ยืนยัน

### 🌀 Module 02: Image Calibration
- แสดง Q หน่วย pixel, เมทริกซ์ Homography ที่คำนวณจาก C1-C4 จริง และพิกัดที่กู้คืนเป็น cm

### 🛡️ Module 03: Measurement Validation
- คำนวณ error, $\varepsilon$ และ bound เฉพาะ snapshot ที่มี ground truth; ภาพผู้ใช้อัปโหลดจะแสดง Measurement Only

### 🎲 Module 04: Monte Carlo Lab
- จำลองการสุ่มความคลาดเคลื่อนความผิดพลาดจำนวน $100 - 18,000$ รอบ ด้วย Seeded PRNG (`mulberry32`)
- แสดงกราฟแท่งความถี่ (Histogram) บน Canvas และคำนวณสถิติ Mean, SD, P95, Max และ Pass Rate

### 📊 Module 05: Segment Analysis
- แจกแจงระยะ Q1→Q6 ทั้ง pixel, cm, cumulative LII และสัดส่วนของแต่ละช่วงจาก snapshot จริง

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

ระบบมีชุดทดสอบ 34 ข้อ ครอบคลุม Determinant, Matrix Inverse, DLT Homography estimation, Error bound, shared Preset/Live calibration และ calibration แบบกำหนดขนาดเอง:

```bash
# รันผ่าน Node.js ใน Terminal
npm test
```

ชุด numerical fixtures สำหรับ self-test ไม่ถูก import เข้า runtime ของหน้าเว็บ และรันผ่าน `npm test` เท่านั้น

### 3. การ Build และ Deploy (Production & GitHub Pages)

```bash
# Build production bundle
npm run build
```

ไฟล์ static จะถูกสร้างในโฟลเดอร์ `dist/` นำโฟลเดอร์นี้ไปอัปโหลดขึ้น GitHub Pages หรือ Web Server ได้ทันที

---

## 📜 ใบอนุญาต (License)

โครงการนี้เผยแพร่ภายใต้ใบอนุญาต **MIT License**
