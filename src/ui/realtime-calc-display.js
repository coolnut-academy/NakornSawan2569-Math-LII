import { distance, fmt } from '../core/math.js';

export function createRealtimeCalcPanel(containerId) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;

  let isExpanded = false;

  function render({ pWorldPoints = [], qWorldPoints = [] } = {}) {
    const hasP = Array.isArray(pWorldPoints) && pWorldPoints.length === 6;
    const hasQ = Array.isArray(qWorldPoints) && qWorldPoints.length === 6;

    let pSegments = [];
    let pLii = 0;
    if (hasP) {
      for (let i = 0; i < 5; i++) {
        const d = distance(pWorldPoints[i], pWorldPoints[i + 1]);
        pSegments.push(d);
        pLii += d;
      }
    }

    let qSegments = [];
    let qLii = 0;
    if (hasQ) {
      for (let i = 0; i < 5; i++) {
        const d = distance(qWorldPoints[i], qWorldPoints[i + 1]);
        qSegments.push(d);
        qLii += d;
      }
    }

    const delta = (hasP && hasQ) ? Math.abs(qLii - pLii) : null;

    let pSubHtml = '';
    if (hasP) {
      const segs = pSegments.map((d, i) => {
        const pA = pWorldPoints[i];
        const pB = pWorldPoints[i + 1];
        const dx = pB[0] - pA[0];
        const dy = pB[1] - pA[1];
        return `<div class="calc-sub-line">
          <span>P<sub>${i + 1}</sub>P<sub>${i + 2}</sub> = √[(${pB[0].toFixed(3)} - ${pA[0].toFixed(3)})² + (${pB[1].toFixed(3)} - ${pA[1].toFixed(3)})²]</span>
          <span>= √[(${dx >= 0 ? dx.toFixed(3) : `(${dx.toFixed(3)})`})² + (${dy >= 0 ? dy.toFixed(3) : `(${dy.toFixed(3)})`})²]</span>
          <strong>= ${d.toFixed(4)} cm</strong>
        </div>`;
      }).join('');

      pSubHtml = `
        <div class="calc-block">
          <div class="calc-block-title"><strong>1) คำนวณ LII(P) — Polyline Path Length จากจุดอ้างอิง (Top-Down):</strong></div>
          ${segs}
          <div class="calc-sub-total">
            <span>LII(P) = Σ P<sub>i</sub>P<sub>i+1</sub> = ${pSegments.map(s => s.toFixed(4)).join(' + ')}</span>
            <strong class="text-blue">= ${pLii.toFixed(4)} cm</strong>
          </div>
        </div>
      `;
    }

    let qSubHtml = '';
    if (hasQ) {
      const segs = qSegments.map((d, i) => {
        const qA = qWorldPoints[i];
        const qB = qWorldPoints[i + 1];
        const dx = qB[0] - qA[0];
        const dy = qB[1] - qA[1];
        return `<div class="calc-sub-line">
          <span>Q<sub>${i + 1}</sub>Q<sub>${i + 2}</sub> = √[(${qB[0].toFixed(3)} - ${qA[0].toFixed(3)})² + (${qB[1].toFixed(3)} - ${qA[1].toFixed(3)})²]</span>
          <span>= √[(${dx >= 0 ? dx.toFixed(3) : `(${dx.toFixed(3)})`})² + (${dy >= 0 ? dy.toFixed(3) : `(${dy.toFixed(3)})`})²]</span>
          <strong>= ${d.toFixed(4)} cm</strong>
        </div>`;
      }).join('');

      qSubHtml = `
        <div class="calc-block" style="margin-top:12px">
          <div class="calc-block-title"><strong>2) คำนวณ LII(Q) — Polyline Path Length จากจุดวัดจริง (Tilted View หลัง H⁻¹):</strong></div>
          ${segs}
          <div class="calc-sub-total">
            <span>LII(Q) = Σ Q<sub>i</sub>Q<sub>i+1</sub> = ${qSegments.map(s => s.toFixed(4)).join(' + ')}</span>
            <strong class="text-green">= ${qLii.toFixed(4)} cm</strong>
          </div>
        </div>
      `;
    }

    let deltaSubHtml = '';
    if (hasP && hasQ) {
      deltaSubHtml = `
        <div class="calc-block" style="margin-top:12px; border-top:1px dashed var(--line); padding-top:8px">
          <div class="calc-block-title"><strong>3) ผลต่างค่า LII (Δ):</strong></div>
          <div class="calc-sub-total">
            <span>Δ = |LII(Q) - LII(P)| = |${qLii.toFixed(4)} - ${pLii.toFixed(4)}|</span>
            <strong class="${delta < 0.1 ? 'text-green' : 'text-amber'}">= ${delta.toFixed(4)} cm</strong>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="realtime-calc-card">
        <div class="realtime-calc-header">
          <div class="realtime-calc-title">
            <i data-lucide="calculator"></i>
            <span>เปรียบเทียบ LII Polyline Real-time (P vs Q)</span>
          </div>
          <button class="btn btn-ghost btn-xs toggle-detail-btn" type="button" aria-expanded="${isExpanded}">
            <span>${isExpanded ? 'ซ่อนการแทนค่า' : 'ดูการแทนค่าอย่างละเอียด'}</span>
            <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}"></i>
          </button>
        </div>

        <div class="realtime-calc-summary">
          <div class="metric-mini">
            <label>LII(P) Polyline อ้างอิง</label>
            <div class="value">${hasP ? fmt(pLii, 4) + ' cm' : '—'}</div>
          </div>
          <div class="metric-mini">
            <label>LII(Q) Polyline จุดวัดจริง</label>
            <div class="value highlight-val">${hasQ ? fmt(qLii, 4) + ' cm' : '—'}</div>
          </div>
          <div class="metric-mini">
            <label>ผลต่าง Δ</label>
            <div class="value ${delta !== null ? (delta < 0.1 ? 'success-val' : 'warning-val') : ''}">${delta !== null ? fmt(delta, 4) + ' cm' : '—'}</div>
          </div>
        </div>

        <div class="realtime-calc-detail" ${!isExpanded ? 'hidden' : ''}>
          ${pSubHtml}
          ${qSubHtml}
          ${deltaSubHtml}
        </div>
      </div>
    `;

    const btn = container.querySelector('.toggle-detail-btn');
    btn?.addEventListener('click', () => {
      isExpanded = !isExpanded;
      render({ pWorldPoints, qWorldPoints });
    });

    if (window.lucide) {
      window.lucide.createIcons?.({ nameAttr: 'data-lucide' });
    }
  }

  return { render };
}
