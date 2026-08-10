import {
  calculateCalibration,
  normalizedToPixels,
  projectWorldPoints
} from '../core/calibration-session.js';
import { PRESET_SESSION } from '../core/preset-session-data.js';
import { validateQuadrilateral } from '../core/homography.js';
import { fmt } from '../core/math.js';
import { liveMeasurementStore } from '../core/measurement-store.js';
import { createImageWorkspace } from '../ui/image-workspace.js';
import { refreshIcons } from '../ui/icons.js';

let mediaStream = null;
let workspace = null;
let activeStep = 1;
let cornerPoints = [];
let dataPoints = [];
let referencePoints = null;
let latestResult = null;
let publishedToModules = false;
let targetWidth = 6;
let targetHeight = 6;
let sampleImageLoaded = false;
let expanded = false;

function getScaledSampleReference() {
  if (!sampleImageLoaded) return null;
  return PRESET_SESSION.referencePoints.map(([x, y]) => [
    x * targetWidth / 6,
    y * targetHeight / 6
  ]);
}

export function initLiveDemo() {
  const root = document.getElementById('liveImageWorkspace');
  if (!root) return;

  workspace = createImageWorkspace(root, {
    onPoint: handleWorkspacePoint,
    onMovePoint: handleWorkspacePointMove
  });

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
  uploadArea?.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea?.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    const [file] = event.dataTransfer?.files || [];
    if (file) loadImageFromFile(file);
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
  document.getElementById('analyzeDemoBtn')?.addEventListener('click', publishCurrentMeasurement);
  document.getElementById('undoDemoPointBtn')?.addEventListener('click', undoLastPoint);
  document.getElementById('resetDemoBtn')?.addEventListener('click', resetDemoState);
  document.getElementById('expandLiveWorkspaceBtn')?.addEventListener('click', toggleExpanded);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expanded) toggleExpanded();
  });

  render();
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
    sampleImageLoaded = sample;
    if (sample) {
      targetWidth = 6;
      targetHeight = 6;
      const widthInput = document.getElementById('calibrationWidth');
      const heightInput = document.getElementById('calibrationHeight');
      if (widthInput) widthInput.value = '6';
      if (heightInput) heightInput.value = '6';
    } else {
      if (!readCalibrationSize()) return;
    }
    const { width, height } = await workspace.setImage(src, sample ? PRESET_SESSION.imageAlt : 'ภาพถ่ายสำหรับวัด LII');
    cornerPoints = [];
    dataPoints = [];
    referencePoints = null;
    latestResult = null;
    publishedToModules = false;
    activeStep = 2;
    setPointError('');
    hideResults();

    if (sample) {
      cornerPoints = normalizedToPixels(PRESET_SESSION.cornerPointsNormalized, width, height);
      referencePoints = getScaledSampleReference();
      dataPoints = projectWorldPoints(cornerPoints, referencePoints, targetWidth, targetHeight);
      activeStep = 4;
      computeDemoResults();
    }
    render();
  } catch (error) {
    setPointError('ไม่สามารถอ่านภาพนี้ได้ กรุณาเลือกไฟล์ JPG หรือ PNG อื่น');
  }
}

async function loadSamplePerspectivePhoto() {
  await loadWorkspaceImage(PRESET_SESSION.imageSrc, { sample: true });
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setPointError('เบราว์เซอร์นี้ไม่รองรับกล้อง หรือหน้าเว็บไม่ได้เปิดผ่าน HTTPS/localhost');
    return;
  }

  setPointError('');
  try {
    stopLiveCamera();
    mediaStream = await requestCameraStream();
    const video = document.getElementById('demoVideo');
    const videoContainer = document.getElementById('demoVideoContainer');
    if (!video || !videoContainer) return;
    video.srcObject = mediaStream;
    video.muted = true;
    await video.play();
    videoContainer.style.display = 'block';
    document.getElementById('liveImageWorkspace').style.display = 'none';
  } catch (error) {
    setPointError('เปิดกล้องไม่สำเร็จ กรุณาตรวจสอบสิทธิ์กล้องหรืออัปโหลดภาพแทน');
  }
}

async function requestCameraStream() {
  const candidates = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
    { video: { facingMode: 'environment' } },
    { video: true }
  ];
  let lastError;
  for (const constraints of candidates) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Camera unavailable');
}

function captureCamera() {
  const video = document.getElementById('demoVideo');
  if (!video?.videoWidth) {
    setPointError('กล้องยังไม่พร้อม กรุณารอสักครู่แล้วลองอีกครั้ง');
    return;
  }

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
  if (activeStep === 2 && cornerPoints.length < 4) {
    cornerPoints.push(point);
    if (cornerPoints.length === 4) {
      const validation = validateQuadrilateral(cornerPoints);
      if (!validation.ok) {
        cornerPoints.pop();
        setPointError('ลำดับมุมไม่ถูกต้อง กรุณาเลือก C1-C4 ตามเข็มนาฬิกาโดยไม่ให้เส้นไขว้กัน');
      } else {
        activeStep = 3;
        setPointError('');
      }
    }
  } else if (activeStep === 3 && dataPoints.length < 6) {
    dataPoints.push(point);
    if (dataPoints.length === 6) {
      activeStep = 4;
      computeDemoResults();
    }
  }
  publishedToModules = false;
  if (dataPoints.length !== 6) {
    latestResult = null;
    hideResults();
  }
  render();
}

function handleWorkspacePointMove(index, point, { committed }) {
  if (!dataPoints[index]) return;
  dataPoints[index] = point;
  publishedToModules = false;
  if (committed && dataPoints.length === 6) computeDemoResults();
  else render();
}

