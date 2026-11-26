import { useEffect, useRef, useState } from 'react';
import { ZH, t } from './lang';
import { DIR_COL } from './look';
import { Host } from './Onboarding';
import { Save } from './state';
import { play } from './sfx';
import { ALL_TREATS, treatsToday } from './treats';
import { ITEMS, SLOTS, STARTER, fits, freeSlot, item, slot } from './deskSlots';

const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
const W = 1280, H = 832;
const TUT = [
  t('Click one of your things', '点一下桌上的东西'),
  t('Move it, or put it in the backpack', '移个位置，或者收进背包'),
  t('Or just drag it to a glowing spot', '也可以直接拖到发光的位置'),
  t('Your backpack: drag things back out', '背包：再把东西拖回桌上'),
];
const CHAR_K = 6, CHAR_ROW0 = 9, CHAR_ROWS = 19, CHAR_TOP = 378;   // size; the rows of the 16x32 frame drawn (top of the hair to the shoulders); where the hair starts
type Place = Record<string, string | null>;

// ---------------- drawing the desk: back wall and desk, the things on it, the character in the chair, the chair ----------------
type Pics = { back: HTMLImageElement; front: HTMLImageElement; pet: HTMLImageElement; items: Record<string, HTMLImageElement>; treats: Record<string, HTMLImageElement> };
function usePics(pet: string): Pics {
  const ref = useRef<Pics | null>(null);
  if (!ref.current) {
    const ld = (p: string) => { const i = new Image(); i.src = A + p; return i; };
    ref.current = { back: ld('ob/starter/back.png'), front: ld('ob/starter/front.png'), pet: ld(`ob/pets/${pet}.png`), items: Object.fromEntries(ITEMS.map((i) => [i.id, ld(`ob/starter/${i.id}.png`)])),
      treats: Object.fromEntries(ALL_TREATS.map((t) => [t.key, ld(`ob/treats/${t.key}.png`)])) };
  }
  if (!ref.current.pet.src.endsWith(`${pet}.png`)) ref.current.pet.src = `${A}ob/pets/${pet}.png`;
  return ref.current;
}
function drawDesk(x: CanvasRenderingContext2D, pics: Pics, place: Place, sheet: HTMLCanvasElement | null, t: number, opts: { lifted?: string | null; walk?: boolean; treats?: string[] } = {}) {
  x.clearRect(0, 0, W, H);
  if (pics.back.complete) x.drawImage(pics.back, 0, 0);
  const on = Object.entries(place).filter(([, sl]) => sl).map(([id, sl]) => ({ it: item(id), at: slot(sl!).at })).sort((a, b) => a.at[1] - b.at[1]);
  for (const { it, at } of on) {
    const im = pics.items[it.id]; if (!im?.complete) continue;
    const [bx, by, bw, bh] = it.box;
    x.globalAlpha = opts.lifted === it.id ? 0.3 : 1;
    x.drawImage(im, bx, by, bw, bh, at[0] - bw / 2, at[1] - bh, bw, bh);
  }
  x.globalAlpha = 1;
  // today's treats sit in free spots on the desk (at most two are shown)
  const used = new Set(Object.values(place).filter(Boolean));
  const free = ['desk-l2', 'desk-r2', 'desk-l1', 'desk-r3', 'desk-l3', 'desk-r1'].filter((id) => !used.has(id));
  (opts.treats ?? []).slice(-2).forEach((k, i) => { const im = pics.treats[k], sl = free[i]; if (!im?.complete || !sl) return; const [ax, ay] = slot(sl).at; x.drawImage(im, ax - im.width * 2, ay - im.height * 4, im.width * 4, im.height * 4); });
  if (pics.pet.complete) x.drawImage(pics.pet, (Math.floor(t * 2) % 2) * 16, 0, 16, 20, 116 * 4, 167 * 4, 64, 80);
  // the character from behind, sitting in the chair: drawn a bit bigger, and only the head and shoulders show above the
  // chair back (the rest of the body is left out, so no legs poke out under or beside the chair)
  if (sheet) x.drawImage(sheet, (DIR_COL.back + (opts.walk ? Math.floor(t * 4) % 6 : 0)) * 16, CHAR_ROW0, 16, CHAR_ROWS, 640 - 8 * CHAR_K, CHAR_TOP, 16 * CHAR_K, CHAR_ROWS * CHAR_K);
  if (pics.front.complete) x.drawImage(pics.front, 0, 0);
}

