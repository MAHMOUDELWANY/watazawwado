(() => {
  let t = 0; const T0 = 1.7e12; let seq = 0; const timers = new Map(); let raf = []; 
  performance.now = () => t; Date.now = () => T0 + t;
  window.requestAnimationFrame = (cb) => { raf.push([++seq, cb]); return seq; };
  window.cancelAnimationFrame = (h) => { raf = raf.filter(([k]) => k !== h); };
  window.setTimeout = (cb, ms = 0, ...a) => { timers.set(++seq, { at: t + (ms || 0), cb: () => cb(...a) }); return seq; };
  window.setInterval = (cb, ms = 0, ...a) => { const k = ++seq; const tick = { at: t + ms, every: Math.max(1, ms), cb: () => cb(...a) }; timers.set(k, tick); return k; };
  window.clearTimeout = window.clearInterval = (k) => timers.delete(k);
  window.__advance = (ms) => {
    const end = t + ms;
    for (;;) { let next = null; for (const [k, v] of timers) if (v.at <= end && (!next || v.at < next[1].at)) next = [k, v]; if (!next) break; t = Math.max(t, next[1].at); if (next[1].every) next[1].at += next[1].every; else timers.delete(next[0]); try { next[1].cb(); } catch (e) { console.error(e); } }
    t = end; const q = raf; raf = []; for (const [, cb] of q) { try { cb(t); } catch (e) { console.error(e); } }
  };
})();