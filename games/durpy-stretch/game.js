import { $, $$, setText, downloadCanvasAsPng } from '../../shared/ui.js';
import { load, save, clear } from '../../shared/storage.js';
import {
  MESH, PULL_RADIUS, MAX_PULLS, COATS, coatById,
  makePull, clampStretch, buildMesh, warpMesh, addPull, randomPulls,
  captionFor, isPull,
} from './logic.js';

const COAT_KEY = 'durpy-stretch:coat';
const STICKY_KEY = 'durpy-stretch:sticky';
const POSE_KEY = 'durpy-stretch:pose';
const PHOTO_KEY = 'durpy-stretch:photo';

/** Every picture is squared off to this size before it becomes a texture. */
const PICTURE_SIZE = 1024;

/**
 * The bundled picture, if there is one. Drop a file called derpy.png (or
 * derpy.jpg) into this folder and it becomes the default for everybody; a
 * picture picked on the device wins over it.
 */
const BUNDLED = ['derpy.png', 'derpy.jpg']
  .map((name) => new URL(name, import.meta.url).href);

const canvas = $('#face');
const els = {
  stage: $('#stage'),
  empty: $('#empty'),
  caption: $('#caption'),
  coats: $('#coats'),
  sticky: $('#sticky'),
  forget: $('#forget'),
  file: $('#file'),
  announce: $('#announce'),
};

let pulls = (load(POSE_KEY, []) || []).filter(isPull).slice(-MAX_PULLS);
let sticky = Boolean(load(STICKY_KEY, false));
let coat = coatById(load(COAT_KEY, COATS[0].id));
let picture = null;      // the squared-off source image, as a canvas
let usingOwnPicture = false;

/* ---------- Renderer ---------- */

const mesh = buildMesh(MESH);
const positions = new Float32Array(mesh.rest.length);

/**
 * WebGL draws the photo across the warped grid in one call. Where WebGL is
 * unavailable, the 2D fallback draws the same grid a triangle at a time,
 * which is slower but looks the same.
 */
function createGlRenderer() {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true })
    || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
  if (!gl) return null;

  const vertexSource = `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() {
      v_uv = a_uv;
      gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0.0, 1.0);
    }`;
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_picture;
    uniform float u_hue;
    uniform float u_saturation;
    uniform float u_brightness;
    varying vec2 v_uv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    void main() {
      vec4 colour = texture2D(u_picture, v_uv);
      vec3 hsv = rgb2hsv(colour.rgb);
      hsv.x = fract(hsv.x + u_hue);
      hsv.y = clamp(hsv.y * u_saturation, 0.0, 1.0);
      hsv.z = clamp(hsv.z * u_brightness, 0.0, 1.0);
      gl_FragColor = vec4(hsv2rgb(hsv), colour.a);
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return null;
  }
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.rest, gl.STATIC_DRAW);
  const uvLocation = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.triangles, gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uniforms = {
    hue: gl.getUniformLocation(program, 'u_hue'),
    saturation: gl.getUniformLocation(program, 'u_saturation'),
    brightness: gl.getUniformLocation(program, 'u_brightness'),
  };

  return {
    name: 'webgl',
    setPicture(source) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    },
    draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uniforms.hue, coat.hue / 360);
      gl.uniform1f(uniforms.saturation, coat.saturation);
      gl.uniform1f(uniforms.brightness, coat.brightness);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
      gl.drawElements(gl.TRIANGLES, mesh.triangles.length, gl.UNSIGNED_SHORT, 0);
    },
  };
}

