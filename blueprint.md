# BLUEPRINT — Homography × LII Mathematical Proof of Concept

> **โครงงาน:** แบบจำลองโฮโมกราฟีและการวิเคราะห์ขอบเขตความคลาดเคลื่อนของดัชนีความซ้อนเกของฟันจากภาพจำลอง  
> **English title:** *A Homography-Based Model and Error-Bound Analysis for Little’s Irregularity Index from Simulated Images*  
> **ประเภท:** โครงงานคณิตศาสตร์ที่บูรณาการความรู้ในคณิตศาสตร์ไปประยุกต์ใช้  
> **สถานะเอกสาร:** Current Project Blueprint / Mathematical Source of Truth  
> **เวอร์ชัน:** 1.0  
> **อัปเดต:** 8 สิงหาคม 2569 (2026-08-08)

---

## 0. บทบาทของเอกสารนี้

ไฟล์นี้เป็น **Blueprint กลางของโครงงาน** สำหรับใช้เป็นฐานในการสร้างหรือแก้ไขงานต่อไป เช่น

- รายงานโครงงาน 5 บท
- บทคัดย่อ / Proposal / Poster
- สไลด์นำเสนอและสคริปต์
- เอกสารซ้อมตอบกรรมการ
- เว็บไซต์หรือ Web Proof of Concept
- โค้ดสำหรับทำซ้ำการคำนวณ
- ภาพประกอบเชิงแนวคิด

หลักสำคัญคือ เอกสารหรือซอฟต์แวร์ที่สร้างต่อจาก Blueprint นี้ต้องรักษา **ตัวตนของงานให้เป็นโครงงานคณิตศาสตร์ประยุกต์** ไม่เปลี่ยนแกนไปเป็นโครงงานทันตกรรม โครงงาน Computer Vision หรือโครงงานพัฒนา Web App

### 0.1 Source-of-Truth Priority

หากข้อมูลจากหลายไฟล์ขัดกัน ให้ยึดลำดับดังนี้

1. **รายงานโครงงานฉบับสมบูรณ์ 41 หน้า**
2. ตาราง/ตัวเลข Published Results ที่ถอดจากรายงาน
3. Blueprint ฉบับนี้
4. เอกสารนำเสนอ / Q&A / เว็บไซต์
5. แนวคิดต่อยอดในอนาคต

สิ่งที่เป็นเพียงแนวคิดต่อยอด **ห้ามเขียนย้อนกลับให้ดูเหมือนเป็นสิ่งที่ทดลองแล้วในงานปัจจุบัน**

---

# 1. Project Identity

## 1.1 ชื่อภาษาไทย

**แบบจำลองโฮโมกราฟีและการวิเคราะห์ขอบเขตความคลาดเคลื่อนของดัชนีความซ้อนเกของฟันจากภาพจำลอง**

## 1.2 ชื่อภาษาอังกฤษ

**A Homography-Based Model and Error-Bound Analysis for Little’s Irregularity Index from Simulated Images**

## 1.3 ผู้จัดทำ

1. นางสาวชญานุตม์ แจ่มจันทร์
2. นางสาววรวลัญช์ จันทร์วิไลลักษณ์
3. นางสาววรัญญา ศิริรัตน์

## 1.4 ครูที่ปรึกษา

1. นางสาวพรไพลิน ตาไฝ
2. นายสาธิต ศิริวัชน์

## 1.5 สถานศึกษา

โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ  
สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาแม่ฮ่องสอน

## 1.6 บริบทการแข่งขัน

โครงงานคณิตศาสตร์ ประเภท **โครงงานคณิตศาสตร์ที่บูรณาการความรู้ในคณิตศาสตร์ไปประยุกต์ใช้** สำหรับการแข่งขันคณิตศาสตร์วิชาการ ครั้งที่ 11 ระดับชาติ ประจำปีการศึกษา 2569

---

# 2. แก่นของโครงงานในหนึ่งประโยค

> **เมื่อระยะทางยูคลิดถูกคำนวณจากพิกัดที่ผ่าน Projective Distortion ค่า LII สามารถเปลี่ยนไปได้ แต่ภายใต้แบบจำลองที่ทราบ Homography อย่างถูกต้อง เราสามารถใช้เมทริกซ์ผกผันแปลงพิกัดกลับ และพิสูจน์ได้ว่าหากพิกัดหลังแปลงกลับคลาดไม่เกิน \(\varepsilon\) ต่อจุด ความคลาดเคลื่อนของ LII จะไม่เกิน \(10\varepsilon\).**

สมการที่เป็น **signature equation** ของโครงงานคือ

\[
\boxed{|\hat L-L_0|\leq 10\varepsilon}
\]

---

# 3. ปัญหาทางคณิตศาสตร์

Little’s Irregularity Index (LII) มีโครงสร้างเป็นผลรวมของระยะทางยูคลิดระหว่างจุดเรียงลำดับ 6 จุด รวม 5 ช่วง

เมื่อพิกัดของจุดเหล่านี้อยู่บนระนาบอ้างอิง เราสามารถคำนวณระยะได้โดยตรง แต่เมื่อพิกัดถูกเปลี่ยนผ่านการแปลงเชิงฉายหรือ **Homography** ความเป็นเส้นตรงยังคงอยู่ แต่ระยะทางยูคลิดและมุมโดยทั่วไปไม่ถูกเก็บรักษา

ดังนั้นคำถามหลักของงานไม่ใช่เพียง “คำนวณ LII ได้หรือไม่” แต่คือ

> **เมื่อข้อมูลพิกัดผ่านการบิดเบี้ยวเชิงฉาย เราจะอธิบาย ผลักกลับ และกำหนดขอบเขตของความคลาดเคลื่อนด้วยคณิตศาสตร์ได้อย่างไร**

---

# 4. ตำแหน่งทางวิชาการของงาน

## 4.1 รูปแบบงาน

