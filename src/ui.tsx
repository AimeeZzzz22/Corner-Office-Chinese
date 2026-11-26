import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COMPANIES, COWORKERS, CoworkerId, HEART_POINTS, TaskType, TYPE_LABEL } from './data';
import { ZH, t as tr } from './lang';
import { gEmit } from './Guide';
import { Note, Past, Save } from './state';
import { hhmm, officeClock, people, statusOf } from './clock';
import { play, preloadTear, tear } from './sfx';

// Small reusable pieces of "feels alive" UI used around the game (see the delightful-ui-motion skill).
const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
const stageK = (el: Element | null) => { const st = el?.closest('.stage') as HTMLElement | null; return st ? st.getBoundingClientRect().width / 1280 : 1; };
export const Head = ({ id, size = 40 }: { id: CoworkerId; size?: number }) => <span className="head" style={{ width: size, height: size }}><img src={`${A}heads/${id}.png`} alt="" /></span>;
const STATUS = { working: tr('Working', '工作中'), break: tr('On a break', '休息中'), lunch: tr('At lunch', '午饭中'), meeting: tr('In a meeting', '开会中') };
const useClock = (scale: number, every = 1000) => {
  const [c, setC] = useState(() => officeClock(scale));
  useEffect(() => { const id = setInterval(() => setC(officeClock(scale)), every); return () => clearInterval(id); }, [scale, every]);
  return c;
};

// ---------------- tearing a strip off (the blind pack and the mail envelope) ----------------
// Drag along the strip to tear it; let go before a third and it springs back; a plain click tears it in one pull.
export function useTear(width: number, onDone: () => void) {
  const [p, setP] = useState(0), [snap, setSnap] = useState(false);
  const drag = useRef<{ x: number; k: number; notch: number; moved: boolean } | null>(null), done = useRef(false), pRef = useRef(0);
  useEffect(() => { preloadTear(); }, []);
  const set = (v: number) => { pRef.current = v; setP(v); };
  const finish = () => { if (done.current) return; done.current = true; drag.current = null; onDone(); };
  const auto = () => { setSnap(true); set(1); [0, 90, 180, 270].forEach((ms) => setTimeout(() => tear(0.8), ms)); setTimeout(() => { setSnap(false); finish(); }, 380); };
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => { if (done.current) return; drag.current = { x: e.clientX, k: stageK(e.currentTarget), notch: 0, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setSnap(false); },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current; if (!d) return;
      const dx = (e.clientX - d.x) / d.k; if (Math.abs(dx) > 4) d.moved = true;
      const np = Math.max(0, Math.min(1, dx / width)); set(np);
      const n = Math.floor(np * 10); if (n > d.notch) { d.notch = n; tear(0.6 + np * 0.4); }
      if (np >= 1) finish();
    },
    onPointerUp: () => {
      const d = drag.current; drag.current = null; if (!d || done.current) return;
      if (!d.moved) { auto(); return; }
      if (pRef.current > 0.33) { setSnap(true); set(1); setTimeout(() => { setSnap(false); finish(); }, 220); } else { setSnap(true); set(0); }
    },
  };
  return { p, snap, handlers: { ...handlers, onPointerCancel: handlers.onPointerUp } };
}