// a desk item cut from its picture, at any size (for the storage drawer and the one being dragged)
function ItemPic({ id, k, style }: { id: string; k: number; style?: React.CSSProperties }) {
  const [bx, by, bw, bh] = item(id).box;
  return <span className="item-pic" style={{ width: bw * k, height: bh * k, backgroundImage: `url(${A}ob/starter/${id}.png)`, backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `-${bx * k}px -${by * k}px`, ...style }} />;
}

// the close view during a work order: the same desk, as the player has set it up
export function WorkScene({ sheet, pet, place, treats = [] }: { sheet: HTMLCanvasElement | null; pet: string; place: Place; treats?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null); const pics = usePics(pet);
  const placeRef = useRef({ place, treats }); placeRef.current = { place, treats };
  useEffect(() => {
    const cv = ref.current!, x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; let raf = 0; const t0 = performance.now();
    const draw = (now: number) => { drawDesk(x, pics, placeRef.current.place, sheet, (now - t0) / 1000, { walk: true, treats: placeRef.current.treats }); raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [sheet]);
  return <canvas ref={ref} className="work-scene" width={W} height={H} />;
}

// ---------------- the player's own desk, seen from behind the chair ----------------
// mode 'gifts': first day, the starter things are still wrapped. 'desk': sat at the desk in free time.
// 'still': just the picture, behind another screen.
interface Held { id: string; from: string | null; px: number; py: number; ox: number; oy: number; sx: number; sy: number; dragging: boolean }
export default function DeskView({ s, sheet, up, mode, openPc, leave }: {
  s: Save; sheet: HTMLCanvasElement | null; up: (p: Partial<Save>) => void; mode: 'gifts' | 'desk' | 'still'; openPc?: () => void; leave?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const pics = usePics(s.pet);
  const [open, setOpen] = useState<string | null>(null);         // the gift being unwrapped
  const [held, setHeld] = useState<Held | null>(null);            // an item picked up (being dragged)
  const [placing, setPlacing] = useState<{ id: string; from: string | null } | null>(null);   // "Move": choose a spot by clicking
  const [menuFor, setMenuFor] = useState<string | null>(null);   // the little menu over a clicked item
  const [drawer, setDrawer] = useState(false);
  // first day, once every gift is open: a short hands-on tutorial. 0 click an item, 1 move it or bag it, 2 drag one,
  // 3 the backpack, 4 done
  const [tut, setTut] = useState(0);
  const step = (from: number) => setTut((t) => (t === from ? from + 1 : t));
  const place = s.place, live = mode !== 'still';
  const st = useRef({ place, held, sheet, treats: treatsToday(s.treats).have }); st.current = { place, held, sheet, treats: treatsToday(s.treats).have };
  useEffect(() => {
    const cv = ref.current!, x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; let raf = 0; const t0 = performance.now();
    const draw = (now: number) => { const { place, held, sheet, treats } = st.current; drawDesk(x, pics, place, sheet, (now - t0) / 1000, { lifted: held?.dragging ? held.id : null, treats }); raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, []);

  const toDesk = (cx: number, cy: number) => { const r = stage.current!.getBoundingClientRect(); return [((cx - r.left) / r.width) * W, ((cy - r.top) / r.height) * H] as const; };
  const used = new Set(Object.values(place).filter(Boolean) as string[]);
  const openSlots = (id: string, from: string | null) => SLOTS.filter((sl) => fits(id, sl.id) && (!used.has(sl.id) || sl.id === from));
  const putAt = (id: string, sl: string | null) => { up({ place: { ...place, [id]: sl } }); play(sl ? 'coin' : 'ui_tap', sl ? 0.25 : 0.4); };

  // pick up an item on the desk (or from the storage drawer) and drag it to an open spot
  const hitItem = (dx: number, dy: number) => {
    const on = Object.entries(place).filter(([, sl]) => sl).map(([id, sl]) => ({ id, at: slot(sl!).at })).sort((a, b) => b.at[1] - a.at[1]);
    return on.find(({ id, at }) => { const [, , bw, bh] = item(id).box; return dx > at[0] - bw / 2 - 6 && dx < at[0] + bw / 2 + 6 && dy > at[1] - bh - 6 && dy < at[1] + 4; });
  };
  const down = (e: React.PointerEvent) => {
    if (!live || open) return;
    const [dx, dy] = toDesk(e.clientX, e.clientY), hit = hitItem(dx, dy);
    if (!hit) { setMenuFor(null); setPlacing(null); return; }
    setMenuFor(null); setPlacing(null);
    setHeld({ id: hit.id, from: place[hit.id], px: dx, py: dy, ox: hit.at[0] - dx, oy: hit.at[1] - dy, sx: e.clientX, sy: e.clientY, dragging: false });
  };
  const fromDrawer = (id: string, e: React.PointerEvent) => {
    e.stopPropagation(); const [dx, dy] = toDesk(e.clientX, e.clientY), [, , , bh] = item(id).box;
    setMenuFor(null); setPlacing(null); setHeld({ id, from: null, px: dx, py: dy, ox: 0, oy: bh / 2, sx: e.clientX, sy: e.clientY, dragging: false });
  };
  useEffect(() => {
    if (!held) return;
    const move = (e: PointerEvent) => {
      const [dx, dy] = toDesk(e.clientX, e.clientY);
      setHeld((h) => h && { ...h, px: dx, py: dy, dragging: h.dragging || Math.hypot(e.clientX - h.sx, e.clientY - h.sy) > 6 });
    };
    const upH = (e: PointerEvent) => {
      const h = held; setHeld(null);
      if (!h.dragging) {                                   // a click, not a drag
        if (h.from) { setMenuFor(h.id); step(0); } else { setDrawer(false); setPlacing({ id: h.id, from: null }); }
        tap(); return;
      }
      if ((document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('.desk-storage')) { putAt(h.id, null); step(2); return; }   // dropped on the backpack
      const [dx, dy] = toDesk(e.clientX, e.clientY), ax = dx + h.ox, ay = dy + h.oy;
      let best: string | null = null, bd = 80;
      for (const sl of openSlots(h.id, h.from)) { const d = Math.hypot(sl.at[0] - ax, sl.at[1] - ay); if (d < bd) { bd = d; best = sl.id; } }
      if (best && best !== h.from) { putAt(h.id, best); if (!h.from) setDrawer(false); step(2); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH); };
  }, [held?.id, held?.dragging, place]);

  const showFor = held?.dragging ? held : placing;
  const marks = showFor ? openSlots(showFor.id, showFor.from) : [];
  const stored = s.desk.filter((d) => !place[d]);
  const left = STARTER.filter((g) => !s.desk.includes(g.id));
  const all = left.length === 0;
  const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });
  const line = all ? t("That's how your desk works. One more thing: there's a little surprise waiting for you somewhere in the office. Have a look around!", '工位就是这么用的。还有一件事：办公室某个地方有个小惊喜在等你，去找找看吧！')

    : s.desk.length === 0 ? (ZH ? `欢迎来到你的工位，${s.name || '小柏'}！我们给你准备了几样东西，点一个礼物拆开看看。` : `Welcome to your desk, ${s.name || 'Juniper'}! We left a few things to get you started. Click a gift to open it.`)
    : ZH ? `还有 ${left.length} 个没拆。` : `${left.length} more to open.`;

  return (
    <div className={`gift-room${live ? '' : ' still'}`}>
      <div className="gift-stage" ref={stage} onPointerDown={down}>
        <canvas ref={ref} width={W} height={H} />
        {/* your computer: click it to use it */}
        {mode === 'desk' && <button className="pc-hot" style={{ ...pct(585, 288), width: `${(110 / W) * 100}%`, height: `${(98 / H) * 100}%` }}
          onPointerDown={(e) => e.stopPropagation()} onClick={() => { tap(); openPc?.(); }} aria-label={t('Use the computer', '用电脑')}><span>{t('Tasklet', '任务夹')}</span>{s.notes.length > 0 && <i className="pc-mailflag"><b>✉</b>{s.notes.length}</i>}</button>}
        {/* spots an item can go: shown while one is picked up */}
        {marks.map((sl) => (
          <button key={sl.id} className={`slot-mark${sl.id === showFor!.from ? ' here' : ''}`} style={pct(sl.at[0], sl.at[1])} aria-label={t('Put it here', '放在这里')}
            onPointerDown={(e) => e.stopPropagation()} onClick={() => { if (placing) { putAt(placing.id, sl.id); setPlacing(null); step(1); } }} />))}
        {mode === 'gifts' && left.map((g) => { const at = slot(g.home).at; return (
          <button key={g.id} className="gift-mini" aria-label={t('Open the gift', '拆开礼物')} style={pct(at[0], at[1])}
            onPointerDown={(e) => e.stopPropagation()} onClick={() => { tap(); setOpen(g.id); }}><MiniBox /></button>); })}
        {menuFor && place[menuFor] && (() => { const at = slot(place[menuFor]!).at, [, , , bh] = item(menuFor).box; return (
          <div className="item-menu card" style={pct(at[0], at[1] - bh)} onPointerDown={(e) => e.stopPropagation()}>
            <b>{item(menuFor).name}</b>
            <button className="opt" onClick={() => { tap(); setPlacing({ id: menuFor, from: place[menuFor] }); setMenuFor(null); }}><b>{t('Move', '移动')}</b><span>{t('Pick a new spot (or just drag it)', '选一个新位置（或者直接拖）')}</span></button>
            <button className="opt" onClick={() => { putAt(menuFor, null); setMenuFor(null); step(1); }}><b>{t('Put in backpack', '放进背包')}</b><span>{t('Take it off the desk for now', '先从桌上拿下来')}</span></button>
          </div>); })()}
        {mode === 'gifts' && all && (tut === 0 || tut === 2) && !held && !menuFor && !placing && Object.entries(place).filter(([, sl]) => sl).map(([id, sl]) => {
          const at = slot(sl!).at, [, , bw, bh] = item(id).box; return <span key={id} className="tut-ring" style={{ ...pct(at[0], at[1] - bh / 2), width: `${((bw + 30) / W) * 100}%`, height: `${((bh + 30) / H) * 100}%` }} />; })}
        {held?.dragging && (() => { const [, , bw, bh] = item(held.id).box, k = 100 / W; return (
          <span className="item-ghost" style={{ ...pct(held.px + held.ox - bw / 2, held.py + held.oy - bh), width: `${bw * k}%`, height: `${(bh / H) * 100}%` }}>
            <ItemPicFill id={held.id} /></span>); })()}
      </div>

      {live && s.desk.length > 0 && (
        <div className={`desk-storage card${mode === 'gifts' && all && tut === 3 ? ' tut-glow' : ''}${drawer ? ' open' : ''}${held?.dragging && held.from ? ' drop' : ''}`} onPointerDown={(e) => e.stopPropagation()}>
          <button className="linkish" onClick={() => { tap(); setDrawer(!drawer); }}>🎒 {t('Backpack', '背包')} · {stored.length}</button>
          {(drawer || (held?.dragging && held.from)) && (
            <div className="drawer">
              {held?.dragging && held.from && <div className="sub">{t('Drop here to put it in your backpack', '放到这里就会收进背包')}</div>}
              {!held?.dragging && !stored.length && <div className="sub">{t('Your backpack is empty. Click a thing on your desk and choose Put in backpack.', '背包是空的。点一下桌上的东西，选“放进背包”。')}</div>}
              {!held?.dragging && stored.map((id) => (
                <button key={id} className="drawer-item" onPointerDown={(e) => fromDrawer(id, e)} title={ZH ? `${item(id).name}：拖到桌上，或者点一下再选位置` : `${item(id).name}: drag it onto your desk, or click it and pick a spot`}>
                  <ItemPic id={id} k={Math.min(52 / item(id).box[2], 52 / item(id).box[3])} /><span>{item(id).name}</span></button>))}
            </div>)}
        </div>)}

      {placing && <div className="card place-tip">{ZH ? `点一个发光的位置，把${item(placing.id).name}放过去。` : `Click a glowing spot to put the ${item(placing.id).name.toLowerCase()} there.`} <button className="linkish" onClick={() => setPlacing(null)}>{t('Cancel', '取消')}</button></div>}

      {mode === 'gifts' && (
        <div className="card gift-card">
          <div className="between"><span className="chip on small">{t('Your desk', '你的工位')}</span><span className="sub">{ZH ? `已拆 ${STARTER.length - left.length} / ${STARTER.length}` : `${STARTER.length - left.length} of ${STARTER.length} opened`}</span></div>
          {(!all || tut >= TUT.length) && <Host co={s.company} line={line} size={56} />}
          {all && tut < TUT.length && <>
            <Host co={s.company} line={TUT[tut]} size={56} />
            <div className="between foot"><div className="steps">{TUT.map((_, i) => <i key={i} className={i <= tut ? 'on' : ''} />)}</div>
              <div className="row"><button className="linkish" onClick={() => { tap(); setTut(TUT.length); }}>{t('Skip', '跳过')}</button>
                <button className="btn ghost" onClick={() => { tap(); setTut(tut + 1); }}>{tut === TUT.length - 1 ? t('Got it', '知道啦') : t('Next', '下一步')}</button></div></div>
          </>}
          {all && tut >= TUT.length && <div className="between foot"><span /><button className="btn primary" onClick={() => { tap(); up({ phase: 'free', surprise: s.surprise === 'opened' ? 'opened' : 'waiting', guide: 0 }); }}>{t('Head into the office →', '去办公室转转 →')}</button></div>}
        </div>)}
      {mode === 'desk' && !placing && (
        <div className="desk-bar">
          <button className="btn ghost" onClick={() => { tap(); leave?.(); }}>{t('← Back to the office', '← 回到办公室')}</button>
          <span className="card desk-hint">{t('Click the computer for your work orders. Drag things to rearrange your desk.', '点电脑看工作单。拖动东西来重新布置工位。')}</span>
        </div>)}

      {open && <Unwrap key={open} id={open} done={(toDesk) => { play('coin', 0.5); up({ desk: [...s.desk, open], place: { ...place, [open]: toDesk ? freeSlot(open, place) : null } }); setOpen(null); }} close={() => setOpen(null)} />}
    </div>
  );
}
// the dragged item fills its box
function ItemPicFill({ id }: { id: string }) {
  const [bx, by, bw, bh] = item(id).box;
  return <span className="item-pic fill" style={{ backgroundImage: `url(${A}ob/starter/${id}.png)`, backgroundSize: `${(W / bw) * 100}% ${(H / bh) * 100}%`, backgroundPosition: `${(bx / (W - bw)) * 100}% ${(by / (H - bh)) * 100}%` }} />;
}

// a small wrapped box sitting where the item will go
function MiniBox() {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%">
      <rect x="6" y="18" width="28" height="20" rx="1.5" fill="var(--gift)" stroke="#3a2a2a" strokeWidth="2" />
      <rect x="4" y="12" width="32" height="8" rx="1.5" fill="var(--gift-lid)" stroke="#3a2a2a" strokeWidth="2" />
      <rect x="18" y="12" width="4" height="26" fill={RIB} />
      <path d="M20 13 C16 5 8 6 10 11 C11 14 17 14 20 13 Z M20 13 C24 5 32 6 30 11 C29 14 23 14 20 13 Z" fill={RIB} stroke="#3a2a2a" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="20" cy="13" r="2.4" fill={RIB_D} stroke="#3a2a2a" strokeWidth="1.4" />
    </svg>
  );
}

// ---------------- the big gift: pull one tail of the bow, the knot slips, the lid lifts off by itself ----------------
const RIB = '#f5c94e', RIB_D = '#d9a62e', RIB_L = '#fff0b3', INK = '#3a2a2a';
type Pt = { x: number; y: number };
const K: Pt = { x: 150, y: 104 }, REST: Pt = { x: 184, y: 160 }, PULL = 90;
// a ribbon band along a gentle curve, with a V cut at its end
function band(p0: Pt, c: Pt, p1: Pt, w0: number, w1: number) {
  const L: Pt[] = [], R: Pt[] = [], N = 18;
  let tx = 0, ty = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y;
    tx = 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x); ty = 2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y);
    const l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = (w0 + (w1 - w0) * t) / 2;
    L.push({ x: x + nx * w, y: y + ny * w }); R.push({ x: x - nx * w, y: y - ny * w });
  }
  const l = Math.hypot(tx, ty) || 1, notch = { x: p1.x - (tx / l) * 7, y: p1.y - (ty / l) * 7 };
  const f = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  return `M${L.map(f).join(' L')} L${f(notch)} L${R.slice().reverse().map(f).join(' L')} Z`;
}
// one loop of the bow, on side s (-1 left, 1 right)
const loop = (s: number) => `M${K.x} ${K.y} C${K.x + s * 10} ${K.y - 34} ${K.x + s * 58} ${K.y - 44} ${K.x + s * 62} ${K.y - 16} C${K.x + s * 64} ${K.y + 6} ${K.x + s * 28} ${K.y + 12} ${K.x} ${K.y} Z`;
const fold = (s: number) => `M${K.x} ${K.y} C${K.x + s * 10} ${K.y - 14} ${K.x + s * 30} ${K.y - 18} ${K.x + s * 36} ${K.y - 6} C${K.x + s * 30} ${K.y + 3} ${K.x + s * 14} ${K.y + 4} ${K.x} ${K.y} Z`;
const shine = (s: number) => `M${K.x + s * 16} ${K.y - 24} Q${K.x + s * 38} ${K.y - 38} ${K.x + s * 54} ${K.y - 26}`;