งานนี้เป็น

> **Applied Mathematics — Mathematical Proof of Concept using controlled 2D simulated data**

จุดแข็งของงานคือการเชื่อมแนวคิดหลายส่วนเข้าเป็น pipeline เดียว ได้แก่

1. ระบบพิกัดคาร์ทีเซียน
2. ระยะทางยูคลิด
3. LII ในฐานะฟังก์ชันผลรวมระยะทาง
4. พิกัดเอกพันธ์
5. เมทริกซ์โฮโมกราฟี
6. เมทริกซ์ผกผัน
7. Triangle Inequality / Reverse Triangle Inequality
8. Error Bound
9. Deterministic Perturbation
10. Monte Carlo Simulation

## 4.2 Contribution ที่ควรกล่าวอ้าง

ภายในขอบเขตของโครงงาน จุดเด่นคือการจัดปัญหาเป็นระบบ

> **controlled homography distortion → inverse recovery → error propagation bound for LII → deterministic and Monte Carlo verification**

สิ่งที่ควรเน้นคือ **การสร้างแบบจำลองและบทพิสูจน์ในบริบทของ LII** ไม่ใช่การอ้างว่าเป็นผู้ค้นพบว่า Homography ไม่รักษาระยะทาง เพราะสมบัตินั้นเป็นความรู้พื้นฐานของ Projective Geometry อยู่แล้ว

## 4.3 สิ่งที่ห้ามกล่าวอ้าง

ห้ามเขียนหรือพูดว่า

- ระบบนี้วินิจฉัยความซ้อนเกของฟันจากภาพจริงได้แล้ว
- มีความแม่นยำทางคลินิกแล้ว
- ใช้แทนทันตแพทย์ได้
- ค่า error ระดับ \(10^{-15}\) คือความแม่นยำที่คาดหวังจากภาพจริง
- Monte Carlo 18,000 รอบเป็น “บทพิสูจน์” ของทฤษฎีบท
- งานนี้เป็นสิ่งที่ “ไม่เคยมีใครทำในโลก” หากยังไม่มี Literature Verification ที่รองรับคำกล่าวนั้น

---

# 5. คำถามของโครงงาน

1. เมื่อพิกัดจุดบนระนาบถูกแปลงด้วยโฮโมกราฟี การคำนวณระยะทางจากพิกัดที่บิดเบี้ยวโดยตรงจะทำให้ค่า LII แตกต่างจากค่าต้นฉบับเพียงใด
2. เมื่อทราบเมทริกซ์โฮโมกราฟีอย่างถูกต้อง การใช้เมทริกซ์ผกผันสามารถแปลงพิกัดกลับและกู้คืนค่า LII ต้นฉบับได้หรือไม่
3. เมื่อพิกัดแต่ละจุดคลาดเคลื่อนไม่เกิน \(\varepsilon\) หน่วย ความคลาดเคลื่อนของค่า LII เป็นไปตามขอบเขต \(10\varepsilon\) ที่พิสูจน์ไว้หรือไม่

---

# 6. วัตถุประสงค์ของโครงงาน

1. เพื่อสร้างชุดข้อมูลตัวอย่างจำลองของจุดบนระนาบจำนวน 6 ชุด ชุดละ 6 จุด และคำนวณค่า LII อ้างอิงของแต่ละชุด
2. เพื่อศึกษาการคำนวณค่า LII จากพิกัดที่ผ่านการบิดเบี้ยวด้วยโฮโมกราฟีโดยตรง
3. เพื่อศึกษาการใช้เมทริกซ์ผกผันของโฮโมกราฟีในการแปลงพิกัดกลับสู่ระนาบอ้างอิงก่อนคำนวณค่า LII
4. เพื่อพิสูจน์และตรวจสอบเชิงคำนวณว่า หากพิกัดแต่ละจุดคลาดเคลื่อนไม่เกิน \(\varepsilon\) หน่วย ความคลาดเคลื่อนของ LII จะไม่เกิน \(10\varepsilon\)

---

# 7. สมมติฐานทางคณิตศาสตร์

1. การคำนวณระยะทางยูคลิดจากพิกัดที่ผ่าน Homography โดยตรงจะให้ค่า LII แตกต่างจากค่าอ้างอิง เนื่องจาก Homography โดยทั่วไปไม่รักษาระยะทางยูคลิด
2. หากเมทริกซ์โฮโมกราฟี \(H\) เป็นเมทริกซ์ไม่เอกฐานและทราบค่าอย่างถูกต้อง การใช้ \(H^{-1}\) กับพิกัดที่เกิดจาก \(H\) จะกู้คืนพิกัดต้นฉบับได้ภายในความคลาดเคลื่อนเชิงตัวเลข
3. หากพิกัดทุกจุดคลาดเคลื่อนไม่เกิน \(\varepsilon\) หน่วย ความคลาดเคลื่อนสัมบูรณ์ของค่า LII จะไม่เกิน \(10\varepsilon\) หน่วย

---

# 8. ขอบเขตของโครงงาน

## 8.1 ด้านข้อมูล

- ใช้พิกัดจำลองบนระนาบสองมิติ
- มีชุดข้อมูลหลัก 6 ชุด ได้แก่ S1–S6
- แต่ละชุดประกอบด้วยจุดเรียงลำดับ 6 จุด
- ไม่ใช่ข้อมูลส่วนบุคคล
- ไม่มีการใช้ข้อมูลผู้ป่วยจริงเป็นฐานของผลการทดลองหลัก

## 8.2 ด้านคณิตศาสตร์

ใช้แนวคิดหลักดังต่อไปนี้

- Cartesian Coordinates
- Euclidean Distance
- Euclidean Norm
- Homogeneous Coordinates
- Matrix Multiplication
- 3×3 Homography Matrix
- Matrix Inverse
- Triangle Inequality
- Reverse Triangle Inequality
- Absolute / Relative Error
- Monte Carlo Simulation

