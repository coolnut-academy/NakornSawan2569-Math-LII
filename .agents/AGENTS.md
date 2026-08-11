# AGENTS.md — LII Lens Lab

> กฎและแนวปฏิบัติสำหรับ AI Agent ที่ทำงานกับโครงการนี้

---

## Project Identity

- **ชื่อโครงการ**: LII Lens Lab — Homography × Error Bound Analysis
- **ภาษาหลัก**: JavaScript (ES Modules, Vanilla — ไม่ใช้ Framework)
- **Build Tool**: Vite 8
- **ภาษา UI/Documentation**: ไทย (Thai) เป็นภาษาหลักของ UI text, คอมเมนต์ในโค้ดเป็นภาษาอังกฤษ
- **ลักษณะ**: Single-Page Application สำหรับ Mathematical Proof of Concept (ไม่ใช่ Clinical Tool)

---

## Architecture Rules

### Layer Separation
- **`src/core/`** — Pure mathematical functions; **ห้าม** import DOM APIs หรือ `document`
- **`src/ui/`** — Presentation components ที่ interact กับ DOM
- **`src/modules/`** — Feature modules ที่เชื่อม core + ui เข้าด้วยกัน
- อย่าข้ามลำดับชั้น: core ต้องไม่ import จาก ui หรือ modules

### Dual-Mode Architecture
- ระบบมี **2 โหมดอิสระ**: Preset Mode และ Live Studio Mode
- แต่ละโหมดมี `MeasurementStore` แยกกัน (`presetMeasurementStore` / `liveMeasurementStore`)
- Analysis Modules 01–05 ถูก init **2 ครั้ง** — ครั้งหนึ่งต่อโหมด ผ่าน `initAnalysisModules(root, store)`
- DOM instances ถูก clone ด้วย `mountAnalysisInstances()` และ re-prefix IDs เป็น `live-*`
- **ห้ามใช้ `document.getElementById()` ตรงๆ ใน Module 01–05** — ให้ใช้ `getAnalysisElement(root, id)` แทน เพื่อให้ scope ถูกต้อง

### Snapshot-Based Data Flow
- Module 01–05 อัปเดตเมื่อได้รับ `subscribe()` callback จาก MeasurementStore เท่านั้น
- Workflow modules (00, 07) จะเรียก `store.publish()` เมื่อผู้ใช้กดปุ่มยืนยัน
- **ห้าม** ให้ Module 01–05 เขียนกลับเข้า store

### Immutability
- `measurement-store.js` deep-clone ทุกครั้ง — publish, subscribe callback, get
- **อย่า** mutate object ที่ได้รับจาก store โดยตรง

---

## Coding Conventions

### Style
- ใช้ **ES Modules** (`import` / `export`) — ไม่ใช้ CommonJS
- ใช้ **`const`** เป็นค่าเริ่มต้น, ใช้ `let` เมื่อจำเป็น, **ห้าม** `var`
- ใช้ **arrow functions** สำหรับ callbacks
- ใช้ **template literals** แทน string concatenation
- ตั้งชื่อไฟล์เป็น **kebab-case** (เช่น `calibration-session.js`)
- ตั้งชื่อตัวแปร/ฟังก์ชัน เป็น **camelCase**
- ตั้งชื่อค่าคงที่เป็น **UPPER_SNAKE_CASE** (เช่น `TARGET_SIZE_CM`)
- Module files ใน `modules/` มีเลขนำหน้า (เช่น `01-lii-builder.js`)

### Comments
- คอมเมนต์ในโค้ดเขียนเป็น **ภาษาอังกฤษ**
- UI text (labels, tooltips, error messages) เขียนเป็น **ภาษาไทย**
- JSDoc ใช้เฉพาะฟังก์ชันที่ซับซ้อน (เช่น `estimateHomography`)

### DOM Access Patterns
```javascript
// ✅ ถูกต้อง — ใน Module 01–05
const get = (id) => getAnalysisElement(root, id);
const element = get('liveLii');

// ❌ ผิด — จะหา element ผิด instance
const element = document.getElementById('liveLii');
```

```javascript
// ✅ ถูกต้อง — ใน Module 00, 07 (มี instance เดียว)
const status = document.getElementById('presetStageStatus');
```

### Error Handling
- ฟังก์ชัน core ใช้ `throw new Error(...)` สำหรับ invalid input
- UI modules ใช้ safe guard (`if (!element) return`) ไม่ crash หาก DOM ไม่พร้อม
- localStorage access ใช้ `try/catch` เสมอ เพราะอาจถูก block ใน private browsing

---

## File Modification Guidelines

### เพิ่ม Module ใหม่
1. สร้างไฟล์ใน `src/modules/` ด้วยเลขนำหน้า (เช่น `06-new-module.js`)
2. Export `initNewModule({ root, store })` — รับ DOM root และ store
3. ใช้ `getAnalysisElement(root, id)` สำหรับ DOM access
4. เรียก `store.subscribe(callback)` เพื่อรับ measurement data
5. เพิ่ม HTML section ใน `index.html` ภายใน `#presetAnalysisModules`
6. Import และเรียก init ใน `main.js` → `initAnalysisModules()`