function readCalibrationSize() {
  const width = Number(document.getElementById('calibrationWidth')?.value);
  const height = Number(document.getElementById('calibrationHeight')?.value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    setPointError('ขนาด calibration ต้องเป็นตัวเลขที่มากกว่า 0');
    return false;
  }
  targetWidth = width;
  targetHeight = height;
  setPointError('');
  return true;
}

function updateCalibrationSize() {
  if (!readCalibrationSize()) {
    latestResult = null;
    publishedToModules = false;
    hideResults();
    render();
    return;
  }
  referencePoints = getScaledSampleReference();
  latestResult = null;
  publishedToModules = false;
  if (cornerPoints.length === 4 && dataPoints.length === 6) computeDemoResults();
  else render();
}

function computeDemoResults() {
  if (cornerPoints.length !== 4 || dataPoints.length !== 6) return;
  try {
    latestResult = calculateCalibration({
      corners: cornerPoints,
      dataPoints,
      referencePoints,
      targetWidth,
      targetHeight
    });
    showResults(latestResult);
    render();
  } catch (error) {
    latestResult = null;
    activeStep = dataPoints.length ? 3 : 2;
    setPointError(`คำนวณ Homography ไม่สำเร็จ: ${error.message}`);
  }
}

function publishCurrentMeasurement() {
  if (!latestResult || cornerPoints.length !== 4 || dataPoints.length !== 6) return;
  liveMeasurementStore.publish({
    source: 'live',
    targetWidth,
    targetHeight,
    corners: cornerPoints,
    imagePoints: dataPoints,
    referencePoints,
    result: latestResult
  });
  publishedToModules = true;
  render();
  document.dispatchEvent(new CustomEvent('lii:open-confirmed-analysis', {
    detail: { source: 'live' }
  }));
}

function showResults(result) {
  const known = result.hasKnownReference;
  const values = {
    demoL0: known ? `${fmt(result.referenceLii, 4)} cm` : 'ไม่มีข้อมูลอ้างอิง',
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

  const note = document.getElementById('demoValidationNote');
  if (note) {
    note.innerHTML = known
      ? '<strong>Known-reference sample:</strong> เปรียบเทียบผลกู้คืนกับพิกัดอ้างอิง จึงตรวจขอบเขต 10ε ได้'
      : '<strong>ภาพจากผู้ใช้:</strong> รายงาน LII ที่กู้คืนแล้ว แต่ไม่สรุป PASS/FAIL เพราะไม่มีพิกัดจริงสำหรับหา ε';
  }

  const matrix = document.getElementById('demoMatrixEst');
  if (matrix) {
    matrix.innerHTML = result.matrix.flat().map((value) => `<span>${value.toFixed(3)}</span>`).join('');
  }
  const results = document.getElementById('demoResultsBox');
  if (results) results.style.display = 'block';
}

function resetDemoState() {
  cornerPoints = [];
  dataPoints = [];
  referencePoints = getScaledSampleReference();
  latestResult = null;
  publishedToModules = false;
  activeStep = workspace?.getSize().width ? 2 : 1;
  setPointError('');
  hideResults();
  render();
}

function undoLastPoint() {
  if (activeStep === 4 && dataPoints.length) {
    dataPoints.pop();
    activeStep = 3;
  } else if (activeStep === 3 && dataPoints.length) {
    dataPoints.pop();
  } else if (activeStep === 3 && cornerPoints.length) {
    cornerPoints.pop();
    activeStep = 2;
  } else if (activeStep === 2 && cornerPoints.length) {
    cornerPoints.pop();
  } else {
    return;
  }
  referencePoints = getScaledSampleReference();
  latestResult = null;
  publishedToModules = false;
  hideResults();
  setPointError('');
  render();
}

function toggleExpanded() {
  expanded = !expanded;
  workspace?.setExpanded(expanded);
  document.body.classList.toggle('workspace-expanded', expanded);
  const button = document.getElementById('expandLiveWorkspaceBtn');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'ย่อพื้นที่ภาพ' : 'ขยายพื้นที่ภาพ');
    button.innerHTML = `<i data-lucide="${expanded ? 'minimize-2' : 'maximize-2'}"></i>`;
    refreshIcons(button);
  }
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
  workspace?.render({
    corners: cornerPoints,
    dataPoints,
    showScale: cornerPoints.length === 4,
    scaleWidth: targetWidth,
    scaleHeight: targetHeight,
    interactiveMode: activeStep === 2 || activeStep === 3,
    draggablePoints: dataPoints.length > 0
  });

  const dots = [1, 2, 3, 4].map((step) => document.getElementById(`step${step}Dot`));
  dots.forEach((dot, index) => {
    dot?.classList.toggle('active', index + 1 === activeStep);
    dot?.classList.toggle('complete', index + 1 < activeStep);
  });

  const hint = document.getElementById('demoStepHint');
  if (hint) {
    const messages = {
      1: '1. เลือกภาพถ่ายหรือเปิดกล้อง',
      2: `2. กำหนดมุม C1-C4 (${cornerPoints.length}/4)`,
      3: `3. กำหนดจุดวัด Q1-Q6 (${dataPoints.length}/6)`,
      4: publishedToModules ? '4. Module 1-5 ใช้ Q ชุดล่าสุดแล้ว' : '4. ผลคำนวณอัปเดตตาม Q1-Q6 ล่าสุด'
    };
    hint.textContent = messages[activeStep];
  }

  const undo = document.getElementById('undoDemoPointBtn');
  if (undo) undo.disabled = cornerPoints.length === 0 && dataPoints.length === 0;

  const analyze = document.getElementById('analyzeDemoBtn');
  if (analyze) {
    analyze.disabled = dataPoints.length !== 6 || !latestResult || publishedToModules;
    analyze.setAttribute('aria-pressed', String(publishedToModules));
  }
}
