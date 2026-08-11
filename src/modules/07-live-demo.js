import {
  calculateCalibration,
  normalizedToPixels,
  projectWorldPoints,
  createWorldCorners
} from '../core/calibration-session.js';
import { estimateHomography, applyHomography, validateQuadrilateral } from '../core/homography.js';
import { inverse3 } from '../core/matrix.js';
import { fmt, lii } from '../core/math.js';
import { liveMeasurementStore } from '../core/measurement-store.js';
import { PRESET_SESSION } from '../core/preset-session-data.js';
import { createImageWorkspace } from '../ui/image-workspace.js';
import { createRealtimeCalcPanel } from '../ui/realtime-calc-display.js';
import { refreshIcons } from '../ui/icons.js';

let mediaStream = null;
let workspace = null;
let calcPanel = null;

// Multi-phase State
let currentPhase = 1; // 1 to 6
let targetWidth = 6;
let targetHeight = 6;

// Top-Down Image state
let topCorners = [];
let pPixelPoints = [];
let pWorldPoints = [];

// Tilted Image state
let tiltedCorners = [];
let qPixelPoints = [];

let latestResult = null;
let publishedToModules = false;
let expanded = false;

export function initLiveDemo() {
  const root = document.getElementById('liveImageWorkspace');
  if (!root) return;

  workspace = createImageWorkspace(root, {
    onPoint: handleWorkspacePoint,
    onMovePoint: handleWorkspacePointMove
  });

  calcPanel = createRealtimeCalcPanel('liveRealtimeCalcContainer');

  const fileInput = document.getElementById('demoFileInput');
  const uploadArea = document.getElementById('demoUploadArea');
  const widthInput = document.getElementById('calibrationWidth');
  const heightInput = document.getElementById('calibrationHeight');

  [widthInput, heightInput].forEach((input) => {
    input?.addEventListener('input', updateCalibrationSize);
  });

  uploadArea?.addEventListener('click', () => fileInput?.click());
  uploadArea?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (file) loadImageFromFile(file);
    event.target.value = '';
  });

  document.getElementById('startCameraBtn')?.addEventListener('click', startCamera);
  document.getElementById('captureCamBtn')?.addEventListener('click', captureCamera);
  document.getElementById('stopCameraBtn')?.addEventListener('click', stopLiveCamera);
  document.getElementById('loadSamplePhotoBtn')?.addEventListener('click', loadSamplePerspectivePhoto);
  document.getElementById('analyzeDemoBtn')?.addEventListener('click', actionNextPhase);
  document.getElementById('undoDemoPointBtn')?.addEventListener('click', undoLastPoint);
  document.getElementById('resetDemoBtn')?.addEventListener('click', resetDemoState);
  document.getElementById('expandLiveWorkspaceBtn')?.addEventListener('click', toggleExpanded);

  render();
}

function updateCalibrationSize() {
  const width = Number(document.getElementById('calibrationWidth')?.value);
  const height = Number(document.getElementById('calibrationHeight')?.value);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    targetWidth = width;
    targetHeight = height;
    render();
  }
}

function loadImageFromFile(file) {
  if (!file.type.startsWith('image/')) {
    setPointError('ไฟล์นี้ไม่ใช่ภาพ กรุณาเลือกไฟล์ JPG หรือ PNG');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => loadWorkspaceImage(reader.result);
  reader.onerror = () => setPointError('ไม่สามารถเปิดไฟล์ภาพนี้ได้');
  reader.readAsDataURL(file);
}

async function loadWorkspaceImage(src, { sample = false } = {}) {
  try {
    stopLiveCamera();
    if (currentPhase <= 3) {
      await workspace.setImage(src, 'ภาพถ่าย Top-Down');
      topCorners = [];
      pPixelPoints = [];
      pWorldPoints = [];
      currentPhase = 1;
    } else {
      await workspace.setImage(src, 'ภาพถ่ายมุมเอียง (Tilted)');
      tiltedCorners = [];
      qPixelPoints = [...pPixelPoints];
      currentPhase = 4;
    }
    setPointError('');
    hideResults();
    render();
  } catch (error) {
    setPointError('ไม่สามารถอ่านภาพนี้ได้');
  }
}

async function loadSamplePerspectivePhoto() {
  if (currentPhase <= 3) {
    await loadWorkspaceImage(PRESET_SESSION.imageSrc, { sample: true });
  } else {
    await loadWorkspaceImage(PRESET_SESSION.tiltedImageSrc, { sample: true });
  }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setPointError('เบราว์เซอร์นี้ไม่รองรับกล้อง');
    return;
  }
  try {
    stopLiveCamera();
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.getElementById('demoVideo');
    const videoContainer = document.getElementById('demoVideoContainer');
    if (!video || !videoContainer) return;
    video.srcObject = mediaStream;
    video.muted = true;
    await video.play();
    videoContainer.style.display = 'block';
    document.getElementById('liveImageWorkspace').style.display = 'none';
  } catch {
    setPointError('เปิดกล้องไม่สำเร็จ');
  }
}