function create2dRenderer() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  let source = null;
  const size = canvas.width;
  const { rest, triangles } = mesh;

  return {
    name: '2d',
    setPicture(image) { source = image; },
    draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if (!source) return;
      ctx.filter = coat.hue === 0 && coat.saturation === 1 && coat.brightness === 1
        ? 'none'
        : `hue-rotate(${coat.hue}deg) saturate(${coat.saturation}) brightness(${coat.brightness})`;

      // Each triangle maps three texture points onto three screen points;
      // that is an affine transform, and drawImage does the rest. Triangles
      // are grown very slightly so their edges overlap and no seams show.
      for (let i = 0; i < triangles.length; i += 3) {
        const a = triangles[i] * 2;
        const b = triangles[i + 1] * 2;
        const c = triangles[i + 2] * 2;
        const sx0 = rest[a] * size, sy0 = rest[a + 1] * size;
        const sx1 = rest[b] * size, sy1 = rest[b + 1] * size;
        const sx2 = rest[c] * size, sy2 = rest[c + 1] * size;
        const dx0 = positions[a] * size, dy0 = positions[a + 1] * size;
        const dx1 = positions[b] * size, dy1 = positions[b + 1] * size;
        const dx2 = positions[c] * size, dy2 = positions[c + 1] * size;

        const det = (sx1 - sx0) * (sy2 - sy0) - (sx2 - sx0) * (sy1 - sy0);
        if (Math.abs(det) < 1e-6) continue;
        const m11 = ((dx1 - dx0) * (sy2 - sy0) - (dx2 - dx0) * (sy1 - sy0)) / det;
        const m12 = ((dy1 - dy0) * (sy2 - sy0) - (dy2 - dy0) * (sy1 - sy0)) / det;
        const m21 = ((dx2 - dx0) * (sx1 - sx0) - (dx1 - dx0) * (sx2 - sx0)) / det;
        const m22 = ((dy2 - dy0) * (sx1 - sx0) - (dy1 - dy0) * (sx2 - sx0)) / det;
        const tx = dx0 - m11 * sx0 - m21 * sy0;
        const ty = dy0 - m12 * sx0 - m22 * sy0;

        const cx = (dx0 + dx1 + dx2) / 3;
        const cy = (dy0 + dy1 + dy2) / 3;
        const grow = 1.03;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + (dx0 - cx) * grow, cy + (dy0 - cy) * grow);
        ctx.lineTo(cx + (dx1 - cx) * grow, cy + (dy1 - cy) * grow);
        ctx.lineTo(cx + (dx2 - cx) * grow, cy + (dy2 - cy) * grow);
        ctx.closePath();
        ctx.clip();
        ctx.setTransform(m11, m12, m21, m22, tx, ty);
        ctx.drawImage(source, 0, 0, size, size);
        ctx.restore();
      }
      ctx.filter = 'none';
    },
  };
}

const renderer = createGlRenderer() || create2dRenderer();

/* ---------- Drawing ---------- */

let activePull = null;    // the pull under the finger right now
let springing = null;     // { pull, start } while a released pull snaps back
let frame = 0;

function livePulls() {
  const list = pulls.slice();
  if (activePull) list.push(activePull);
  if (springing) list.push(springing.pull);
  return list;
}

function render() {
  frame = 0;
  if (!picture) return;
  const live = livePulls();
  warpMesh(mesh, live, positions);
  renderer.draw();
  setText(els.caption, captionFor(live));
}

function requestRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

/** Overshoots past home and settles, like a rubber sheet let go. */
function bounce(t) {
  if (t >= 1) return 0;
  return Math.exp(-6 * t) * Math.cos(9 * t);
}

