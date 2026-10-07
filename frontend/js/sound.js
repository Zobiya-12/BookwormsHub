/* BookWorm's Hub — sound effects (synthesised with the Web Audio API, no audio files).
   Load after api.js. Other scripts call BW.sfx.open() / page() / add() / close() / success().
   The nav gets a mute button; the choice is remembered in localStorage ('bw_sound'). */
(function () {
  const KEY = 'bw_sound';
  let ctx = null;

  const enabled = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };

  // Browsers only allow audio after a click or tap, so the context is created lazily
  function ac() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch { return null; }
  }

  function tone(freq, type, dur, vol, delay = 0) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur);
  }

  // Filtered noise whose pitch sweeps from f0 to f1: paper rustle / page swish
  function swish(dur, vol, f0, f1, delay = 0) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t); src.stop(t + dur);
  }

  const play = fn => () => { if (enabled()) fn(); };

  BW.sfx = {
    enabled,
    // Book opens: soft cover thump, then pages fanning
    open: play(() => { tone(95, 'sine', 0.22, 0.2); swish(0.35, 0.25, 600, 2600, 0.06); }),
    // Page turn
    page: play(() => swish(0.22, 0.22, 1400, 4200)),
    // Book closes
    close: play(() => { swish(0.16, 0.14, 2200, 700); tone(80, 'sine', 0.16, 0.16, 0.1); }),
    // Saved to library: bright two-note chime
    add: play(() => { tone(659.25, 'sine', 0.22, 0.12); tone(987.77, 'sine', 0.35, 0.1, 0.09); }),
    // Pass created: rising arpeggio
    success: play(() => [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, 'sine', 0.35, 0.11, i * 0.1)))
  };

  // Mute button in the nav
  document.addEventListener('DOMContentLoaded', () => {
    const right = document.querySelector('.nav-right');
    if (!right || document.getElementById('soundToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'soundToggleBtn'; btn.type = 'button'; btn.className = 'nav-icon-btn';
    const paint = () => {
      const on = enabled();
      btn.textContent = on ? '🔊' : '🔇';
      btn.setAttribute('aria-label', on ? 'Mute sound effects' : 'Turn on sound effects');
      btn.title = on ? 'Sound on' : 'Sound off';
      btn.setAttribute('aria-pressed', on);
    };
    btn.onclick = () => {
      const turnOn = !enabled();
      try { localStorage.setItem(KEY, turnOn ? 'on' : 'off'); } catch {}
      paint();
      if (turnOn) BW.sfx.add();
    };
    paint();
    right.insertBefore(btn, right.firstChild);
  });
})();