function captureCamera() {
  const video = document.getElementById('demoVideo');
  if (!video?.videoWidth) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  loadWorkspaceImage(canvas.toDataURL('image/jpeg', 0.92));
}

export function stopLiveCamera() {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  const video = document.getElementById('demoVideo');
  const videoContainer = document.getElementById('demoVideoContainer');
  const workspaceRoot = document.getElementById('liveImageWorkspace');
  if (video) video.srcObject = null;
  if (videoContainer) videoContainer.style.display = 'none';
  if (workspaceRoot) workspaceRoot.style.display = '';
}

function handleWorkspacePoint(point) {
  if (currentPhase === 1 && topCorners.length < 4) {
    topCorners.push(point);
    if (topCorners.length === 4) {
      const v = validateQuadrilateral(topCorners);
      if (!v.ok) {
        topCorners.pop();
        setPointError('ลำดับมุมไม่ถูกต้อง กรุณาเลือก C1-C4 ตามเข็มนาฬิกา');
      } else {
        currentPhase = 2;
        setPointError('');
      }
    }
  } else if (currentPhase === 2 && pPixelPoints.length < 6) {
    pPixelPoints.push(point);
    if (pPixelPoints.length === 6) {
      currentPhase = 3;
    }
  } else if (currentPhase === 4 && tiltedCorners.length < 4) {
    tiltedCorners.push(point);
    if (tiltedCorners.length === 4) {
      const v = validateQuadrilateral(tiltedCorners);
      if (!v.ok) {
        tiltedCorners.pop();
        setPointError('ลำดับมุมไม่ถูกต้อง กรุณาเลือก C1-C4 ตามเข็มนาฬิกา');
      } else {
        currentPhase = 5;
        if (!qPixelPoints.length) qPixelPoints = [...pPixelPoints];
        setPointError('');
      }
    }
  } else if (currentPhase === 5 && qPixelPoints.length < 6) {
    qPixelPoints.push(point);
  }
  publishedToModules = false;
  render();
}

function handleWorkspacePointMove(index, point, { committed }) {
  if (currentPhase <= 3) {
    if (pPixelPoints[index]) pPixelPoints[index] = point;
  } else {
    if (qPixelPoints[index]) qPixelPoints[index] = point;
  }
  publishedToModules = false;
  render();
}

function computePWorldPoints() {
  if (topCorners.length !== 4 || pPixelPoints.length !== 6) return [];
  try {
    const H = estimateHomography(createWorldCorners(targetWidth, targetHeight), topCorners);
    const Hinv = inverse3(H);
    return pPixelPoints.map(pt => applyHomography(pt, Hinv));
  } catch {
    return [];
  }
}

function computeQWorldPoints() {
  if (tiltedCorners.length !== 4 || qPixelPoints.length !== 6) return [];
  try {
    const H = estimateHomography(createWorldCorners(targetWidth, targetHeight), tiltedCorners);
    const Hinv = inverse3(H);
    return qPixelPoints.map(pt => applyHomography(pt, Hinv));
  } catch {
    return [];
  }
}

function actionNextPhase() {
  if (currentPhase === 1 && topCorners.length === 4) {
    currentPhase = 2;
  } else if (currentPhase === 2 && pPixelPoints.length === 6) {
    currentPhase = 3;
  } else if (currentPhase === 3) {
    pWorldPoints = computePWorldPoints();
    currentPhase = 4;
    setPointError('กรุณาอัปโหลดหรือถ่ายภาพมุมเอียง (Tilted View)');
  } else if (currentPhase === 4 && tiltedCorners.length === 4) {
    currentPhase = 5;
    if (!qPixelPoints.length) qPixelPoints = [...pPixelPoints];
  } else if (currentPhase === 5 && qPixelPoints.length === 6) {
    publishCurrentMeasurement();
  }
  render();
}

function publishCurrentMeasurement() {
  pWorldPoints = computePWorldPoints();
  const qWorld = computeQWorldPoints();
  if (tiltedCorners.length !== 4 || qPixelPoints.length !== 6) return;

  latestResult = calculateCalibration({
    corners: tiltedCorners,
    dataPoints: qPixelPoints,
    referencePoints: pWorldPoints.length === 6 ? pWorldPoints : null,
    targetWidth,
    targetHeight
  });

  liveMeasurementStore.publish({
    source: 'live',
    targetWidth,
    targetHeight,
    corners: tiltedCorners,
    imagePoints: qPixelPoints,
    referencePoints: pWorldPoints.length === 6 ? pWorldPoints : null,
    result: latestResult
  });

  publishedToModules = true;
  currentPhase = 6;
  showResults(latestResult);
  render();

  document.dispatchEvent(new CustomEvent('lii:open-confirmed-analysis', {
    detail: { source: 'live' }
  }));
}