function startSpring(pull) {
  const start = performance.now();
  springing = { pull: { ...pull }, start };
  const tick = (now) => {
    if (!springing || springing.start !== start) return;
    const t = (now - start) / 620;
    if (t >= 1) {
      springing = null;
      render();
      return;
    }
    springing.pull.strength = bounce(t);
    render();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function persistPose() {
  save(POSE_KEY, pulls);
}

/* ---------- Pictures ---------- */

/** Draws any image centred and cropped to a square canvas of PICTURE_SIZE. */
function squareOff(image) {
  const w = image.naturalWidth || image.videoWidth || image.width;
  const h = image.naturalHeight || image.videoHeight || image.height;
  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;
  const out = document.createElement('canvas');
  out.width = PICTURE_SIZE;
  out.height = PICTURE_SIZE;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PICTURE_SIZE, PICTURE_SIZE);
  ctx.drawImage(image, sx, sy, side, side, 0, 0, PICTURE_SIZE, PICTURE_SIZE);
  return out;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function usePicture(source, { own = false } = {}) {
  picture = squareOff(source);
  usingOwnPicture = own;
  renderer.setPicture(picture);
  els.empty.hidden = true;
  els.forget.hidden = !own;
  els.stage.classList.remove('busy');
  render();
}

function showEmpty() {
  picture = null;
  usingOwnPicture = false;
  els.empty.hidden = false;
  els.forget.hidden = true;
  els.stage.classList.remove('busy');
  setText(els.caption, 'Durpy is not here yet.');
}

/** The first bundled picture that exists, or null if there is none. */
async function loadBundled() {
  for (const src of BUNDLED) {
    try {
      return await loadImage(src);
    } catch {
      // Try the next name.
    }
  }
  return null;
}

async function loadStartingPicture() {
  const saved = load(PHOTO_KEY, null);
  if (typeof saved === 'string' && saved.startsWith('data:image/')) {
    try {
      usePicture(await loadImage(saved), { own: true });
      return;
    } catch {
      clear(PHOTO_KEY);
    }
  }
  const bundled = await loadBundled();
  if (bundled) usePicture(bundled);
  else showEmpty();
}

async function pickFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  els.stage.classList.add('busy');
  try {
    let source;
    if (typeof createImageBitmap === 'function') {
      // from-image honours the camera's rotation flag, so phone photos are
      // the right way up.
      source = await createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(() => createImageBitmap(file));
    } else {
      const url = URL.createObjectURL(file);
      try { source = await loadImage(url); } finally { URL.revokeObjectURL(url); }
    }
    usePicture(source, { own: true });
    if (source.close) source.close();

    // Keep it for next time. A 1024 square JPEG is a few hundred kilobytes,
    // well inside what localStorage allows; if saving fails the picture
    // still works for this visit.
    const stored = save(PHOTO_KEY, picture.toDataURL('image/jpeg', 0.86));
    els.announce.textContent = stored
      ? 'Picture loaded and saved on this device.'
      : 'Picture loaded. It could not be saved, so it will be gone next time.';
  } catch {
    els.stage.classList.remove('busy');
    els.announce.textContent = 'That picture could not be opened.';
  }
}

/* ---------- Dragging ---------- */

/** Client pixels to picture fractions, 0 to 1. */
function toPicture(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.width ? (event.clientX - rect.left) / rect.width : 0,
    y: rect.height ? (event.clientY - rect.top) / rect.height : 0,
  };
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  if (!picture || drag) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add('dragging');
  const at = toPicture(event);
  // Grab a bit wider than the default when starting near the edge, so a
  // pull on an ear still moves something.
  const radius = PULL_RADIUS;
  activePull = makePull(at.x, at.y, 0, 0, radius);
  springing = null;
  drag = { pointerId: event.pointerId, origin: at };
  requestRender();
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag || event.pointerId !== drag.pointerId || !activePull) return;
  const at = toPicture(event);
  const stretch = clampStretch(at.x - drag.origin.x, at.y - drag.origin.y);
  activePull.dx = stretch.x;
  activePull.dy = stretch.y;
  requestRender();
});

function release(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  canvas.classList.remove('dragging');
  const finished = activePull;
  activePull = null;
  drag = null;
  if (!finished) return;
  const moved = Math.hypot(finished.dx, finished.dy) > 0.004;
  if (sticky && moved) {
    pulls = addPull(pulls, finished);
    persistPose();
    render();
  } else if (moved) {
    startSpring(finished);
  } else {
    render();
  }
}

canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

/* ---------- Buttons ---------- */

$('#scramble').addEventListener('click', () => {
  if (!picture) return;
  pulls = randomPulls();
  persistPose();
  springing = null;
  render();
  els.announce.textContent = captionFor(pulls);
});

$('#reset').addEventListener('click', () => {
  pulls = [];
  persistPose();
  springing = null;
  render();
  els.announce.textContent = 'Durpy is back to normal.';
});

function renderSticky() {
  els.sticky.textContent = `Sticky: ${sticky ? 'on' : 'off'}`;
  els.sticky.setAttribute('aria-pressed', String(sticky));
}

els.sticky.addEventListener('click', () => {
  sticky = !sticky;
  save(STICKY_KEY, sticky);
  renderSticky();
});

$('#save').addEventListener('click', () => {
  if (!picture) return;
  render();
  downloadCanvasAsPng(canvas, 'durpy.png');
  els.announce.textContent = 'Saving a photo of Durpy.';
});

function renderCoats() {
  els.coats.innerHTML = COATS.map((c) => `
    <button class="swatch" type="button" data-id="${c.id}"
            style="background:${c.swatch}"
            aria-pressed="${c.id === coat.id}" aria-label="${c.name} fur"></button>
  `).join('');
  $$('.swatch', els.coats).forEach((button) => {
    button.addEventListener('click', () => {
      coat = coatById(button.dataset.id);
      save(COAT_KEY, coat.id);
      renderCoats();
      render();
    });
  });
}

for (const id of ['#pick', '#pick-empty']) {
  $(id).addEventListener('click', () => els.file.click());
}
els.file.addEventListener('change', () => {
  pickFile(els.file.files && els.file.files[0]);
  els.file.value = '';
});

els.forget.addEventListener('click', async () => {
  clear(PHOTO_KEY);
  const bundled = await loadBundled();
  if (bundled) usePicture(bundled);
  else showEmpty();
  els.announce.textContent = 'Back to the usual Durpy.';
});

// Dropping a picture onto the page works too.
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) pickFile(file);
});

renderCoats();
renderSticky();
loadStartingPicture();