// ---------------- avatar stack: who's in the office, folded into a few overlapping heads ----------------
// At most 4 circles; the last one shows "+n". Click to fan them out (40 ms apart) with names and status; click to fold back.
export function AvatarStack({ s }: { s: Save }) {
  const [open, setOpen] = useState(false);
  // it folds back by itself when the player moves on: clicks anywhere else, or goes somewhere (desk, an order...)
  const me = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [s.phase]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!me.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('pointerdown', away, true); return () => window.removeEventListener('pointerdown', away, true);
  }, [open]);
  const clock = useClock(s.fast ? 60 : 1, 5000);
  const ids = people(s.company), n = ids.length, few = n > 4 ? 3 : n;
  const S = 40, closedStep = 27, openStep = 74;
  const PAD = 16;  // names are wider than the heads: leave room for them on both sides when open
  const w = open ? n * openStep - (openStep - S) + PAD * 2 : (few - 1) * closedStep + S + (n > 4 ? closedStep : 0);
  return (
    <button ref={me} className={`card avatar-stack${open ? ' open' : ''}`} onClick={() => { tap(); if (!open) gEmit('stack-open'); setOpen(!open); }} aria-label={tr("Who's in the office", '谁在办公室')}>
      <span className="as-label">{open ? tr('Your team', '你的团队') : tr('In the office', '在办公室')}</span>
      <span className="as-row" style={{ width: w, height: open ? S + 34 : S }}>
        {ids.map((id, i) => {
          const st = statusOf(id, clock), shown = open || i < few;
          const delay = open ? i * 40 : (n - 1 - i) * 40;
          return (
            <span key={id} className={`as-item${shown ? '' : ' gone'}`} style={{ left: open ? PAD + i * openStep : Math.min(i, few) * closedStep, zIndex: n - i, transitionDelay: `${delay}ms` }}>
              <span className={`as-ring ${st.kind}`}><Head id={id} size={S - 6} /></span>
              <span className="as-name" style={{ transitionDelay: open ? `${delay + 160}ms` : '0ms' }}><b>{COWORKERS[id].name}</b><small><i className={st.kind} />{STATUS[st.kind]}</small></span>
            </span>);
        })}
        {n > 4 && <span className="as-more" style={{ left: few * closedStep, opacity: open ? 0 : 1 }}>+{n - few}</span>}
      </span>
    </button>
  );
}

// ---------------- horizontal accordion: the coworker directory ----------------
// Narrow strips with a head and a sideways name. Click one: it widens while the others shrink, and its details
// fade in only after the width has settled.
export function TeamAccordion({ s }: { s: Save }) {
  const ids = people(s.company);
  const [open, setOpen] = useState<CoworkerId>(ids[0]);
  const [ready, setReady] = useState(true);
  const clock = useClock(s.fast ? 60 : 1);
  const pick = (id: CoworkerId) => { if (id === open) return; tap(); setReady(false); setOpen(id); };
  return (
    <div className="acc">
      {ids.map((id) => {
        const c = COWORKERS[id], st = statusOf(id, clock), on = id === open, hearts = Math.floor(s.hearts[id] / HEART_POINTS);
        return (
          <div key={id} className={`acc-strip${on ? ' on' : ''}${on && ready ? ' ready' : ''}`} onClick={() => pick(id)} onTransitionEnd={(e) => { if (on && e.propertyName === 'flex-grow') setReady(true); }}>
            <div className="acc-closed"><Head id={id} size={36} /><i className={`acc-dot ${st.kind}`} /><span className="acc-vname">{c.name}</span></div>
            <div className="acc-open">
              <div className="row"><Head id={id} size={64} /><div><div className="pc-h">{c.name}</div><div className="sub">{c.role}</div></div></div>
              <span className={`pc-status ${st.kind}`}><i />{STATUS[st.kind]}</span>
              <div className="acc-where">{st.kind === 'working' ? <>{tr('At their desk. ', '在工位上。')}{st.free !== null ? (ZH ? `大约 ${hhmm(st.free)} 休息。` : `Next break around ${hhmm(st.free)}.`) : tr('Working all day.', '今天一直在工作。')}</>
                : st.kind === 'meeting' ? <>{ZH ? `在${st.where}。大约 ${hhmm(st.free!)} 有空。` : `At ${st.where}. Free around ${hhmm(st.free!)}.`}</> : <>{ZH ? `在${st.where}。大约 ${hhmm(st.free!)} 回来。` : `At ${st.where}. Back around ${hhmm(st.free!)}.`}</>}</div>
              <div className="acc-hearts">{Array.from({ length: 10 }, (_, i) => <img key={i} src={`${A}${i < hearts ? 'heart' : 'heart_empty'}.png`} alt="" />)}</div>
              <div className="sub">{ZH ? `离下一颗心 ${s.hearts[id] % HEART_POINTS} / ${HEART_POINTS} · 为TA完成了 ${s.ordersDone[id]} 张工作单` : `${s.hearts[id] % HEART_POINTS} / ${HEART_POINTS} to the next heart · ${s.ordersDone[id]} orders done for them`}</div>
              <div className="acc-quote">“{c.chat}”</div>
            </div>
          </div>);
      })}
    </div>
  );
}

