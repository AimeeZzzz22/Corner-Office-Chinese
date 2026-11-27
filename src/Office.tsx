import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from './lang';
import { COWORKERS, Company, CoworkerId, HomeAct } from './data';
import { officeClock } from './clock';
import { gEmit } from './Guide';

const A = `${import.meta.env.BASE_URL}assets/`;
const T = 16, S = 3;                        // tile size in map pixels, art scale
export type Tile = [number, number];
interface Grid { w: number; h: number; walk: string[]; base: number[][]; wallE: Set<number>; wallS: Set<number> }   // base: ground row of the object covering a tile; wallE: thin wall on a tile's right edge
// The map file: one label per tile. '#' wall (fixed), 'S' solid, 'T' tall (walk behind it), '.' free floor.
export interface MapFile { w: number; h: number; labels: string[]; occ: string[]; front: string[]; edges?: [number, number][]; edgesY?: [number, number][] }   // edges: thin wall on a tile's right side; edgesY: on its bottom side
function derive(m: MapFile, labels: string[]): Grid {
  const walk = labels.map((r) => [...r].map((c) => (c === '.' || c === 'T' ? '1' : '0')).join(''));
  const base = labels.map((r, y) => [...r].map((c, x) => {
    if (m.front[y][x] === '1') return 99;
    if (m.occ[y][x] !== '1') return 0;
    if (c !== 'T') return y;
    // a tall tile belongs to the object standing below it: its ground row is the first solid tile down the column
    for (let yy = y + 1; yy < m.h && m.occ[yy][x] === '1'; yy++) if (labels[yy][x] !== 'T') return yy;
    return y;
  }));
  return { w: m.w, h: m.h, walk, base, wallE: new Set((m.edges ?? []).map(([x, y]) => y * m.w + x)), wallS: new Set((m.edgesY ?? []).map(([x, y]) => y * m.w + x)) };
}
const QUICK = typeof location !== 'undefined' && location.hash === '#npc-test';   // test aid: coworkers get up right away
const img = (src: string) => { const i = new Image(); i.src = A + src; return i; };
const giftImg = typeof Image !== 'undefined' ? img('ob/office_gift.png') : ({} as HTMLImageElement);

// Shortest paths from one tile to every tile it can reach. Moves go in 8 directions (a diagonal costs 1.41 and
// is only allowed when both tiles beside it are free, so nobody cuts through a corner). `blocked` holds tiles
// that are taken right now by someone else.
// Only straight steps: at a corner a walker stops on the tile, turns to face the new way, then walks on, so they never
// slide sideways or diagonally while facing another way.
const DIRS: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1]];
function routes(g: Grid, from: Tile, blocked: Set<number> = new Set()) {
  const n = g.w * g.h, dist = new Float32Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < g.w && y < g.h && g.walk[y][x] === '1' && !blocked.has(y * g.w + x);
  dist[from[1] * g.w + from[0]] = 0;
  for (;;) {
    let c = -1, best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; c = i; }
    if (c < 0) break; done[c] = 1; const cx = c % g.w, cy = Math.floor(c / g.w);
    for (const [dx, dy, cost] of DIRS) {
      const x = cx + dx, y = cy + dy; if (!free(x, y) || (dx && dy && (!free(cx + dx, cy) || !free(cx, cy + dy)))) continue;
      // thin walls: a sideways step may not cross a blocked edge (checked on both rows for a diagonal)
      if (dx && (g.wallE.has(cy * g.w + Math.min(cx, x)) || g.wallE.has(y * g.w + Math.min(cx, x)))) continue;
      if (dy && (g.wallS.has(Math.min(cy, y) * g.w + cx) || g.wallS.has(Math.min(cy, y) * g.w + x))) continue;
      const k = y * g.w + x; if (dist[c] + cost < dist[k]) { dist[k] = dist[c] + cost; prev[k] = c; }
    }
  }
  const pathTo = (t: Tile): Tile[] | null => {
    let k = t[1] * g.w + t[0]; if (!isFinite(dist[k])) return null;
    const p: Tile[] = []; for (; k !== -1; k = prev[k]) p.push([k % g.w, Math.floor(k / g.w)]); return p.reverse();
  };
  // the reachable tile closest to a point in map pixels; between equally close tiles, the one with the shorter walk
  const nearest = (px: number, py: number): Tile => {
    let bt: Tile = from, bd = Infinity, bw = Infinity;
    for (let i = 0; i < n; i++) {
      if (!isFinite(dist[i])) continue; const x = i % g.w, y = Math.floor(i / g.w), d = Math.round(Math.hypot(x * T + 8 - px, y * T + 8 - py));
      if (d < bd || (d === bd && dist[i] < bw)) { bd = d; bw = dist[i]; bt = [x, y]; }
    }
    return bt;
  };
  return { pathTo, nearest };
}

// Anyone who walks: the player and coworkers who are up from their desks
interface Walker { x: number; y: number; cur: Tile; path: Tile[]; dir: number; moving: boolean }
const key2 = (t: Tile) => `${t[0]},${t[1]}`;
const centre = (t: Tile): [number, number] => [t[0] * T + 8, t[1] * T + 8];
const walker = (t: Tile): Walker => ({ x: t[0] * T + 8, y: t[1] * T + 8, cur: t, path: [], dir: 3, moving: false });
// Which way a walker faces, from the tile step they are taking. On a diagonal step they keep facing the way they
// already were if it fits, so they don't flip back and forth on a zig-zag path; otherwise they face sideways.
function stepFacing(w: Walker, sx: number, sy: number) {
  const h = sx > 0 ? 0 : sx < 0 ? 2 : -1, v = sy > 0 ? 3 : sy < 0 ? 1 : -1;
  if (h >= 0 && v >= 0) { if (w.dir !== h && w.dir !== v) w.dir = h; } else if (h >= 0) w.dir = h; else if (v >= 0) w.dir = v;
}
// Turn to face a point, but only when it is clearly in another direction (no flicker when it is close to diagonal).
function faceTo(w: Walker, x: number, y: number) {
  const dx = x - w.x, dy = y - w.y, ax = Math.abs(dx), ay = Math.abs(dy);
  const cur = w.dir === 0 || w.dir === 2 ? 'h' : 'v';
  if (ax < 1 && ay < 1) return;
  if (cur === 'h' ? ay > ax * 1.4 : ax <= ay * 1.4) w.dir = dy > 0 ? 3 : 1; else w.dir = dx > 0 ? 0 : 2;
}
// Move along the path. A walker only leaves a tile centre when the next tile is free; returns 'blocked' if it is not.
function advance(w: Walker, dt: number, speed: number, taken: (t: Tile) => boolean): 'moving' | 'arrived' | 'blocked' | 'idle' {
  if (!w.path.length) { w.moving = false; return 'idle'; }
  const [cx, cy] = centre(w.cur);
  if (Math.abs(w.x - cx) < 0.01 && Math.abs(w.y - cy) < 0.01 && taken(w.path[0])) { w.moving = false; return 'blocked'; }
  const [gx, gy] = centre(w.path[0]), dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy), step = speed * dt;
  stepFacing(w, w.path[0][0] - w.cur[0], w.path[0][1] - w.cur[1]);
  w.moving = true;
  if (d <= step) { w.x = gx; w.y = gy; w.cur = w.path.shift()!; if (!w.path.length) { w.moving = false; return 'arrived'; } }
  else { w.x += (dx / d) * step; w.y += (dy / d) * step; }
  return 'moving';
}
// tiles a walker holds right now: where it stands and the tile it is stepping into
// a seated coworker takes only the chair's seat tile; the tile behind the chair stays as labelled, so people can pass behind
const seatTile = (id: CoworkerId): Tile => { const [sx, sy, cut] = COWORKERS[id].seat; return [Math.floor(sx / T), Math.floor((cut >= 32 ? sy + 20 : sy + cut - 4) / T)]; };
const seatTiles = (id: CoworkerId, g: Grid, into: Set<number>) => { const [x, y] = seatTile(id); into.add(y * g.w + x); };
const holds = (w: Walker, g: Grid, into: Set<number>) => { into.add(w.cur[1] * g.w + w.cur[0]); if (w.moving && w.path[0]) into.add(w.path[0][1] * g.w + w.path[0][0]); };