## 8.3 ด้านการจำลอง

- Homography 3 ระดับ: H1, H2, H3
- 6 coordinate sets × 3 homographies = **18 primary distortion conditions**
- ระดับความคลาดเคลื่อนหลัก: \(\varepsilon=0.10, 0.25, 0.50\)
- มีทั้ง deterministic perturbation และ random perturbation

## 8.4 ด้านการสรุปผล

สรุปได้เฉพาะ

> **ความเป็นไปได้และคุณสมบัติภายในแบบจำลองสองมิติภายใต้สมมติฐานที่กำหนด**

ไม่สรุปความแม่นยำกับ

- ภาพทันตกรรมจริง
- การตรวจหา landmark จริง
- การประมาณ Homography จากภาพจริง
- โครงสร้างสามมิติ
- การวินิจฉัยหรือการรักษาทางคลินิก

---

# 9. ตัวแปรที่ศึกษา

| ประเภท | รายละเอียด |
|---|---|
| ตัวแปรต้น | รูปแบบพิกัดต้นฉบับ, ระดับ Homography, ระดับ \(\varepsilon\), วิธีคำนวณก่อน/หลังแปลงกลับ |
| ตัวแปรตาม | ค่า LII, AE, RE, ความคลาดเคลื่อนหลัง recovery, ผลตรวจสอบ \(E\leq10\varepsilon\) |
| ตัวแปรควบคุม | จำนวนและลำดับ 6 จุด, หน่วยพิกัด, สูตร Euclidean distance, เมทริกซ์ในแต่ละเงื่อนไข, precision และลำดับขั้นการคำนวณ |

---

# 10. Mathematical Source of Truth

## 10.1 จุดต้นฉบับ

กำหนด

\[
P_i=(x_i,y_i),\qquad i=1,2,\ldots,6
\]

## 10.2 ระยะหนึ่งช่วง

\[
d_i=\|P_{i+1}-P_i\|
=\sqrt{(x_{i+1}-x_i)^2+(y_{i+1}-y_i)^2}
\]

เมื่อ \(i=1,2,\ldots,5\)

## 10.3 Little’s Irregularity Index

\[
L_0
=\sum_{i=1}^{5}d_i
=\sum_{i=1}^{5}
\sqrt{(x_{i+1}-x_i)^2+(y_{i+1}-y_i)^2}
\]

ใน Blueprint นี้ \(L_0\) หมายถึงค่าอ้างอิงที่คำนวณจากพิกัดต้นฉบับ

## 10.4 พิกัดเอกพันธ์

\[
\widetilde P_i=
\begin{bmatrix}
x_i\\y_i\\1
\end{bmatrix}
\]

## 10.5 Homography

\[
\widetilde Q_i\sim H\widetilde P_i
\]

สัญลักษณ์ \(\sim\) หมายถึงเท่ากันถึงตัวคูณสเกลที่ไม่เป็นศูนย์ในพิกัดเอกพันธ์

หาก

\[
H\widetilde P_i=
\begin{bmatrix}
a\\b\\c
\end{bmatrix},\qquad c\neq0
\]

พิกัดคาร์ทีเซียนหลังแปลงคือ

\[
Q_i=\left(\frac{a}{c},\frac{b}{c}\right)
\]

## 10.6 ค่า LII บนพิกัดบิดเบี้ยว

\[
L_{raw}
=\sum_{i=1}^{5}\|Q_{i+1}-Q_i\|
\]

โดยทั่วไป

\[
L_{raw}\neq L_0
\]

เพราะ Projective Homography ไม่ได้รักษา Euclidean distance โดยทั่วไป

## 10.7 การแปลงกลับ

ถ้า \(\det(H)\neq0\) จะมี \(H^{-1}\)

\[
H^{-1}\widetilde Q_i
\sim
H^{-1}H\widetilde P_i
=
\widetilde P_i
\]

หลัง normalization ในกรณีอุดมคติจะได้จุดต้นฉบับคืน และ

\[
L_{rec}=L_0
\]

ในคอมพิวเตอร์ค่าที่ได้อาจต่างกันระดับ floating-point precision

---

# 11. ทฤษฎีบทขอบเขตความคลาดเคลื่อน

## 11.1 สมมติฐาน

ให้ \(\hat P_i\) เป็นพิกัดที่ใช้คำนวณหลัง recovery/perturbation และกำหนดว่า

\[
\|\hat P_i-P_i\|\leq\varepsilon
\qquad \text{สำหรับทุก } i=1,\ldots,6
\]

นิยาม

\[
d_i=\|P_{i+1}-P_i\|
\]

และ

\[
\hat d_i=\|\hat P_{i+1}-\hat P_i\|
\]

## 11.2 ความคลาดเคลื่อนของหนึ่งช่วง

จาก Reverse Triangle Inequality

\[
|\hat d_i-d_i|
\leq
\| (\hat P_{i+1}-\hat P_i)-(P_{i+1}-P_i) \|
\]

จัดรูปได้เป็น

\[
|\hat d_i-d_i|
\leq
\| (\hat P_{i+1}-P_{i+1})-(\hat P_i-P_i) \|
\]

ใช้ Triangle Inequality

\[
|\hat d_i-d_i|
\leq
\|\hat P_{i+1}-P_{i+1}\|
+
\|\hat P_i-P_i\|
\]

ดังนั้น

\[
\boxed{|\hat d_i-d_i|\leq2\varepsilon}
\]

## 11.3 ความคลาดเคลื่อนของ LII ทั้งหมด

เนื่องจาก LII มี 5 ช่วง

\[
\hat L=\sum_{i=1}^{5}\hat d_i
\]

จึงได้

\[
|\hat L-L_0|
=
\left|\sum_{i=1}^{5}(\hat d_i-d_i)\right|
\leq
\sum_{i=1}^{5}|\hat d_i-d_i|
\]

