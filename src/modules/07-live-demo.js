// Module 07: Live Physical Demo (Camera/Upload + 4-Point DLT Calibration & Error Analysis)
import { estimateHomography, applyHomography } from '../core/homography.js';
import { inverse3 } from '../core/matrix.js';
import { lii, distance, fmt, ae, re } from '../core/math.js';

// Default World Coordinates for Calibration Target (6cm x 6cm Square)
const WORLD_CORNERS = [
  [0, 0], // C1: Top-Left (0,0)
  [6, 0], // C2: Top-Right (6,0)
  [6, 6], // C3: Bottom-Right (6,6)
  [0, 6]  // C4: Bottom-Left (0,6)
];

// Default World Reference Data Points (S3 shifted to fit inside 6x6cm square)
const WORLD_DATA_REF = [
  [0.0, 3.0],
  [1.2, 3.1],
  [2.35, 3.65],
  [3.65, 2.45],
  [4.8, 2.9],
  [6.0, 3.0]
];
const L0_REF = lii(WORLD_DATA_REF);

let mediaStream = null;
let currentImage = null;
let currentMode = 'upload'; // 'upload' | 'camera'
let activeStep = 1; // 1: Image, 2: 4 Corners, 3: 6 Data Points, 4: Results

// Canvas marker states (in image pixel coordinates)
let cornerPoints = []; // 4 points [x, y]
let dataPoints = [];   // 6 points [x, y]

export function initLiveDemo() {
  const fileInput = document.getElementById('demoFileInput');
  const uploadArea = document.getElementById('demoUploadArea');
  const startCamBtn = document.getElementById('startCameraBtn');
  const captureCamBtn = document.getElementById('captureCamBtn');
  const stopCamBtn = document.getElementById('stopCameraBtn');
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  const presetSampleBtn = document.getElementById('loadSamplePhotoBtn');

  const canvas = document.getElementById('demoCanvas');

  if (fileInput && uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadImageFromFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadImageFromFile(e.target.files[0]);
      }
    });
  }

  if (startCamBtn) startCamBtn.addEventListener('click', startCamera);
  if (captureCamBtn) captureCamBtn.addEventListener('click', captureCamera);
  if (stopCamBtn) stopCamBtn.addEventListener('click', stopCamera);
  if (resetDemoBtn) resetDemoBtn.addEventListener('click', resetDemoState);
  if (presetSampleBtn) presetSampleBtn.addEventListener('click', loadSamplePerspectivePhoto);

  if (canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        handleCanvasClick(e);
        e.preventDefault();
      }
    });
    canvas.addEventListener('click', (e) => {
      if (e.pointerType !== 'touch') {
        handleCanvasClick(e);
      }
    });
  }

  // Preload synthesized sample photo if user wants instant demo without camera
  renderStepUI();
}

function loadImageFromFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      stopCamera();
      cornerPoints = [];
      dataPoints = [];
      activeStep = 2; // Move to corner marking
      redrawCanvas();
      renderStepUI();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function startCamera() {
  const video = document.getElementById('demoVideo');
  const videoContainer = document.getElementById('demoVideoContainer');
  const canvas = document.getElementById('demoCanvas');

  try {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
    } catch (errFallback) {
      // Fallback for tablets/laptops with single camera or different constraints
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    if (video) {
      video.srcObject = mediaStream;
      video.play();
    }
    if (videoContainer) videoContainer.style.display = 'block';
    if (canvas) canvas.style.display = 'none';

    currentMode = 'camera';
    renderStepUI();
  } catch (err) {
    alert('Camera access error: ' + err.message + '\nPlease use file upload instead.');
  }
}

function captureCamera() {
  const video = document.getElementById('demoVideo');
  const canvas = document.getElementById('demoCanvas');
  const videoContainer = document.getElementById('demoVideoContainer');

  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  const img = new Image();
  img.onload = () => {
    currentImage = img;
    stopCamera();
    if (videoContainer) videoContainer.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    cornerPoints = [];
    dataPoints = [];
    activeStep = 2;
    redrawCanvas();
    renderStepUI();
  };
  img.src = tempCanvas.toDataURL('image/jpeg');
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  const videoContainer = document.getElementById('demoVideoContainer');
  const canvas = document.getElementById('demoCanvas');
  if (videoContainer) videoContainer.style.display = 'none';
  if (canvas) canvas.style.display = 'block';
}