interface Npc extends Walker {
  id: CoworkerId; state: 'sit' | 'out' | 'idle' | 'back'; timer: number; alpha: number; home: Tile; wait: number; hold: boolean; sheet: HTMLImageElement; resume?: Tile | null;
  until: number; lastTrip: string;                      // schedule: back to the desk at this clock minute; the trip already taken
  glide: { fx: number; fy: number; tx: number; ty: number; t: number; sit: boolean } | null;   // getting up from / sitting down in the chair (two straight legs)
}

export interface OfficeProps {
  onCoworker: (id: CoworkerId | null, x?: number) => void; frozen: boolean; menu: CoworkerId | null; onPc: () => void;
  startAt?: Tile;      // where the player stands when the office opens (back from the desk: right beside it)
  goDesk?: number;     // bump to walk the player to their desk
  goBoss?: { n: number; id: CoworkerId; via?: string } | null;   // via: a place the two of you then walk to together (Rio: the kitchen)   // walk the player over to a coworker (the boss, for a one-to-one); onBoss fires on arrival
  onBoss?: (id: CoworkerId) => void;
  extras?: { fridge: boolean; surprise: boolean; deco?: string | null; doing?: string | null };   // a treat waiting in the fridge; the welcome gift still waiting
  onSpot?: (kind: 'food' | 'fridge' | 'surprise') => void;
  onAct?: (key: HomeAct) => void; actLabel?: (key: HomeAct) => string;
  editing: boolean; labels: string[] | null; onLabels: (rows: string[], defaults: string[]) => void; co: Company;
  playerSheet: HTMLCanvasElement | null;
  tour: { zone: [number, number, number, number]; stop: number } | null;   // welcome tour: host and player walk to this zone; camera zooms in
  onTourArrive: (stop: number) => void;   // both have walked to the stop and stopped
  clockScale: number;                     // 1 = real time; 60 = Fast demo time
}

// tour camera: frame a stop above (or below) the dialog card, or follow a point while walking
const VIEW_W = 720 * 1536 / 1056, K = 720 / 352, OFF = (1280 - VIEW_W) / 2;
const clampCam = (z: number, cx: number, cy: number, sy: number) => ({ z,
  tx: Math.min(-OFF, Math.max(1280 - OFF - VIEW_W * z, VIEW_W / 2 - cx * z)), ty: Math.min(0, Math.max(720 - 720 * z, sy - cy * z)) });