และ

\[
|\hat L-L_0|
\leq
5(2\varepsilon)
\]

ดังนั้น

\[
\boxed{|\hat L-L_0|\leq10\varepsilon}
\]

## 11.4 การตีความที่ถูกต้อง

- \(10\varepsilon\) เป็น **upper bound**
- เป็นค่ารับประกันภายใต้สมมติฐานของบทพิสูจน์
- ไม่ใช่ expected error
- ไม่ได้บอกว่า error จริงต้องใกล้ \(10\varepsilon\)
- หากการทดลองที่ตรงตามสมมติฐานทุกข้อให้ค่าเกิน \(10\varepsilon\) ต้องตรวจ implementation / นิยาม error / การใช้ \(\varepsilon\) ทันที ไม่ควรตัดทิ้งเป็น outlier
- \(\varepsilon\) ใน theorem หมายถึง error ของพิกัด **บนระนาบที่นำไปคำนวณ LII** ไม่ใช่ pixel error ดิบจากภาพโดยอัตโนมัติ

---

# 12. นิยาม Error Metrics

## 12.1 Absolute Error

\[
AE=|L-L_0|
\]

## 12.2 Relative Error

\[
RE(\%)=\frac{|L-L_0|}{L_0}\times100
\]

## 12.3 Error สำหรับตรวจ theorem

\[
E=|\hat L-L_0|
\]

ตรวจเงื่อนไข

\[
E\leq10\varepsilon
\]

---

# 13. ชุดข้อมูลต้นฉบับ S1–S6

> ค่าในส่วนนี้ถือเป็น **canonical numerical data** ของโครงงานปัจจุบัน

```text
S1 = [(0,0), (1.2,0.08), (2.4,-0.05), (3.6,0.06), (4.8,-0.07), (6,0)]
S2 = [(0,0), (1.2,0.25), (2.4,-0.18), (3.6,0.20), (4.8,-0.22), (6,0.05)]
S3 = [(0,0), (1.2,0.10), (2.35,0.65), (3.65,-0.55), (4.8,-0.10), (6,0)]
S4 = [(0,0), (1.15,0.55), (2.45,-0.60), (3.55,0.70), (4.85,-0.50), (6,0.15)]
S5 = [(0,0.10), (1.25,0.70), (2.30,0.30), (3.70,-0.65), (4.75,-0.20), (6,0.05)]
S6 = [(0,0), (1.10,0.95), (2.55,-0.80), (3.45,1.10), (4.95,-0.75), (6,0.25)]
```

### 13.1 คำอธิบายเชิงรูปแบบ

| ชุด | ลักษณะ | \(L_0\) |
|---|---|---:|
| S1 | เกือบเป็นแนวตรง | 6.023777 |
| S2 | เบี่ยงเบนเล็กน้อยแบบสลับทิศ | 6.260587 |
| S3 | จุดกึ่งกลางเบี่ยงเบนเด่นชัด | 6.687163 |
| S4 | เบี่ยงเบนสลับหลายตำแหน่ง | 7.803514 |
| S5 | เบี่ยงเบนแบบไม่สมมาตร | 6.619166 |
| S6 | เบี่ยงเบนระดับมาก | 9.660188 |

---

# 14. Homography Matrices H1–H3

## H1 — ระดับต่ำ

\[
H_1=
\begin{bmatrix}
1.02 & 0.03 & 0.50\\
0.01 & 0.98 & 0.30\\
0.0008 & 0.0005 & 1
\end{bmatrix}
\]

\[
\det(H_1)=0.99876470
\]

## H2 — ระดับปานกลาง

\[
H_2=
\begin{bmatrix}
1.08 & 0.12 & 1.00\\
-0.05 & 0.95 & 0.80\\
0.004 & 0.002 & 1
\end{bmatrix}
\]

\[
\det(H_2)=1.02675600
\]

## H3 — ระดับสูง

\[
H_3=
\begin{bmatrix}
0.90 & 0.30 & 1.50\\
-0.18 & 1.08 & 1.00\\
0.015 & -0.008 & 1
\end{bmatrix}
\]

\[
\det(H_3)=1.01556000
\]

ทั้งสามเมทริกซ์มี determinant ไม่เท่ากับศูนย์ จึงมี inverse

---

# 15. Experimental Pipeline

ลำดับหลักของโครงงานคือ

```text
Original coordinates P_i
        ↓
Compute reference L0
        ↓
Apply H1 / H2 / H3
        ↓
Distorted coordinates Q_i
        ↓
Compute L_raw directly
        ↓
Apply corresponding H^-1
        ↓
Recovered coordinates
        ↓
Compute L_rec
        ↓
Add bounded coordinate perturbation
        ↓
Compute L_hat and E = |L_hat - L0|
        ↓
Check E ≤ 10ε
        ↓
Deterministic + Monte Carlo verification
```

## 15.1 Primary Conditions

\[
6\text{ datasets}\times3\text{ homographies}=18\text{ conditions}
\]

## 15.2 Numerical Reproducibility Settings

- double-precision floating-point
- ไม่ปัดค่าระหว่างขั้นตอน
- \(\varepsilon=0,0.10,0.25,0.50\) ตามบริบทของการทดลอง
- Monte Carlo: 1,000 trials ต่อ dataset ต่อระดับ \(\varepsilon\)
- ระดับสุ่มหลัก 3 ค่า: 0.10, 0.25, 0.50
- รวม Monte Carlo = \(6\times3\times1000=18,000\) trials
- reported seed = `20260617`

### Implementation caution

หากนำไป reimplement ในภาษา/ระบบใหม่ ต้องระบุชนิดของ Pseudo-Random Number Generator เพิ่มเติม เพราะ **seed เดียวกันอย่างเดียวไม่รับประกันว่าจะได้ random sequence แบบ bit-for-bit ตรงกันข้ามภาษา** หาก PRNG ต่างชนิดกัน

