/** Small DOM helpers shared by the games. Nothing clever on purpose. */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setText(el, value) {
  if (el && el.textContent !== String(value)) el.textContent = String(value);
}

/**
 * Sizes a canvas to its CSS box at the device pixel ratio, so drawings are
 * crisp on phones. Calls back with the CSS-pixel width and height.
 */
export function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext('2d');
  function apply() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (onResize) onResize(w, h);
  }
  apply();
  window.addEventListener('resize', apply);
  return apply;
}

/** Pointer position in CSS pixels relative to an element. */
export function pointerPos(event, el) {
  const rect = el.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/** Turns an inline <svg> into a PNG download. No external refs allowed. */
export function downloadSvgAsPng(svg, filename, scale = 2) {
  const clone = svg.cloneNode(true);
  const box = svg.viewBox.baseVal;
  const w = box && box.width ? box.width : svg.clientWidth;
  const h = box && box.height ? box.height : svg.clientHeight;
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const source = new XMLSerializer().serializeToString(clone);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    }, 'image/png');
  };
  img.src = url;
}

/** Formats seconds as m:ss.t */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const t = Math.floor((seconds * 10) % 10);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}
