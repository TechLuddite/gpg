/**
 * A fixed-ish game loop on requestAnimationFrame.
 *
 * `step(dt)` gets seconds since the last frame, clamped to 0.05 so that a
 * backgrounded tab does not resume with one enormous jump that teleports
 * everything through everything else.
 */
export function createLoop(step, render) {
  let rafId = null;
  let last = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    if (render) render();
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
    get running() {
      return running;
    },
  };
}