function showResults(result) {
  const known = result.hasKnownReference;
  const values = {
    demoL0: known ? `${fmt(result.referenceLii, 4)} cm` : 'ไม่มีข้อมูลอ้างอิง P',
    demoLrec: `${fmt(result.recoveredLii, 4)} cm`,
    demoEps: known ? `${fmt(result.epsilon, 4)} cm` : 'ประเมินไม่ได้',
    demoActualE: known ? `${fmt(result.actualError, 4)} cm` : 'ประเมินไม่ได้',
    demoBound: known ? `${fmt(result.bound, 4)} cm` : 'ประเมินไม่ได้'
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const status = document.getElementById('demoStatus');
  if (status) {
    status.textContent = known ? (result.passed ? 'PASS' : 'CHECK') : 'MEASUREMENT ONLY';
    status.className = `value ${known && result.passed ? 'success' : 'warning'}`;
  }

  const results = document.getElementById('demoResultsBox');
  if (results) results.style.display = 'block';
}

function resetDemoState() {
  topCorners = [];
  pPixelPoints = [];
  pWorldPoints = [];
  tiltedCorners = [];
  qPixelPoints = [];
  latestResult = null;
  publishedToModules = false;
  currentPhase = 1;
  setPointError('');
  hideResults();
  render();
}

function undoLastPoint() {
  if (currentPhase === 5 && qPixelPoints.length) qPixelPoints.pop();
  else if (currentPhase === 4 && tiltedCorners.length) tiltedCorners.pop();
  else if (currentPhase === 2 && pPixelPoints.length) pPixelPoints.pop();
  else if (currentPhase === 1 && topCorners.length) topCorners.pop();
  render();
}

function toggleExpanded() {
  expanded = !expanded;
  workspace?.setExpanded(expanded);
  document.body.classList.toggle('workspace-expanded', expanded);
}

function hideResults() {
  const results = document.getElementById('demoResultsBox');
  if (results) results.style.display = 'none';
}

function setPointError(message) {
  const error = document.getElementById('demoPointError');
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
}

function render() {
  if (currentPhase <= 3) {
    workspace?.render({
      corners: topCorners,
      dataPoints: pPixelPoints,
      cornerCount: topCorners.length,
      pointCount: pPixelPoints.length,
      showScale: topCorners.length === 4,
      scaleWidth: targetWidth,
      scaleHeight: targetHeight,
      interactiveMode: currentPhase === 1 || currentPhase === 2,
      draggablePoints: currentPhase === 2,
      pointPrefix: 'P'
    });
  } else {
    workspace?.render({
      corners: tiltedCorners,
      dataPoints: qPixelPoints,
      shadowPoints: pPixelPoints,
      cornerCount: tiltedCorners.length,
      pointCount: qPixelPoints.length,
      showScale: tiltedCorners.length === 4,
      scaleWidth: targetWidth,
      scaleHeight: targetHeight,
      interactiveMode: currentPhase === 4 || currentPhase === 5,
      draggablePoints: currentPhase === 5,
      pointPrefix: 'Q',
      shadowPrefix: 'P'
    });
  }

  // Real-time Calc Panel Update
  const pWorld = pWorldPoints.length === 6 ? pWorldPoints : computePWorldPoints();
  const qWorld = currentPhase >= 4 ? computeQWorldPoints() : [];
  calcPanel?.render({ pWorldPoints: pWorld, qWorldPoints: qWorld });

  // Update Dots
  const dots = [1, 2, 3, 4, 5, 6].map((s) => document.getElementById(`liveStep${s}Dot`));
  dots.forEach((dot, index) => {
    dot?.classList.toggle('active', index + 1 === currentPhase);
    dot?.classList.toggle('complete', index + 1 < currentPhase);
  });

  const hint = document.getElementById('demoStepHint');
  if (hint) {
    const hints = {
      1: `1. ภาพ Top-Down: เลือกมุม C1-C4 (${topCorners.length}/4)`,
      2: `2. ภาพ Top-Down: เลือกจุดอ้างอิง P1-P6 (${pPixelPoints.length}/6)`,
      3: '3. บันทึกจุดอ้างอิง P เรียบร้อย กดต่อไปเพื่ออัปโหลดภาพเอียง',
      4: `4. ภาพเอียง (Tilted): เลือกมุม C1-C4 (${tiltedCorners.length}/4)`,
      5: `5. ภาพเอียง (Tilted): ปรับจุดวัด Q1-Q6 (${qPixelPoints.length}/6)`,
      6: publishedToModules ? '6. Module 1-5 ใช้ Q ชุดล่าสุดแล้ว' : '6. คำนวณเรียบร้อยแล้ว'
    };
    hint.textContent = hints[currentPhase] || '';
  }

  const analyze = document.getElementById('analyzeDemoBtn');
  if (analyze) {
    if (currentPhase === 1) analyze.disabled = topCorners.length !== 4;
    else if (currentPhase === 2) analyze.disabled = pPixelPoints.length !== 6;
    else if (currentPhase === 3) analyze.disabled = false;
    else if (currentPhase === 4) analyze.disabled = tiltedCorners.length !== 4;
    else if (currentPhase === 5) analyze.disabled = qPixelPoints.length !== 6;
    else if (currentPhase === 6) analyze.disabled = publishedToModules;
  }
}