ดังนั้นควรแยกระหว่าง

- **Published Results** = ตัวเลขจากรายงาน
- **New Reproduction Run** = ผลที่รันใหม่ด้วย PRNG ที่ระบุชัดเจน

---

# 16. Published Results — Distortion

ผลการคำนวณ LII จากพิกัดที่บิดเบี้ยวโดยตรงแตกต่างจากค่าอ้างอิงใน **ทั้ง 18 เงื่อนไข**

| Homography | Mean AE | Mean RE (%) | Maximum RE (%) |
|---|---:|---:|---:|
| H1 | 0.0601 | 0.8780 | 1.4489 |
| H2 | 0.2076 | 3.1170 | 5.1248 |
| H3 | 0.6953 | 10.6177 | 17.2956 |

### Interpretation

1. ความบิดเบี้ยวที่มากขึ้นโดยรวมทำให้ error เพิ่มขึ้น
2. Error ไม่ได้ขึ้นกับ Homography เพียงอย่างเดียว แต่ขึ้นกับ **configuration ของจุด** ด้วย
3. จึงไม่ควรอธิบายปัญหาว่าเป็นเพียง “scale factor เดียว”

---

# 17. Published Results — Inverse Recovery

เมื่อใช้ inverse Homography ที่ตรงกับเมทริกซ์ที่ใช้สร้าง distortion ค่า LII ทั้ง 18 เงื่อนไขกลับสู่ค่าอ้างอิงภายใน floating-point precision

\[
\boxed{\max AE_{recovered}=3.55\times10^{-15}}
\]

### การตีความที่ต้องระวัง

ผลนี้เกิดใน **idealized validation** เพราะ

- ใช้ \(H\) ที่ทราบค่าชัดเจนสร้าง distortion
- ใช้ \(H^{-1}\) ของเมทริกซ์เดียวกันย้อนกลับ

จึงเป็นการตรวจ internal mathematical consistency ไม่ใช่การทดสอบว่าในภาพจริงเราจะประมาณ \(H\) ได้แม่นถึงระดับนี้

---

# 18. Canonical Demonstration — S3 + H2

กรณี S3 + H2 ใช้เป็นตัวอย่างหลักในการสาธิต เพราะเห็นผลของ distortion ชัดเจนและค่าตัวเลขเหมาะกับการอธิบาย

\[
L_0=6.687163
\]

\[
L_{raw}=6.917916
\]

\[
AE=0.230753
\]

\[
RE=3.4507\%
\]

หลัง inverse recovery

\[
L_{rec}=6.687163
\]

และ

\[
AE_{recovered}=8.88\times10^{-16}
\]

กรณีนี้ควรใช้เป็น default example ใน

- สไลด์
- เว็บไซต์
- การอธิบายหน้าบูธ
- Q&A
- ตัวอย่างคำนวณในภาคผนวก

---

# 19. Deterministic Perturbation Results

| \(\varepsilon\) | Mean E | Maximum E | Bound \(10\varepsilon\) | Maximum ratio | Pass |
|---:|---:|---:|---:|---:|---:|
| 0.10 | 0.041749 | 0.103830 | 1.00 | 0.103830 | 100% |
| 0.25 | 0.142077 | 0.304422 | 2.50 | 0.121769 | 100% |
| 0.50 | 0.418297 | 0.766518 | 5.00 | 0.153304 | 100% |

ผลใช้แสดงว่าการ perturb แบบกำหนดทิศทางยังคงเป็นไปตาม theorem ภายใต้เงื่อนไขที่กำหนด

---

# 20. Monte Carlo Results

| \(\varepsilon\) | Mean E | Mean SD | Highest P95 | Maximum E | Bound pass |
|---:|---:|---:|---:|---:|---:|
| 0.10 | 0.092660 | 0.068565 | 0.31568 | 0.53357 | 100% |
| 0.25 | 0.236248 | 0.174167 | 0.84832 | 1.54729 | 100% |
| 0.50 | 0.506325 | 0.377472 | 1.61372 | 2.99537 | 100% |

รวมทั้งหมด

\[
\boxed{18,000/18,000\text{ trials satisfied }E\leq10\varepsilon}
\]

### ความหมายของผลนี้

Monte Carlo มีหน้าที่

- แสดง empirical behavior ของ error
- ตรวจว่า implementation สอดคล้องกับ theorem
- แสดงการกระจายของผลเมื่อ perturbation เป็นแบบสุ่ม

Monte Carlo **ไม่ใช่** บทพิสูจน์ของ theorem เพราะจำนวนครั้งที่สุ่มยังเป็นจำนวนจำกัด

---

# 21. สามข้อสรุปหลักของโครงงาน

## Conclusion 1 — Distortion matters

\[
L_{raw}\neq L_0
\]

การคำนวณ Euclidean distance บนพิกัดที่ผ่าน Projective Distortion โดยตรงสามารถทำให้ค่า LII เปลี่ยนไปอย่างมีนัยสำคัญเชิงตัวเลขในแบบจำลอง

## Conclusion 2 — Correct inverse recovers the reference plane in the ideal model

\[
H^{-1}Q\rightarrow P
\]

เมื่อ \(H\) ไม่เป็นเอกฐานและทราบค่าอย่างถูกต้อง inverse homography สามารถกู้พิกัดและ LII กลับได้ภายใน floating-point precision

## Conclusion 3 — LII error is bounded

\[
\boxed{|\hat L-L_0|\leq10\varepsilon}
\]

ถ้าพิกัดทั้ง 6 จุดบนระนาบที่ใช้คำนวณคลาดไม่เกิน \(\varepsilon\) ต่อจุด theorem รับประกันว่า absolute LII error ไม่เกิน \(10\varepsilon\)

---

# 22. Claim Boundary Matrix

