// Pointer/Touch event binding helper for interactive point dragging

export function attachDrag(svg, pointGetter, pointSetter, mapGetter, constrain) {
  let drag = null;

  svg.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('circle[data-index]');
    if (!t) return;
    drag = { index: +t.dataset.index, pointer: e.pointerId };
    t.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  svg.addEventListener('pointermove', (e) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = ((e.clientX - r.left) / r.width) * vb.width + vb.x;
    const y = ((e.clientY - r.top) / r.height) * vb.height + vb.y;

    const map = mapGetter();
    if (!map) return;

    let p = map.toData([x, y]);
    if (constrain) p = constrain(drag.index, p);
    pointSetter(drag.index, p);
  });

  const end = (e) => {
    if (drag && drag.pointer === e.pointerId) drag = null;
  };

  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}
