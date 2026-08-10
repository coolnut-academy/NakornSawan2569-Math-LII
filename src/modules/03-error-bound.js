// Module 03: validation metrics from one mode's confirmed measurement only.
import { fmt, clamp } from '../core/math.js';
import { getAnalysisElement } from '../ui/analysis-context.js';
import { boundsFor, renderPlot } from '../ui/svg-renderer.js';

export function initErrorBound({ root, store }) {
  const get = (id) => getAnalysisElement(root, id);
  let confirmedMeasurement = null;

  function renderErrorAnalysis() {
    const svg = get('errorPlot');
    if (!svg) return;
    const source = get('errorAnalysisSource');
    const actualError = get('actualError');
    const theoryBound = get('theoryBound');
    const boundStatus = get('boundStatus');
    const boundRatioText = get('boundRatioText');
    const boundMeter = get('boundMeter');

    if (!confirmedMeasurement) {
      renderPlot(svg, [], { pad: 0.35 });
      if (source) source.textContent = `รอ Q1-Q6 จาก ${store.label}`;
      if (actualError) actualError.textContent = '—';
      if (theoryBound) theoryBound.textContent = '—';
      if (boundStatus) {
        boundStatus.textContent = 'รอข้อมูล';
        boundStatus.className = 'value';
      }
      if (boundRatioText) boundRatioText.textContent = '—';
      if (boundMeter) boundMeter.style.width = '0%';
      return;
    }

    const { result, referencePoints } = confirmedMeasurement;
    const recovered = result.recoveredPoints;
    const series = referencePoints
      ? [
          { points: referencePoints, labelPrefix: 'R' },
          { points: recovered, labelPrefix: 'Q̂', className: 'raw' }
        ]
      : [{ points: recovered, labelPrefix: 'Q̂', className: 'recovered' }];
    renderPlot(svg, series, { bounds: boundsFor(series.map((item) => item.points), 0.35) });

    if (source) {
      source.textContent = result.hasKnownReference
        ? `เปรียบเทียบ Q ที่กู้คืนกับ reference จริง · ${confirmedMeasurement.targetWidth}×${confirmedMeasurement.targetHeight} cm`
        : 'ภาพนี้ไม่มี ground truth จึงไม่สร้างค่า ε, bound หรือ PASS/FAIL ขึ้นเอง';
    }

    if (!result.hasKnownReference) {
      if (actualError) actualError.textContent = 'N/A';
      if (theoryBound) theoryBound.textContent = 'N/A';
      if (boundStatus) {
        boundStatus.textContent = 'MEASUREMENT ONLY';
        boundStatus.className = 'value warning';
      }
      if (boundRatioText) boundRatioText.textContent = 'ไม่มี reference สำหรับตรวจ error';
      if (boundMeter) boundMeter.style.width = '0%';
      return;
    }

    const ratio = result.bound ? result.actualError / result.bound : 0;
    if (actualError) actualError.textContent = `${fmt(result.actualError, 4)} cm`;
    if (theoryBound) theoryBound.textContent = `${fmt(result.bound, 4)} cm`;
    if (boundStatus) {
      boundStatus.textContent = result.passed ? 'PASS' : 'CHECK';
      boundStatus.className = `value ${result.passed ? 'success' : 'danger'}`;
    }
    if (boundRatioText) boundRatioText.textContent = `ε = ${fmt(result.epsilon, 4)} cm`;
    if (boundMeter) boundMeter.style.width = `${clamp(ratio * 100, 0, 100)}%`;
  }

  store.subscribe((measurement) => {
    confirmedMeasurement = measurement;
    renderErrorAnalysis();
  });
  renderErrorAnalysis();
}