| ประโยค | สถานะ |
|---|---|
| Homography โดยทั่วไปไม่รักษา Euclidean distance | Supported |
| พิกัดบิดเบี้ยวทั้ง 18 เงื่อนไขให้ LII ต่างจาก \(L_0\) | Supported by current simulation |
| Correct inverse recovered all 18 cases within floating-point precision | Supported by current simulation |
| หาก point error ≤ \(\varepsilon\) แล้ว LII error ≤ \(10\varepsilon\) | Mathematically proven under assumptions |
| Monte Carlo 18,000 รอบไม่ละเมิด bound | Supported by current simulation |
| ระบบนี้แม่นกับภาพฟันจริง | **Unsupported** |
| ระบบนี้ผ่าน clinical validation | **Unsupported** |
| ระบบนี้ประมาณ Homography จากภาพจริงได้แล้ว | **Unsupported in current project** |
| ระบบนี้ใช้แทนการวัดโดยทันตแพทย์ได้ | **Unsupported / must not claim** |
| งานนี้ไม่เคยมีใครทำมาก่อนในโลก | **Needs external literature verification** |

---

# 23. ข้อจำกัดที่ต้องเขียนให้ชัด

1. ใช้ข้อมูลจำลองสองมิติ ไม่ใช่ข้อมูล clinical
2. Homography ถูกกำหนดไว้ล่วงหน้า ไม่ได้ estimated จาก noisy image correspondences
3. Inverse recovery ใช้ inverse ของเมทริกซ์ที่ใช้สร้าง distortion จึงเป็น idealized controlled test
4. ไม่ได้รวม error จาก automatic landmark detection
5. ไม่ได้รวม camera calibration error
6. ไม่ได้รวม lens distortion
7. ไม่ได้รวม occlusion / perspective ambiguity ของโครงสร้างสามมิติ
8. ไม่ได้ทดสอบ inter-rater / intra-rater reliability บน landmark จริง
9. ไม่ได้ benchmark เทียบกับ rectification algorithm อื่น
10. ไม่ได้ยืนยัน threshold หรือ clinical interpretation ของ LII จาก workflow นี้

---

# 24. บทบาทของทันตกรรมในโครงงาน

บริบททันตกรรมทำหน้าที่เป็น **application context** ของปัญหาคณิตศาสตร์

สิ่งที่นำมาจาก LII คือโครงสร้าง

> 6 ordered points → 5 Euclidean segments → sum of distances

ตัวตนของงานจึงควรอธิบายว่า

> “เราใช้ LII เป็นกรณีศึกษาเพื่อวิเคราะห์ผลของ Projective Distortion ต่อปริมาณที่สร้างจากผลรวมของ Euclidean distances”

ไม่ควรทำให้กรรมการเข้าใจว่างานมุ่งพัฒนาเครื่องมือวินิจฉัยทันตกรรมในเวอร์ชันปัจจุบัน

---

# 25. บทบาทของ Web Proof of Concept

เว็บไซต์ไม่ใช่ผลลัพธ์วิจัยหลัก แต่เป็น **Proof of Concept / Learning Interface / Reproduction Interface** ที่ช่วยให้ผู้ใช้เห็นคณิตศาสตร์ทำงานจริง

ชื่อที่ใช้ในปัจจุบัน:

> **LII Lens Lab — Homography × Error Bound**

## 25.1 Goal ของเว็บ

ทำให้ผู้เรียนหรือกรรมการสามารถ

1. เห็นว่าภาพ/ระนาบที่ถูก project ทำให้ระยะเปลี่ยน
2. ลากจุด P1–P6 และคำนวณ LII แบบ real time
3. เลือก S1–S6
4. เลือก H1–H3
5. ดู Original / Distorted / Recovered
6. ดู \(L_0\), \(L_{raw}\), \(L_{rec}\), AE, RE
7. ทดลอง error bound ด้วย \(\varepsilon\)
8. เห็น proof ladder: \(\varepsilon\to2\varepsilon\to5(2\varepsilon)\to10\varepsilon\)
9. รัน Monte Carlo ใน browser
10. เปรียบเทียบผลใหม่กับ Published Results
11. ทำ Owner Mode / Q&A / Overclaim Detector

## 25.2 Current Technical Direction

- Static website
- `index.html` runtime เดียว
- HTML + CSS + Vanilla JavaScript
- ไม่มี backend
- ไม่มี database
- ไม่มี authentication
- deploy ได้บน GitHub Pages

## 25.3 กฎสำคัญของเว็บ

- ข้อมูล S1–S6, H1–H3 และ Published Results ต้องตรงรายงาน
- ห้ามใช้ค่าที่ปัดเศษแล้วไปคำนวณต่อภายใน
- ต้องแยก Published Results กับ Browser Re-run
- ต้องมีข้อความชัดว่าไม่ใช่เครื่องมือวินิจฉัย
- หากมี self-tests ต้องทดสอบ LII, determinant, inverse, S3+H2 และ recovery ทั้ง 18 เงื่อนไข

---

# 26. โครงสร้างรายงาน 5 บท

## บทที่ 1 — บทนำ

ต้องตอบ

- ปัญหาคืออะไร
- ทำไม Euclidean distance บน distorted plane จึงน่าสงสัย
- ทำไมเลือก LII เป็นกรณีศึกษา
- คำถาม 3 ข้อ
- วัตถุประสงค์ 4 ข้อ
- สมมติฐาน 3 ข้อ
- ขอบเขต / ตัวแปร / นิยาม
- ย้ำว่าเป็น Mathematical Proof of Concept

## บทที่ 2 — เอกสารและงานวิจัยที่เกี่ยวข้อง

แกนสำคัญ

1. Little’s Irregularity Index
2. Cartesian coordinates / Euclidean distance / norm
3. Triangle Inequality / Reverse Triangle Inequality
4. Matrix transformations
5. Homogeneous coordinates
6. Projective geometry / Homography
7. Matrix inverse
8. Error metrics
9. Monte Carlo / uncertainty concepts
10. งานที่เกี่ยวข้องกับ LII จากภาพหรือแบบจำลองดิจิทัล
11. การสังเคราะห์เป็น conceptual framework ของงาน