type Stage = 'tied' | 'untie' | 'open' | 'reveal';
export function Unwrap({ id, done, close }: { id: string; done: (toDesk: boolean) => void; close: () => void }) {
  const it = item(id);
  const svg = useRef<SVGSVGElement>(null);
  const [end, setEnd] = useState<Pt>(REST);
  const [stage, setStage] = useState<Stage>('tied');
  const target = useRef<Pt | null>(null), endRef = useRef(REST), stageRef = useRef<Stage>('tied');
  stageRef.current = stage;
  // the tail end eases towards the pointer every frame (and springs home when let go), so it moves smoothly
  useEffect(() => {
    let raf = 0, vx = 0, vy = 0;
    const step = () => {
      const e = endRef.current;
      if (stageRef.current === 'tied') {
        if (target.current) { const t = target.current; vx = (t.x - e.x) * 0.4; vy = (t.y - e.y) * 0.4; }
        else { vx = vx * 0.72 + (REST.x - e.x) * 0.16; vy = vy * 0.72 + (REST.y - e.y) * 0.16; }   // a little springy wobble back home
        const n = { x: e.x + vx, y: e.y + vy }; endRef.current = n;
        if (Math.abs(n.x - e.x) > 0.05 || Math.abs(n.y - e.y) > 0.05) setEnd(n);
        if (Math.hypot(n.x - REST.x, n.y - REST.y) > PULL) { target.current = null; untie(); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, []);
  const toSvg = (cx: number, cy: number): Pt => { const p = svg.current!.createSVGPoint(); p.x = cx; p.y = cy; const q = p.matrixTransform(svg.current!.getScreenCTM()!.inverse()); return { x: q.x, y: q.y }; };
  const move = (e: React.PointerEvent) => {
    if (!target.current || stage !== 'tied') return;
    let p = toSvg(e.clientX, e.clientY); const dx = p.x - K.x, dy = p.y - K.y, d = Math.hypot(dx, dy), max = 170;
    if (d > max) p = { x: K.x + (dx / d) * max, y: K.y + (dy / d) * max };
    target.current = p;
  };
  const untie = () => {
    if (stageRef.current !== 'tied') return;
    setStage('untie'); stageRef.current = 'untie'; play('ui_tap', 0.6);
    setTimeout(() => { setStage('open'); play('heart_pop', 0.5); }, 520);
    setTimeout(() => { setStage('reveal'); play('heart_level', 0.45); }, 1000);
  };
  const k = Math.min(1, Math.hypot(end.x - REST.x, end.y - REST.y) / PULL);   // how close the knot is to slipping
  const loopS = 1 - k * 0.6;                                                  // the right loop is drawn through as its tail is pulled
  // the pulled tail: hangs with a soft sag that straightens as it's pulled tight
  const sag = 22 * (1 - k);
  const tailC = { x: (K.x + end.x) / 2 + 6, y: (K.y + end.y) / 2 + sag };
  const rightTail = band({ x: K.x + 4, y: K.y + 4 }, tailC, end, 15, 13);
  const leftTail = band({ x: K.x - 4, y: K.y + 4 }, { x: K.x - 18, y: K.y + 30 }, { x: K.x - 34, y: K.y + 58 }, 15, 13);
  const [, , bw, bh] = it.box, sc = Math.min(96 / bw, 110 / bh);
  return (
    <div className="gift-modal" onPointerMove={move} onPointerUp={() => { target.current = null; }} onPointerCancel={() => { target.current = null; }}>
      <div className={`gift-big ${stage}`}>
        <svg ref={svg} viewBox="0 0 300 300" className="gift-svg">
          <ellipse cx="150" cy="268" rx="96" ry="10" fill="rgba(0,0,0,.18)" />
          {/* a puff when the box vanishes */}
          <g className="gift-poof">{[[-60, -20], [55, -30], [-40, 40], [50, 35], [0, -55], [0, 55]].map(([dx, dy], k) => <circle key={k} cx={150 + dx * 0.4} cy={190 + dy * 0.4} r="20" fill="#fffaf0" stroke="rgba(120,90,70,.25)" strokeWidth="2" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px` }} />)}</g>
          <g className="gift-body">
            <rect x="70" y="140" width="160" height="122" rx="4" fill="var(--gift)" stroke={INK} strokeWidth="4" />
            <rect x="196" y="144" width="30" height="114" rx="2" fill="rgba(0,0,0,.08)" />
            <rect x="76" y="146" width="14" height="110" rx="3" fill="rgba(255,255,255,.28)" />
            <g className="gift-band"><rect x="139" y="140" width="22" height="122" fill={RIB} stroke={INK} strokeWidth="3" /><rect x="153" y="142" width="6" height="118" fill={RIB_D} /></g>
          </g>
          <g className="gift-lid">
            <rect x="60" y="112" width="180" height="32" rx="4" fill="var(--gift-lid)" stroke={INK} strokeWidth="4" />
            <rect x="66" y="117" width="168" height="6" rx="3" fill="rgba(255,255,255,.35)" />
            <g className="gift-band"><rect x="139" y="112" width="22" height="32" fill={RIB} stroke={INK} strokeWidth="3" /><rect x="153" y="114" width="6" height="28" fill={RIB_D} /></g>
          </g>
          <g className="gift-bow">
            <g className="bow-tails">
              <path d={leftTail} fill={RIB} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <path d={rightTail} fill={RIB} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            </g>
            <g className="bow-loops">
              <path d={loop(-1)} fill={RIB} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
              <path d={fold(-1)} fill={RIB_D} />
              <path d={shine(-1)} fill="none" stroke={RIB_L} strokeWidth="3" strokeLinecap="round" />
              <g transform={`translate(${K.x} ${K.y}) scale(${loopS} ${0.75 + loopS * 0.25}) translate(${-K.x} ${-K.y})`}>
                <path d={loop(1)} fill={RIB} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
                <path d={fold(1)} fill={RIB_D} />
                <path d={shine(1)} fill="none" stroke={RIB_L} strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
            <g className="bow-knot"><rect x={K.x - 12} y={K.y - 11} width="24" height="22" rx="8" fill={RIB} stroke={INK} strokeWidth="3.5" /><path d={`M${K.x - 5} ${K.y - 6} Q${K.x} ${K.y} ${K.x - 4} ${K.y + 6}`} fill="none" stroke={RIB_D} strokeWidth="3" strokeLinecap="round" /></g>
            {stage === 'tied' && <>
              <circle cx={end.x} cy={end.y} r="9" className="tail-hint" />
              <circle cx={end.x} cy={end.y} r="30" fill="transparent" style={{ cursor: target.current ? 'grabbing' : 'grab', touchAction: 'none' }}
                onPointerDown={(e) => { target.current = toSvg(e.clientX, e.clientY); (e.target as Element).setPointerCapture?.(e.pointerId); }}
                onPointerMove={move} onPointerUp={() => { target.current = null; }} />
            </>}
          </g>
          <g className="gift-item"><svg x={150 - (bw * sc) / 2} y={165 - (bh * sc) / 2} width={bw * sc} height={bh * sc} viewBox={it.box.join(' ')}><image href={`${A}ob/starter/${id}.png`} width={W} height={H} style={{ imageRendering: 'pixelated' }} /></svg></g>
          {/* sparkles circling round it */}
          {stage === 'reveal' && <g className="gift-orbit">{[0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = (k / 8) * Math.PI * 2, rx = 92, ry = 78; return (
            <path key={k} className="spark" d={`M${150 + Math.cos(a) * rx} ${165 + Math.sin(a) * ry - 8} l3.5 7 l7 3.5 l-7 3.5 l-3.5 7 l-3.5 -7 l-7 -3.5 l7 -3.5 Z`} fill={k % 2 ? '#fff3b0' : '#ffffff'} style={{ animationDelay: `${k * 0.15}s` }} />); })}</g>}
        </svg>
        {stage === 'tied' && <div className="gift-tip pix">{t('Pull the ribbon', '拉开丝带')} <span>↘</span></div>}
        {stage === 'reveal' && (
          <div className="card gift-reveal">
            <div className="pix h1">{it.name}</div>
            <div className="sub">{it.line}</div>
            <div className="row gift-choice">
              <button className="btn primary" onClick={() => { tap(); done(true); }}>{t('Put it on my desk', '放在我的桌上')}</button>
              <button className="btn ghost" onClick={() => { tap(); done(false); }}>🎒 {t('Put it in my backpack', '放进我的背包')}</button>
            </div>
          </div>)}
      </div>
      {stage === 'tied' && <button className="linkish gift-later" onClick={() => { tap(); close(); }}>{t('Not yet', '先不拆')}</button>}
    </div>
  );
}
