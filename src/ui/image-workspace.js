const SVG_NS = 'http://www.w3.org/2000/svg';

function svgNode(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function pointString(points) {
  return points.map((point) => point.join(',')).join(' ');
}

export function createImageWorkspace(container, { onPoint, onMovePoint } = {}) {
  if (!container) throw new Error('Image workspace container is required.');

  container.classList.add('image-workspace');
  container.innerHTML = `
    <div class="workspace-media">
      <img class="workspace-image" alt="" draggable="false">
      <svg class="workspace-overlay" role="img" aria-label="Calibration and measurement overlay"></svg>
      <div class="workspace-empty">เลือกภาพหรือเปิดกล้องเพื่อเริ่มต้น</div>
    </div>
  `;

  const media = container.querySelector('.workspace-media');
  const image = container.querySelector('.workspace-image');
  const overlay = container.querySelector('.workspace-overlay');
  const empty = container.querySelector('.workspace-empty');
  let width = 0;
  let height = 0;
  let interactive = false;
  let pointsDraggable = false;
  let draggedPointIndex = null;
  let lastRenderOptions = null;

  function eventToImagePoint(event) {
    const rect = overlay.getBoundingClientRect();
    return [
      Math.max(0, Math.min(width, ((event.clientX - rect.left) / rect.width) * width)),
      Math.max(0, Math.min(height, ((event.clientY - rect.top) / rect.height) * height))
    ];
  }

  overlay.addEventListener('pointerdown', (event) => {
    const target = event.target.closest?.('.measurement-point');
    if (!pointsDraggable || !target || !onMovePoint) return;
    event.preventDefault();
    draggedPointIndex = Number(target.dataset.pointIndex);
    overlay.setPointerCapture?.(event.pointerId);
    overlay.classList.add('is-dragging-point');
  });

  overlay.addEventListener('pointermove', (event) => {
    if (draggedPointIndex === null || !onMovePoint) return;
    event.preventDefault();
    onMovePoint(draggedPointIndex, eventToImagePoint(event), { committed: false });
  });

  overlay.addEventListener('pointerup', (event) => {
    if (draggedPointIndex !== null && onMovePoint) {
      event.preventDefault();
      const pointIndex = draggedPointIndex;
      draggedPointIndex = null;
      overlay.releasePointerCapture?.(event.pointerId);
      overlay.classList.remove('is-dragging-point');
      onMovePoint(pointIndex, eventToImagePoint(event), { committed: true });
      return;
    }
    if (!interactive || !width || !height || !onPoint) return;
    onPoint(eventToImagePoint(event), event);
  });

  overlay.addEventListener('pointercancel', (event) => {
    if (draggedPointIndex !== null && onMovePoint) {
      const pointIndex = draggedPointIndex;
      draggedPointIndex = null;
      onMovePoint(pointIndex, eventToImagePoint(event), { committed: true });
    }
    overlay.classList.remove('is-dragging-point');
  });

  overlay.addEventListener('keydown', (event) => {
    const target = event.target.closest?.('.measurement-point');
    if (!pointsDraggable || !target || !onMovePoint || !event.key.startsWith('Arrow')) return;
    event.preventDefault();
    const index = Number(target.dataset.pointIndex);
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
    onMovePoint(index, point, { committed: true });
    overlay.querySelector(`[data-point-index="${index}"]`)?.focus();
  });

  function setImage(src, alt = '') {
    empty.hidden = true;
    image.alt = alt;
    return new Promise((resolve, reject) => {
      image.onload = () => {
        width = image.naturalWidth;
        height = image.naturalHeight;
        media.style.aspectRatio = `${width} / ${height}`;
        overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
        overlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        resolve({ width, height });
      };
      image.onerror = () => reject(new Error('Unable to load workspace image.'));
      image.src = src;
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
      cornerCount = corners.length,
      pointCount = dataPoints.length,
      showScale = false,
      showOverlay = true,
      scaleWidth = 6,
      scaleHeight = 6,
      interactiveMode = false,
      draggablePoints = false
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
      const group = svgNode('g', { class: 'calibration-point', tabindex: '0', role: 'img' });
      group.setAttribute('aria-label', `C${index + 1} calibration point`);
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
      group.setAttribute('aria-label', `Q${index + 1} measurement point; drag or use arrow keys to adjust`);
      const title = svgNode('title');
      title.textContent = `Q${index + 1}: drag to adjust`;
      group.appendChild(title);
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 2, class: 'point-hit-target'
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
      label.textContent = `Q${index + 1}`;
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