## บทที่ 3 — วิธีการดำเนินงาน

ต้องมี

- รูปแบบ Mathematical Proof of Concept
- S1–S6
- \(L_0\)
- H1–H3
- Homography transformation + normalization
- direct distorted calculation
- inverse recovery
- theorem/proof \(10\varepsilon\)
- deterministic perturbation
- Monte Carlo
- double precision / no intermediate rounding / seed

## บทที่ 4 — ผลการดำเนินงาน

ลำดับที่แนะนำ

1. Reference LII ของ S1–S6
2. ผล direct distorted 18 conditions
3. Aggregate H1/H2/H3
4. Inverse recovery
5. Case study S3+H2
6. Deterministic perturbation
7. Monte Carlo
8. ตารางตอบวัตถุประสงค์

## บทที่ 5 — สรุป อภิปรายผล และข้อเสนอแนะ

ต้องแยก

- สิ่งที่พิสูจน์ได้ทางคณิตศาสตร์
- สิ่งที่ simulation สนับสนุน
- สิ่งที่ยังไม่ศึกษา
- เหตุผลที่ \(10\varepsilon\) เป็น upper bound
- ความหมายของ ideal inverse recovery
- แนวทางไปสู่ real-image study ในอนาคต

---

# 27. Presentation Blueprint

การนำเสนอไม่ควรย่อรายงาน 5 บท แต่ควรเล่าเป็นเรื่องเดียว

> **Problem → Model → Proof → Computation → Limits**

Baseline deck ปัจจุบัน = **11 slides / ประมาณ 10–12 นาที**

1. Title + mathematical hook
2. ปัญหา: distance after projective distortion
3. Research questions
4. Mathematical model: 6×3 = 18 conditions
5. Why Homography changes distance
6. Proof: \(\varepsilon\to2\varepsilon\to10\varepsilon\)
7. Experiment design
8. Result: distortion changes LII
9. Result: inverse recovery
10. Result: Monte Carlo and bound
11. Conclusions + scope

### Presentation priority

สมการที่กรรมการควรจำได้คือ

\[
\boxed{|\hat L-L_0|\leq10\varepsilon}
\]

### ห้ามทำให้ slide deck กลายเป็น

- ตาราง 18 แถวเต็มหน้า
- matrix H1–H3 เต็มทุกตัวในหลายสไลด์
- literature review ยาว ๆ
- บทที่ 1–5 แบบหนังสือ
- demo webapp ที่แย่งแกนคณิตศาสตร์

---

# 28. Q&A Guardrails

คำถามเสี่ยงสูงที่ผู้จัดทำต้องตอบให้ได้โดยไม่ดูสคริปต์

## 28.1 ทำไมหนึ่งช่วงไม่เกิน \(2\varepsilon\)?

เพราะระยะหนึ่งช่วงมีปลายสองจุด และแต่ละปลายอาจคลาดได้ไม่เกิน \(\varepsilon\); ใช้ Reverse Triangle Inequality และ Triangle Inequality จึงได้ไม่เกิน \(2\varepsilon\)

## 28.2 ทำไมทั้ง LII ไม่เกิน \(10\varepsilon\)?

เพราะ LII มี 5 ช่วง จึงได้ \(5\times2\varepsilon=10\varepsilon\)

## 28.3 ทำไม inverse recovery จึงแทบสมบูรณ์?

เพราะงานสร้าง distortion ด้วย \(H\) ที่ทราบ แล้วใช้ \(H^{-1}\) ของเมทริกซ์เดียวกันย้อนกลับ เป็น intentional idealized validation

## 28.4 ถ้า Monte Carlo รันล้านครั้งถือว่าพิสูจน์ theorem หรือไม่?

ไม่ เพราะการสุ่มจำนวนเท่าใดก็ยังเป็น finite cases; theorem รับประกันทุกกรณีภายใต้สมมติฐานจาก mathematical proof

## 28.5 ถ้าพบหนึ่ง trial เกิน \(10\varepsilon\) จะทำอย่างไร?

หาก input ยังตรงสมมติฐาน ต้องถือว่าเป็นสัญญาณให้ตรวจ bug, error definition หรือ implementation ไม่ควรอธิบายว่าเป็น outlier

## 28.6 ทำไมไม่ใช้ภาพจริงตั้งแต่แรก?

เพราะงานปัจจุบันต้องการ internal ground truth ที่รู้แน่นอน เพื่อแยกศึกษาผลของ Homography และ theorem โดยไม่ปะปน error จาก camera, landmark, H estimation หรือ 3D geometry

---

# 29. Reference Anchors ที่ควรรักษาในงานเขียน

แหล่งหลักในรายงานปัจจุบันแบ่งบทบาทดังนี้

- **Little (1975)** — ที่มาของ Little’s Irregularity Index
- **Hartley & Zisserman (2004)** — Projective geometry, homogeneous coordinates, homography
- **Szeliski (2022)** — Computer Vision / geometric transformations ตามบริบท
- **Almasoud & Bearn (2010)** — LII/ภาพหรือแบบจำลองดิจิทัลตามบริบท
- **Tran et al. (2003)** — การวัด/แบบจำลองทางทันตกรรมตามบริบท
- **Palazzo et al. (2020)** — digital/image-based dental measurement ตามบริบท
- **Alrasheed et al. (2022)** — งานด้าน digital dental measurement ตามบริบท
- **JCGM (2008a, 2008b, 2020)** — uncertainty / Monte Carlo guidance ตามบริบท
- **Taylor & Kuyatt (1994)** — uncertainty of measurement
- **Fishman (1996)** — Monte Carlo simulation

