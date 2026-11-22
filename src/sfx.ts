const cache: Record<string, HTMLAudioElement> = {};
let enabled = true, chimeOnly = false;
export function setSound(on: boolean, onlyChime = false) { enabled = on; chimeOnly = onlyChime; }
export function play(name: string, volume = 0.6) {
  if (!enabled || (chimeOnly && name !== 'times_up')) return;
  try {
    const a = (cache[name] ||= new Audio(`${import.meta.env.BASE_URL}assets/sfx/${name}.wav`));
    a.volume = volume; a.currentTime = 0; void a.play().catch(() => {});
  } catch { /* audio not available */ }
}

// Paper tearing, made on the fly, sitting between a crisp paper snap and a long cardboard rip:
// each notch starts with a short bright snap (the perforation giving way), then a fuller, lower, grainy rip
// of fibres crunching apart that carries on for about a fifth of a second. Quick pulls overlap them into a long tear.
let actx: AudioContext | null = null;
function noiseBuf(ctx: AudioContext, len: number, fill: (t: number, i: number) => number) {
  const n = Math.ceil(ctx.sampleRate * len), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = fill(i / n, i); return b;
}
// Real tearing, from your own recording: short clips of paper tearing, cut and cleaned up. Each notch plays a random
// piece of a random clip at a slightly different speed, so no two rips sound the same. Until the clips are loaded
// (or if they can't be), the made-up rip below is used instead.
let clips: { buf: AudioBuffer; parts: [number, number][] } | null = null, clipBytes: Promise<ArrayBuffer> | null = null;
export function preloadTear() {
  if (clipBytes) return;
  const base = `${import.meta.env.BASE_URL}assets/sfx/`;
  clipBytes = fetch(base + 'tear_clips.wav').then((r) => r.arrayBuffer());
  Promise.all([clipBytes, fetch(base + 'tear_clips.json').then((r) => r.json())]).then(async ([bytes, parts]) => {
    actx ||= new AudioContext(); clips = { buf: await actx.decodeAudioData(bytes.slice(0)), parts };
  }).catch(() => { /* keep the made-up rip */ });
}
export function tear(strength = 1) {
  if (!enabled || chimeOnly) return;
  try {
    actx ||= new AudioContext(); if (actx.state === 'suspended') void actx.resume();
    if (clips) {
      const c = actx, t0 = c.currentTime, [start, len] = clips.parts[Math.floor(Math.random() * clips.parts.length)];
      const dur = Math.min(len, 0.16 + Math.random() * 0.1), off = start + Math.random() * Math.max(0, len - dur);
      const src = c.createBufferSource(); src.buffer = clips.buf; src.playbackRate.value = 0.9 + Math.random() * 0.2;
      const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.35 * strength, t0 + 0.012);
      g.gain.setValueAtTime(0.35 * strength, t0 + dur * 0.6); g.gain.linearRampToValueAtTime(0, t0 + dur);
      src.connect(g).connect(c.destination); src.start(t0, off, dur + 0.02); return;
    }
    synthTear(strength);
  } catch { /* audio not available */ }
}
function synthTear(strength = 1) {
  {
    actx ||= new AudioContext(); const c = actx, t0 = c.currentTime, out = c.createGain(); out.gain.value = strength; out.connect(c.destination);
    // 1) the snap: short and bright
    const snap = c.createBufferSource(); snap.buffer = noiseBuf(c, 0.03, (t) => (Math.random() * 2 - 1) * Math.pow(1 - t, 3));
    const sbp = c.createBiquadFilter(); sbp.type = 'bandpass'; sbp.frequency.value = 2400 + Math.random() * 900; sbp.Q.value = 1.1;
    const sg = c.createGain(); sg.gain.value = 0.32; snap.connect(sbp).connect(sg).connect(out); snap.start(t0);
    // 2) the rip: grainy cardboard crunch with a soft paper hiss, uneven in loudness
    const len = 0.17 + Math.random() * 0.09, sr = c.sampleRate; let flutter = 0.7, grain = 0, decay = 0;
    const rip = c.createBufferSource(); rip.buffer = noiseBuf(c, len, (t, i) => {
      if (i % Math.floor(sr / 260) === 0) flutter = 0.45 + Math.random() * 0.8;
      if (Math.random() < 0.02) { grain = (Math.random() * 2 - 1) * (0.5 + Math.random()); decay = 0.82 + Math.random() * 0.12; }   // a fibre bundle tears
      grain *= decay;
      const env = Math.min(1, t / 0.12) * Math.pow(1 - t, 1.2);
      return env * flutter * ((Math.random() * 2 - 1) * 0.3 + grain * 0.8);
    });
    rip.playbackRate.value = 0.92 + Math.random() * 0.16;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
    const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 1300 + Math.random() * 600; body.Q.value = 0.8; body.gain.value = 5;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, t0); lp.frequency.linearRampToValueAtTime(3600, t0 + len);
    const rg = c.createGain(); rg.gain.value = 0.6;
    rip.connect(hp).connect(body).connect(lp).connect(rg).connect(out); rip.start(t0 + 0.006);
  }
}