### เพิ่มฟังก์ชัน Math ใหม่
1. เพิ่มใน `src/core/math.js` หรือสร้างไฟล์ใหม่ใน `src/core/`
2. **ห้าม** import DOM APIs ใน core layer
3. เพิ่ม test ใน `src/tests/self-tests.js`
4. รัน `npm test` เพื่อยืนยัน

### แก้ไข CSS
- Design tokens (สี, spacing, typography) อยู่ใน `src/style.css`
- Image workspace + professional overrides อยู่ใน `src/redesign.css`
- ใช้ CSS Custom Properties (`var(--name)`) เสมอ ไม่ hardcode สี
- Dark mode: เพิ่ม overrides ใน `[data-theme="dark"]` block

### แก้ไข HTML
- `index.html` มี markup ทั้งหมดของ app — มีขนาดใหญ่ (~33KB)
- Section ที่อยู่ใน `#presetAnalysisModules` จะถูก clone ไปยัง Live ด้วย `analysis-context.js`
- ดังนั้นการเพิ่ม/แก้ element ใน section นี้จะมีผลทั้ง 2 โหมด
- **ห้าม** ใช้ `id` ซ้ำใน HTML — ระบบ clone จะ re-prefix เป็น `live-*`

---

## Testing

### Running Tests
```bash
npm test
```

### Writing Tests
- เพิ่ม test ใน `src/tests/self-tests.js` ด้วย pattern:
```javascript
test('N description', () => {
  // return truthy for pass, falsy for fail
  return almost(actual, expected, tolerance);
});
```
- ใช้ `almost(a, b, tol)` สำหรับ floating-point comparison
- Test เลขต่อเนื่อง (ปัจจุบันถึง 36)
- `data.js` มีชุดตัวเลขสำหรับ test เท่านั้น ไม่ถูก import ใน production runtime

### Test Categories
| Range | Coverage |
|-------|----------|
| 1–2 | Basic math |
| 3–8 | LII dataset consistency |
| 9–14 | Matrix operations |
| 15–17 | Homography distortion/recovery |
| 18–19 | Error functions + PRNG |
| 20–25 | DLT estimation + 10ε theorem |
| 26–27 | Quadrilateral validation |
| 28–36 | Calibration pipeline + store isolation |

---

## Important Constraints

### ⚠️ Mathematical Integrity
- **ห้ามแก้ค่าตัวเลขใน `data.js`** โดยไม่เข้าใจผลกระทบ — ค่าเหล่านี้เป็น canonical fixtures ที่ test ทั้งหมดอ้างอิง
- **ห้ามเปลี่ยน LII formula** — `lii(pts) = Σ distance(pts[i], pts[i+1])` สำหรับ i = 0..4
- **ห้ามเปลี่ยน 10ε bound** — เป็นผลจากทฤษฎีบททางคณิตศาสตร์ที่พิสูจน์แล้ว
- `calculateCalibration()` เป็น single source of truth สำหรับ calibration pipeline

### ⚠️ Domain Guardrails
- โปรเจกต์นี้เป็น **Mathematical Proof of Concept** เท่านั้น
- **ห้ามเพิ่มข้อความที่สื่อว่าเป็นเครื่องมือวินิจฉัยทางการแพทย์**
- เมื่อภาพไม่มี ground truth → ต้องแสดง "MEASUREMENT ONLY" ไม่ใช่ PASS/FAIL

### ⚠️ Store Isolation
- `presetMeasurementStore` และ `liveMeasurementStore` ต้องแยกกันเสมอ
- **ห้าม** ให้ข้อมูลข้ามโหมด
- Test #36 ตรวจ isolation นี้อยู่แล้ว

---

## Build & Deploy

```bash
npm run dev      # Dev server (Vite HMR) → http://localhost:5173
npm run build    # Production → dist/
npm run preview  # Preview production build
npm test         # 36 self-tests (Node.js)
```

- `base: './'` ใน `vite.config.js` — ใช้ relative paths สำหรับ GitHub Pages
- ไม่มี backend — ทุกอย่าง client-side
- dist/ คือ production output ที่พร้อม deploy

---

## Key File Reference

| File | Role | Notes |
|------|------|-------|
| `index.html` | All HTML markup | ~33KB, มี KaTeX CDN, semantic sections |
| `src/main.js` | Bootstrap + event wiring | Init theme → mount modules → bind navigation |
| `src/core/calibration-session.js` | Main calibration engine | Used by both Preset + Live |
| `src/core/measurement-store.js` | Pub/sub state management | Deep-clone, localStorage, 2 instances |
| `src/ui/analysis-context.js` | DOM cloning for dual mode | Re-prefix IDs, `for`, `href` |
| `src/ui/image-workspace.js` | Photo + overlay workspace | SVG overlay, drag, keyboard, resize |
| `src/modules/07-live-demo.js` | Live camera/upload workflow | Largest module (~440 lines) |
| `src/tests/self-tests.js` | Math + integration tests | 36 tests, deterministic |