function frame([zx, zy, zw, zh]: [number, number, number, number]) {
  const z = Math.min(2.1, 620 / (zw * K), 380 / (zh * K));
  return clampCam(z, (zx + zw / 2) * K, (zy + zh / 2) * K, zy + zh / 2 > 190 ? 470 : 250);
}
const follow = (mx: number, my: number) => clampCam(2.2, mx * K, my * K, 360);
export default function Office({ onCoworker, frozen, menu, editing, labels, onLabels, co, playerSheet, tour, onPc, onTourArrive, clockScale, startAt, goDesk, goBoss, onBoss, extras, onSpot, onAct, actLabel = () => '' }: OfficeProps) {
  const bossRef = useRef<CoworkerId | null>(null), onBossRef = useRef(onBoss); onBossRef.current = onBoss;
  const viaRef = useRef<string | null>(null), withRef = useRef<{ id: CoworkerId; target: Tile; t: number } | null>(null);
  const extrasRef = useRef(extras); extrasRef.current = extras;
  // every place with a bubble: mini-games, the treat counter, the fridge, and the welcome gift while it's waiting
  type Spot = { name: string; at: [number, number]; stand: [number, number]; kind: 'game' | 'food' | 'fridge' | 'surprise' | 'act'; key?: HomeAct };
  const allSpots = (): Spot[] => co.acts ? co.acts.map((a) => ({ ...a, kind: 'act' as const })) : [...co.games.map((g) => ({ ...g, kind: 'game' as const })), { ...co.food, kind: 'food' },
    { ...co.fridge, name: extrasRef.current?.fridge ? t('Something in the fridge!', '冰箱里有东西！') : t('The fridge', '冰箱'), kind: 'fridge' }, ...(extrasRef.current?.surprise ? [{ ...co.surprise, kind: 'surprise' as const }] : [])];
  const arriveRef = useRef(onTourArrive); arriveRef.current = onTourArrive; const scaleRef = useRef(clockScale); scaleRef.current = clockScale;
  const innerRef = useRef<HTMLDivElement>(null);
  const meetRef = useRef<((n: Npc) => void) | null>(null);
  const onPcRef = useRef(onPc); onPcRef.current = onPc;
  const sheetRef = useRef(playerSheet); sheetRef.current = playerSheet;
  const tourRef = useRef<{ zone: [number, number, number, number]; stop: number; pending: boolean; arrived?: boolean; age?: number } | null>(null);
  useEffect(() => { tourRef.current = tour ? { ...tour, pending: true, arrived: false, age: 0 } : tourRef.current ? { ...tourRef.current, stop: -1, pending: true } : null; }, [tour?.stop, tour?.zone[0]]);
  const ref = useRef<HTMLCanvasElement>(null);
  const [map, setMap] = useState<MapFile | null>(null);
  const rows = useMemo(() => (!map ? null : labels && labels.length === map.h ? map.labels.map((r, y) => [...r].map((c, x) => (c === '#' || labels[y][x] === '#' ? c : labels[y][x])).join('')) : map.labels), [map, labels]);
  const grid = useMemo(() => (map && rows ? derive(map, rows) : null), [map, rows]);
  const gridRef = useRef(grid); gridRef.current = grid;
  const editRef = useRef(editing); editRef.current = editing; const rowsRef = useRef(rows); rowsRef.current = rows;
  const [bubble, setBubble] = useState<{ name: string; x: number; y: number; kind: Spot['kind']; key?: HomeAct } | null>(null);
  const me = useRef({ ...walker(startAt ?? co.start), goal: null as CoworkerId | null, target: null as Tile | null, wait: 0, stuck: 0, ghost: 0, follow: false, delay: 0, resume: null as Tile | null });
  const npcs = useRef<Npc[] | null>(null);
  const frozenRef = useRef(frozen); frozenRef.current = frozen;
  const menuRef = useRef(menu); menuRef.current = menu;

  useEffect(() => { fetch(A + `office_${co.id}.json`).then((r) => r.json()).then(setMap); }, [co.id]);

  useEffect(() => {
    if (!grid) return;
    const g = grid, cv = ref.current!, ctx = cv.getContext('2d')!; ctx.imageSmoothingEnabled = false;
    const bgImg = img(`office_${co.id}.png`), overImg = img(`office_${co.id}_over.png`), fallback = img('player.png');
    let bg: HTMLImageElement | HTMLCanvasElement = bgImg, over: HTMLImageElement | HTMLCanvasElement = overImg, giftGone = false;
    const ready = (i: HTMLImageElement | HTMLCanvasElement) => !(i instanceof HTMLImageElement) || i.complete;
    // the welcome gift sitting on a table in the map picture: once it's opened, paint the table top back over it
    const paintOut = (src: HTMLImageElement) => {
      const gm = co.giftInMap!, c = document.createElement('canvas'); c.width = src.naturalWidth; c.height = src.naturalHeight; const x = c.getContext('2d')!;
      x.drawImage(src, 0, 0);
      for (let r = gm.y0; r <= gm.y1; r++) { const sr = gm.src + (((r - gm.src) % 2) + 2) % 2; x.drawImage(src, gm.x0 * S, sr * S, (gm.x1 - gm.x0 + 1) * S, S, gm.x0 * S, r * S, (gm.x1 - gm.x0 + 1) * S, S); }
      return c;
    };
    const p = me.current;
    // coworkers start at their desks; "home" is the free tile right beside the chair, left or right of it on the same row,
    // where they stand up and sit down (never across the desk). Of the two, the one nearer the way out.
    const open = routes(g, co.start);
    const homeOf = (id: CoworkerId): Tile => {
      const [cx, cy] = seatTile(id); let best: Tile | null = null, bestLen = Infinity;
      for (const [x, e] of [[cx - 1, cx - 1], [cx + 1, cx]] as const) {   // e: the tile whose right edge lies between chair and side
        if (x < 0 || x >= g.w || g.walk[cy][x] !== '1' || g.wallE.has(cy * g.w + e)) continue;
        const pth = open.pathTo([x, cy]); if (pth && pth.length < bestLen) { best = [x, cy]; bestLen = pth.length; }
      }
      const [sx, sy] = COWORKERS[id].seat; return best ?? open.nearest(sx, sy + 56);
    };
    if (!npcs.current) npcs.current = co.people.map((id) => {
      const home = homeOf(id);
      return { ...walker(home), id, state: 'sit' as const, timer: 0, alpha: 0, home, wait: 0, hold: false, sheet: img(`npc/${id}.png`), until: 0, lastTrip: '', glide: null };
    });
    const list = npcs.current;
    (window as unknown as { office: unknown }).office = { p, list };   // lets the automated tests read positions
    const up = (n: Npc) => n.state !== 'sit';
    const takenBy = (skip: Walker | null) => { const s = new Set<number>(); for (const n of list) if (n !== skip) { if (up(n)) holds(n, g, s); else seatTiles(n.id, g, s); } if (p !== skip) holds(p, g, s); return s; };
    const key = (t: Tile) => t[1] * g.w + t[0];
    const trail = { route: [] as Tile[], idx: -1, spot: null as Tile | null };   // the guide's route the player is following on the tour
    const pathSet = (w: Walker) => { const k = new Set(w.path.map(key)); k.add(key(w.cur)); return k; };
    const isGuide = (n: Npc) => !!tourRef.current && n.id === co.host;
    // make room: a coworker steps off someone's route to the nearest free tile, then carries on where they were going
    // (they may walk along the other's route to get there, e.g. back out of a narrow way ahead of them, but never stop on it)
    const aside = (w: Walker, keep: Set<number>) => {
      const rt = routes(g, w.cur, takenBy(w)); let best: Tile[] | null = null;
      for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
        const t: Tile = [w.cur[0] + dx, w.cur[1] + dy]; if (keep.has(key(t))) continue;
        const pth = rt.pathTo(t); if (pth && pth.length > 1 && (!best || pth.length < best.length)) best = pth;
      }
      return best;
    };
    const playerAside = (keep: Set<number>) => {
      const best = aside(p, keep); if (!best) return false;
      p.resume = p.target; p.path = best.slice(1); p.follow = false; p.wait = 0.5; return true;
    };
    const stepAside = (w: Npc, keep: Set<number>) => {
      const best = aside(w, keep); if (!best) return false;
      w.resume = w.state === 'back' ? w.home : w.path.length ? w.path[w.path.length - 1] : null;
      w.path = best.slice(1); if (w.state === 'idle') w.state = 'out'; w.wait = 0; return true;
    };

    // the office clock: real time of day (Fast demo time runs it 60x)
    const clockNow = () => officeClock(QUICK ? 60 : scaleRef.current);   // shared with the desk computer
    const seatPoint = (n: Npc): [number, number] => { const [sx, sy] = COWORKERS[n.id].seat; return [sx, sy + 24]; };
    // get up: slide out of the chair to the tile beside the desk, walking, then follow the path
    const standUp = (n: Npc) => { const [fx, fy] = seatPoint(n), [tx, ty] = centre(n.home); Object.assign(n, walker(n.home), { x: fx, y: fy, alpha: 1, glide: { fx, fy, tx, ty, t: 0, sit: false } }); faceTo(n, tx, ty); };
    meetRef.current = (n: Npc) => { standUp(n); n.state = 'idle'; n.timer = 5; n.until = Infinity; n.hold = true; n.wait = 0; };
    // tour camera: follows the guide and the player while they walk; frames the stop once they are there
    const cam = { x: 0, y: 0, z: 1, on: false };
    let raf = 0, last = performance.now(), t = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const clock = clockNow();

      // ---- the player: never steps onto a tile a coworker holds; walks around them or waits
      // tour: the player follows the guide's footsteps, staying a tile behind; never a shortcut of their own
      if (p.follow && trail.spot && !p.path.length && p.delay <= 0) {
        const hostN = list.find((n) => n.id === co.host), hp = trail.route;
        const hostIdx = hostN ? hp.length - 1 - hostN.path.length : hp.length - 1;     // where the guide is along the route
        if (trail.idx < 0) {                                       // step onto the start of the guide's route once they have left it
          if (hostIdx >= 1 || hp.length <= 1) {
            // step straight onto the guide's trail where it touches the player, so they never cut their own way round
            let j = -1; for (let q = Math.min(hostIdx - 1, hp.length - 1); q >= 0; q--) if (Math.abs(hp[q][0] - p.cur[0]) + Math.abs(hp[q][1] - p.cur[1]) <= 1) { j = q; break; }
            if (j >= 0) { trail.idx = j; if (hp[j][0] !== p.cur[0] || hp[j][1] !== p.cur[1]) p.path = [hp[j]]; }
            else if (!hp.slice(hostIdx).some((t) => Math.abs(t[0] - p.cur[0]) + Math.abs(t[1] - p.cur[1]) <= 1)) {   // (if the trail passes right by, wait for the guide to go by)
              const pth = routes(g, p.cur, takenBy(p)).pathTo(hp[0]); trail.idx = 0; if (pth && pth.length > 1) p.path = pth.slice(1);
            }
          }
        } else if (trail.idx < Math.min(hostIdx - 1, hp.length - 2)) { trail.idx += 1; p.path = [hp[trail.idx]]; }
        else if (hostN && !hostN.path.length && trail.idx >= hp.length - 2) {   // the guide has stopped: take the spot beside them
          const pth = routes(g, p.cur, takenBy(p)).pathTo(trail.spot); trail.spot = null; p.follow = false; if (pth && pth.length > 1) p.path = pth.slice(1);
        }
      }
      if (p.delay > 0) p.delay -= dt;
      else if (p.path.length) {
        // two people walking into each other (a narrow kitchen, a doorway): after a moment you turn sideways and slip
        // past them instead of both standing there
        if ((p.stuck ?? 0) > 1.4 && !p.ghost) { p.ghost = 0.9; p.stuck = 0; }
        if (p.ghost) p.ghost = Math.max(0, p.ghost - dt);
        // walking along with the boss: keep level with them instead of racing ahead
        const pace = () => { const w = withRef.current; if (!w) return 64; const b = list.find((n) => n.id === w.id); return b && p.path.length < b.path.length - 1 ? 28 : 50; };
        const taken = takenBy(p), r = advance(p, dt, pace(),  (tl) => !p.ghost && taken.has(tl[1] * g.w + tl[0]));
        if (r === 'blocked') {
          p.wait -= dt; p.stuck = (p.stuck ?? 0) + dt;
          // a coworker standing still in the way steps aside after a moment
          const blocker = p.stuck > 0.8 ? list.find((n) => up(n) && !n.moving && !n.hold && !isGuide(n) && !COWORKERS[n.id].pet && n.cur[0] === p.path[0][0] && n.cur[1] === p.path[0][1]) : undefined;
          if (blocker && stepAside(blocker, pathSet(p))) p.stuck = 0;
          if (p.wait <= 0 && p.target && !p.follow) {
            p.wait = 0.3; const rt = routes(g, p.cur, taken); const [tx, ty] = centre(p.target);
            // go round people in the way; settle for the nearest spot only when someone is standing on the target itself
            const onTarget = taken.has(p.target[1] * g.w + p.target[0]);
            const path = rt.pathTo(p.target) ?? (onTarget ? rt.pathTo(rt.nearest(tx, ty)) : null); if (path) p.path = path.slice(1);
          }
        } else if (r === 'arrived' && p.resume) {          // stepped aside to let someone pass: now carry on
          const pth = routes(g, p.cur, takenBy(p)).pathTo(p.resume); p.target = p.resume; p.resume = null; if (pth) p.path = pth.slice(1);
        } else if (r === 'arrived' && p.follow && trail.spot) {   // one footstep done on the tour; the follow step picks the next
          p.stuck = 0;
        } else if (r === 'arrived') {
          if (p.target) gEmit('walked');
          p.target = null; p.stuck = 0; p.follow = false;
          if (trail.route.length && !trail.spot) { const h = list.find((n) => n.id === co.host); if (h) faceTo(p, h.x, h.y); }
          // walking up to your own desk sits you down at it (the close desk view)
          if (!tourRef.current && p.cur[0] === co.pc.stand[0] && p.cur[1] === co.pc.stand[1]) { p.dir = 1; onPcRef.current(); }
          if (p.goal) { const who = list.find((n) => n.id === p.goal)!; const gx = up(who) ? who.x : COWORKERS[who.id].seat[0], gy = up(who) ? who.y : COWORKERS[who.id].seat[1] + 24;
            faceTo(p, gx, gy); const id = p.goal; p.goal = null; if (bossRef.current === id) {
              bossRef.current = null; who.hold = false;
              const via = viaRef.current, place = via ? co.places[via] : null; viaRef.current = null;
              if (!place) onBossRef.current?.(id);
              else {   // "let's grab a coffee": the boss leads the way, you walk along beside them
                if (who.state === 'sit') standUp(who);
                const rtN = routes(g, who.cur, takenBy(who)), nt = rtN.nearest(place[0], place[1]), np = rtN.pathTo(nt);
                const avoid = new Set([nt[1] * g.w + nt[0]]); const rtP = routes(g, p.cur, avoid), pt = rtP.nearest(place[0] + 20, place[1]), pp = rtP.pathTo(pt);
                if (!np || !pp) onBossRef.current?.(id);
                else { who.state = 'out'; who.path = np.slice(1); who.until = Infinity; who.timer = Infinity; who.wait = 0; p.path = pp.slice(1); p.target = pt; p.delay = 0.5; withRef.current = { id, target: pt, t: 0 }; }
              }
            } else onCoworker(id, gx); }
        }
      }

      // ---- walking somewhere together with the boss: once you're both there, face each other and start
      const wr = withRef.current;
      if (wr) {
        const who = list.find((n) => n.id === wr.id);
        wr.t += dt;
        if (who && ((!p.path.length && !who.path.length && p.delay <= 0) || wr.t > 30)) { faceTo(p, who.x, who.y); faceTo(who, p.x, p.y); who.state = 'idle'; who.timer = 6; withRef.current = null; onBossRef.current?.(wr.id); }
      }

      // ---- welcome tour: the host and the player walk to the next stop (the first stop: they are simply there)
      const tr = tourRef.current, host = list.find((n) => n.id === co.host);
      if (tr && tr.pending && host) {
        tr.pending = false;
        if (tr.stop < 0) { tourRef.current = null; host.state = 'idle'; host.timer = 0.5; host.until = Infinity; host.hold = false; }   // tour over: the host goes back to their desk
        else {
          const [zx, zy, zw, zh] = tr.zone, cx = zx + zw / 2, cy = zy + zh / 2, first = tr.stop === 0 && host.state === 'sit';
          const open = routes(g, first ? co.start : host.cur, new Set());
          const hostTile = open.nearest(cx - 10, cy);
          const avoid = new Set([hostTile[1] * g.w + hostTile[0]]); for (const n of list) if (n !== host) { if (up(n)) holds(n, g, avoid); else seatTiles(n.id, g, avoid); }
          const playerTile = routes(g, first ? co.start : p.cur, avoid).nearest(cx + 14, cy + 6);
          if (first) { Object.assign(host, walker(hostTile), { state: 'idle' as const, alpha: 1, timer: 1e9, until: Infinity, glide: null }); Object.assign(p, walker(playerTile), { target: null, goal: null }); p.dir = 2; }
          else {
            // plan through people standing about (they make room); only seated coworkers' chairs are off limits
            const seats = new Set<number>(); for (const n of list) if (!up(n)) seatTiles(n.id, g, seats);
            let hp = routes(g, host.cur, takenBy(host)).pathTo(hostTile) ?? routes(g, host.cur, seats).pathTo(hostTile);
            // the guide sets off the way that doesn't go through the player when that's only a few steps longer,
            // so the player can fall in behind them instead of shuffling out of the way first
            if (hp && hp.slice(1).some((t) => key(t) === key(p.cur))) {
              const round = new Set(takenBy(host)); round.add(key(p.cur));
              const alt = routes(g, host.cur, round).pathTo(hostTile); if (alt && alt.length <= hp.length + 4) hp = alt;
            }
            if (hp && hp.slice(1).some((t) => key(t) === key(p.cur))) {     // the player is standing on the guide's way: step aside first
              const best = aside(p, new Set(hp.map(key))); if (best) p.path = best.slice(1);
            }
            if (hp) {
              host.path = hp.slice(1); host.state = 'out'; host.timer = 1e9; host.resume = null;
              // the player follows behind the guide, tile by tile along the guide's own route, then steps to their spot beside them
              trail.route = hp; trail.idx = -1; trail.spot = hp.length >= 2 ? hp[hp.length - 2] : playerTile;   // stop right behind the guide, on their trail
              p.target = playerTile; p.goal = null; p.follow = true; p.delay = 0;
            }
          }
        }
      }

      // ---- coworkers: sit, now and then get up, walk somewhere, stand a while, walk back
      for (const n of list) {
        if (COWORKERS[n.id].pet) continue;                             // Bean stays on her bed
        if (tourRef.current && n.id === co.host) {                     // the tour guide: walks to each stop, then faces the player
          if (n.path.length) {
            const tk = takenBy(n), r = advance(n, dt, 64, (tl) => tk.has(key(tl)));
            if (r === 'blocked') { n.wait += dt; const o = list.find((x) => x !== n && up(x) && !x.moving && !x.hold && key(x.cur) === key(n.path[0]));
              if (n.wait > 0.5 && o && stepAside(o, pathSet(n))) n.wait = 0;
              else if (n.wait > 0.8) {                                   // e.g. the player is in the way: go round, or have the player make room
                const dest = n.path[n.path.length - 1], pth = routes(g, n.cur, tk).pathTo(dest);
                if (pth) { n.path = pth.slice(1); n.wait = 0; }
                else if (key(p.cur) === key(n.path[0]) && !p.moving && !p.follow && playerAside(pathSet(n))) n.wait = 0;
              }
            } else n.wait = 0;
          }
          else if (n.resume) { const pth = routes(g, n.cur, takenBy(n)).pathTo(n.resume); n.resume = null; if (pth) n.path = pth.slice(1); }
          else { n.moving = false; n.state = 'idle'; n.timer = 1e9; faceTo(n, p.x, p.y); }
          n.alpha = 1; continue;
        }
        n.hold = menuRef.current === n.id || p.goal === n.id;          // wait for the player who is coming to talk
        if (n.glide) {                                                 // getting up or sitting down
          const gl = n.glide; gl.t = Math.min(1, gl.t + dt / 0.6);
          // getting up: straight down out of the chair, turn, then sideways to the tile; sitting down is the reverse
          const vFirst = !gl.sit, a = Math.min(1, gl.t * 2), b = Math.max(0, gl.t * 2 - 1);
          if (vFirst) { n.x = gl.fx + (gl.tx - gl.fx) * b; n.y = gl.fy + (gl.ty - gl.fy) * a; }
          else { n.x = gl.fx + (gl.tx - gl.fx) * a; n.y = gl.fy + (gl.ty - gl.fy) * b; }
          const legV = vFirst ? gl.t < 0.5 : gl.t >= 0.5;
          if (legV && Math.abs(gl.ty - gl.fy) > 1) n.dir = gl.ty > gl.fy ? 3 : 1; else if (Math.abs(gl.tx - gl.fx) > 1) n.dir = gl.tx > gl.fx ? 0 : 2;
          if (gl.sit && gl.t >= 0.5) n.dir = 1;        // turns to face the desk as they sit
          n.moving = gl.t < 1;
          if (gl.t >= 1) { n.glide = null; n.moving = false; if (gl.sit) { n.state = 'sit'; n.alpha = 0; } }
          continue;
        }
        if (n.state === 'sit') {
          // the schedule: is it time for one of this coworker's trips?
          const day = Math.floor(clock / 1440), mins = ((clock % 1440) + 1440) % 1440, hour = Math.floor(mins / 60), mh = mins % 60;
          const trip = (COWORKERS[n.id].schedule ?? []).find((e) => (e.h === undefined || e.h === hour) && mh >= e.m && mh < e.m + e.stay);
          const id = trip ? `${day}-${hour}-${trip.m}-${trip.to}` : '';
          if (trip && id !== n.lastTrip && !n.hold && !takenBy(n).has(key(n.home))) {
            const place = co.places[trip.to], rt = routes(g, n.home, takenBy(n)), path = place ? rt.pathTo(rt.nearest(place[0], place[1])) : null;
            n.lastTrip = id;
            if (path && path.length > 1) {
              standUp(n); n.state = 'out'; n.path = path.slice(1); n.wait = 0; n.timer = Infinity;
              n.until = day * 1440 + hour * 60 + trip.m + trip.stay;     // walk back when the trip's time is up
            }
          }
          continue;
        }
        n.alpha = 1;
        if (n.hold) {                                                  // finish the current step, then stand and face the player
          const [hx, hy] = centre(n.cur);
          if (n.moving && n.path[0] && (Math.abs(n.x - hx) > 0.01 || Math.abs(n.y - hy) > 0.01)) { const rest = n.path.slice(1); n.path = [n.path[0]]; advance(n, dt, 40, () => false); n.path = [...n.path, ...rest]; if (n.path.length === rest.length) n.moving = false; }
          else { n.moving = false; faceTo(n, p.x, p.y); }
          continue;
        }
        if (n.state === 'idle') { n.timer -= dt; if (n.timer <= 0 || clock >= n.until) { const path = routes(g, n.cur, takenBy(n)).pathTo(n.home); if (path) { n.path = path.slice(1); n.state = 'back'; n.wait = 0; } else n.timer = 2; } if (n.state === 'idle') continue; }
        const taken = takenBy(n), r = advance(n, dt, withRef.current?.id === n.id ? 50 : 40, (tl) => taken.has(tl[1] * g.w + tl[0]));
        if (r === 'blocked') {
          n.wait += dt;
          const nx = key(n.path[0]), o = list.find((x) => x !== n && up(x) && !COWORKERS[x.id].pet && (key(x.cur) === nx || (x.moving && x.path[0] && key(x.path[0]) === key(n.cur))));
          if (n.wait > 0.6 && o && !o.moving) {
            // the other one makes room (unless they are the tour guide or waiting to talk); otherwise this one does
            if ((!isGuide(o) && !o.hold && stepAside(o, pathSet(n))) || stepAside(n, pathSet(o))) { n.wait = 0; continue; }
          }
          if (n.wait > 0.5) {                                          // look for a way around; give up after a while
            const dest = n.state === 'back' ? n.home : n.path[n.path.length - 1], path = routes(g, n.cur, taken).pathTo(dest);
            if (path) { n.path = path.slice(1); n.wait = 0; }
            else if (n.wait > 3) { if (n.state === 'out') { n.path = []; n.state = 'idle'; n.dir = 3; } n.wait = 0.5; }
          }
        } else { n.wait = 0; if (r === 'arrived' || r === 'idle') {
          if (n.resume) { const pth = routes(g, n.cur, takenBy(n)).pathTo(n.resume); n.resume = null; if (pth && pth.length > 1) { n.path = pth.slice(1); continue; } }
          if (n.state === 'back' && (n.cur[0] !== n.home[0] || n.cur[1] !== n.home[1])) { const pth = routes(g, n.cur, takenBy(n)).pathTo(n.home); if (pth && pth.length > 1) { n.path = pth.slice(1); continue; } }
          if (n.state === 'out') { n.state = 'idle'; n.dir = 3; if (!isFinite(n.until)) n.timer = 4; }   // stay until the trip's time is up
          else if (n.state === 'back' && n.cur[0] === n.home[0] && n.cur[1] === n.home[1]) {        // sit back down: slide into the chair
            const [tx, ty] = seatPoint(n); n.glide = { fx: n.x, fy: n.y, tx, ty, t: 0, sit: true }; faceTo(n, tx, ty);
          }
        } }
      }

      // a mini-game bubble shows only while the player stands at its spot
      const spot = !p.moving && !tourRef.current && !extrasRef.current?.doing ? allSpots().find((s) => s.stand[0] === p.cur[0] && s.stand[1] === p.cur[1]) : undefined;
      setBubble((b) => (spot ? (b && b.name === spot.name ? b : { name: spot.name, x: spot.at[0], y: spot.at[1], kind: spot.kind, key: spot.key }) : b ? null : b));

      // ---- welcome tour: tell the screen when both have arrived (then the dialog appears), and move the camera
      const trA = tourRef.current, hostA = list.find((n) => n.id === co.host);
      if (trA && trA.stop >= 0 && !trA.pending && hostA) {
        trA.age = (trA.age ?? 0) + dt;
        if (!trA.arrived && trA.age > 0.6 && !hostA.path.length && !hostA.glide && !p.follow && !p.path.length && !p.moving) { trA.arrived = true; arriveRef.current(trA.stop); }
      }
      if (innerRef.current) {
        let tz = 1, tx = 0, ty = 0;
        if (trA && trA.stop >= 0 && hostA) {
          if (trA.arrived) ({ z: tz, tx, ty } = frame(trA.zone));
          else ({ z: tz, tx, ty } = follow((hostA.x + p.x) / 2, (hostA.y + p.y) / 2));
        }
        if (!cam.on) { cam.x = tx; cam.y = ty; cam.z = tz; cam.on = true; }
        const k = 1 - Math.exp(-dt * (trA && !trA.arrived ? 4 : 2.6));
        cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
        innerRef.current.style.transform = Math.abs(cam.z - 1) < 0.002 && Math.abs(cam.x) < 0.5 && Math.abs(cam.y) < 0.5 ? '' : `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
      }

      // ---- draw
      if (co.giftInMap && !giftGone && !extrasRef.current?.surprise && bgImg.complete && overImg.complete) { bg = paintOut(bgImg); over = paintOut(overImg); giftGone = true; }
      else if (giftGone && extrasRef.current?.surprise) { bg = bgImg; over = overImg; giftGone = false; }   // a new gift (replayed onboarding)
      ctx.globalAlpha = 1; ctx.drawImage(bg, 0, 0);
      if (editRef.current && rowsRef.current) {     // label editor: colour every tile by its label
        const col: Record<string, string> = { '#': 'rgba(40,30,40,.55)', S: 'rgba(230,50,50,.45)', T: 'rgba(255,210,0,.6)', '.': 'rgba(60,200,90,.35)' };
        rowsRef.current.forEach((r, y) => [...r].forEach((c, x) => { ctx.fillStyle = col[c]; ctx.fillRect(x * 48 + 2, y * 48 + 2, 44, 44); }));
        ctx.fillStyle = '#2a1f2a'; g.wallE.forEach((k) => ctx.fillRect(((k % g.w) + 1) * 48 - 4, Math.floor(k / g.w) * 48, 8, 48));   // thin walls
        g.wallS.forEach((k) => ctx.fillRect((k % g.w) * 48, (Math.floor(k / g.w) + 1) * 48 - 4, 48, 8));
        raf = requestAnimationFrame(tick); return;
      }
      if (!tourRef.current) {                       // your computer: the screen glows softly so you can find it
        const [gx, gy] = co.pc.at, a = 0.25 + 0.2 * Math.sin(t * 2.4);
        ctx.fillStyle = `rgba(150,210,255,${a})`; ctx.beginPath(); ctx.ellipse(gx * S, gy * S - 8, 34, 26, 0, 0, 7); ctx.fill();
      }
      if (extrasRef.current?.surprise) {   // the welcome gift on a table (in the map picture, or drawn here): two little twinkles beside it
        const [gx, gy] = co.surprise.at;
        if (!co.giftInMap && giftImg.complete) ctx.drawImage(giftImg, Math.round(gx - giftImg.width / 2) * S, (gy - giftImg.height) * S, giftImg.width * S, giftImg.height * S);
        for (let i = 0; i < 2; i++) { const a = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.5), sx = gx * S + (i ? 26 : -24), sy = gy * S - (i ? 46 : 30);
          ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff6c8'; ctx.translate(sx, sy); ctx.rotate(t * (i ? -1 : 1));
          ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 3 : 9, an = (k * Math.PI) / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.fill(); ctx.restore(); }
      }
      if (extrasRef.current?.fridge) {           // something in the fridge: a little twinkle on the door
        const [fx, fy] = co.fridge.at, a = 0.5 + 0.5 * Math.sin(t * 4);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff6c8'; ctx.translate(fx * S + 14, fy * S + 10); ctx.rotate(t);
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 11, an = (i * Math.PI) / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.fill(); ctx.restore();
      }
      for (const s of co.games) {                 // play markers
        const x = s.at[0] * S, y = s.at[1] * S - 40 + Math.sin(t * 3) * 3;
        ctx.fillStyle = 'rgba(255,236,150,.55)'; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill();
        ctx.fillStyle = '#f2c14e'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x - 5, y + 8); ctx.lineTo(x + 9, y); ctx.fill();
      }
      if (p.target && !tourRef.current) {           // click marker and the dotted path (not on the tour)
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = '#c9962e'; ctx.lineWidth = 3;
        for (const [px, py] of p.path) { ctx.beginPath(); ctx.arc(px * T * S + 24, py * T * S + 24, 6, 0, 7); ctx.fill(); ctx.stroke(); }
        const [mx, my] = p.target; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(mx * T * S + 24, my * T * S + 24, 22, 10, 0, 0, 7); ctx.stroke();
      }
      // everyone is drawn back to front; after each walker, objects standing in front of them are drawn again on top
      const drawWalker = (w: Walker, sh: CanvasImageSource, alpha: number) => {
        const frame = w.dir * 6 + (Math.floor(t * (w.moving ? 10 : 4)) % 6), px = Math.round((w.x - 8) * S), py = Math.round((w.y + 8 - 32) * S);
        ctx.globalAlpha = alpha; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(px + 24, py + 94, 18, 6, 0, 0, 7); ctx.fill();
        ctx.drawImage(sh, frame * 16, w.moving ? 32 : 0, 16, 32, px, py, 48, 96); ctx.globalAlpha = 1;
        const feet = Math.floor(w.y / T);
        if (ready(over)) for (let cy = feet - 2; cy <= feet + 1; cy++) for (let cx = Math.floor((w.x - 8) / T); cx <= Math.floor((w.x + 7) / T); cx++) {
          if (cy < 0 || cx < 0 || cy >= g.h || cx >= g.w || g.base[cy][cx] <= feet) continue;
          ctx.drawImage(over, cx * T * S, cy * T * S, T * S, T * S, cx * T * S, cy * T * S, T * S, T * S);
        }
      };
      if (tourRef.current && tourRef.current.stop >= 0 && tourRef.current.arrived) {          // highlight the stop once they are there
        const [zx, zy, zw, zh] = tourRef.current.zone; ctx.fillStyle = 'rgba(255,236,150,.16)'; ctx.fillRect(zx * S, zy * S, zw * S, zh * S);
        ctx.strokeStyle = 'rgba(242,193,78,.95)'; ctx.lineWidth = 6; ctx.strokeRect(zx * S + 3, zy * S + 3, zw * S - 6, zh * S - 6);
      }
      const sheet = sheetRef.current ?? fallback;
      const order: { y: number; draw: () => void }[] = [{ y: p.y, draw: () => drawWalker(p, sheet, 1) }];
      for (const n of list) {
        const [sx, sy, cut] = COWORKERS[n.id].seat; const seated = n.state === 'sit' && !n.glide ? 1 : 0;
        if (COWORKERS[n.id].pet) { order.push({ y: sy + 16, draw: () => ctx.drawImage(n.sheet, (Math.floor(t * 1.2) % 2) * 16, 0, 16, 20, (sx - 8) * S, sy * S, 48, 60) }); continue; }
        if (seated > 0.01) order.push({ y: sy + 20, draw: () => {
          ctx.globalAlpha = seated; const f = Math.floor(t * 4 + sx) % 6;
          // the sitting row of the sheet (lap, shins and shoes), sat 2 px lower than standing; a table in front may hide the legs
          if (n.sheet.naturalHeight >= 96) { const show = COWORKERS[n.id].seat[3] ?? 32; ctx.drawImage(n.sheet, f * 16, 64, 16, show, (sx - 8) * S, (sy + 2) * S, 48, show * S); }
          else ctx.drawImage(n.sheet, (18 + f) * 16, 0, 16, cut, (sx - 8) * S, sy * S, 48, cut * S);
          ctx.globalAlpha = 1;
          // a full-height sitter (reception) has the counter drawn back over the legs
          if (cut >= 32 && ready(over)) { const ry = Math.floor((sy + 32) / T) * T * S; ctx.drawImage(over, (sx - 16) * S, ry, 96, 96, (sx - 16) * S, ry, 96, 96); }
        } });
        if (!seated) order.push({ y: n.y, draw: () => drawWalker(n, n.sheet, 1) });
      }
      order.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
      const doing = extrasRef.current?.doing;
      if (doing && !p.moving) {
        const bx = p.x * S, by = (p.y - 30) * S + Math.sin(t * 3) * 4;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3b2e2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(bx - 30, by - 58, 60, 52, 14); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - 8, by - 8); ctx.lineTo(bx, by + 6); ctx.lineTo(bx + 8, by - 8); ctx.fill(); ctx.stroke(); ctx.fillRect(bx - 9, by - 10, 18, 4);
        ctx.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(doing, bx, by - 31);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [grid, onCoworker]);

  // the "My desk" button: walk over to your own desk
  useEffect(() => {
    if (!goDesk || !grid || !npcs.current || frozenRef.current) return;
    const p = me.current, t = new Set<number>();
    for (const n of npcs.current) { if (n.state !== 'sit') holds(n, grid, t); else seatTiles(n.id, grid, t); }
    if (p.cur[0] === co.pc.stand[0] && p.cur[1] === co.pc.stand[1] && !p.moving) { onPcRef.current(); return; }
    const path = routes(grid, p.cur, t).pathTo(co.pc.stand); if (!path) return;
    const rest = path.slice(1), mid = Math.abs(p.x - centre(p.cur)[0]) > 0.01 || Math.abs(p.y - centre(p.cur)[1]) > 0.01;
    p.path = mid ? [p.cur, ...rest] : rest; p.target = co.pc.stand; p.goal = null; p.wait = 0; p.stuck = 0; onCoworker(null);
  }, [goDesk]);

  // walk over to the boss (for the one-to-one): like clicking them, but arriving opens the meeting instead of the menu
  useEffect(() => {
    if (!goBoss) return; let tries = 0, timer = 0;
    const go = () => {
      const grid = gridRef.current;
      if (!grid || !npcs.current || frozenRef.current) { if (tries++ < 25) timer = window.setTimeout(go, 200); else onBossRef.current?.(goBoss.id); return; }
      const p = me.current, who = npcs.current.find((n) => n.id === goBoss.id); if (!who) { onBossRef.current?.(goBoss.id); return; }
      const t = new Set<number>(); for (const n of npcs.current) { if (n.state !== 'sit') holds(n, grid, t); else seatTiles(n.id, grid, t); }
      const rt = routes(grid, p.cur, t);
      const target = who.state !== 'sit' ? rt.nearest(who.x, who.y) : rt.nearest(COWORKERS[who.id].spot[0], COWORKERS[who.id].spot[1] + 22);
      const path = rt.pathTo(target); if (!path || path.length < 2) { onBossRef.current?.(goBoss.id); return; }
      const rest = path.slice(1), mid = Math.abs(p.x - centre(p.cur)[0]) > 0.01 || Math.abs(p.y - centre(p.cur)[1]) > 0.01;
      p.path = mid ? [p.cur, ...rest] : rest; p.goal = who.id; p.target = target; p.wait = 0; p.stuck = 0; who.hold = true; bossRef.current = who.id; viaRef.current = goBoss.via ?? null; onCoworker(null);
    };
    go(); return () => clearTimeout(timer);
  }, [goBoss?.n]);

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!grid || !map || !rows) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * grid.w * T, my = ((e.clientY - r.top) / r.height) * grid.h * T;
    if (editing) {                                  // click a tile to cycle free -> solid -> tall
      const x = Math.floor(mx / T), y = Math.floor(my / T), c = rows[y]?.[x]; if (!c || c === '#') return;
      const next = c === '.' ? 'S' : c === 'S' ? 'T' : '.';
      onLabels(rows.map((row, yy) => (yy === y ? row.slice(0, x) + next + row.slice(x + 1) : row)), map.labels); return;
    }
    if (frozenRef.current || !npcs.current) return;
    const p = me.current, list = npcs.current;
    onCoworker(null);
    const takenNow = () => { const t = new Set<number>(); for (const n of list) { if (n.state !== 'sit') holds(n, grid, t); else seatTiles(n.id, grid, t); } return t; };
    let rt = routes(grid, p.cur, takenNow());
    const marker = co.games.find((s) => Math.hypot(mx - s.at[0], my - (s.at[1] - 13)) < 9);   // the play marker itself wins over whoever sits under it
    // clicking a coworker (at their desk or walking about) walks to the closest free spot next to them
    const who = marker ? undefined : list.find((n) => n.state !== 'sit' ? Math.abs(mx - n.x) < 10 && my > n.y - 26 && my < n.y + 10 : (() => { const [sx, sy] = COWORKERS[n.id].seat; return Math.abs(mx - sx) < 11 && my > sy - 4 && my < sy + 62; })());
    if (who && who.state === 'sit' && !COWORKERS[who.id].pet) {
      // a seated coworker the player can't stand beside (their desk is closed in) gets up and comes to meet the player
      const seat = new Set<number>(); seatTiles(who.id, grid, seat); let beside = false;
      seat.forEach((k) => { const x = k % grid.w, y = Math.floor(k / grid.w);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (!seat.has(ny * grid.w + nx) && rt.pathTo([nx, ny])) beside = true; } });
      const homeFree = !takenNow().has(who.home[1] * grid.w + who.home[0]) && !(p.cur[0] === who.home[0] && p.cur[1] === who.home[1]);
      if (!beside && homeFree) { meetRef.current?.(who); rt = routes(grid, p.cur, takenNow()); }
    }
    let target: Tile;
    const [dx0, dy0, dx1, dy1] = co.pc.desk, pcClick = !who && !marker && mx >= dx0 && mx < dx1 && my >= dy0 && my < dy1;
    if (pcClick) { if (key2(p.cur) === key2(co.pc.stand) && !p.moving) { onPc(); return; } target = co.pc.stand; }
    else if (who) target = who.state !== 'sit' ? rt.nearest(who.x, who.y) : rt.nearest(COWORKERS[who.id].spot[0], COWORKERS[who.id].spot[1] + 22);
    else {
      const spot = marker ?? allSpots().find((s) => Math.abs(mx - s.at[0]) < 16 && Math.abs(my - (s.at[1] - 13)) < 22);
      const tile: Tile = [Math.floor(mx / T), Math.floor(my / T)];
      target = spot && rt.pathTo(spot.stand) ? spot.stand : rt.pathTo(tile) ? tile : rt.nearest(mx, my);
    }
    const path = rt.pathTo(target); if (!path) return;
    // finish the current step first, then follow the new path
    const rest = path.slice(1), mid = Math.abs(p.x - centre(p.cur)[0]) > 0.01 || Math.abs(p.y - centre(p.cur)[1]) > 0.01;
    p.path = mid ? [p.cur, ...rest] : rest; p.goal = who ? who.id : null; p.target = target; p.wait = 0; p.stuck = 0;
    if (who) who.hold = true;
    if (!p.path.length && who) { p.goal = null; p.target = null; onCoworker(who.id, who.state !== 'sit' ? who.x : COWORKERS[who.id].seat[0]); }
  };

  return (
    <div className="office"><div className="office-inner" ref={innerRef}>
      <canvas ref={ref} width={1536} height={1056} onClick={click} />
      {extras?.deco && <div className={`deco deco-${extras.deco}`} aria-hidden>{extras.deco === 'winter' && <span className="snow">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.7) % 9}s`, animationDuration: `${8 + (i % 5)}s` }} />)}</span>}</div>}
      {bubble && (
        <div data-kind={bubble.kind} className={bubble.kind === 'game' || (bubble.kind === 'fridge' && !extras?.fridge) ? 'spot-bubble' : 'spot-bubble act'} style={{ left: `${(bubble.x / 512) * 100}%`, top: `${((bubble.y - (bubble.kind === 'surprise' ? 18 : 22)) / 352) * 100}%` }}>
          <b>{bubble.name}</b>
          {bubble.kind === 'game' && <span>{t('Coming soon in the demo', '演示版即将推出')}</span>}
          {bubble.kind === 'food' && <button className="bubble-btn" onClick={() => onSpot?.('food')}>{t('See the menu', '看看菜单')}</button>}
          {bubble.kind === 'fridge' && (extras?.fridge ? <button className="bubble-btn" onClick={() => onSpot?.('fridge')}>{t('Take a look', '看一看')}</button> : <span>{t("Just milk and someone's lunch today.", '今天只有牛奶和某人的午饭。')}</span>)}
          {bubble.kind === 'surprise' && <button className="bubble-btn" onClick={() => onSpot?.('surprise')}>{t('Open it', '打开')}</button>}
          {bubble.kind === 'act' && bubble.key && <button className="bubble-btn" onClick={() => onAct?.(bubble.key!)}>{actLabel(bubble.key)}</button>}
        </div>
      )}
    </div></div>
  );
}