// ---------------- the opening: an alarm clock, a hand slapping it off, a phone buzz and a soft ding ----------------
function ctx() { actx ||= new AudioContext(); if (actx.state === 'suspended') void actx.resume(); return actx; }
function noise(c: AudioContext, len: number) { const n = Math.ceil(c.sampleRate * len), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
// an old twin-bell alarm clock: the hammer rattles between two bells, in bursts
export function alarmRing(bursts = 3, burst = 0.7, gap = 0.28) {
  if (!enabled) return 0;
  try {
    const c = ctx(), out = c.createGain(); out.gain.value = 0.16; out.connect(c.destination);
    for (let k = 0; k < bursts; k++) {
      const t0 = c.currentTime + 0.05 + k * (burst + gap);
      for (const [f, pan] of [[2350, -0.3], [2930, 0.3]] as const) {
        const o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner(); o.type = 'square'; o.frequency.value = f; p.pan.value = pan;
        // the hammer strikes ~22 times a second: a fast on/off on each bell, a little out of step with the other
        g.gain.setValueAtTime(0, t0);
        for (let t = 0; t < burst; t += 1 / 22) { const s = t0 + t + (pan > 0 ? 0.022 : 0); g.gain.setValueAtTime(0.9, s); g.gain.exponentialRampToValueAtTime(0.05, s + 0.04); }
        g.gain.setValueAtTime(0, t0 + burst + 0.03);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 6;
        o.connect(bp).connect(g).connect(p).connect(out); o.start(t0); o.stop(t0 + burst + 0.05);
      }
    }
    return bursts * (burst + gap);
  } catch { return 0; }
}
// a hand comes down on the button: a soft thump, the plastic click, and the bells' last little rattle cut short
export function alarmOff() {
  if (!enabled) return;
  try {
    const c = ctx(), t0 = c.currentTime + 0.01, out = c.createGain(); out.gain.value = 0.7; out.connect(c.destination);
    const thump = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain(); thump.buffer = noise(c, 0.25); lp.type = 'lowpass'; lp.frequency.value = 260;
    g.gain.setValueAtTime(1, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2); thump.connect(lp).connect(g).connect(out); thump.start(t0);
    const body = c.createOscillator(), bg = c.createGain(); body.type = 'sine'; body.frequency.setValueAtTime(140, t0); body.frequency.exponentialRampToValueAtTime(60, t0 + 0.15);
    bg.gain.setValueAtTime(0.6, t0); bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18); body.connect(bg).connect(out); body.start(t0); body.stop(t0 + 0.2);
    const click = c.createBufferSource(), hp = c.createBiquadFilter(), cg = c.createGain(); click.buffer = noise(c, 0.03); hp.type = 'highpass'; hp.frequency.value = 2500;
    cg.gain.setValueAtTime(0.5, t0 + 0.02); cg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05); click.connect(hp).connect(cg).connect(out); click.start(t0 + 0.02);
    const ring = c.createOscillator(), rg = c.createGain(); ring.type = 'triangle'; ring.frequency.value = 2350;
    rg.gain.setValueAtTime(0.08, t0); rg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.35); ring.connect(rg).connect(out); ring.start(t0); ring.stop(t0 + 0.4);
  } catch { /* audio not available */ }
}
// the phone buzzes twice on the table, then a soft two-note ding
export function phoneBuzz() {
  if (!enabled) return;
  try {
    const c = ctx(), out = c.createGain(); out.gain.value = 0.35; out.connect(c.destination);
    for (const s of [0, 0.32]) {
      const t0 = c.currentTime + 0.02 + s, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 150; lp.type = 'lowpass'; lp.frequency.value = 420;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.8, t0 + 0.02); g.gain.setValueAtTime(0.8, t0 + 0.2); g.gain.linearRampToValueAtTime(0, t0 + 0.24);
      o.connect(lp).connect(g).connect(out); o.start(t0); o.stop(t0 + 0.26);
    }
    for (const [f, s] of [[988, 0.72], [1319, 0.86]] as const) {
      const t0 = c.currentTime + s, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.45, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7); o.connect(g).connect(out); o.start(t0); o.stop(t0 + 0.75);
    }
  } catch { /* audio not available */ }
}
