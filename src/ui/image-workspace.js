const SVG_NS = 'http://www.w3.org/2000/svg';

function svgNode(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function pointString(points) {
  return points.map((point) => point.join(',')).join(' ');
}

export function createImageWorkspace(container, { onPoint, onMovePoint, onMoveCorner } = {}) {
  if (!container) throw new Error('Image workspace container is required.');

  container.classList.add('image-workspace');
  container.innerHTML = `
    <div class="workspace-media">
      <div class="workspace-stage">
        <img class="workspace-image" alt="" draggable="false">
        <svg class="workspace-overlay" role="img" aria-label="Calibration and measurement overlay"></svg>
      </div>
      <div class="workspace-loupe" hidden>
        <canvas class="loupe-canvas" width="160" height="160"></canvas>
        <div class="loupe-tag">C1</div>
      </div>
      <div class="workspace-empty">เลือกภาพหรือเปิดกล้องเพื่อเริ่มต้น</div>
    </div>
    <div class="workspace-tool-tabs">
      <div class="tool-tab-bar">
        <button class="tool-tab active" data-tab="zoom" type="button">
          <span class="tool-tab-icon">🔍</span><span>ซูม/เลื่อน</span>
        </button>
        <button class="tool-tab" data-tab="nudge" type="button">
          <span class="tool-tab-icon">🎯</span><span>ปรับจุดละเอียด</span>
        </button>
        <button class="tool-tab-collapse" type="button" title="พับ/เปิด แถบเครื่องมือ" aria-label="พับ/เปิดแถบเครื่องมือ">▾</button>
      </div>
      <div class="tool-tab-panels">
        <div class="tool-tab-panel" data-panel="zoom">
          <button class="zoom-btn mode-pill-btn" data-action="toggle-hand" type="button" title="สลับโหมด: ปรับจุด / เลื่อนภาพ">
            <span class="mode-label-point">📍 โหมดปรับจุด</span>
            <span class="mode-label-hand" hidden>✋ โหมดเลื่อนภาพ</span>
          </button>
          <span class="toolbar-divider"></span>
          <button class="zoom-btn" data-action="zoom-in" type="button" title="ขยายภาพ (+)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span class="zoom-badge">100%</span>
          <button class="zoom-btn" data-action="zoom-out" type="button" title="ย่อภาพ (-)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button class="zoom-btn" data-action="zoom-reset" type="button" title="รีเซ็ตย่อ/ขยาย">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
        <div class="tool-tab-panel" data-panel="nudge" hidden>
          <div class="nudge-header">
            <span class="nudge-title">ปรับจุด</span>
            <button class="nudge-step-btn" type="button" title="สลับระยะขยับ (1px / 5px)">Step 1px</button>
            <button class="nudge-close-btn" type="button" title="ยกเลิกการเลือกจุด">✕</button>
          </div>
          <div class="nudge-dpad">
            <button class="nudge-btn nudge-up" data-dir="up" type="button" aria-label="ขยับขึ้น">▲</button>
            <button class="nudge-btn nudge-left" data-dir="left" type="button" aria-label="ขยับซ้าย">◄</button>
            <button class="nudge-btn nudge-right" data-dir="right" type="button" aria-label="ขยับขวา">►</button>
            <button class="nudge-btn nudge-down" data-dir="down" type="button" aria-label="ขยับลง">▼</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const media = container.querySelector('.workspace-media');
  const stage = container.querySelector('.workspace-stage');
  const image = container.querySelector('.workspace-image');
  const overlay = container.querySelector('.workspace-overlay');
  const empty = container.querySelector('.workspace-empty');
  const badge = container.querySelector('.zoom-badge');
  const loupe = container.querySelector('.workspace-loupe');
  const loupeCanvas = container.querySelector('.loupe-canvas');
  const loupeTag = container.querySelector('.loupe-tag');

  let width = 0;
  let height = 0;
  let interactive = false;
  let pointsDraggable = false;
  let lastRenderOptions = null;
  let draggedItem = null;
  let dragStartPt = null;
  let dragStartEventPt = null;

  // Zoom & Pan & Hand state
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isHandMode = false;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let initialPinchDist = null;
  let initialPinchZoom = 1.0;

  function updateZoomTransform() {
    zoomScale = Math.max(1.0, Math.min(4.0, zoomScale));
    if (zoomScale <= 1.001) {
      panX = 0;
      panY = 0;
      stage.style.transform = '';
      media.classList.remove('is-zoomed');
    } else {
      stage.style.transform = `scale(${zoomScale}) translate(${panX / zoomScale}px, ${panY / zoomScale}px)`;
      media.classList.add('is-zoomed');
    }
    if (badge) badge.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  // Prevent right-click context menu on media box for smooth right-click panning
  media.addEventListener('contextmenu', (e) => e.preventDefault());

  container.querySelectorAll('.zoom-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'toggle-hand') {
        isHandMode = !isHandMode;
        btn.classList.toggle('active', isHandMode);
        media.classList.toggle('is-hand-mode', isHandMode);
        const pointLabel = btn.querySelector('.mode-label-point');
        const handLabel = btn.querySelector('.mode-label-hand');
        if (pointLabel && handLabel) {
          pointLabel.hidden = isHandMode;
          handLabel.hidden = !isHandMode;
        }
      } else if (action === 'zoom-in') {
        zoomScale += 0.25;
        updateZoomTransform();
      } else if (action === 'zoom-out') {
        zoomScale -= 0.25;
        updateZoomTransform();
      } else if (action === 'zoom-reset') {
        zoomScale = 1.0;
        panX = 0;
        panY = 0;
        updateZoomTransform();
      }
    });
  });

  media.addEventListener('wheel', (e) => {
    if (!width || !height) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    zoomScale += delta;
    updateZoomTransform();
  }, { passive: false });

  // Pan interaction (Right-click drag, Hand mode left-click drag, Middle click)
  media.addEventListener('pointerdown', (e) => {
    const isRightClick = e.button === 2;
    const isMiddleClick = e.button === 1;
    const isPointTarget = !!e.target.closest('.calibration-point, .measurement-point');

    if (isRightClick || isMiddleClick || (isHandMode && !isPointTarget)) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      media.classList.add('is-panning');
      media.setPointerCapture?.(e.pointerId);
    }
  });

  media.addEventListener('pointermove', (e) => {
    if (isPanning) {
      e.preventDefault();
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      updateZoomTransform();
    }
  });

  const stopPanning = (e) => {
    if (isPanning) {
      isPanning = false;
      media.classList.remove('is-panning');
      media.releasePointerCapture?.(e.pointerId);
    }
  };

  media.addEventListener('pointerup', stopPanning);
  media.addEventListener('pointercancel', stopPanning);

  // Touch Pinch-to-Zoom and 2-Finger Pan support for Tablets/Mobile
  media.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isPanning = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchZoom = zoomScale;
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      panStartX = midX - panX;
      panStartY = midY - panY;
    }
  }, { passive: false });

  media.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      zoomScale = initialPinchZoom * (dist / initialPinchDist);

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      panX = midX - panStartX;
      panY = midY - panStartY;

      updateZoomTransform();
    }
  }, { passive: false });

  media.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDist = null;
      isPanning = false;
    }
  });

  // Tab Bar: Collapsible tool panels below the image
  const toolTabs = container.querySelector('.workspace-tool-tabs');
  const tabBar = container.querySelector('.tool-tab-bar');
  const tabPanels = container.querySelector('.tool-tab-panels');
  const collapseBtn = container.querySelector('.tool-tab-collapse');
  let activeTab = 'zoom';
  let tabsCollapsed = false;

  function updateTabBar() {
    if (!toolTabs) return;
    toolTabs.classList.toggle('is-collapsed', tabsCollapsed);
    if (collapseBtn) collapseBtn.textContent = tabsCollapsed ? '▸' : '▾';

    container.querySelectorAll('.tool-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === activeTab && !tabsCollapsed);
    });

    container.querySelectorAll('.tool-tab-panel').forEach((panel) => {
      panel.hidden = tabsCollapsed || panel.dataset.panel !== activeTab;
    });
  }

  container.querySelectorAll('.tool-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (activeTab === target && !tabsCollapsed) {
        // Same tab clicked again — toggle collapse
        tabsCollapsed = true;
      } else {
        activeTab = target;
        tabsCollapsed = false;
      }
      updateTabBar();
    });
  });

  collapseBtn?.addEventListener('click', () => {
    tabsCollapsed = !tabsCollapsed;
    updateTabBar();
  });

  // Touch & Precision Nudge Pad state
  let activeSelectedPoint = null;
  let nudgeStep = 1;

  const nudgePanel = container.querySelector('[data-panel="nudge"]');
  const nudgeTitle = container.querySelector('.nudge-title');
  const nudgeStepBtn = container.querySelector('.nudge-step-btn');
  const nudgeCloseBtn = container.querySelector('.nudge-close-btn');
  const nudgeTab = container.querySelector('[data-tab="nudge"]');

  function updateNudgePadState() {
    if (!nudgePanel) return;
    if (!activeSelectedPoint || draggedItem !== null) {
      // No point selected — update nudge tab badge but don't force switch
      if (nudgeTab) nudgeTab.classList.add('is-empty');
      if (nudgeTitle) nudgeTitle.textContent = 'ไม่มีจุดที่เลือก';
      return;
    }
    if (nudgeTab) nudgeTab.classList.remove('is-empty');
    const isCorner = activeSelectedPoint.type === 'corner';
    const idx = activeSelectedPoint.index;
    const prefix = isCorner ? 'C' : (lastRenderOptions?.pointPrefix || 'P');
    const pt = isCorner ? lastRenderOptions?.corners?.[idx] : lastRenderOptions?.dataPoints?.[idx];

    if (nudgeTitle) {
      nudgeTitle.textContent = pt ? `${prefix}${idx + 1} (${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})` : `${prefix}${idx + 1}`;
    }
    if (nudgeStepBtn) {
      nudgeStepBtn.textContent = `Step ${nudgeStep}px`;
    }

    // Auto-switch to nudge tab when a point is selected
    activeTab = 'nudge';
    tabsCollapsed = false;
    updateTabBar();
  }

  function moveSelectedPointByNudge(dx, dy) {
    if (!activeSelectedPoint || !width || !height) return;
    const isCorner = activeSelectedPoint.type === 'corner';
    const idx = activeSelectedPoint.index;
    const callback = isCorner ? onMoveCorner : onMovePoint;
    if (!callback) return;

    const currentPt = isCorner ? lastRenderOptions?.corners?.[idx] : lastRenderOptions?.dataPoints?.[idx];
    if (!currentPt) return;

    const overlayRect = overlay.getBoundingClientRect();
    const scale = overlayRect.width > 0 ? (width / overlayRect.width) : 1;
    const shiftX = dx * nudgeStep * scale;
    const shiftY = dy * nudgeStep * scale;

    const newPt = [
      Math.max(0, Math.min(width, currentPt[0] + shiftX)),
      Math.max(0, Math.min(height, currentPt[1] + shiftY))
    ];

    callback(idx, newPt, { committed: true });
    updateNudgePadState();
  }

  if (nudgeStepBtn) {
    nudgeStepBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nudgeStep = nudgeStep === 1 ? 5 : 1;
      updateNudgePadState();
    });
  }

  if (nudgeCloseBtn) {
    nudgeCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeSelectedPoint = null;
      updateNudgePadState();
    });
  }

  container.querySelectorAll('.nudge-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dir = btn.dataset.dir;
      const dirMap = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
      };
      if (dirMap[dir]) {
        moveSelectedPointByNudge(dirMap[dir][0], dirMap[dir][1]);
      }
    });
  });

  // Precision Loupe (Magnifier Glass) Functionality
  function updateLoupe(point, labelText, clientX, clientY, isTouch = false) {
    if (!loupe || !loupeCanvas || !image.naturalWidth) return;

    loupe.hidden = false;
    const mediaRect = media.getBoundingClientRect();

    const loupeW = isTouch ? 140 : 140;
    const loupeH = isTouch ? 140 : 140;
    if (loupeCanvas.width !== loupeW || loupeCanvas.height !== loupeH) {
      loupeCanvas.width = loupeW;
      loupeCanvas.height = loupeH;
    }

    let left = clientX - mediaRect.left - loupeW / 2;
    let top = clientY - mediaRect.top - loupeH - (isTouch ? 65 : 24);

    if (top < 8) top = clientY - mediaRect.top + (isTouch ? 55 : 24);
    left = Math.max(8, Math.min(mediaRect.width - loupeW - 8, left));
    top = Math.max(8, Math.min(mediaRect.height - loupeH - 8, top));

    loupe.style.transform = `translate(${left}px, ${top}px)`;
    if (loupeTag) loupeTag.textContent = labelText;

    const ctx = loupeCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, loupeW, loupeH);

    const ctm = overlay.getScreenCTM?.();
    const screenPixelsPerUnitX = ctm ? Math.hypot(ctm.a, ctm.b) : ((mediaRect.width / width) * (zoomScale || 1));
    const screenPixelsPerUnitY = ctm ? Math.hypot(ctm.c, ctm.d) : ((mediaRect.height / height) * (zoomScale || 1));

    const natScaleX = image.naturalWidth / width;
    const natScaleY = image.naturalHeight / height;
    const imgX = point[0] * natScaleX;
    const imgY = point[1] * natScaleY;

    // Crop region with 2.5x zoom multiplier
    const cropW = screenPixelsPerUnitX > 0 ? (loupeW / 2.5) / screenPixelsPerUnitX * natScaleX : 50;
    const cropH = screenPixelsPerUnitY > 0 ? (loupeH / 2.5) / screenPixelsPerUnitY * natScaleY : 50;
    const cropX = imgX - cropW / 2;
    const cropY = imgY - cropH / 2;

    try {
      ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, loupeW, loupeH);
    } catch {}

    // Precision Crosshair overlay
    ctx.strokeStyle = '#d62839';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(loupeW / 2, loupeH / 2, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(loupeW / 2, 0); ctx.lineTo(loupeW / 2, loupeH);
    ctx.moveTo(0, loupeH / 2); ctx.lineTo(loupeW, loupeH / 2);
    ctx.stroke();
  }

  function hideLoupe() {
    if (loupe) loupe.hidden = true;
  }

  function eventToImagePoint(event) {
    if (!width || !height) return [0, 0];
    const ctm = overlay.getScreenCTM?.();
    if (ctm) {
      try {
        const inverse = ctm.inverse();
        const pt = overlay.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const transformed = pt.matrixTransform(inverse);
        return [
          Math.max(0, Math.min(width, transformed.x)),
          Math.max(0, Math.min(height, transformed.y))
        ];
      } catch {}
    }
    const rect = overlay.getBoundingClientRect();
    return [
      Math.max(0, Math.min(width, ((event.clientX - rect.left) / rect.width) * width)),
      Math.max(0, Math.min(height, ((event.clientY - rect.top) / rect.height) * height))
    ];
  }

  // Touch scroll prevention when touching/dragging point elements on mobile touch devices
  overlay.addEventListener('touchstart', (e) => {
    if (e.target.closest?.('.calibration-point, .measurement-point')) {
      if (e.touches.length === 1) e.preventDefault();
    }
  }, { passive: false });

  overlay.addEventListener('touchmove', (e) => {
    if (draggedItem) {
      e.preventDefault();
    }
  }, { passive: false });

  overlay.addEventListener('pointerdown', (event) => {
    const cornerTarget = event.target.closest?.('.calibration-point');
    const pointTarget = event.target.closest?.('.measurement-point');

    const isTouch = event.pointerType === 'touch';
    if (cornerTarget && onMoveCorner && cornerTarget.dataset.cornerIndex !== undefined) {
      event.preventDefault();
      const idx = Number(cornerTarget.dataset.cornerIndex);
      const currentPt = lastRenderOptions?.corners?.[idx];
      draggedItem = { type: 'corner', index: idx };
      activeSelectedPoint = { type: 'corner', index: idx };
      updateNudgePadState();
      dragStartEventPt = eventToImagePoint(event);
      dragStartPt = currentPt ? [currentPt[0], currentPt[1]] : [...dragStartEventPt];

      overlay.setPointerCapture?.(event.pointerId);
      overlay.classList.add('is-dragging-point');
      media.classList.add('is-dragging-point');
      updateLoupe(dragStartPt, `C${idx + 1}`, event.clientX, event.clientY, isTouch);
      return;
    }

    if (pointsDraggable && pointTarget && onMovePoint && pointTarget.dataset.pointIndex !== undefined) {
      event.preventDefault();
      const idx = Number(pointTarget.dataset.pointIndex);
      const currentPt = lastRenderOptions?.dataPoints?.[idx];
      draggedItem = { type: 'point', index: idx };
      activeSelectedPoint = { type: 'point', index: idx };
      updateNudgePadState();
      dragStartEventPt = eventToImagePoint(event);
      dragStartPt = currentPt ? [currentPt[0], currentPt[1]] : [...dragStartEventPt];

      overlay.setPointerCapture?.(event.pointerId);
      overlay.classList.add('is-dragging-point');
      media.classList.add('is-dragging-point');
      const prefix = lastRenderOptions?.pointPrefix || 'P';
      updateLoupe(dragStartPt, `${prefix}${idx + 1}`, event.clientX, event.clientY, isTouch);
      return;
    }
  });

  overlay.addEventListener('pointermove', (event) => {
    if (!draggedItem || !dragStartPt || !dragStartEventPt) return;
    event.preventDefault();
    const currentEventPt = eventToImagePoint(event);
    const dx = currentEventPt[0] - dragStartEventPt[0];
    const dy = currentEventPt[1] - dragStartEventPt[1];

    const pt = [
      Math.max(0, Math.min(width, dragStartPt[0] + dx)),
      Math.max(0, Math.min(height, dragStartPt[1] + dy))
    ];

    const isTouch = event.pointerType === 'touch';
    const label = draggedItem.type === 'corner'
      ? `C${draggedItem.index + 1}`
      : `${lastRenderOptions?.pointPrefix || 'P'}${draggedItem.index + 1}`;

    updateLoupe(pt, label, event.clientX, event.clientY, isTouch);

    if (draggedItem.type === 'corner' && onMoveCorner) {
      onMoveCorner(draggedItem.index, pt, { committed: false });
    } else if (draggedItem.type === 'point' && onMovePoint) {
      onMovePoint(draggedItem.index, pt, { committed: false });
    }
  });

  overlay.addEventListener('pointerup', (event) => {
    hideLoupe();
    media.classList.remove('is-dragging-point');
    if (draggedItem && dragStartPt && dragStartEventPt) {
      event.preventDefault();
      const currentEventPt = eventToImagePoint(event);
      const dx = currentEventPt[0] - dragStartEventPt[0];
      const dy = currentEventPt[1] - dragStartEventPt[1];

      const pt = [
        Math.max(0, Math.min(width, dragStartPt[0] + dx)),
        Math.max(0, Math.min(height, dragStartPt[1] + dy))
      ];

      const item = draggedItem;
      draggedItem = null;
      dragStartPt = null;
      dragStartEventPt = null;

      overlay.releasePointerCapture?.(event.pointerId);
      overlay.classList.remove('is-dragging-point');
      updateNudgePadState();

      if (item.type === 'corner' && onMoveCorner) {
        onMoveCorner(item.index, pt, { committed: true });
      } else if (item.type === 'point' && onMovePoint) {
        onMovePoint(item.index, pt, { committed: true });
      }
      return;
    }
    if (!interactive || !width || !height || !onPoint) return;
    onPoint(eventToImagePoint(event), event);
  });

  overlay.addEventListener('pointercancel', (event) => {
    hideLoupe();
    media.classList.remove('is-dragging-point');
    if (draggedItem && dragStartPt && dragStartEventPt) {
      const currentEventPt = eventToImagePoint(event);
      const dx = currentEventPt[0] - dragStartEventPt[0];
      const dy = currentEventPt[1] - dragStartEventPt[1];

      const pt = [
        Math.max(0, Math.min(width, dragStartPt[0] + dx)),
        Math.max(0, Math.min(height, dragStartPt[1] + dy))
      ];

      const item = draggedItem;
      draggedItem = null;
      dragStartPt = null;
      dragStartEventPt = null;

      if (item.type === 'corner' && onMoveCorner) {
        onMoveCorner(item.index, pt, { committed: true });
      } else if (item.type === 'point' && onMovePoint) {
        onMovePoint(item.index, pt, { committed: true });
      }
    }
    overlay.classList.remove('is-dragging-point');
    updateNudgePadState();
  });

  overlay.addEventListener('keydown', (event) => {
    const cornerTarget = event.target.closest?.('.calibration-point');
    const pointTarget = event.target.closest?.('.measurement-point');
    if (!event.key.startsWith('Arrow')) return;

    const target = pointTarget || cornerTarget;
    if (!target) return;

    const isCorner = !!cornerTarget;
    const callback = isCorner ? onMoveCorner : onMovePoint;
    if (!callback) return;

    event.preventDefault();
    const index = Number(isCorner ? target.dataset.cornerIndex : target.dataset.pointIndex);
    const core = target.querySelector('.point-core');
    const step = (event.shiftKey ? 10 : 2) * (width / overlay.getBoundingClientRect().width);
    const deltas = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const [dx, dy] = deltas[event.key];
    const point = [
      Math.max(0, Math.min(width, Number(core.getAttribute('cx')) + dx)),
      Math.max(0, Math.min(height, Number(core.getAttribute('cy')) + dy))
    ];
    callback(index, point, { committed: true });
    overlay.querySelector(`[data-${isCorner ? 'corner' : 'point'}-index="${index}"]`)?.focus();
  });

  function setImage(src, alt = '') {
    empty.hidden = true;
    image.alt = alt;
    const filename = src.split('/').pop() || src;
    const candidates = [
      src,
      `./${filename}`,
      `./public/${filename}`,
      `./src/assets/${filename}`,
      `/${filename}`
    ];
    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    return new Promise((resolve, reject) => {
      let index = 0;
      function tryNext() {
        if (index >= uniqueCandidates.length) {
          reject(new Error(`Unable to load workspace image (${filename}).`));
          return;
        }
        const currentUrl = uniqueCandidates[index++];
        image.onload = () => {
          width = image.naturalWidth;
          height = image.naturalHeight;
          media.style.aspectRatio = `${width} / ${height}`;
          overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
          overlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          resolve({ width, height });
        };
        image.onerror = () => {
          tryNext();
        };
        image.src = currentUrl;
      }
      tryNext();
    });
  }

  function clearImage() {
    image.removeAttribute('src');
    image.alt = '';
    width = 0;
    height = 0;
    media.style.removeProperty('aspect-ratio');
    overlay.removeAttribute('viewBox');
    overlay.innerHTML = '';
    empty.hidden = false;
  }

  function render(options = {}) {
    lastRenderOptions = options;
    const {
      corners = [],
      dataPoints = [],
      shadowPoints = [],
      cornerCount = corners.length,
      pointCount = dataPoints.length,
      showScale = false,
      showOverlay = true,
      scaleWidth = 6,
      scaleHeight = 6,
      interactiveMode = false,
      draggablePoints = false,
      pointPrefix = 'Q',
      shadowPrefix = 'P'
    } = options;
    overlay.innerHTML = '';
    overlay.toggleAttribute('hidden', !showOverlay);
    interactive = interactiveMode;
    pointsDraggable = draggablePoints;
    overlay.classList.toggle('is-interactive', interactiveMode);
    overlay.classList.toggle('has-draggable-points', draggablePoints);
    if (!showOverlay || !width || !height) return;

    const visibleCorners = corners.slice(0, cornerCount);
    const visiblePoints = dataPoints.slice(0, pointCount);
    const displayedWidth = media.getBoundingClientRect().width || width;
    const unitsPerCssPixel = width / displayedWidth;
    const pointRadius = 8 * unitsPerCssPixel;
    const cornerFontSize = 18 * unitsPerCssPixel;
    const coordinateFontSize = 13 * unitsPerCssPixel;
    const measurementFontSize = 16 * unitsPerCssPixel;
    const dimensionFontSize = 24 * unitsPerCssPixel;
    const labelGap = 12 * unitsPerCssPixel;
    const dimensionInset = 34 * unitsPerCssPixel;
    const dimensionOutset = 22 * unitsPerCssPixel;

    const defs = svgNode('defs');
    const marker = svgNode('marker', {
      id: `${container.id || 'workspace'}-arrow`,
      viewBox: '0 0 10 10',
      refX: 5,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse'
    });
    marker.appendChild(svgNode('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'dimension-arrow' }));
    defs.appendChild(marker);
    overlay.appendChild(defs);

    if (visibleCorners.length > 1) {
      overlay.appendChild(svgNode('polyline', {
        points: pointString(visibleCorners),
        class: 'calibration-outline'
      }));
    }

    if (visibleCorners.length === 4) {
      overlay.appendChild(svgNode('line', {
        x1: visibleCorners[3][0],
        y1: visibleCorners[3][1],
        x2: visibleCorners[0][0],
        y2: visibleCorners[0][1],
        class: 'calibration-outline'
      }));
    }

    if (showScale && corners.length === 4) {
      const markerId = `url(#${container.id || 'workspace'}-arrow)`;
      const dimensions = [
        {
          a: [corners[0][0], corners[0][1] + dimensionInset],
          b: [corners[1][0], corners[1][1] + dimensionInset],
          label: `${Number(scaleWidth).toFixed(2)} cm`,
          rotate: 0
        },
        {
          a: [corners[1][0] + dimensionOutset, corners[1][1]],
          b: [corners[2][0] + dimensionOutset, corners[2][1]],
          label: `${Number(scaleHeight).toFixed(2)} cm`,
          rotate: 90
        }
      ];
      dimensions.forEach(({ a, b, label, rotate }) => {
        overlay.appendChild(svgNode('line', {
          x1: a[0], y1: a[1], x2: b[0], y2: b[1],
          class: 'dimension-line',
          'marker-start': markerId,
          'marker-end': markerId
        }));
        const x = (a[0] + b[0]) / 2;
        const y = (a[1] + b[1]) / 2;
        const text = svgNode('text', {
          x,
          y: rotate ? y : y - dimensionFontSize * 0.45,
          class: 'dimension-label',
          'font-size': dimensionFontSize,
          'text-anchor': 'middle',
          'dominant-baseline': rotate ? 'middle' : 'auto',
          transform: rotate ? `rotate(${rotate} ${x} ${y})` : ''
        });
        text.textContent = label;
        overlay.appendChild(text);
      });
    }

    visibleCorners.forEach((point, index) => {
      const group = svgNode('g', {
        class: 'calibration-point',
        tabindex: '0',
        role: 'img',
        'data-corner-index': index
      });
      group.setAttribute('aria-label', `C${index + 1} calibration point; drag or use arrow keys to adjust`);
      const title = svgNode('title');
      title.textContent = `C${index + 1}: drag to adjust`;
      group.appendChild(title);
      const hitRadius = Math.max(pointRadius * 3.5, 26 * unitsPerCssPixel);
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: hitRadius, class: 'point-hit-target'
      }));
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 1.45, class: 'point-halo'
      }));
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius, class: 'point-core'
      }));
      const alignRight = index === 1 || index === 2;
      const isBottom = index > 1;
      const labelX = point[0] + (alignRight ? -labelGap : labelGap);
      const labelY = point[1] + (isBottom ? labelGap * 1.45 : labelGap * 0.35);
      const label = svgNode('text', {
        x: labelX,
        y: labelY,
        class: 'overlay-label calibration-label calibration-name',
        'font-size': cornerFontSize,
        'text-anchor': alignRight ? 'end' : 'start'
      });
      const coords = [[0, 0], [scaleWidth, 0], [scaleWidth, scaleHeight], [0, scaleHeight]][index];
      const formatCoordinate = (value) => Number(value.toFixed(2)).toString();
      label.textContent = `C${index + 1}`;
      group.appendChild(label);
      const coordinate = svgNode('text', {
        x: labelX,
        y: labelY + coordinateFontSize * 1.15,
        class: 'overlay-label calibration-label calibration-coordinate',
        'font-size': coordinateFontSize,
        'text-anchor': alignRight ? 'end' : 'start'
      });
      coordinate.textContent = `(${formatCoordinate(coords[0])},${formatCoordinate(coords[1])})`;
      group.appendChild(coordinate);
      overlay.appendChild(group);
    });

    // Render Shadow Points (if any)
    if (shadowPoints.length > 0) {
      if (shadowPoints.length > 1) {
        overlay.appendChild(svgNode('polyline', {
          points: pointString(shadowPoints),
          class: 'shadow-line'
        }));
      }
      shadowPoints.forEach((point, index) => {
        const group = svgNode('g', { class: 'shadow-point', role: 'img' });
        group.setAttribute('aria-label', `${shadowPrefix}${index + 1} shadow point`);
        group.appendChild(svgNode('circle', {
          cx: point[0], cy: point[1], r: pointRadius * 1.2, class: 'shadow-point-halo'
        }));
        group.appendChild(svgNode('circle', {
          cx: point[0], cy: point[1], r: pointRadius * 0.7, class: 'shadow-point-core'
        }));
        const placements = [
          { dx: -labelGap, dy: -labelGap * 0.7, anchor: 'end' },
          { dx: 0, dy: -labelGap * 1.35, anchor: 'middle' },
          { dx: 0, dy: labelGap * 1.65, anchor: 'middle' },
          { dx: 0, dy: labelGap * 1.65, anchor: 'middle' },
          { dx: 0, dy: -labelGap * 1.35, anchor: 'middle' },
          { dx: labelGap, dy: -labelGap * 0.7, anchor: 'start' }
        ];
        const placement = placements[index % placements.length];
        const label = svgNode('text', {
          x: point[0] + placement.dx,
          y: point[1] + placement.dy,
          class: 'overlay-label shadow-label',
          'font-size': measurementFontSize * 0.9,
          'text-anchor': placement.anchor
        });
        label.textContent = `${shadowPrefix}${index + 1}`;
        group.appendChild(label);
        overlay.appendChild(group);
      });
    }

    // Render Active Measurement Points
    if (visiblePoints.length > 1) {
      overlay.appendChild(svgNode('polyline', {
        points: pointString(visiblePoints),
        class: 'measurement-line'
      }));
    }

    visiblePoints.forEach((point, index) => {
      const group = svgNode('g', {
        class: 'measurement-point',
        tabindex: '0',
        role: 'img',
        'data-point-index': index
      });
      group.setAttribute('aria-label', `${pointPrefix}${index + 1} measurement point; drag or use arrow keys to adjust`);
      const title = svgNode('title');
      title.textContent = `${pointPrefix}${index + 1}: drag to adjust`;
      group.appendChild(title);
      const hitRadius = Math.max(pointRadius * 3.5, 26 * unitsPerCssPixel);
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: hitRadius, class: 'point-hit-target'
      }));
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 1.35, class: 'point-halo'
      }));
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 0.86, class: 'point-core'
      }));
      const placements = [
        { dx: -labelGap, dy: -labelGap * 0.7, anchor: 'end' },
        { dx: 0, dy: -labelGap * 1.35, anchor: 'middle' },
        { dx: 0, dy: labelGap * 1.65, anchor: 'middle' },
        { dx: 0, dy: labelGap * 1.65, anchor: 'middle' },
        { dx: 0, dy: -labelGap * 1.35, anchor: 'middle' },
        { dx: labelGap, dy: -labelGap * 0.7, anchor: 'start' }
      ];
      const placement = placements[index];
      const label = svgNode('text', {
        x: point[0] + placement.dx,
        y: point[1] + placement.dy,
        class: 'overlay-label measurement-label',
        'font-size': measurementFontSize,
        'text-anchor': placement.anchor
      });
      label.textContent = `${pointPrefix}${index + 1}`;
      group.appendChild(label);
      overlay.appendChild(group);
    });
  }

  function setExpanded(expanded) {
    container.classList.toggle('is-expanded', expanded);
  }

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      if (width && lastRenderOptions) render(lastRenderOptions);
    });
    resizeObserver.observe(media);
  }

  return {
    setImage,
    clearImage,
    render,
    setExpanded,
    getSize: () => ({ width, height }),
    getImageElement: () => image
  };
}
