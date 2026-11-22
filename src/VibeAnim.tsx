import { ZH, t as tr } from './lang';
import { useEffect, useRef } from 'react';
import { DIR_COL } from './look';

const A = `${import.meta.env.BASE_URL}assets/ob/vibe/`;
const W = 192, H = 134, S = 3, INK = '#3a2a2a', LINE = '#3a3a50';
type Dir = keyof typeof DIR_COL;

// ---------------- poses built from the player's own sprite ----------------
// The sprite is 16x32. On the front frame the eyes are at columns 5 and 10, rows 20-21, and the arms hang at the
// sides (columns 0-2 and 13-15, rows 23-27). New poses are made by erasing the arms and drawing new ones in the
// player's own skin and sleeve colours, so they work with any look.
const PW = 24, PH = 42, OX = 4, OY = 8;           // pose canvas, with room around the frame for raised arms
type Mod = 'up' | 'mid' | 'phone' | 'closed' | 'down' | 'dizzyA' | 'dizzyB' | 'noarms' | 'snack' | 'happy';
type Rect = [number, number, number, number, string];
const cache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();
function pose(sheet: HTMLCanvasElement, dir: Dir, f: number, mods: Mod[] = []): HTMLCanvasElement {
  let m = cache.get(sheet); if (!m) { m = new Map(); cache.set(sheet, m); }
  const key = `${dir}${f}${mods.join()}`, hit = m.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
  g.drawImage(sheet, (DIR_COL[dir] + (f % 6)) * 16, 0, 16, 32, OX, OY, 16, 32);
  const fr = sheet.getContext('2d')!.getImageData(DIR_COL.front * 16, 0, 16, 32).data;
  const at = (x: number, y: number) => { const i = (y * 16 + x) * 4; return `rgb(${fr[i]},${fr[i + 1]},${fr[i + 2]})`; };
  const SKIN = at(7, 20), SLEEVE = at(2, 23);
  const px = (gg: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => { gg.fillStyle = col; gg.fillRect(OX + x, OY + y, w, h); };
  const mirror = (r: Rect): Rect => [16 - r[0] - r[2], r[1], r[2], r[3], r[4]];
  // a limb: every piece gets a 1-pixel outline, then the colours on top
  const limbs = (gg: CanvasRenderingContext2D, rs: Rect[]) => { const all = [...rs, ...rs.map(mirror)]; all.forEach(([x, y, w, h]) => px(gg, x - 1, y - 1, w + 2, h + 2, LINE)); all.forEach(([x, y, w, h, col]) => px(gg, x, y, w, h, col)); };
  const eraseArms = () => { g.clearRect(OX, OY + 23, 3, 5); g.clearRect(OX + 13, OY + 23, 3, 5); px(g, 2, 23, 1, 5, LINE); px(g, 13, 23, 1, 5, LINE); };
  for (const mod of mods) {
    if (mod === 'noarms') eraseArms();
    else if (mod === 'up') {                  // a chibi stretch: slim arms (as wide as the sprite's own) up in a V beside the head
      eraseArms();
      const b = document.createElement('canvas'); b.width = PW; b.height = PH; const bg = b.getContext('2d')!;
      limbs(bg, [[0, 21, 2, 2, SLEEVE], [-1, 19, 2, 2, SKIN], [-2, 17, 2, 2, SKIN]]);
      g.globalCompositeOperation = 'destination-over'; g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-over';
    } else if (mod === 'mid') {               // arms on the way up: out to the sides
      eraseArms();
      limbs(g, [[0, 22, 2, 2, SLEEVE], [-2, 22, 2, 2, SKIN]]);
    } else if (mod === 'snack') {             // one hand up at the mouth (the cookie is drawn on top of it)
      g.clearRect(OX + 13, OY + 23, 3, 5); px(g, 13, 23, 1, 5, LINE);
      const pts: [number, number, string][] = [[13, 22, SLEEVE], [14, 22, SLEEVE], [14, 21, SKIN], [13, 21, SKIN], [12, 20, SKIN], [13, 20, SKIN]];
      pts.forEach(([xx, yy]) => [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => px(g, xx + dx, yy + dy, 1, 1, LINE)));
      pts.forEach(([xx, yy, col]) => px(g, xx, yy, 1, 1, col));
    } else if (mod === 'happy') {             // happy closed eyes: little ^ ^
      px(g, 4, 19, 3, 3, SKIN); px(g, 9, 19, 3, 3, SKIN);
      px(g, 4, 21, 1, 1, LINE); px(g, 5, 20, 1, 1, LINE); px(g, 6, 21, 1, 1, LINE); px(g, 9, 21, 1, 1, LINE); px(g, 10, 20, 1, 1, LINE); px(g, 11, 21, 1, 1, LINE);
    } else if (mod === 'phone') {             // the hands come in from the sides and hold a phone in front of the chest
      const both = (pts: [number, number][], col: string) => pts.forEach(([xx, yy]) => { px(g, xx, yy, 1, 1, col); px(g, 15 - xx, yy, 1, 1, col); });
      g.clearRect(OX, OY + 25, 2, 3); g.clearRect(OX + 14, OY + 25, 2, 3);          // the hands that hung at the sides
      px(g, 5, 22, 6, 7, LINE); px(g, 6, 23, 4, 4, '#bfe3ff'); px(g, 6, 27, 4, 1, '#5c5672');   // the phone
      both([[1, 25], [1, 26], [2, 27], [3, 27], [4, 27]], LINE);                        // forearm outlines
      both([[2, 25], [3, 25], [4, 25], [2, 26], [3, 26], [4, 26], [5, 24], [5, 25], [5, 26]], SKIN);   // forearms and fingers round the phone
    } else if (mod === 'closed') {            // eyes shut: a short line where each eye was
      px(g, 5, 20, 1, 2, SKIN); px(g, 10, 20, 1, 2, SKIN); px(g, 4, 21, 2, 1, LINE); px(g, 10, 21, 2, 1, LINE);
    } else if (mod === 'down') {              // looking down at the phone
      px(g, 5, 20, 1, 1, SKIN); px(g, 10, 20, 1, 1, SKIN); px(g, 5, 21, 1, 1, LINE); px(g, 10, 21, 1, 1, LINE);
    } else if (mod === 'dizzyA' || mod === 'dizzyB') {   // swirly eyes, two frames so they seem to turn
      const L = mod === 'dizzyA' ? ['.##', '#.#', '##.'] : ['##.', '#.#', '.##'];
      for (const [ex, ey] of [[4, 19], [9, 19]]) L.forEach((row, j) => [...row].forEach((ch, i) => px(g, ex + i, ey + j, 1, 1, ch === '#' ? LINE : SKIN)));
    }
  }
  m.set(key, c); return c;
}

// the player's skin colour (for the thumb)
const skinOf = (sheet: HTMLCanvasElement | null) => { if (!sheet) return '#f6c9a8'; const d = sheet.getContext('2d')!.getImageData(DIR_COL.front * 16 + 7, 20, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };

// a chocolate-chip cookie (14x14 pixels) with n bites taken out of the side that faces the mouth
const COOKIE = ['....######....', '..##aaaaaa##..', '.#aaaacaaaaa#.', '.#aaaaaaacaa#.', '#acaaaaaaaaaa#', '#aaaaacaaaaaa#', '#aaaaaaaaaca#.', '#aacaaaaaaaaa#', '#aaaaaaacaaaa#', '.#aaaaaaaaaa#.', '.#aacaaaaaca#.', '..##aaaaaa##..', '....######....'];
const BITES: [number, number][] = [[-0.5, 4], [2.5, 9], [5.5, 3.5], [9, 8.5]];
function cookie(n: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 14; c.height = 14; const g = c.getContext('2d')!;
  COOKIE.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = ch === '#' ? '#7a4a28' : ch === 'c' ? '#4a2a1a' : '#d9a05b'; g.fillRect(x, y, 1, 1); } }));
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n && i < BITES.length; i++) { const [bx, by] = BITES[i]; for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) if ((x + 0.5 - bx) ** 2 + (y + 0.5 - by) ** 2 < 10.5) g.fillRect(x, y, 1, 1); }
  return c;
}