// ---------------- magnify dock: the desk computer's app bar ----------------
// The icon nearest the mouse grows and lifts; its neighbours grow a little; sizes follow the mouse smoothly.
export interface DockApp { key: string; label: string; icon: string; bg: string; badge?: number }
export function MagnifyDock({ apps, open }: { apps: DockApp[]; open: (key: string) => void }) {
  const [mx, setMx] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [centers, setCenters] = useState<number[]>([]);
  const measure = (e: React.PointerEvent) => {
    const k = stageK(e.currentTarget);
    if (!centers.length) setCenters(refs.current.map((el) => { const r = el!.getBoundingClientRect(); return (r.left + r.width / 2) / k; }));
    setMx(e.clientX / k);
  };
  const scale = (i: number) => { if (mx === null || !centers.length) return 1; const d = Math.abs(mx - centers[i]); return 1 + 0.75 * Math.max(0, 1 - d / 110) ** 1.6; };
  const big = mx === null ? -1 : apps.reduce((b, _, i) => (scale(i) > scale(b) ? i : b), 0);
  return (
    <div className="dock" onPointerMove={measure} onPointerLeave={() => { setMx(null); setCenters([]); }}>
      {apps.map((a, i) => { const k = scale(i); return (
        <button key={a.key} ref={(el) => { refs.current[i] = el; }} data-key={a.key} className="dock-app" style={{ transform: `translateY(${-(k - 1) * 26}px) scale(${k})` }} onClick={() => { tap(); open(a.key); }} aria-label={a.label}>
          <span className="dock-tile" style={{ background: a.bg }}>{a.icon}</span>
          {!!a.badge && <em>{a.badge}</em>}
          {i === big && k > 1.3 && <span className="dock-tip">{a.label}</span>}
        </button>); })}
    </div>
  );
}

// ---------------- liquid tabs ----------------
// The highlight is a soft pill whose two ends follow the chosen tab on two different springs: the leading end
// gets there first, so the pill stretches like a drop of liquid and then pulls itself together.
export function LiquidTabs<T extends string>({ tabs, value, onChange, className = '' }: { tabs: { key: T; label: React.ReactNode }[]; value: T; onChange: (t: T) => void; className?: string }) {
  const box = useRef<HTMLDivElement>(null), blob = useRef<HTMLSpanElement>(null);
  const st = useRef({ l: 0, r: 0, vl: 0, vr: 0, tl: 0, tr: 0, init: false }), raf = useRef(0);
  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(`[data-k="${value}"]`); if (!el) return;
    const s = st.current; s.tl = el.offsetLeft; s.tr = el.offsetLeft + el.offsetWidth;
    if (!s.init) { s.l = s.tl; s.r = s.tr; s.init = true; }
    const right = s.tr > s.r, kLead = 520, kTrail = 170, c = 26;
    cancelAnimationFrame(raf.current); let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      const kl = right ? kTrail : kLead, kr = right ? kLead : kTrail;
      s.vl += (-kl * (s.l - s.tl) - c * s.vl) * dt; s.l += s.vl * dt;
      s.vr += (-kr * (s.r - s.tr) - c * s.vr) * dt; s.r += s.vr * dt;
      if (blob.current) { blob.current.style.left = `${s.l}px`; blob.current.style.width = `${Math.max(20, s.r - s.l)}px`;
        const stretch = Math.min(0.2, Math.abs(s.vl - s.vr) / 4000); blob.current.style.transform = `scaleY(${1 - stretch})`; }
      if (Math.abs(s.l - s.tl) + Math.abs(s.r - s.tr) + Math.abs(s.vl) + Math.abs(s.vr) > 0.5) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, tabs.length]);
  return (
    <div className={`liquid ${className}`} ref={box}>
      <span className="liquid-blob" ref={blob} />
      {tabs.map((t) => <button key={t.key} data-k={t.key} className={t.key === value ? 'on' : ''} onClick={() => { if (t.key !== value) { tap(); onChange(t.key); } }}>{t.label}</button>)}
    </div>
  );
}