function loadSamplePerspectivePhoto() {
  // Create a synthetic distorted calibration target photo on a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Background wooden table effect
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, '#f1f5f9');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Perspective transformed quad corners on image
  const imgCorners = [
    [180, 140], // C1 Top-Left
    [620, 100], // C2 Top-Right
    [680, 480], // C3 Bottom-Right
    [120, 440]  // C4 Bottom-Left
  ];

  // Draw paper target quad
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(imgCorners[0][0], imgCorners[0][1]);
  ctx.lineTo(imgCorners[1][0], imgCorners[1][1]);
  ctx.lineTo(imgCorners[2][0], imgCorners[2][1]);
  ctx.lineTo(imgCorners[3][0], imgCorners[3][1]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Calculate homography H from world (0..6) to this distorted image quad
  const H_synth = estimateHomography(WORLD_CORNERS, imgCorners);
  const synthDataImg = WORLD_DATA_REF.map((p) => applyHomography(p, H_synth));

  // Draw 4 Corner Checkerboard indicators
  imgCorners.forEach((p, idx) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`C${idx + 1}`, p[0] - 8, p[1] - 14);
  });

  // Draw 6 data point circles on synthetic photo
  synthDataImg.forEach((p, idx) => {
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`P${idx + 1}`, p[0] + 8, p[1] + 4);
  });

  const img = new Image();
  img.onload = () => {
    currentImage = img;
    // Pre-populate corners & data points for instant demo delight
    cornerPoints = imgCorners.map((p) => [...p]);
    dataPoints = synthDataImg.map((p) => [...p]);
    activeStep = 4; // Auto compute results!
    redrawCanvas();
    renderStepUI();
    computeDemoResults();
  };
  img.src = canvas.toDataURL('image/png');
}

function handleCanvasClick(e) {
  if (!currentImage) return;

  const canvas = document.getElementById('demoCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  if (activeStep === 2) {
    if (cornerPoints.length < 4) {
      cornerPoints.push([clickX, clickY]);
      if (cornerPoints.length === 4) {
        activeStep = 3;
      }
    }
  } else if (activeStep === 3) {
    if (dataPoints.length < 6) {
      dataPoints.push([clickX, clickY]);
      if (dataPoints.length === 6) {
        activeStep = 4;
        computeDemoResults();
      }
    }
  }

  redrawCanvas();
  renderStepUI();
}

function resetDemoState() {
  cornerPoints = [];
  dataPoints = [];
  activeStep = currentImage ? 2 : 1;
  redrawCanvas();
  renderStepUI();

  const resultsBox = document.getElementById('demoResultsBox');
  if (resultsBox) resultsBox.style.display = 'none';
}

function redrawCanvas() {
  const canvas = document.getElementById('demoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (!currentImage) {
    canvas.width = 640;
    canvas.height = 400;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 640, 400);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Upload photo or start camera to perform live DLT demonstration', 320, 200);
    return;
  }

  canvas.width = currentImage.width;
  canvas.height = currentImage.height;
  ctx.drawImage(currentImage, 0, 0);

  // Draw Corner Calibration points (C1..C4)
  cornerPoints.forEach((p, idx) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(p[0], p[1], Math.max(8, canvas.width / 100), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(14, canvas.width / 60)}px sans-serif`;
    ctx.fillText(`C${idx + 1}`, p[0] + 12, p[1] - 12);
  });

  // Draw polygon joining corner points if 4 are set
  if (cornerPoints.length === 4) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = Math.max(2, canvas.width / 300);
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cornerPoints[0][0], cornerPoints[0][1]);
    ctx.lineTo(cornerPoints[1][0], cornerPoints[1][1]);
    ctx.lineTo(cornerPoints[2][0], cornerPoints[2][1]);
    ctx.lineTo(cornerPoints[3][0], cornerPoints[3][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw 6 Data points (Q1..Q6)
  dataPoints.forEach((p, idx) => {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(p[0], p[1], Math.max(7, canvas.width / 110), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(13, canvas.width / 65)}px sans-serif`;
    ctx.fillText(`Q${idx + 1}`, p[0] + 10, p[1] + 15);
  });

  // Connect data points with polyline
  if (dataPoints.length > 1) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = Math.max(2, canvas.width / 250);
    ctx.beginPath();
    ctx.moveTo(dataPoints[0][0], dataPoints[0][1]);
    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i][0], dataPoints[i][1]);
    }
    ctx.stroke();
  }
}

