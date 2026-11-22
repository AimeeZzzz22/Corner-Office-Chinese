// The player's look, built from the character generator parts in the browser.
const A = `${import.meta.env.BASE_URL}assets/ob/`;
export interface Look { body: number; eyes: number; top: number; bottom: number; hair: number; hairColour: string; acc: number | null }
// older saves had one outfit for both halves
export const fixLook = (l: Look & { outfit?: number }): Look => ({ ...DEFAULT_LOOK, ...l, top: l.top ?? l.outfit ?? 14, bottom: l.bottom ?? l.outfit ?? 14 });
export const DEFAULT_LOOK: Look = { body: 1, eyes: 2, top: -1, bottom: -1, hair: -1, hairColour: 'Brown', acc: null };   // a bare start: you pick everything
export interface Parts {
  img: Record<'body' | 'eyes' | 'top' | 'bottom' | 'hair' | 'acc', HTMLImageElement>;
  count: Record<'body' | 'eyes' | 'top' | 'bottom' | 'hair' | 'acc', number>;
  hairColours: Record<string, { swatch: string }>;
  hairMaps: Record<string, Record<string, [number, number, number]>>[];   // per hairstyle, per colour: shade -> new shade
  skin: string[];
  hats: number[];     // the extras that are hats: hair never pokes out above them
}
const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = A + src; });
let partsP: Promise<Parts> | null = null;
export function loadParts(): Promise<Parts> {
  return (partsP ||= (async () => {
    const meta = await (await fetch(A + 'parts.json')).json();
    const kinds = ['body', 'eyes', 'top', 'bottom', 'hair', 'acc'] as const;
    const imgs = await Promise.all(kinds.map((k) => loadImg(`parts_${k}.png`)));
    const img = Object.fromEntries(kinds.map((k, i) => [k, imgs[i]])) as Parts['img'];
    const count = Object.fromEntries(kinds.map((k) => [k, meta[k].length])) as Parts['count'];
    const hats = (meta.acc as string[]).map((n, i) => (/snapback|beanie|hat|cap/i.test(n) ? i : -1)).filter((i) => i >= 0);
    return { img, count, hairColours: meta.hairColours, hairMaps: meta.hairMaps, skin: meta.skin, hats };
  })());
}
// each hairstyle comes in one colour; any colour is a palette swap of it
const hairCache = new Map<string, HTMLCanvasElement>();
function hairBlock(p: Parts, hair: number, colour: string) {
  const key = `${hair}|${colour}`; const hit = hairCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = 384; c.height = 64; const x = c.getContext('2d')!;
  x.drawImage(p.img.hair, 0, hair * 64, 384, 64, 0, 0, 384, 64);
  const map = p.hairMaps[hair]?.[colour] ?? {};
  if (Object.keys(map).length) {
    const d = x.getImageData(0, 0, 384, 64), a = d.data;
    for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const m = map[`${a[i]},${a[i + 1]},${a[i + 2]}`]; if (m) { a[i] = m[0]; a[i + 1] = m[1]; a[i + 2] = m[2]; } }
    x.putImageData(d, 0, 0);
  }
  hairCache.set(key, c); return c;
}
// a full sheet: 2 rows (idle, walk) x 24 columns (right 0-5, back 6-11, left 12-17, front 18-23), 16x32 each
export function compose(p: Parts, l: Look): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 384; c.height = 64; const x = c.getContext('2d')!;
  const put = (k: 'body' | 'eyes' | 'top' | 'bottom' | 'acc', i: number) => x.drawImage(p.img[k], 0, i * 64, 384, 64, 0, 0, 384, 64);
  put('body', l.body); put('eyes', l.eyes); if (l.bottom >= 0) put('bottom', l.bottom); if (l.top >= 0) put('top', l.top);
  if (l.hair >= 0) x.drawImage(l.acc !== null && p.hats.includes(l.acc) ? underHat(p, hairBlock(p, l.hair, l.hairColour), l.acc) : hairBlock(p, l.hair, l.hairColour), 0, 0);
  if (l.acc !== null) put('acc', l.acc);
  return c;
}
// Hair under a hat: in every frame, hair at or above the hat's lower edge is taken away, so nothing sticks out above or
// beside the hat. Hair below that edge stays, so long hair still shows from under it. In columns the hat doesn't
// reach, the nearest hat column's edge is used.
const hatCache = new Map<number, Uint8Array>();
function hatEdges(p: Parts, acc: number) {
  const hit = hatCache.get(acc); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = 384; c.height = 64; const x = c.getContext('2d')!;
  x.drawImage(p.img.acc, 0, acc * 64, 384, 64, 0, 0, 384, 64);
  const a = x.getImageData(0, 0, 384, 64).data, edge = new Uint8Array(48 * 16);   // per frame (2 rows x 24), per column: last row to clear + 1
  for (let f = 0; f < 48; f++) {
    const fx = (f % 24) * 16, fy = Math.floor(f / 24) * 32, col: number[] = [];
    for (let cx = 0; cx < 16; cx++) { let low = -1; for (let cy = 0; cy < 32; cy++) if (a[((fy + cy) * 384 + fx + cx) * 4 + 3]) low = cy; col.push(low); }
    for (let cx = 0; cx < 16; cx++) {
      let v = col[cx];
      if (v < 0) { let best = 99; for (let k = 0; k < 16; k++) if (col[k] >= 0 && Math.abs(k - cx) < best) { best = Math.abs(k - cx); v = col[k]; } }
      edge[f * 16 + cx] = v + 1;
    }
  }
  hatCache.set(acc, edge); return edge;
}
function underHat(p: Parts, hair: HTMLCanvasElement, acc: number) {
  const edge = hatEdges(p, acc), c = document.createElement('canvas'); c.width = 384; c.height = 64; const x = c.getContext('2d')!;
  x.drawImage(hair, 0, 0); const d = x.getImageData(0, 0, 384, 64), a = d.data;
  for (let f = 0; f < 48; f++) {
    const fx = (f % 24) * 16, fy = Math.floor(f / 24) * 32;
    for (let cx = 0; cx < 16; cx++) for (let cy = 0; cy < edge[f * 16 + cx]; cy++) a[((fy + cy) * 384 + fx + cx) * 4 + 3] = 0;
  }
  x.putImageData(d, 0, 0); return c;
}
export const DIR_COL = { right: 0, back: 6, left: 12, front: 18 } as const;
export function randomLook(p: Parts): Look {
  const r = (n: number) => Math.floor(Math.random() * n), cols = Object.keys(p.hairColours);
  return { body: r(p.count.body), eyes: r(p.count.eyes), top: r(p.count.top), bottom: r(p.count.bottom), hair: r(p.count.hair), hairColour: cols[r(cols.length)], acc: Math.random() < 0.4 ? r(p.count.acc) : null };
}