// ---------------- the pull-down summary: a small pill at the top that pulls down into today's stats ----------------
const sameDay = (t: number) => new Date(t).toDateString() === new Date().toDateString();
export function weekStart(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
export const weekKey = (d = new Date()) => weekStart(d).toDateString();
export const thisWeek = (h: Past[]) => { const w0 = weekStart().getTime(); return h.filter((p) => p.at >= w0); };
export const fmtMins = (m: number) => (ZH ? (m >= 60 ? `${Math.floor(m / 60)} 小时${m % 60 ? ` ${m % 60} 分钟` : ''}` : `${m} 分钟`) : m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);
export function PullSummary({ s, ready, earned, dayMax, treats, onWeek }: { s: Save; ready: number; earned: number; dayMax: number; treats: string[]; onWeek: () => void }) {
  const today = s.history.filter((h) => sameDay(h.at));
  const done = today.filter((h) => h.finished).length, mins = today.reduce((a, h) => a + h.worked, 0), coins = today.reduce((a, h) => a + h.coins, 0);
  const clock = useClock(s.fast ? 60 : 1, 5000);
  const CAP = 44, FULL = 286;
  const [h, setH] = useState(CAP), [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; k: number; h0: number; moved: boolean } | null>(null);
  const open = h > CAP + 20;
  const down = (e: React.PointerEvent) => { drag.current = { y: e.clientY, k: stageK(e.currentTarget), h0: h, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDragging(true); };
  const move = (e: React.PointerEvent) => { const d = drag.current; if (!d) return; const dy = (e.clientY - d.y) / d.k; if (Math.abs(dy) > 4) d.moved = true; setH(Math.max(CAP, Math.min(FULL, d.h0 + dy * 0.9))); };
  const up = () => {
    const d = drag.current; drag.current = null; setDragging(false); if (!d) return;
    if (!d.moved) { tap(); if (d.h0 <= CAP + 20) gEmit('pull-open'); setH(d.h0 > CAP + 20 ? CAP : FULL); return; }
    const opened = h > (d.h0 > CAP + 20 ? FULL - 60 : CAP + 60); if (opened && d.h0 <= CAP + 20) gEmit('pull-open'); setH(opened ? FULL : CAP);
  };
  const t = Math.max(0, Math.min(1, (h - CAP) / (FULL - CAP)));
  return <>
    <div className="pull-dim" style={{ opacity: t * 0.9, pointerEvents: open ? 'auto' : 'none' }} onClick={() => setH(CAP)} />
    <div className={`card pull${dragging ? ' drag' : ''}`} style={{ height: h, width: 300 + t * 120 }}>
      <div className="pull-cap" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <b>{tr('Today', '今天')}</b><span><span className="pix">{done}</span>{ZH ? ' 张工作单' : ` order${done === 1 ? '' : 's'}`}</span><span><span className="pix">{mins}</span>{tr(' min', ' 分钟')}</span><span>{ready ? (ZH ? `${ready} 个卡包可开` : `${ready} pack${ready > 1 ? 's' : ''} ready`) : `${hhmm(clock)}`}</span>
      </div>
      <div className="pull-body" style={{ opacity: Math.max(0, t * 1.4 - 0.4) }}>
        <div className="pull-grid">
          <div><span className="pix">{done}</span><small>{ZH ? '张工作单完成' : `${done === 1 ? 'order' : 'orders'} finished`}</small></div>
          <div><span className="pix">{fmtMins(mins)}</span><small>{tr('focused', '专注时长')}</small></div>
          <div><span className="pix">{coins}</span><small>{tr('coins earned', '获得金币')}</small></div>
        </div>
        <div className="pull-line"><b>{tr('Packs today', '今日卡包')}</b><span className="pull-dots">{Array.from({ length: dayMax }, (_, i) => <i key={i} className={i < earned ? 'on' : ''} />)}</span><span className="sub">{earned} / {dayMax}</span></div>
        <div className="pull-line"><b>{tr('Treats', '甜点')}</b><span className="sub">{treats.length ? treats.join(tr(', ', '、')) : tr('None today. The bakery is open.', '今天还没有。面包房开着呢。')}</span></div>
        <div className="pull-line"><b>{tr('Office time', '办公室时间')}</b><span className="sub">{hhmm(clock)}</span></div>
        <div className="row pull-foot"><button className="btn ghost" onClick={() => { tap(); setH(CAP); onWeek(); }}>{tr('See my week', '看看我这周')}</button><span className="sub">{tr('Push up to close', '向上推关闭')}</span></div>
      </div>
      <span className="pull-handle" />
    </div>
  </>;
}

// ---------------- a letter in the mail: tear the envelope open, the letter slides out and unfolds ----------------
const THANKS: Partial<Record<CoworkerId, string>> = {
  margaux: tr('You make my lists shorter and my mornings calmer. That is rare. Keep it up.', '有你在，我的清单变短了，早上也平静多了。这很难得，继续保持。'),
  priya: tr('Every order you finish is one less thing on my calendar. I noticed. Thank you.', '你每完成一张工作单，我的日程上就少一件事。我都看在眼里，谢谢你。'),
  theo: tr('I lost the tab again, but you never lose the thread. Thanks for keeping me on track.', '我又把标签页弄丢了，可你从来不会断了思路。谢谢你帮我跟上节奏。'),
  camille: tr('I read your work out loud and heard no typos. That has never happened before.', '我把你的稿子大声读了一遍，一个错字都没有。这可是头一回。'),
  jonah: tr('You got me unstuck more than once this week. Lunch is on me sometime.', '这周你不止一次帮我解了围。改天请你吃午饭。'),
  odette: tr('I am so glad you said yes to the offer. The office is warmer with you in it.', '真高兴你接受了录用。有你在，办公室都温暖了。'),
  rio: tr('You keep the studio moving. I saved you the good chair by the window.', '是你让工作室转起来的。窗边那把好椅子我给你留着。'),
  sam: tr('Tiny wins add up. Yours add up fast. Thank you for all of them.', '小小的进步会积少成多，你的积累得特别快。谢谢你做的每一件事。'),
  ada: tr('Clean, careful, on time. You make my job look easy.', '干净、细心、准时。有你在，我的工作都变轻松了。'),
  kofi: tr('You showed up, you finished, you made it look calm. Teach me your ways.', '你来了，你做完了，还做得那么从容。教教我吧。'),
  mei: tr('Welcome to the team, properly this time. We are lucky to have you.', '这次正式地说一声：欢迎加入团队。有你是我们的幸运。'),
};
type MailStage = 'in' | 'out' | 'read';
// each coworker's stationery: paper tint, ink accent
const NOTE_TINT: [string, string][] = [['#fff1f4', '#e8708a'], ['#eefaf3', '#4fa77d'], ['#f3efff', '#8a70d6'], ['#fff8e2', '#d09a2c'], ['#eef6ff', '#4f8fd6'], ['#fff2ea', '#e0805a']];
const letterDate = (t: number) => { const d = new Date(t); return ZH ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
export function MailLetter({ note, name, s, keep, opened }: { note: Note; name: string; s: Save; keep: (n: Note, week?: boolean) => void; opened?: boolean }) {
  const [stage, setStage] = useState<MailStage>(opened ? 'read' : 'in');
  const W = 360;
  const { p, snap, handlers } = useTear(W, () => { play('blindbox_open', 0.4); setStage('out'); setTimeout(() => setStage('read'), 1100); });
  const from = note.from ? COWORKERS[note.from] : null, co = COMPANIES[s.company];
  const week = thisWeek(s.history);
  return (
    <div className={`mail-dim m-${stage}`}>
      <div className="mail-scene">
        <div className="mail-letter">
          {note.kind === 'payday' ? (() => {
            // payday: the company's letterhead, a short typed letter, the week in numbers, and a cheque to tear off
            const w0 = new Date(note.week).getTime(), wk = isNaN(w0) ? week : s.history.filter((h) => h.at >= w0 && h.at < w0 + 7 * 864e5);
            const orders = wk.filter((h) => h.finished).length, mins = wk.reduce((a, h) => a + h.worked, 0), earned = wk.reduce((a, h) => a + h.coins, 0);
            const host = COWORKERS[co.host];
            return (
            <div className="mail-paper payslip">
              <img className="slip-mark" src={`${A}ob/logo_${s.company}.png`} alt="" />
              <div className="slip-head"><img src={`${A}ob/logo_${s.company}.png`} alt="" /><div><b className="pix">{co.name}</b><small>{tr('People & Payroll', '人事与薪资')}</small></div><span className="slip-date">{letterDate(note.id)}</span></div>
              <div className="slip-title">{tr('Weekly bonus', '本周奖金单')}</div>
              <p className="slip-p">{ZH ? `${name}，你好：这周辛苦了！按惯例，我们把你本周所得的 10% 作为额外奖励发给你。周末愉快。` : `Dear ${name}, thank you for a good week. As always, here is a little extra: 10% of what you earned. Have a lovely weekend.`}</p>
              <div className="slip-rows">
                <div><span>{tr('Orders finished', '完成的工作单')}</span><i /><b>{orders}</b></div>
                <div><span>{tr('Time in focus', '专注时长')}</span><i /><b>{fmtMins(mins)}</b></div>
                <div><span>{tr('Coins earned this week', '本周赚到的金币')}</span><i /><b>{earned}</b></div>
              </div>
              <div className="slip-cheque">
                <span className="slip-cut">✂</span>
                <div className="cq-to"><small>{tr('PAY TO', '收款人')}</small><b className="mail-hand">{name}</b></div>
                <div className="cq-amt"><img src={`${A}coin.png`} alt="" /><span className="pix">+{note.coins}</span></div>
                <div className="cq-sign"><span className="mail-hand">{host.name}</span><small>{ZH ? `代表${co.name}` : `for ${co.name}`}</small></div>
                <span className="slip-stamp">{tr('PAID', '已发放')}</span>
              </div>
            </div>); })() : (() => {
            // a thank-you (or the welcome) note: the sender's own stationery, taped at the top, written by hand
            const tint = NOTE_TINT[Math.max(0, Object.keys(COWORKERS).indexOf(note.from ?? '')) % NOTE_TINT.length];
            return (
            <div className="mail-paper note" style={{ ['--tint' as string]: tint[0], ['--ink2' as string]: tint[1] }}>
              <i className="tape l" /><i className="tape r" />
              <div className="note-top">
                {from && <span className="note-photo"><img src={`${A}heads/${from.id}.png`} alt="" /></span>}
                <span className="mail-hand note-date">{letterDate(note.id)}</span>
              </div>
              {note.kind === 'welcome' && <div className="note-title mail-hand">{tr('Welcome aboard!', '欢迎加入！')}</div>}
              <div className="mail-hand">{ZH ? `亲爱的${name}：` : `Dear ${name},`}</div>
              <p className="mail-hand body">{note.kind === 'welcome' ? tr('Your first order, done! That is all there is to it. Welcome to the team, properly this time.', '第一张工作单完成啦！就是这么简单。这次正式说一声：欢迎加入！') : THANKS[note.from!] ?? tr('Thank you for all your help. It means a lot.', '谢谢你的帮助，这对我意义重大。')}</p>
              {note.kind === 'thanks' && from && <div className="note-hearts">{Array.from({ length: note.level }, (_, i) => <img key={i} src={`${A}heart.png`} alt="" style={{ rotate: `${(i % 3 - 1) * 8}deg` }} />)}<span className="mail-hand">{ZH ? `我们之间的 ${note.level} 颗心` : `${note.level} heart${note.level > 1 ? 's' : ''} between us`}</span></div>}
              <div className="mail-hand mail-sign">— {from?.name}<svg className="note-doodle" viewBox="0 0 24 22" width="22" height="20"><path d="M12 20 C4 14 1 10 3 6 C5 2 10 3 12 7 C14 3 19 2 21 6 C23 10 20 14 12 20Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg></div>
              {note.kind === 'welcome' && <span className="note-confetti" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>}
            </div>); })()}
        </div>
        <div className={`mail-env ${note.kind}`} {...handlers}>
          <div className="mail-front"><span className="mail-to">{tr('To: ', '收件人：')}{name}</span><span className="mail-from">{tr('From ', '寄件人：')}{from ? from.name : co.name}</span><span className="mail-stamp">{note.kind === 'payday' ? '¢' : '♥'}</span></div>
          <div className={`mail-strip${snap ? ' snap' : ''}`} style={{ ['--p' as string]: p }}><span className="mail-attached" /><span className="mail-torn" /></div>
          {stage === 'in' && <span className="mail-grab" style={{ opacity: p > 0.05 ? 0 : 1 }}>{tr('pull ➜', '拉 ➜')}</span>}
        </div>
      </div>
      <div className="mail-hint">{stage === 'in' ? tr('Drag the strip to open it, or just click the envelope.', '拖动封条打开，或者直接点信封。') : ' '}</div>
      {stage === 'read' && <div className="row mail-btns">
        <button className="btn primary" onClick={() => { tap(); keep(note); }}>{opened ? tr('Put it back', '放回信箱') : note.kind === 'payday' ? (ZH ? `收下 ${note.coins} 金币` : `Add ${note.coins} coins`) : tr('Keep the note', '收好这封信')}</button>
        {note.kind === 'payday' && !opened && <button className="btn ghost" onClick={() => { tap(); keep(note, true); }}>{tr('Add and see my week', '收下并看看我这周')}</button>}
      </div>}
    </div>
  );
}

// ---------------- the weekly recap: a 3D runway you scroll down ----------------
const DAYS = ZH ? ['一', '二', '三', '四', '五', '六', '日'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function WeekRecap({ s, name, close }: { s: Save; name: string; close: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);
  const week = thisWeek(s.history), co = COMPANIES[s.company];
  const mins = week.reduce((a, h) => a + h.worked, 0), done = week.filter((h) => h.finished), coins = week.reduce((a, h) => a + h.coins, 0);
  const byDay = DAYS.map((_, i) => week.filter((h) => (new Date(h.at).getDay() + 6) % 7 === i).reduce((a, h) => a + h.worked, 0)), top = Math.max(30, ...byDay);
  const who: Record<string, number> = {}; done.forEach((h) => { if (h.who) who[h.who] = (who[h.who] ?? 0) + 1; });
  const friends = Object.entries(who).sort((a, b) => b[1] - a[1]) as [CoworkerId, number][];
  const types: Record<string, number> = {}; week.forEach((h) => { types[h.type] = (types[h.type] ?? 0) + h.worked; });
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
  const SLABS = [
    { col: '#5b6cff', title: tr('Focus', '专注'), body: <><div className="wr-big pix">{fmtMins(mins)}</div><div className="wr-bars">{byDay.map((m, i) => <span key={i}><i style={{ height: `${(m / top) * 100}%` }} /><small>{DAYS[i]}</small></span>)}</div></> },
    { col: '#9b5cf0', title: tr('Orders', '工作单'), body: <><div className="wr-big pix">{done.length}</div><div className="wr-sub">{ZH ? `张完成${week.length - done.length ? `，还有 ${week.length - done.length} 次恰好的暂停` : ''}` : `finished${week.length - done.length ? `, and ${week.length - done.length} good stopping points` : ''}`}</div>{topType && <div className="wr-sub">{ZH ? `主要是${TYPE_LABEL[topType[0] as TaskType]}` : `Mostly ${topType[0].toLowerCase()}`}</div>}</> },
    { col: '#f07a3c', title: tr('Friends', '朋友'), body: friends.length ? <div className="wr-friends">{friends.slice(0, 3).map(([id, n]) => <span key={id}><Head id={id} size={54} /><b>{COWORKERS[id].name}</b><small>{ZH ? `${n} 张工作单` : `${n} order${n > 1 ? 's' : ''}`}</small></span>)}</div> : <div className="wr-sub">{tr('Take an order for a coworker to start a friendship.', '帮同事接一张工作单，开始一段友谊吧。')}</div> },
    { col: '#e94b8a', title: tr('Coins', '金币'), body: <><div className="wr-big pix">+{coins}</div><div className="wr-sub">{ZH ? `现在共有 ${s.coins.toLocaleString()} 金币` : `You have ${s.coins.toLocaleString()} now`}</div></> },
  ];
  const STEP = 520, total = (SLABS.length - 1) * STEP;
  return (
    <div className="wr" ref={box} onScroll={(e) => setY((e.currentTarget as HTMLDivElement).scrollTop)}>
      <div className="wr-sticky">
        <div className="wr-head"><div className="pix">{ZH ? `${name}在${co.name}的一周` : `${name}'s week at ${co.name}`}</div><button className="bb-x" onClick={() => { tap(); close(); }} aria-label={tr("Close", "关闭")}>✕</button></div>
        <div className="wr-view">
          <div className="wr-track" style={{ transform: `rotateX(58deg) translateY(${-Math.min(y, total)}px)` }}>
            {SLABS.map((sl, i) => { const d = Math.abs(y - i * STEP) / STEP; return (
              <div key={sl.title} className="wr-slab" style={{ top: i * STEP, background: sl.col, opacity: Math.max(0.3, 1 - d * 0.5) }}>
                <svg className="wr-lines" viewBox="0 0 600 420" preserveAspectRatio="none">{Array.from({ length: 9 }, (_, k) => <line key={k} x1={k * 75} y1="0" x2={k * 75} y2="420" />)}{Array.from({ length: 6 }, (_, k) => <line key={k} x1="0" y1={k * 84} x2="600" y2={k * 84} />)}</svg>
                <div className="wr-paint pix">{sl.title}</div>
              </div>); })}
          </div>
        </div>
        {/* the section you're on, as a card floating above the runway */}
        {(() => { const i = Math.max(0, Math.min(SLABS.length - 1, Math.round(y / STEP))); const sl = SLABS[i]; return (
          <div key={i} className="wr-board" style={{ ['--c' as string]: sl.col }}>
            <div className="wr-title"><i />{sl.title}<span>{i + 1} / {SLABS.length}</span></div>{sl.body}
          </div>); })()}
        <div className="wr-foot">{y < total - 10 ? tr('Scroll to walk down your week ↓', '向下滚动，回顾你的一周 ↓') : tr('That was your week. See you Monday.', '这就是你的一周。周一见！')}</div>
      </div>
      <div style={{ height: total }} />
    </div>
  );
}