function computeDemoResults() {
  if (cornerPoints.length !== 4 || dataPoints.length !== 6) return;

  try {
    // 1. Estimate Homography mapping World (0,0)-(6,6) -> Image Pixels cornerPoints
    const H_est = estimateHomography(WORLD_CORNERS, cornerPoints);
    const H_inv = inverse3(H_est);

    // 2. Map Image Data Points Q1..Q6 back to World plane using H_inv
    const recoveredWorld = dataPoints.map((q) => applyHomography(q, H_inv));

    // 3. Compute LII values
    const Lraw_pixel = lii(dataPoints);
    const Lrec = lii(recoveredWorld);

    // 4. Compute Point Errors on World Reference Plane
    let maxPointEps = 0;
    recoveredWorld.forEach((p, i) => {
      const err = distance(p, WORLD_DATA_REF[i]);
      if (err > maxPointEps) maxPointEps = err;
    });

    const E_actual = Math.abs(Lrec - L0_REF);
    const Bound_10eps = 10 * maxPointEps;
    const isBoundPassed = E_actual <= Bound_10eps + 1e-9;

    // Display Results Box
    const resultsBox = document.getElementById('demoResultsBox');
    if (resultsBox) resultsBox.style.display = 'block';

    const valL0 = document.getElementById('demoL0');
    const valLrec = document.getElementById('demoLrec');
    const valEps = document.getElementById('demoEps');
    const valActualE = document.getElementById('demoActualE');
    const valBound = document.getElementById('demoBound');
    const valStatus = document.getElementById('demoStatus');
    const matrixEst = document.getElementById('demoMatrixEst');

    if (valL0) valL0.textContent = fmt(L0_REF, 4) + ' cm';
    if (valLrec) valLrec.textContent = fmt(Lrec, 4) + ' cm';
    if (valEps) valEps.textContent = fmt(maxPointEps, 4) + ' cm';
    if (valActualE) valActualE.textContent = fmt(E_actual, 4) + ' cm';
    if (valBound) valBound.textContent = fmt(Bound_10eps, 4) + ' cm';

    if (valStatus) {
      valStatus.textContent = isBoundPassed ? 'PASS (E ≤ 10ε)' : 'CHECK';
      valStatus.className = 'value ' + (isBoundPassed ? 'success' : 'warning');
    }

    if (matrixEst) {
      matrixEst.innerHTML = H_est.flat()
        .map((v) => `<span>${v.toFixed(3)}</span>`)
        .join('');
    }
  } catch (err) {
    alert('DLT Homography calculation error: ' + err.message);
  }
}

function renderStepUI() {
  const stepHint = document.getElementById('demoStepHint');
  const step1Dot = document.getElementById('step1Dot');
  const step2Dot = document.getElementById('step2Dot');
  const step3Dot = document.getElementById('step3Dot');
  const step4Dot = document.getElementById('step4Dot');

  const dots = [step1Dot, step2Dot, step3Dot, step4Dot];
  dots.forEach((dot, idx) => {
    if (dot) dot.classList.toggle('active', idx + 1 === activeStep);
  });

  if (stepHint) {
    if (activeStep === 1) {
      stepHint.textContent = 'Step 1: Upload a photo of the calibration target or click "Use Sample Photo"';
    } else if (activeStep === 2) {
      stepHint.textContent = `Step 2: Click the 4 reference corners C1–C4 (${cornerPoints.length}/4 set)`;
    } else if (activeStep === 3) {
      stepHint.textContent = `Step 3: Click the 6 data points Q1–Q6 (${dataPoints.length}/6 set)`;
    } else if (activeStep === 4) {
      stepHint.textContent = 'Step 4: Live DLT Homography & Error Bound Analysis Complete!';
    }
  }
}
