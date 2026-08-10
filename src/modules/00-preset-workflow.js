import { calculateCalibration, normalizedToPixels, projectWorldPoints } from '../core/calibration-session.js';
import { PRESET_FRAMES, PRESET_PHASE_LABELS, PRESET_SESSION } from '../core/preset-session-data.js';
import { fmt } from '../core/math.js';
import { presetMeasurementStore } from '../core/measurement-store.js';
import { createImageWorkspace } from '../ui/image-workspace.js';
import { refreshIcons } from '../ui/icons.js';

const PHASE_FRAME = [0, 1, 5, 6, 12];

export function initPresetWorkflow({ onGoLive } = {}) {
  const root = document.getElementById('presetWorkflowWorkspace');
  if (!root) return;

  const workspace = createImageWorkspace(root, { onMovePoint: handleMovePoint });
  let frameIndex = 0;
  let corners = [];
  let dataPoints = [];
  let result = null;
  let published = false;
  let timer = null;
  let overlayVisible = true;

  const previousButton = document.getElementById('presetPrevious');
  const nextButton = document.getElementById('presetNext');
  const playButton = document.getElementById('presetPlay');
  const resetButton = document.getElementById('presetReset');
  const overlayButton = document.getElementById('presetToggleOverlay');
  const analyzeButton = document.getElementById('presetAnalyze');
  const liveButton = document.getElementById('presetGoLive');

  workspace.setImage(PRESET_SESSION.imageSrc, PRESET_SESSION.imageAlt).then(({ width, height }) => {
    corners = normalizedToPixels(PRESET_SESSION.cornerPointsNormalized, width, height);
    dataPoints = projectWorldPoints(corners, PRESET_SESSION.referencePoints);
    result = calculateCalibration({
      corners,
      dataPoints,
      referencePoints: PRESET_SESSION.referencePoints
    });
    render();
  });

  previousButton?.addEventListener('click', () => setFrame(frameIndex - 1));
  nextButton?.addEventListener('click', () => setFrame(frameIndex + 1));
  resetButton?.addEventListener('click', resetWorkflow);
  analyzeButton?.addEventListener('click', confirmMeasurement);
  liveButton?.addEventListener('click', () => onGoLive?.());
  overlayButton?.addEventListener('click', () => {
    overlayVisible = !overlayVisible;
    overlayButton.dataset.icon = overlayVisible ? 'eye-off' : 'eye';
    overlayButton.setAttribute('aria-label', overlayVisible ? 'ซ่อนจุดและเส้น' : 'แสดงจุดและเส้น');
    overlayButton.innerHTML = `<i data-lucide="${overlayVisible ? 'eye-off' : 'eye'}"></i>`;
    render();
    refreshIcons(overlayButton);
  });

  playButton?.addEventListener('click', () => {
    if (timer) {
      stopPlayback();
      return;
    }
    if (frameIndex === PRESET_FRAMES.length - 1) frameIndex = 0;
    playButton.innerHTML = '<i data-lucide="pause"></i><span>หยุด</span>';
    refreshIcons(playButton);
    timer = window.setInterval(() => {
      if (frameIndex >= PRESET_FRAMES.length - 1) {
        stopPlayback();
        return;
      }
      setFrame(frameIndex + 1, false);
    }, 700);
  });

  document.querySelectorAll('[data-preset-phase]').forEach((button) => {
    button.addEventListener('click', () => {
      stopPlayback();
      setFrame(PHASE_FRAME[Number(button.dataset.presetPhase)] || 0, false);
    });
  });

  function handleMovePoint(index, point, { committed }) {
    dataPoints[index] = point;
    published = false;
    if (committed) {
      result = calculateCalibration({
        corners,
        dataPoints,
        referencePoints: PRESET_SESSION.referencePoints
      });
    }
    render();
  }

  function confirmMeasurement() {
    if (!result || dataPoints.length !== 6 || corners.length !== 4) return;
    presetMeasurementStore.publish({
      source: 'preset',
      targetWidth: 6,
      targetHeight: 6,
      corners,
      imagePoints: dataPoints,
      referencePoints: PRESET_SESSION.referencePoints,
      result
    });
    published = true;
    frameIndex = PRESET_FRAMES.length - 1;
    render();
    document.dispatchEvent(new CustomEvent('lii:open-confirmed-analysis', {
      detail: { source: 'preset' }
    }));
  }

  function resetWorkflow() {
    stopPlayback();
    dataPoints = projectWorldPoints(corners, PRESET_SESSION.referencePoints);
    result = calculateCalibration({
      corners,
      dataPoints,
      referencePoints: PRESET_SESSION.referencePoints
    });
    published = false;
    setFrame(0, false);
  }

  function stopPlayback() {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (playButton) {
      playButton.innerHTML = '<i data-lucide="play"></i><span>เล่นตัวอย่าง</span>';
      refreshIcons(playButton);
    }
  }

  function setFrame(nextIndex, stop = true) {
    if (stop) stopPlayback();
    frameIndex = Math.max(0, Math.min(PRESET_FRAMES.length - 1, nextIndex));
    render();
  }

  function render() {
    if (!corners.length) return;
    const frame = PRESET_FRAMES[frameIndex];
    workspace.render({
      corners,
      dataPoints,
      cornerCount: frame.corners,
      pointCount: frame.points,
      showScale: frame.scale,
      showOverlay: overlayVisible,
      scaleWidth: 6,
      scaleHeight: 6,
      draggablePoints: frame.points === dataPoints.length
    });

    document.querySelectorAll('[data-preset-phase]').forEach((button) => {
      const phase = Number(button.dataset.presetPhase);
      button.classList.toggle('active', phase === frame.phase);
      button.setAttribute('aria-selected', String(phase === frame.phase));
    });

    const status = document.getElementById('presetStageStatus');
    const counter = document.getElementById('presetStageCounter');
    const results = document.getElementById('presetWorkflowResults');
    if (status) status.textContent = PRESET_PHASE_LABELS[frame.phase];
    if (counter) {
      counter.textContent = frame.result && published
        ? 'Module 1–5 ใช้ Q ชุดนี้'
        : frame.phase === 1
        ? `${frame.corners}/4 จุดสอบเทียบ`
        : frame.phase === 3
          ? `${frame.points}/6 จุดวัด`
          : `${frameIndex + 1}/${PRESET_FRAMES.length}`;
    }
    if (previousButton) previousButton.disabled = frameIndex === 0;
    if (nextButton) nextButton.disabled = frameIndex === PRESET_FRAMES.length - 1;
    if (analyzeButton) {
      analyzeButton.disabled = frame.points !== 6 || published;
      analyzeButton.setAttribute('aria-pressed', String(published));
    }
    if (results) results.hidden = !(frame.result && result);

    if (result) {
      const values = {
        presetL0: `${fmt(result.referenceLii, 4)} cm`,
        presetLrec: `${fmt(result.recoveredLii, 4)} cm`,
        presetEps: `${fmt(result.epsilon, 4)} cm`,
        presetBound: `${fmt(result.bound, 4)} cm`
      };
      Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      });
      const resultStatus = document.getElementById('presetResultStatus');
      if (resultStatus) {
        resultStatus.textContent = result.passed ? 'PASS' : 'CHECK';
        resultStatus.className = `value ${result.passed ? 'success' : 'warning'}`;
      }
    }
  }
}