// a tiny dancer for the video on the phone (not the player): three poses
const DANCER: Record<string, string[]> = {
  a: ['....HHH.....', '...HHHHH...K', '...HKKKH..K.', '...HKKKH.K..', '....KKK.T...', '..TTTTTTT...', '.K.TTTTT....', 'K..TTTTT....', '...PPPPP....', '...PP.PP....', '..PP...PP...', '..PP....PP..', '.BB......BB.'],
  c: ['....HHH.....', '...HHHHH....', '...HKKKH....', '...HKKKH....', '....KKK.....', '..TTTTTTT...', '.K.TTTTT.K..', '.K.TTTTT.K..', '...PPPPP....', '...PP.PP....', '...PP.PP....', '...PP.PP....', '..BB...BB...'],
};
DANCER.b = DANCER.a.map((r) => [...r].reverse().join(''));
const DCOL: Record<string, string> = { H: '#4a2f3a', K: '#f6c9a8', T: '#ff8ab0', P: '#5468b8', B: '#2e2a3a' };

// A little looping animation of the player's own character doing their work vibe.
export default function VibeAnim({ id, sheet }: { id: string; sheet: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!, x = cv.getContext('2d')!; x.imageSmoothingEnabled = false;
    const icon = new Image(); icon.src = `${A}${id}.png`;
    let raf = 0; const t0 = performance.now();
    // one character frame: dir, idle frame, rows [from, count] of the 16x32 frame, at (px, py) top-left, with extra stretch
    const ch = (dir: Dir, f: number, px: number, py: number, rows: [number, number] = [0, 32], sx = 1, sy = 1) => {
      if (!sheet) return;
      const [r0, n] = rows; x.drawImage(sheet, (DIR_COL[dir] + (f % 6)) * 16, r0, 16, n, px, py, 16 * S * sx, n * S * sy);
    };
    // a built pose, placed like a normal frame (px, py = where the frame's top-left goes)
    const pz = (mods: Mod[], px: number, py: number, rows: [number, number] = [0, 32], dir: Dir = 'front', f = 0) => {
      if (!sheet) return; const c = pose(sheet, dir, f, mods);
      if (rows[0] === 0 && rows[1] === 32) x.drawImage(c, px - OX * S, py - OY * S, PW * S, PH * S);
      else x.drawImage(c, OX, OY + rows[0], 16, rows[1], px, py + 0, 16 * S, rows[1] * S);
    };
    const text = (s: string, px: number, py: number, size: number, a = 1, col = INK) => { x.globalAlpha = Math.max(0, a); x.font = `700 ${size}px "Pixelify Sans", sans-serif`; x.fillStyle = col; x.fillText(s, px, py); x.globalAlpha = 1; };
    const star = (px: number, py: number, size: number, a = 1) => { text('✦', px + 1, py + 1, size, a * 0.6, INK); text('✦', px, py, size, a, '#f2c14e'); };
    const ico = (px: number, py: number, k: number, rot = 0) => {
      if (!icon.complete) return; x.save(); x.translate(px, py); x.rotate(rot); x.drawImage(icon, -8 * k, -16 * k, 16 * k, 16 * k); x.restore();   // anchored at the bottom middle
    };
    const box = (px: number, py: number, w: number, h: number, fill: string, edge = INK, lw = 3) => { x.fillStyle = fill; x.fillRect(px, py, w, h); x.strokeStyle = edge; x.lineWidth = lw; x.strokeRect(px, py, w, h); };
    const ease = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));
    const ground = 128, cx = W / 2;
    const draw = (now: number) => {
      const t = (now - t0) / 1000, idle = Math.floor(t * 4.5);
      x.clearRect(0, 0, W, H);
      const shadow = (sx = cx, w = 34) => { x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.ellipse(sx, ground, w, 5, 0, 0, 7); x.fill(); };
      if (id === 'spinner') {
        // two turns round in the desk chair, then dizzy: swirly eyes, a wobble, stars circling the head
        shadow();
        const cyc = t % 4.8, spinning = cyc < 2.4, order: Dir[] = ['front', 'right', 'back', 'left'];
        const dir: Dir = spinning ? order[Math.floor(cyc * 3.4) % 4] : 'front';
        const seatY = ground - 30;
        const chairBack = () => box(cx - 18, seatY - 36, 36, 34, '#4a4560');
        x.fillStyle = INK; x.fillRect(cx - 3, seatY + 6, 6, 18); x.fillRect(cx - 22, ground - 6, 44, 5);
        if (dir !== 'back') chairBack();
        if (spinning) ch(dir, 0, cx - 24, seatY - 18 * S + 4, [9, 19]);
        else {
          const d = cyc - 2.4, wob = Math.sin(d * 9) * 0.13 * Math.max(0.35, 1 - d / 2.4);
          x.save(); x.translate(cx, seatY); x.rotate(wob);
          pz([Math.floor(d * 7) % 2 ? 'dizzyA' : 'dizzyB'], -24, -18 * S + 4, [9, 19]);
          x.restore();
          for (let i = 0; i < 3; i++) { const a = d * 5 + (i * Math.PI * 2) / 3; star(cx - 6 + Math.cos(a) * 30 + wob * 40, seatY - 64 + Math.sin(a) * 7, 13, Math.sin(a) > -0.6 ? 1 : 0.5); }
          text(tr('whoa…', '哇…'), cx + 26, seatY - 60, 12, Math.min(1, d * 2) * (d < 1.8 ? 1 : 1 - (d - 1.8) * 1.7));
        }
        box(cx - 24, seatY, 48, 9, '#5c5672');
        if (dir === 'back') chairBack();
        if (spinning) { x.strokeStyle = 'rgba(58,42,42,.45)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, seatY - 30, 44, 12, 0, Math.PI * 0.15 + t * 4, Math.PI * 0.85 + t * 4); x.stroke(); }
      } else if (id === 'napper') {
        // nodding off on their feet, then tipping over onto a bed; the blanket comes up and they sleep
        const cyc = t % 7.2, fx = 62, MT = ground - 30, endY = MT - 21;
        const fade = cyc > 6.6 ? 1 - (cyc - 6.6) / 0.6 : cyc < 0.3 ? cyc / 0.3 : 1;
        x.globalAlpha = fade;
        // the bed: headboard, frame, mattress, pillow
        box(fx + 76, MT - 22, 8, 44, '#c08a5c'); box(fx - 12, MT + 8, 96, 8, '#c08a5c');
        x.fillStyle = INK; x.fillRect(fx - 10, MT + 16, 5, ground - MT - 16); x.fillRect(fx + 73, MT + 16, 5, ground - MT - 16);
        box(fx - 12, MT, 96, 9, '#fff7ea'); box(fx + 44, MT - 9, 30, 11, '#ffffff');
        let a = 0, py = ground, bob = 0, mods: Mod[] = [];
        if (cyc < 1.8) { const nod = (cyc % 0.9) > 0.55; bob = nod ? 3 : 0; mods = nod ? ['closed'] : []; text('…', fx + 18, ground - 100, 16, 1); }
        else if (cyc < 2.2) { a = Math.sin((cyc - 1.8) * 16) * 0.06; mods = ['closed']; }
        else if (cyc < 2.75) { const p = (cyc - 2.2) / 0.55; a = p * p * Math.PI / 2; py = ground + (endY - ground) * ease(p); mods = ['closed']; }
        else { a = Math.PI / 2; py = endY + (cyc < 3 ? Math.sin((cyc - 2.75) / 0.25 * Math.PI) * 3 : 0); mods = ['closed', 'noarms']; }
        if (cyc < 2.2) { x.globalAlpha = fade; x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.ellipse(fx, ground, 26, 4, 0, 0, 7); x.fill(); }
        x.save(); x.translate(fx, py + bob); x.rotate(a); pz(mods, -24, -96); x.restore();
        // the blanket comes up from the feet to the chin, over the whole body and down over the side of the bed;
        // a turned-down white hem at the neck; it rises and falls a little with each breath
        if (cyc > 3.0) {
          const p = ease((cyc - 3.0) / 0.7), breath = Math.sin(cyc * 2.6) > 0 ? 1 : 0;
          const x0 = fx - 14, x1 = fx - 14 + 46 * p, top = endY - 21 - breath, bottom = MT + 14;
          if (x1 - x0 > 4) {
            x.beginPath(); x.moveTo(x0, bottom); x.lineTo(x0, top + 12); x.quadraticCurveTo(x0, top, x0 + 12, top); x.lineTo(x1, top); x.lineTo(x1, bottom); x.closePath();
            x.fillStyle = '#b9a2ec'; x.fill();
            x.save(); x.clip();
            x.fillStyle = '#a58ade'; for (let s2 = x0 + 6; s2 < x1; s2 += 11) x.fillRect(s2, top, 4, bottom - top);   // stripes
            x.fillStyle = 'rgba(58,42,42,.16)'; x.fillRect(x0, MT + 2, x1 - x0, 3);                                 // where it bends over the mattress edge
            if (p > 0.9) { x.fillStyle = '#ffffff'; x.fillRect(x1 - 8, top, 8, bottom - top); x.fillStyle = '#e6dcf7'; x.fillRect(x1 - 8, top, 2, bottom - top); }   // the hem
            x.restore();
            x.beginPath(); x.moveTo(x0, bottom); x.lineTo(x0, top + 12); x.quadraticCurveTo(x0, top, x0 + 12, top); x.lineTo(x1, top); x.lineTo(x1, bottom);
            x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
          }
        }
        if (cyc > 3.4 && cyc < 6.6) for (let i = 0; i < 3; i++) { const p = ((cyc - 3.4) * 0.45 + i / 3) % 1; text('Z', fx + 58 + p * 30, endY - 30 - p * 40, 12 + p * 10, (1 - p) * fade); }
        x.globalAlpha = 1;
      } else if (id === 'snacker') {
        // a cookie comes up to the mouth and is eaten one bite at a time: chomp, a bite mark, "nom", crumbs; then a happy face
        shadow();
        const cyc = t % 4.6, BITE = [0.9, 1.6, 2.3, 3.0], bites = BITE.filter((b) => cyc >= b).length;
        const happy = cyc > 3.15 && cyc < 4.3;
        pz(happy ? ['happy'] : bites < 4 ? ['snack'] : [], cx - 24, ground - 96);
        if (bites < 4) {
          const up = ease(Math.min(1, cyc / 0.45)), last = BITE[bites - 1] ?? -9, chomp = cyc - last < 0.12 ? -4 : 0;
          x.drawImage(cookie(bites), cx + 8 + chomp, ground - 64 + (1 - up) * 24, 42, 42);
        }
        BITE.forEach((b, k) => {
          const d = cyc - b; if (d < 0 || d > 0.6) return;
          text(tr('nom', '啊呜'), cx + 30 + (k % 2) * 8, ground - 76 - d * 20, 13, 1 - d / 0.6);
          x.fillStyle = '#c8873a'; for (let i = 0; i < 3; i++) x.fillRect(cx + 4 + i * 6 + k * 3, ground - 50 + d * (40 + i * 14), 3, 3);
        });
        if (happy) { text('♥', cx + 22, ground - 92 - (cyc - 3.15) * 14, 14, 1, '#ff6b8b'); text(tr('yum!', '好吃!'), cx + 30, ground - 70, 13, 1); }
      } else if (id === 'scroller') {
        // phone in both hands, thumb flicking up; then the phone zooms in and you see the video: someone dancing
        const cyc = t % 7.6;
        const small = { x: cx - 24 + 5 * S, y: ground - 96 + 22 * S, w: 6 * S, h: 6 * S }, big = { x: cx - 38, y: 4, w: 76, h: 126 };
        const zoom = cyc < 2.4 ? 0 : cyc < 2.9 ? ease((cyc - 2.4) / 0.5) : cyc < 6.4 ? 1 : cyc < 6.9 ? 1 - ease((cyc - 6.4) / 0.5) : 0;
        x.globalAlpha = 1 - zoom * 0.75; shadow(); pz(['phone', 'down'], cx - 24, ground - 96); x.globalAlpha = 1;
        if (zoom < 0.05) {
          // the feed sliding up on the little screen, and the thumb flicking
          const flick = (cyc % 0.8) / 0.8, sy = flick < 0.3 ? ease(flick / 0.3) : 1;
          x.save(); x.beginPath(); x.rect(small.x + 3, small.y + 3, small.w - 6, small.h - 6); x.clip();
          for (let i = -1; i < 3; i++) { x.fillStyle = ['#ffb3c8', '#c8b6ff', '#a8e6cf'][(i + 3 + Math.floor(cyc / 0.8)) % 3]; x.fillRect(small.x + 3, small.y + 3 + i * 9 - sy * 9 + 9, small.w - 6, 7); }
          x.restore();
          x.fillStyle = INK; x.fillRect(small.x + small.w - 7, small.y + 15 - sy * 9, 6, 6);
          x.fillStyle = skinOf(sheet); x.fillRect(small.x + small.w - 6, small.y + 16 - sy * 9, 4, 4);
        } else {
          const r = { x: small.x + (big.x - small.x) * zoom, y: small.y + (big.y - small.y) * zoom, w: small.w + (big.w - small.w) * zoom, h: small.h + (big.h - small.h) * zoom };
          x.fillStyle = LINE; x.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
          x.save(); x.beginPath(); x.rect(r.x, r.y, r.w, r.h); x.clip();
          const gr = x.createLinearGradient(0, r.y, 0, r.y + r.h); gr.addColorStop(0, '#ffd6e8'); gr.addColorStop(1, '#c9b8ff'); x.fillStyle = gr; x.fillRect(r.x, r.y, r.w, r.h);
          if (zoom > 0.9) {
            const v = Math.max(0, cyc - 2.9), k = 3, beat = Math.floor(v / 0.32), p = ['a', 'c', 'b', 'c'][beat % 4], hop = beat % 2 ? 0 : 4;
            x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(r.x, r.y + r.h - 34, r.w, 3);
            DANCER[p].forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') { x.fillStyle = DCOL[c]; x.fillRect(r.x + 14 + i * k, r.y + 50 - hop + j * k, k, k); } }));
            // the side buttons, the caption and a progress bar, like any short-video app
            [['♥', '#ff5a8a', 46], ['●', '#ffffff', 64], ['➦', '#ffffff', 82]].forEach(([s, col, yy]) => text(s as string, r.x + r.w - 15, r.y + (yy as number), 12, 1, col as string));
            x.fillStyle = 'rgba(58,42,42,.55)'; x.fillRect(r.x + 6, r.y + r.h - 24, 40, 4); x.fillRect(r.x + 6, r.y + r.h - 16, 28, 4);
            x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(r.x + 4, r.y + r.h - 6, r.w - 8, 2); x.fillStyle = '#ff5a8a'; x.fillRect(r.x + 4, r.y + r.h - 6, (r.w - 8) * Math.min(1, v / 3.5), 2);
            text('♪', r.x + 8 + Math.sin(v * 3) * 3, r.y + 22 - (v * 8) % 12, 12, 0.8);
            if (v > 1.6 && v < 2.4) { const q = (v - 1.6) / 0.8; text('♥', cx - 12, r.y + 60 - q * 14, 22 + q * 8, 1 - q, '#ff5a8a'); }
          }
          x.restore();
          x.fillStyle = LINE; x.fillRect(cx - 6, r.y - 1, 12, 2);
        }
      } else if (id === 'stretcher') {
        // a real stretch: arms out, then right up overhead, a lean to each side with eyes shut, then back down
        shadow();
        const cyc = t % 3.8;
        let mods: Mod[] = [], a = 0, lift = 0;
        if (cyc < 0.25) mods = ['mid'];
        else if (cyc < 2.45) { mods = ['up', 'closed']; lift = 3; const h = (cyc - 0.25) / 2.2; a = Math.sin(h * Math.PI * 2) * 0.12; }
        else if (cyc < 2.7) mods = ['mid'];
        x.save(); x.translate(cx, ground); x.rotate(a); pz(mods, -24, -96 - lift); x.restore();
        if (cyc > 0.4 && cyc < 2.4) { text(tr('mmmh…', '嗯~…'), cx + 30, ground - 104, 12, 1); for (let i = 0; i < 3; i++) { const q = cyc * 3 + i * 2.1; star(cx - 6 + Math.cos(q) * 40, ground - 112 + Math.sin(q) * 8, 11); } }
        if (cyc > 2.8 && cyc < 3.6) text(tr('ahh', '啊~'), cx + 26, ground - 92, 12, 1 - (cyc - 2.8) / 0.8);
      } else if (id === 'plant') {
        // chatting to the desk plant... until it shoots up and answers back.
        // The character jumps with a "!", then they trade hearts, and the plant shrinks back as if nothing happened.
        shadow(cx - 50, 26);
        const cyc = t % 7.0, px0 = cx + 46;
        const grow = cyc < 2.2 ? 0 : cyc < 2.7 ? ease((cyc - 2.2) / 0.5) : cyc < 6.2 ? 1 : 1 - ease((cyc - 6.2) / 0.5);
        const bloom = cyc < 2.6 ? 0 : cyc < 2.9 ? ease((cyc - 2.6) / 0.3) : cyc < 6.1 ? 1 : 1 - ease((cyc - 6.1) / 0.3);
        const jump = cyc > 3.25 && cyc < 3.65 ? Math.sin((cyc - 3.25) / 0.4 * Math.PI) * 14 : 0;
        ch('right', jump ? 0 : idle, cx - 74, ground - 96 - jump);
        // the plant: wiggles while you talk; stretches up when it comes alive
        const wig = cyc < 2.2 || cyc > 4.4 ? Math.sin(t * 5) * 0.08 : Math.sin(t * 14) * 0.03;
        if (icon.complete) { x.save(); x.translate(px0, ground); x.rotate(wig); x.scale(1, 1 + grow * 0.45); x.drawImage(icon, -24, -48, 48, 48); x.restore(); }
        if (bloom > 0) {
          const fy = ground - 48 * (1 + grow * 0.45) + 4, fx2 = px0 + Math.sin(wig) * 40;
          if (cyc > 3.0 && cyc < 4.6) {   // it talks back
            const a2 = Math.min(1, (cyc - 3.0) * 5) * (cyc > 4.3 ? 1 - (cyc - 4.3) / 0.3 : 1);
            x.globalAlpha = a2; box(fx2 - 70, fy - 46, 60, 22, '#ffffff', INK, 2); x.fillStyle = '#ffffff'; x.fillRect(fx2 - 22, fy - 26, 8, 6);
            x.fillStyle = INK; x.fillRect(fx2 - 16, fy - 22, 2, 4); x.globalAlpha = 1;
            text(tr('You too!', '你也是!'), fx2 - (ZH ? 52 : 66), fy - 30, 12, a2);
          }
        }
        if (cyc > 3.2 && cyc < 4.4) { text('!', cx - 46, ground - 74 - jump, 22, 1, '#e8504a'); if (cyc > 3.7) { x.fillStyle = '#8fd0f0'; x.fillRect(cx - 30, ground - 62 + (cyc - 3.7) * 10, 4, 6); } }
        if (cyc < 2.2) for (let i = 0; i < 2; i++) { const p = (t * 0.6 + i / 2) % 1; text(i ? '♪' : '♥', cx - 28 + p * 56, ground - 70 - Math.sin(p * Math.PI) * 26, 13, 1 - p * 0.8); }
        if (cyc > 4.5 && cyc < 6.1) for (let i = 0; i < 2; i++) { const p = ((cyc - 4.5) * 0.9 + i / 2) % 1, dir2 = i ? -1 : 1; text('♥', cx + (dir2 > 0 ? -28 + p * 56 : 28 - p * 56), ground - 80 - Math.sin(p * Math.PI) * 22, 13, 1 - p * 0.6, '#ff6b8b'); }
      } else {
        shadow(); ch('front', idle, cx - 24, ground - 96);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [id, sheet]);
  return <canvas ref={ref} width={W} height={H} className="vibe-anim" />;
}
