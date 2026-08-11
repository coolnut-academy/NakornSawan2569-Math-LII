import { calculateCalibration, normalizedToPixels, projectWorldPoints } from '../core/calibration-session.js';
import { PRESET_SESSION, PRESET_PHASES } from '../core/preset-session-data.js';
import { estimateHomography, applyHomography, validateQuadrilateral } from '../core/homography.js';
import { inverse3 } from '../core/matrix.js';
import { createWorldCorners } from '../core/calibration-session.js';
import { fmt, lii } from '../core/math.js';
import { presetMeasurementStore } from '../core/measurement-store.js';
import { createImageWorkspace } from '../ui/image-workspace.js';
import { createRealtimeCalcPanel } from '../ui/realtime-calc-display.js';
import { refreshIcons } from '../ui/icons.js';

export function initPresetWorkflow({ onGoLive } = {}) {
  const root = document.getElementById('presetWorkflowWorkspace');
  if (!root) return;

  const workspace = createImageWorkspace(root, {
    onPoint: handleWorkspacePoint,
    onMovePoint: handleWorkspacePointMove
  });

  const calcPanel = createRealtimeCalcPanel('presetRealtimeCalcContainer');

  // Workflow State
  let currentPhase = 1; // 1 to 6
  let topImageLoaded = false;
  let tiltedImageLoaded = false;

  // Top-Down state
  let topCorners = [];
  let pPixelPoints = [];
  let pWorldPoints = [];

  // Tilted state
  let tiltedCorners = [];
  let qPixelPoints = [];

  // Analysis result
  let result = null;
  let published = false;

  // Buttons & DOM elements
  const statusElem = document.getElementById('presetStageStatus');
  const counterElem = document.getElementById('presetStageCounter');
  const stepBar = document.getElementById('presetStepBar');
  const actionBtn = document.getElementById('presetActionBtn');
  const prevBtn = document.getElementById('presetPrevBtn');
  const resetBtn = document.getElementById('presetReset');
  const overlayBtn = document.getElementById('presetToggleOverlay');
  const liveBtn = document.getElementById('presetGoLive');
  const tiltedFileInput = document.getElementById('presetTiltedFileInput');
  const uploadArea = document.getElementById('presetTiltedUploadArea');
  const resultsBox = document.getElementById('presetWorkflowResults');

  let overlayVisible = true;

  // Load Top-Down Image Initially
  loadTopDownImage();

  function loadTopDownImage() {
    workspace.setImage(PRESET_SESSION.imageSrc, PRESET_SESSION.imageAlt).then(({ width, height }) => {
      topCorners = normalizedToPixels(PRESET_SESSION.cornerPointsNormalized, width, height);
      pPixelPoints = projectWorldPoints(topCorners, PRESET_SESSION.referencePoints);
      topImageLoaded = true;
      tiltedImageLoaded = false;
      currentPhase = 1;
      published = false;
      render();
    });
  }

  function loadTiltedImage(src, alt = PRESET_SESSION.tiltedImageAlt) {
    return workspace.setImage(src, alt).then(({ width, height }) => {
      tiltedCorners = normalizedToPixels(PRESET_SESSION.tiltedCornerPointsNormalized, width, height);
      qPixelPoints = [...pPixelPoints];
      tiltedImageLoaded = true;
      published = false;
      render();
    });
  }

  // File Upload for Tilted Image (Phase 4+)
  if (tiltedFileInput) {
    tiltedFileInput.addEventListener('change', (e) => {
      const [file] = e.target.files || [];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => loadTiltedImage(reader.result, file.name);
        reader.readAsDataURL(file);
      }
    });
  }

  if (uploadArea) {
    uploadArea.addEventListener('click', () => tiltedFileInput?.click());
  }

  // Handlers
  function handleWorkspacePoint(point) {
    if (currentPhase === 1 && topCorners.length < 4) {
      topCorners.push(point);
      if (topCorners.length === 4) {
        const v = validateQuadrilateral(topCorners);
        if (!v.ok) topCorners.pop();
        else {
          pPixelPoints = projectWorldPoints(topCorners, PRESET_SESSION.referencePoints);
        }
      }
    } else if (currentPhase === 2 && pPixelPoints.length < 6) {
      pPixelPoints.push(point);
    } else if (currentPhase === 4 && tiltedCorners.length < 4) {
      tiltedCorners.push(point);
      if (tiltedCorners.length === 4) {
        const v = validateQuadrilateral(tiltedCorners);
        if (!v.ok) tiltedCorners.pop();
      }
    } else if (currentPhase === 5 && qPixelPoints.length < 6) {
      qPixelPoints.push(point);
    }
    render();
  }

  function handleWorkspacePointMove(index, point, { committed }) {
    if (currentPhase <= 3) {
      if (pPixelPoints[index]) pPixelPoints[index] = point;
    } else {
      if (qPixelPoints[index]) qPixelPoints[index] = point;
    }
    render();
  }

  // Calculate World Points for P (Top-Down)
  function computePWorldPoints() {
    if (topCorners.length !== 4 || pPixelPoints.length !== 6) return [];
    try {
      const H = estimateHomography(createWorldCorners(6, 6), topCorners);
      const Hinv = inverse3(H);
      return pPixelPoints.map(pt => applyHomography(pt, Hinv));
    } catch {
      return [];
    }
  }

  // Calculate World Points for Q (Tilted)
  function computeQWorldPoints() {
    if (tiltedCorners.length !== 4 || qPixelPoints.length !== 6) return [];
    try {
      const H = estimateHomography(createWorldCorners(6, 6), tiltedCorners);
      const Hinv = inverse3(H);
      return qPixelPoints.map(pt => applyHomography(pt, Hinv));
    } catch {
      return [];
    }
  }

  // Event Listeners for Workflow Actions
  actionBtn?.addEventListener('click', () => {
    if (currentPhase === 1) {
      if (topCorners.length === 4) setPhase(2);
    } else if (currentPhase === 2) {
      if (pPixelPoints.length === 6) setPhase(3);
    } else if (currentPhase === 3) {
      // Confirm & Save Reference
      pWorldPoints = computePWorldPoints();
      loadTiltedImage(PRESET_SESSION.tiltedImageSrc).then(() => {
        setPhase(4);
      });
    } else if (currentPhase === 4) {
      if (tiltedCorners.length === 4) setPhase(5);
    } else if (currentPhase === 5) {
      // Process to Modules 01-05
      confirmMeasurement();
    }
  });

  prevBtn?.addEventListener('click', () => {
    if (currentPhase === 4) {
      // Back to Top-Down
      workspace.setImage(PRESET_SESSION.imageSrc, PRESET_SESSION.imageAlt).then(() => {
        tiltedImageLoaded = false;
        setPhase(2);
      });
    } else if (currentPhase > 1) {
      setPhase(currentPhase - 1);
    }
  });

  resetBtn?.addEventListener('click', () => {
    loadTopDownImage();
  });

  overlayBtn?.addEventListener('click', () => {
    overlayVisible = !overlayVisible;
    overlayBtn.innerHTML = `<i data-lucide="${overlayVisible ? 'eye-off' : 'eye'}"></i>`;
    render();
    refreshIcons(overlayBtn);
  });

  liveBtn?.addEventListener('click', () => onGoLive?.());

  function setPhase(phase) {
    currentPhase = phase;
    render();
  }

  function confirmMeasurement() {
    pWorldPoints = computePWorldPoints();
    const qWorld = computeQWorldPoints();
    if (tiltedCorners.length !== 4 || qPixelPoints.length !== 6 || pWorldPoints.length !== 6) return;

    result = calculateCalibration({
      corners: tiltedCorners,
      dataPoints: qPixelPoints,
      referencePoints: pWorldPoints,
      targetWidth: 6,
      targetHeight: 6
    });

    presetMeasurementStore.publish({
      source: 'preset',
      targetWidth: 6,
      targetHeight: 6,
      corners: tiltedCorners,
      imagePoints: qPixelPoints,
      referencePoints: pWorldPoints,
      result
    });

    published = true;
    currentPhase = 6;
    render();

    document.dispatchEvent(new CustomEvent('lii:open-confirmed-analysis', {
      detail: { source: 'preset' }
    }));
  }

  function render() {
    // Stepper UI update
    if (stepBar) {
      stepBar.innerHTML = PRESET_PHASES.map(p => `
        <div class="phase-step-item ${p.id === currentPhase ? 'active' : ''} ${p.id < currentPhase ? 'completed' : ''}" data-phase="${p.id}">
          <span class="step-num">${p.id < currentPhase ? '✓' : p.id}</span>
          <span>${p.name}</span>
        </div>
      `).join('');

      stepBar.querySelectorAll('.phase-step-item').forEach(item => {
        item.addEventListener('click', () => {
          const ph = Number(item.dataset.phase);
          if (ph < currentPhase) {
            if (ph <= 3 && currentPhase >= 4) {
              workspace.setImage(PRESET_SESSION.imageSrc, PRESET_SESSION.imageAlt).then(() => {
                tiltedImageLoaded = false;
                setPhase(ph);
              });
            } else {
              setPhase(ph);
            }
          }
        });
      });
    }

    // Status label
    if (statusElem) statusElem.textContent = PRESET_PHASES[currentPhase - 1]?.name || '';
    if (counterElem) counterElem.textContent = `ขั้นตอน ${currentPhase} / 6`;

    // Render Workspace SVG Overlay
    if (currentPhase <= 3) {
      // Top-Down rendering
      workspace.render({
        corners: topCorners,
        dataPoints: pPixelPoints,
        cornerCount: topCorners.length,
        pointCount: pPixelPoints.length,
        showScale: topCorners.length === 4,
        showOverlay: overlayVisible,
        scaleWidth: 6,
        scaleHeight: 6,
        interactiveMode: currentPhase === 1 || currentPhase === 2,
        draggablePoints: currentPhase === 2,
        pointPrefix: 'P'
      });
    } else {
      // Tilted rendering (Phase 4, 5, 6)
      workspace.render({
        corners: tiltedCorners,
        dataPoints: qPixelPoints,
        shadowPoints: pPixelPoints,
        cornerCount: tiltedCorners.length,
        pointCount: qPixelPoints.length,
        showScale: tiltedCorners.length === 4,
        showOverlay: overlayVisible,
        scaleWidth: 6,
        scaleHeight: 6,
        interactiveMode: currentPhase === 4 || currentPhase === 5,
        draggablePoints: currentPhase === 5,
        pointPrefix: 'Q',
        shadowPrefix: 'P'
      });
    }

    // Toggle Upload Area display
    if (uploadArea) {
      uploadArea.style.display = (currentPhase === 4) ? 'block' : 'none';
    }

    // Update Real-time Calc Panel
    const pWorld = pWorldPoints.length === 6 ? pWorldPoints : computePWorldPoints();
    const qWorld = currentPhase >= 4 ? computeQWorldPoints() : [];
    calcPanel?.render({ pWorldPoints: pWorld, qWorldPoints: qWorld });

    // Action button state
    if (actionBtn) {
      if (currentPhase === 1) {
        actionBtn.disabled = topCorners.length !== 4;
        actionBtn.innerHTML = '<i data-lucide="arrow-right"></i><span>กำหนดจุด P1-P6</span>';
      } else if (currentPhase === 2) {
        actionBtn.disabled = pPixelPoints.length !== 6;
        actionBtn.innerHTML = '<i data-lucide="bookmark"></i><span>บันทึกจุดอ้างอิง P</span>';
      } else if (currentPhase === 3) {
        actionBtn.disabled = false;
        actionBtn.innerHTML = '<i data-lucide="image"></i><span>ไปยังภาพเอียง (Tilted View)</span>';
      } else if (currentPhase === 4) {
        actionBtn.disabled = tiltedCorners.length !== 4;
        actionBtn.innerHTML = '<i data-lucide="arrow-right"></i><span>กำหนดจุด Q1-Q6</span>';
      } else if (currentPhase === 5) {
        actionBtn.disabled = qPixelPoints.length !== 6;
        actionBtn.innerHTML = '<i data-lucide="calculator"></i><span>ประมวลผลไปยัง Module 1–5</span>';
      } else if (currentPhase === 6) {
        actionBtn.disabled = published;
        actionBtn.innerHTML = '<i data-lucide="check-circle"></i><span>ประมวลผลแล้ว</span>';
      }
      refreshIcons(actionBtn);
    }

    if (prevBtn) prevBtn.disabled = currentPhase === 1;

    // Results Box Display
    if (resultsBox) {
      resultsBox.hidden = !(result && published);
      if (result) {
        const values = {
          presetL0: `${fmt(result.referenceLii, 4)} cm`,
          presetLrec: `${fmt(result.recoveredLii, 4)} cm`,
          presetEps: `${fmt(result.epsilon, 4)} cm`,
          presetBound: `${fmt(result.bound, 4)} cm`
        };
        Object.entries(values).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        });
        const st = document.getElementById('presetResultStatus');
        if (st) {
          st.textContent = result.passed ? 'PASS' : 'CHECK';
          st.className = `value ${result.passed ? 'success' : 'warning'}`;
        }
      }
    }
  }
}