กฎ: อ้างอิงเหล่านี้สนับสนุน **ทฤษฎีและบริบท** แต่ไม่ใช้เป็นหลักฐานว่าระบบของโครงงานผ่าน clinical validation

---

# 30. แนวทางต่อยอดหลังจบ Proof of Concept

สิ่งต่อไปนี้เป็น **future work ไม่ใช่ผลของโครงงานปัจจุบัน**

## Phase A — Synthetic robustness

- perturb Homography parameters
- study condition number / sensitivity
- compare different point configurations
- study anisotropic or correlated coordinate noise

## Phase B — Image-plane experiment

- สร้าง planar calibration target
- ถ่ายภาพด้วยมุมควบคุม
- estimate \(H\) จาก correspondences แทนการกำหนด \(H\) ตรง ๆ
- เปรียบเทียบ estimated \(H^{-1}\) กับ known reference

## Phase C — Physical dental model

- ใช้แบบจำลองกายภาพที่ไม่ใช่ผู้ป่วย
- กำหนด landmark โดยผู้เชี่ยวชาญ
- ทดสอบ repeatability
- วิเคราะห์ error จาก landmark + H estimation + image acquisition

## Phase D — Real/clinical validation

ต้องมี

- ผู้เชี่ยวชาญทางทันตกรรม
- protocol ชัดเจน
- ethics / privacy ตามความเหมาะสม
- reference standard
- inter/intra-rater analysis
- sample size rationale
- Bland–Altman หรือสถิติ comparison ที่เหมาะสม

จึงค่อยเริ่มใช้คำว่า accuracy / agreement / clinical feasibility ได้ตามหลักฐานจริง

---

# 31. Definition of Done สำหรับ Artifact ใหม่

Artifact ที่ต่อยอดจาก Blueprint นี้ถือว่า “ผ่าน” เมื่อ

1. ชื่อโครงงานและขอบเขตตรงกับ current project
2. ไม่เปลี่ยน simulated 2D data ให้กลายเป็น real-image experiment โดยไม่มีหลักฐาน
3. สูตร LII ถูกต้อง
4. สูตร Homography และ normalization ถูกต้อง
5. theorem \(10\varepsilon\) ถูกเขียนครบเงื่อนไข
6. ไม่เรียก \(10\varepsilon\) ว่า expected error
7. 6 datasets และ reference LII ตรงกัน
8. H1–H3 และ determinant ตรงกัน
9. S3+H2 canonical example ตรงกัน
10. ค่า aggregate H1/H2/H3 ตรงกัน
11. maximum distorted RE = 17.2956%
12. maximum recovered AE = \(3.55\times10^{-15}\)
13. Monte Carlo = 18,000 trials และไม่ใช้แทน proof
14. แยก proof / numerical verification / future work ชัดเจน
15. ไม่มี overclaim ทางคลินิก
16. ถ้าเป็นเว็บ ต้องแยก Published Results กับ New Browser Run
17. ถ้าเป็นสไลด์ ต้องเห็นแกน “Problem → Model → Proof → Result → Scope”
18. ถ้าเป็น Q&A ต้องตอบได้ว่าทำไม \(2\varepsilon\) และ \(10\varepsilon\)

---

# 32. Core Message สำหรับใช้สื่อสารกับคนทั่วไป

> โครงงานนี้ศึกษาว่า “ถ้าเราวัดระยะจากภาพที่ถูกทำให้เอียงหรือบิดเบี้ยว ค่าที่วัดจะเปลี่ยนไปแค่ไหน และคณิตศาสตร์ช่วยแก้กลับได้หรือไม่” เราใช้จุด 6 จุดเป็นตัวแทนข้อมูล สร้างภาพบิดเบี้ยวด้วยเมทริกซ์ Homography แล้วทดลองแปลงกลับด้วยเมทริกซ์ผกผัน พร้อมพิสูจน์ว่า ถ้าตำแหน่งแต่ละจุดหลังแก้ยังคลาดไม่เกิน \(\varepsilon\) ผลรวมของระยะทั้ง 5 ช่วงจะคลาดไม่เกิน \(10\varepsilon\) งานนี้จึงเป็นการพิสูจน์แนวคิดทางคณิตศาสตร์ด้วยข้อมูลจำลอง ไม่ใช่ระบบวินิจฉัยทางทันตกรรมจริง

---

# 33. Project Motto

> **Correct the plane before trusting the distance.**

หรือในภาษาไทย

> **ก่อนเชื่อระยะทาง ต้องรู้ก่อนว่าเรากำลังวัดอยู่บนระนาบที่ถูกต้องหรือไม่**

---

# 34. Change-Control Rule

หากมีการแก้ Blueprint ในอนาคต ให้แยกการเปลี่ยนแปลงเป็น 3 ประเภท

### A. Editorial Change

เช่น ภาษา รูปแบบ หัวข้อ — เปลี่ยนได้โดยไม่กระทบ Source of Truth

### B. Implementation Change

เช่น เว็บ UI, PRNG, visualization — เปลี่ยนได้ แต่ต้องไม่เปลี่ยน Published Results

### C. Scientific Change

เช่น เปลี่ยน dataset, matrix, theorem, experimental design, clinical scope — ต้องถือเป็น **new project version / new experiment** และไม่ควรแก้ย้อนหลังให้รายงานเดิมดูเหมือนใช้วิธีใหม่ตั้งแต่แรก

---

## Final Source Lock

เมื่อมีข้อสงสัย ให้กลับมาตรวจ 5 แกนนี้ก่อนเสมอ

```text
1) P1–P6 → Euclidean distances → L0
2) H → distorted Q → Lraw
3) H^-1 → recovered P → Lrec
4) ||P_hat - P|| ≤ ε → |L_hat - L0| ≤ 10ε
5) Proof first; simulation supports; real-world validation is future work
```

**นี่คือ identity หลักของโครงงานฉบับปัจจุบัน**
