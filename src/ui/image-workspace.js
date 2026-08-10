const SVG_NS = 'http://www.w3.org/2000/svg';

function svgNode(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function pointString(points) {
  return points.map((point) => point.join(',')).join(' ');
}

export function createImageWorkspace(container, { onPoint } = {}) {
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

  overlay.addEventListener('pointerup', (event) => {
    if (!interactive || !width || !height || !onPoint) return;
    const rect = overlay.getBoundingClientRect();
    const point = [
      ((event.clientX - rect.left) / rect.width) * width,
      ((event.clientY - rect.top) / rect.height) * height
    ];
    onPoint(point, event);
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

  function render({
    corners = [],
    dataPoints = [],
    cornerCount = corners.length,
    pointCount = dataPoints.length,
    showScale = false,
    showOverlay = true,
    interactiveMode = false
  } = {}) {
    overlay.innerHTML = '';
    overlay.hidden = !showOverlay;
    interactive = interactiveMode;
    overlay.classList.toggle('is-interactive', interactiveMode);
    if (!showOverlay || !width || !height) return;

    const visibleCorners = corners.slice(0, cornerCount);
    const visiblePoints = dataPoints.slice(0, pointCount);
    // SVG user units scale with the photo, so these sizes remain legible on narrow screens.
    const pointRadius = Math.max(14, width * 0.01);
    const fontSize = Math.max(48, width * 0.031);
    const dimensionFontSize = Math.max(58, width * 0.038);

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
        { a: corners[0], b: corners[1], label: '6.00 cm', rotate: 0 },
        { a: corners[1], b: corners[2], label: '6.00 cm', rotate: 90 }
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
          y: y - dimensionFontSize * 0.65,
          class: 'dimension-label',
          'font-size': dimensionFontSize,
          'text-anchor': 'middle',
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
      const label = svgNode('text', {
        x: point[0] + pointRadius * 1.55,
        y: point[1] - pointRadius * 1.4,
        class: 'overlay-label calibration-label',
        'font-size': fontSize
      });
      const coords = [[0, 0], [6, 0], [6, 6], [0, 6]][index];
      label.textContent = `C${index + 1} (${coords[0]},${coords[1]})`;
      group.appendChild(label);
      overlay.appendChild(group);
    });

    if (visiblePoints.length > 1) {
      overlay.appendChild(svgNode('polyline', {
        points: pointString(visiblePoints),
        class: 'measurement-line'
      }));
    }

    visiblePoints.forEach((point, index) => {
      const group = svgNode('g', { class: 'measurement-point', tabindex: '0', role: 'img' });
      group.setAttribute('aria-label', `Q${index + 1} measurement point`);
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 1.35, class: 'point-halo'
      }));
      group.appendChild(svgNode('circle', {
        cx: point[0], cy: point[1], r: pointRadius * 0.86, class: 'point-core'
      }));
      const label = svgNode('text', {
        x: point[0] + pointRadius * 1.35,
        y: point[1] - pointRadius * 1.15,
        class: 'overlay-label measurement-label',
        'font-size': fontSize
      });
      label.textContent = `Q${index + 1}`;
      group.appendChild(label);
      overlay.appendChild(group);
    });
  }

  function setExpanded(expanded) {
    container.classList.toggle('is-expanded', expanded);
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
