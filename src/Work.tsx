import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANIES, COWORKERS, CoworkerId } from './data';
import { Save } from './state';
import { play } from './sfx';
import { ZH, t } from './lang';
import { DIR_COL, Look, Parts, compose, loadParts, randomLook } from './look';
import { ChatMsg, MEET_CHOICES, meetIntro, rulesOf } from './work';

const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
type Sheet = HTMLCanvasElement | HTMLImageElement;
const K = 6, B = 4;   // characters are drawn at 6x, the scene pictures at 4x (same as the desk view)

function useImages(paths: string[]) {
  const [, setN] = useState(0);
  const imgs = useMemo(() => paths.map((p) => { const i = new Image(); i.onload = () => setN((n) => n + 1); i.src = A + p; return i; }), [paths.join()]);
  return imgs;
}
const ok = (i?: HTMLImageElement | HTMLCanvasElement | null): i is HTMLImageElement | HTMLCanvasElement => !!i && (!(i instanceof HTMLImageElement) || (i.complete && i.naturalWidth > 0));
// one 16x32 frame, centred on x (scene pixels), feet on y (scene pixels); rows [r0, r1) only
function char(x: CanvasRenderingContext2D, sh: Sheet | null | undefined, col: number, row: number, cx: number, feet: number, r0 = 0, r1 = 32) {
  if (!ok(sh as HTMLImageElement)) return;
  x.drawImage(sh!, col * 16, row * 32 + r0, 16, r1 - r0, Math.round(cx * B - 8 * K), Math.round(feet * B - (32 - r0) * K), 16 * K, (r1 - r0) * K);
}
const fr = (t: number, fps = 4.5) => Math.floor(t * fps) % 6;
// lying in bed on the left-hand pillow: the whole front-facing figure turned on its side, head to the headboard
function lie(x: CanvasRenderingContext2D, sh: Sheet | null | undefined, wobble: number) {
  if (!ok(sh as HTMLImageElement)) return;
  x.save(); x.translate(231 * B, 88 * B); x.rotate(-Math.PI / 2 + wobble);
  x.drawImage(sh!, DIR_COL.front * 16, 8, 16, 24, -8 * K, -12 * K, 16 * K, 24 * K); x.restore();
}
function zzz(x: CanvasRenderingContext2D, cx: number, cy: number, t: number, col = '#ffffff') {
  x.fillStyle = col; x.font = '700 22px "Pixelify Sans", monospace';
  for (let i = 0; i < 3; i++) { const k = ((t * 0.6 + i / 3) % 1); x.globalAlpha = Math.sin(k * Math.PI); x.fillText('z', cx + k * 40 + i * 4, cy - k * 70); }
  x.globalAlpha = 1;
}
// a speech bubble that types its words out
function Bubble({ text, who, at, side = 'up', w = 420, done }: { text: string; who?: string; at: [number, number]; side?: 'up' | 'left'; w?: number; done?: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); let i = 0; const id = setInterval(() => { i += ZH ? 1 : 2; setN(i); if (i >= text.length) { clearInterval(id); done?.(); } }, 30); return () => clearInterval(id); }, [text]);
  return <div className={`sb sb-${side}`} style={{ left: at[0], top: at[1], width: w }}>{who && <b>{who}</b>}<p>{text.slice(0, n)}<span className="sb-ghost">{text.slice(n)}</span></p></div>;
}

// ================================================= the one-to-one, in the boss's office =================================================
// You walk in, sit down across the desk, and the boss asks how you are. Three honest answers, each met kindly. Never a penalty.
type MStep = 'walk' | 'hello' | 'ask' | 'answer' | 'reply';
export function Meeting({ s, msg, sheet, close }: { s: Save; msg: ChatMsg; sheet: Sheet | null; close: (choice: string | null) => void }) {
  const r = rulesOf(s), boss = COWORKERS[r.boss], rio = r.boss === 'rio', co = s.company;
  const [bg, desk, chairs, bossSheet] = useImages([`scene/meet_${co}_back.png`, `scene/meet_${co}_desk.png`, `scene/meet_${co}_chairs.png`, `npc/${r.boss}.png`]);
  const [step, setStep] = useState<MStep>('walk'), [typed, setTyped] = useState(false);
  const [pick, setPick] = useState<ReturnType<typeof MEET_CHOICES>[number] | null>(null);
  const cv = useRef<HTMLCanvasElement>(null), stepRef = useRef(step); stepRef.current = step;
  const t0 = useRef(performance.now()), sat = useRef(0);
  useEffect(() => {
    const x = cv.current!.getContext('2d')!; x.imageSmoothingEnabled = false; let raf = 0;
    const draw = (now: number) => {
      const t = (now - t0.current) / 1000; x.clearRect(0, 0, 1280, 720);
      if (ok(bg)) x.drawImage(bg, 0, 0);
      // the boss in their chair: looks up and talks (a small nod while speaking)
      const talking = stepRef.current === 'hello' || stepRef.current === 'ask' || stepRef.current === 'reply';
      const nod = talking && Math.floor(t * 5) % 4 === 0 ? 1 : 0;
      char(x, bossSheet, fr(t), 2, 160, 79 + nod * 0.25);
      if (ok(desk)) x.drawImage(desk, 0, 0);
      // steam from the mugs
      if (rio) for (const [mx, my] of [[185, 82], [125, 81]]) for (let i = 0; i < 3; i++) {
        const k = (t * 0.7 + i / 3) % 1; x.fillStyle = `rgba(255,255,255,${0.7 * Math.sin(k * Math.PI)})`;
        x.fillRect((mx + Math.round(Math.sin(k * 6 + i) * 1.5)) * B, (my - k * 12) * B, B, B);
      }
      // you: walk in from the left, then sit down across the desk (seen from behind)
      const walkT = 2.1, wt = Math.min(1, t / walkT);
      if (stepRef.current === 'walk') {
        if (ok(chairs)) x.drawImage(chairs, 0, 0);
        char(x, sheet, DIR_COL.right + fr(t, 8), 1, -14 + wt * 132, 177);
      } else {
        if (!sat.current) sat.current = t;
        const settle = Math.max(0, 1 - (t - sat.current) * 5);
        char(x, sheet, DIR_COL.back, 0, 118, 124.5 - settle * 2);
        if (ok(chairs)) x.drawImage(chairs, 0, 0);
      }
      // walking in: the room fades up from black
      if (t < 0.6) { x.fillStyle = `rgba(20,14,24,${1 - t / 0.6})`; x.fillRect(0, 0, 1280, 720); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const id = setTimeout(() => setStep('hello'), 2300);
    return () => { cancelAnimationFrame(raf); clearTimeout(id); };
  }, [sheet]);
  useEffect(() => { setTyped(false); }, [step]);
  const hello = rio ? t("Hey, come in! The yellow mug's yours. Sit anywhere.", '嘿，进来吧！黄色那杯是给你的，随便坐。') : t('Come in. Close the door behind you and have a seat.', '进来吧。把门带上，坐。');
  const bye = rio ? t('Thanks for the chat. Same time next week? Only if you want to.', '谢谢你跟我聊。下周再一起喝杯咖啡？想来再来。') : t('Thank you for being honest with me. My door is open.', '谢谢你跟我说实话。我的门一直开着。');
  const BOSS_AT: [number, number] = [420, 92];
  return (
    <div className="meet" onClick={(e) => e.stopPropagation()}>
      <canvas ref={cv} width={1280} height={720} />
      <div className="meet-tag pix">{rio ? (ZH ? `${boss.name}的办公室 · 咖啡小聊` : `${boss.name}'s office · Coffee chat`) : (ZH ? `${boss.name}的办公室 · 一对一约谈` : `${boss.name}'s office · One-to-one`)}</div>
      {step === 'walk' && <div className="meet-knock">{t('*knock knock*', '*咚咚*')}</div>}
      {step === 'hello' && <Bubble who={boss.name} at={BOSS_AT} text={hello} done={() => setTimeout(() => setStep('ask'), 1400)} />}
      {step === 'ask' && <Bubble who={boss.name} at={BOSS_AT} text={meetIntro(r.boss, msg.coins ?? 2, r.minFocus)} done={() => setTyped(true)} />}
      {step === 'ask' && typed && <div className="meet-opts"><span>{t('Your answer', '你的回答')}</span>
        {MEET_CHOICES().map((c) => <button key={c.key} onClick={() => { tap(); setPick(c); setStep('answer'); }}>{c.text}</button>)}</div>}
      {step === 'answer' && pick && <Bubble who={t('You', '你')} at={[150, 300]} side="left" w={380} text={pick.text} done={() => setTimeout(() => setStep('reply'), 900)} />}
      {step === 'reply' && pick && <Bubble who={boss.name} at={BOSS_AT} text={`${pick.reply[r.boss as 'margaux' | 'rio']} ${bye}`} done={() => setTyped(true)} />}
      {step === 'reply' && typed && <div className="meet-opts end"><span>{t('No penalty, ever. Your boss just wanted to check in.', '没有任何惩罚，上司只是想关心一下你。')}</span>
        <button className="go" onClick={() => { play('heart_pop', 0.5); close(pick!.key); }}>{rio ? t('Thanks, Rio. Back to work', '谢谢里奥，回去工作啦') : t('Thank you. Back to my desk', '谢谢，回工位了')}</button></div>}
      {step !== 'reply' && <button className="meet-later" onClick={() => { tap(); close(null); }}>{t('Come back later', '晚点再来')}</button>}
    </div>
  );
}

// the sleeper: the player's own look with the eyes closed (the eye layer left out, a little closed-eye line drawn
// along the bottom of where the eyes were)
function sleepSheet(p: Parts, look: Look) {
  const c = compose(p, { ...look, eyes: -1 }), x = c.getContext('2d')!;
  const e = document.createElement('canvas'); e.width = 384; e.height = 64; const ex = e.getContext('2d')!;
  ex.drawImage(p.img.eyes, 0, look.eyes * 64, 384, 64, 0, 0, 384, 64);
  const a = ex.getImageData(0, 0, 384, 32).data; x.fillStyle = '#3a2a36';
  for (let col = 0; col < 384; col++) { let low = -1; for (let y = 0; y < 32; y++) if (a[(y * 384 + col) * 4 + 3] > 0) low = y; if (low >= 0) x.fillRect(col, low, 1, 1); }
  return c;
}
// ================================================= going home after orientation =================================================
// black screen with a few thoughts → walking out of the office at dusk → the train home → home, lamp on, into bed →
// lights out → morning, the alarm rings → "Day 1. Start now?" (or stay in bed a little longer)
const VIBE_LINE: Record<string, [string, string]> = {
  snacker: ['A little snack for the ride. You earned it.', '路上吃点小零食，这是你应得的。'],
  napper: ['You could fall asleep standing up on this train.', '在地铁上站着都能睡着。'],
  scroller: ['Phone out. Scrolling all the way home.', '掏出手机，一路刷回家。'],
  stretcher: ['One huge stretch while nobody is looking.', '趁没人注意，伸个超大的懒腰。'],
  spinner: ['Round and round the pole. You miss the spinny chair already.', '绕着扶杆转圈圈，已经开始想念那把转椅了。'],
  plant: ['You bought a tiny plant on the way. It needs a name.', '路上买了一盆小绿植，得给它起个名字。'],
};
type Stage = 'black' | 'exit' | 'train' | 'room' | 'sleep' | 'alarm' | 'ask' | 'bed';
const LEN: Partial<Record<Stage, number>> = { exit: 6.6, train: 6.2, room: 5.6, sleep: 3.4 };
export function GoHome({ s, name, sheet, fresh, start }: { s: Save; name: string; sheet: Sheet | null; fresh: boolean; start: () => void }) {
  const co = COMPANIES[s.company], boss = COWORKERS[rulesOf(s).boss], r = rulesOf(s), host = co.host;
  const [stage, setStage] = useState<Stage>(fresh ? 'black' : 'alarm');
  const [line, setLine] = useState(0);
  const imgs = useImages([`scene/home_exit_${s.company}.png`, 'scene/home_train.png', 'scene/home_city.png', 'scene/home_room_night.png', 'scene/home_blanket_night.png', 'scene/home_room_day.png', 'scene/home_blanket_day.png', `npc/${host}.png`, 'scene/home_blanket_day_sit.png', 'scene/home_blanket_night_sit.png']);
  const [exitBg, trainBg, city, roomN, blanketN, roomD, blanketD, hostSheet, blanketSit, blanketMade] = imgs;
  // three strangers on the train, made from the same character parts as the player
  const [strangers, setStrangers] = useState<HTMLCanvasElement[]>([]);
  const [sleeper, setSleeper] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => { loadParts().then((p) => { setStrangers([0, 1, 2].map(() => compose(p, randomLook(p)))); setSleeper(sleepSheet(p, s.look)); }).catch(() => {}); }, []);
  const lines = [
    ZH ? `${co.name}的入职培训……终于结束了。` : `Orientation at ${co.name}... finally over.`,
    s.company === 'stitchlight'
      ? (ZH ? `${boss.name}冲你点了一下头。在织光，这已经算是很高的评价了。` : `${boss.name} gave you one small nod. At Stitchlight, that counts as high praise.`)
      : (ZH ? `${boss.name}跟你击掌了两次，还说「明天见啦，${co.role}！」` : `${boss.name} high-fived you twice and said "See you tomorrow, new ${co.role.toLowerCase()}!"`),
    t('Time to go home and rest.', '终于可以回家休息了。'),
  ];
  const vibe = s.vibe && VIBE_LINE[s.vibe] ? s.vibe : 'stretcher';
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ stage, t0: performance.now(), sheet, strangers, sleeper });
  useEffect(() => { st.current.stage = stage; st.current.t0 = performance.now(); }, [stage]);
  st.current.sheet = sheet; st.current.strangers = strangers; st.current.sleeper = sleeper;
  // move through the scenes on their own; a click skips ahead
  useEffect(() => {
    if (stage === 'black') { const id = setTimeout(() => (line < lines.length - 1 ? setLine(line + 1) : setStage('exit')), line < lines.length - 1 ? 2300 : 2600); return () => clearTimeout(id); }
    const len = LEN[stage]; if (!len) return;
    const next: Record<string, Stage> = { exit: 'train', train: 'room', room: 'sleep', sleep: 'alarm' };
    const id = setTimeout(() => setStage(next[stage]), len * 1000); return () => clearTimeout(id);
  }, [stage, line]);
  useEffect(() => { if (stage !== 'alarm') return; const id = setInterval(() => play('ui_tap', 0.55), 380); return () => clearInterval(id); }, [stage]);
  const skip = () => {
    if (stage === 'black') { if (line < lines.length - 1) setLine(line + 1); else setStage('exit'); }
    else if (stage === 'exit') setStage('train'); else if (stage === 'train') setStage('room'); else if (stage === 'room') setStage('sleep'); else if (stage === 'sleep') setStage('alarm');
    else if (stage === 'alarm') { tap(); setStage('ask'); }
  };
  useEffect(() => {
    const x = cv.current!.getContext('2d')!; x.imageSmoothingEnabled = false; let raf = 0;
    const draw = (now: number) => {
      const { stage, t0, sheet, strangers, sleeper } = st.current, t = (now - t0) / 1000, len = LEN[stage];
      x.clearRect(0, 0, 1280, 720);
      if (stage === 'exit') {
        if (ok(exitBg)) x.drawImage(exitBg, 0, 0);
        // a car going by
        const cx = 1400 - ((t * 260) % 2200); x.fillStyle = '#e98a7a'; x.fillRect(cx, 632, 120, 28); x.fillRect(cx + 20, 612, 70, 22); x.fillStyle = '#bfe3f2'; x.fillRect(cx + 28, 616, 24, 14); x.fillRect(cx + 58, 616, 24, 14);
        x.fillStyle = '#2b2b3a'; x.fillRect(cx + 14, 656, 20, 12); x.fillRect(cx + 86, 656, 20, 12); x.fillStyle = '#fff1a8'; x.fillRect(cx - 4, 640, 8, 8);
        // your host sees you off at the door; you step out, turn, and head off down the street
        char(x, hostSheet, DIR_COL.front + fr(t), 0, 152, 139);
        const wt = t - 1.3;
        if (wt < 0) char(x, sheet, DIR_COL.front + fr(t), 0, 117, 137);
        else char(x, sheet, DIR_COL.right + fr(t, 8), 1, 117 + wt * 40, 137 + Math.min(4, wt * 6));
      } else if (stage === 'train') {
        const sway = Math.round(Math.sin(t * 7) * 1.2) * B;
        x.fillStyle = '#1d2147'; x.fillRect(0, 0, 1280, 720);
        if (ok(city)) { const off = (t * 340) % 2560; x.drawImage(city, -off, 112, 2560, 192); x.drawImage(city, 2560 - off, 112, 2560, 192); }
        // lights flicking past the windows
        x.fillStyle = 'rgba(255,230,160,.5)'; const lx = 1500 - ((t * 900) % 1900); x.fillRect(lx, 120, 16, 170);
        x.save(); x.translate(0, sway);
        if (ok(trainBg)) x.drawImage(trainBg, 0, 0);
        // people heading home: one reading the ads, one dozing, one looking out
        [[36, 0], [100, 1], [272, 2]].forEach(([bx, i]) => { const sh = strangers[i]; if (sh) char(x, sh, DIR_COL.front + (i === 1 ? 0 : fr(t + i)), 0, bx, 125); });
        if (strangers[1]) zzz(x, 100 * B + 20, 70 * B, t, '#f4f4f4');
        // you, by the pole, doing your thing
        const pcx = 180, feet = 150;
        if (vibe === 'spinner') { const d = [DIR_COL.front, DIR_COL.right, DIR_COL.back, DIR_COL.left][Math.floor(t * 2.5) % 4]; char(x, sheet, d, 0, pcx, feet); }
        else if (vibe === 'stretcher') { const up = Math.floor(t * 1.2) % 2 ? 2 : 0; char(x, sheet, DIR_COL.front + fr(t), 0, pcx, feet - up); if (up) { x.fillStyle = '#ffffff'; x.font = '700 22px "Pixelify Sans"'; x.fillText('~', pcx * B + 40, (feet - 36) * B); } }
        else char(x, sheet, DIR_COL.front + (vibe === 'napper' ? 0 : fr(t)), 0, pcx, feet + (vibe === 'napper' && Math.floor(t * 1.5) % 2 ? 0.5 : 0));
        const hx = pcx * B, hy = (feet - 9) * B;
        if (vibe === 'scroller') { x.fillStyle = 'rgba(140,210,255,.35)'; x.fillRect(hx - 30, hy - 40, 40, 40); x.fillStyle = '#2b2b3a'; x.fillRect(hx - 18, hy - 22, 16, 24); x.fillStyle = '#8fd3ff'; x.fillRect(hx - 15, hy - 19, 10, 16); x.fillStyle = '#ffffff'; x.fillRect(hx - 15, hy - 19 + ((t * 30) % 14), 10, 2); }
        if (vibe === 'snacker') { x.fillStyle = '#e6b86a'; x.beginPath(); x.arc(hx - 8, hy - 8, 10, 0, Math.PI * 2); x.fill(); x.fillStyle = '#7a4a2e'; x.fillRect(hx - 12, hy - 12, 4, 4); x.fillRect(hx - 4, hy - 6, 4, 4); x.fillStyle = 'rgba(42,30,40,1)'; if (Math.floor(t * 2) % 2) { x.beginPath(); x.arc(hx + 2, hy - 14, 5, 0, Math.PI * 2); x.fill(); } }
        if (vibe === 'napper') zzz(x, hx + 30, (feet - 30) * B, t);
        if (vibe === 'plant') { x.fillStyle = '#e98a7a'; x.fillRect(hx - 14, hy - 10, 20, 16); x.fillStyle = '#4f8a5e'; x.fillRect(hx - 12, hy - 26, 6, 16); x.fillRect(hx - 4, hy - 30, 6, 20); x.fillStyle = '#76b07a'; x.fillRect(hx - 16, hy - 22, 6, 6); x.fillRect(hx + 2, hy - 26, 6, 6); }
        x.restore();
      } else if (stage === 'room' || stage === 'sleep') {
        if (ok(roomN)) x.drawImage(roomN, 0, 0);
        const lampOn = stage === 'room';
        if (stage === 'room') {
          const g = x.createRadialGradient(181 * B, 76 * B, 10, 181 * B, 76 * B, 520); g.addColorStop(0, 'rgba(255,214,140,.55)'); g.addColorStop(1, 'rgba(255,214,140,0)');
          x.fillStyle = g; x.fillRect(0, 0, 1280, 720);
          // in through the door, across the room, to the bed
          const wt = t - 0.5;
          if (wt < 0) char(x, sheet, DIR_COL.front + fr(t), 0, 27, 140);
          else if (wt < 4.2) char(x, sheet, DIR_COL.right + fr(t, 8), 1, 27 + Math.min(1, wt / 4.2) * 180, 140);
          else char(x, sheet, DIR_COL.back, 0, 207, 140);
          if (ok(blanketMade)) x.drawImage(blanketMade, 0, 0);
        } else {
          // lights out: the sleeper's head on the pillow, the quilt pulled up, moonlight through the window
          lie(x, sleeper ?? sheet, 0);
          if (ok(blanketN)) x.drawImage(blanketN, 0, 0);
          x.fillStyle = 'rgba(14,10,40,.42)'; x.fillRect(0, 0, 1280, 720);
          x.fillStyle = 'rgba(220,230,255,.13)'; x.beginPath(); x.moveTo(91 * B, 72 * B); x.lineTo(148 * B, 72 * B); x.lineTo(210 * B, 180 * B); x.lineTo(120 * B, 180 * B); x.closePath(); x.fill();
          zzz(x, 232 * B, 78 * B, t, '#dfe6ff');
        }
        void lampOn;
      } else if (stage === 'alarm' || stage === 'ask' || stage === 'bed') {
        if (ok(roomD)) x.drawImage(roomD, 0, 0);
        const ring = stage === 'alarm';
        if (stage === 'ask') {
          // awake: sitting up in bed, a big yawn
          char(x, sheet, DIR_COL.front + fr(t), 0, 228, 105.5);
          if (ok(blanketSit)) x.drawImage(blanketSit, 0, 0);
        } else {
          lie(x, sleeper ?? sheet, ring ? Math.sin(t * 30) * 0.02 : 0);
          if (ok(blanketD)) x.drawImage(blanketD, 0, 0);
          if (stage === 'bed') zzz(x, 232 * B, 80 * B, t, '#9a86c8');
        }
        // the alarm clock on the nightstand: rings and shakes until you tap it
        const sh = ring ? Math.round(Math.sin(t * 40) * 1) : 0, cx = 192 * B + sh * B, cy = 80 * B;
        x.fillStyle = '#4a3a44'; x.fillRect(cx - 4, cy - 4, 48, 40); x.fillStyle = '#ec6f84'; x.fillRect(cx, cy, 40, 32); x.fillStyle = '#fff7ea'; x.fillRect(cx + 6, cy + 6, 28, 20);
        x.fillStyle = '#4a3a44'; x.fillRect(cx + 18, cy + 8, 4, 10); x.fillRect(cx + 18, cy + 14, 10, 4);
        x.fillStyle = '#d9b052'; x.fillRect(cx - 4, cy - 12, 14, 8); x.fillRect(cx + 30, cy - 12, 14, 8); x.fillStyle = '#4a3a44'; x.fillRect(cx + 2, cy + 32, 6, 6); x.fillRect(cx + 32, cy + 32, 6, 6);
        if (ring && Math.floor(t * 6) % 2) { x.fillStyle = '#ec6f84'; for (const [dx, dy, w, h] of [[-24, -16, 12, 4], [-28, 6, 14, 4], [52, -16, 12, 4], [54, 6, 14, 4]]) x.fillRect(cx + dx, cy + dy, w, h); }
      }
      // fade in / out of each scene
      if (len !== undefined || stage === 'alarm') {
        const a = Math.max(t < 0.7 ? 1 - t / 0.7 : 0, len !== undefined && t > len - 0.6 ? (t - (len - 0.6)) / 0.6 : 0);
        if (a > 0) { x.fillStyle = `rgba(10,8,16,${Math.min(1, a)})`; x.fillRect(0, 0, 1280, 720); }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [imgs]);
  const rule = r.clockIn !== null
    ? (ZH ? `从明天起：工作日 9:00 打卡，每天至少专注 ${r.minFocus} 分钟。今天是第一天，不算迟到。` : `From tomorrow: clock in by 9:00 on weekdays, and focus at least ${r.minFocus} minutes a day. Today is day one, so no clock-in worries.`)
    : (ZH ? `${co.name}不用打卡，只要每天至少专注 ${r.minFocus} 分钟。` : `${co.name} has no clock-in. Just focus at least ${r.minFocus} minutes a day.`);
  const caption = stage === 'exit' ? (ZH ? `下班啦。${COWORKERS[host].name}在门口跟你挥手：「明天见！」` : `Clocking out. ${COWORKERS[host].name} waves from the door: "See you tomorrow!"`)
    : stage === 'train' ? (ZH ? VIBE_LINE[vibe][1] : VIBE_LINE[vibe][0])
    : stage === 'room' ? (ZH ? `${name}终于到家了。` : `Home at last.`)
    : stage === 'sleep' ? t('Lights out. Big day tomorrow.', '关灯，睡觉。明天是大日子。')
    : stage === 'alarm' ? t('07:30. Tap the alarm to turn it off.', '07:30，点一下闹钟把它关掉。') : '';
  return (
    <div className={`gh gh-s-${stage}`} onClick={skip}>
      <canvas ref={cv} width={1280} height={720} style={{ display: stage === 'black' ? 'none' : 'block' }} />
      {stage === 'black' && <div className="gh-lines">{lines.slice(0, line + 1).map((l, i) => <p key={i} className={i === line ? 'now' : ''}>{l}</p>)}<span className="gh-skip">{t('click to continue', '点击继续')}</span></div>}
      {caption && <p key={stage} className="gh-cap">{caption}</p>}
      {stage === 'ask' && <Bubble who={name} at={[700, 150]} w={300} text={t('Mmm... morning already?', '唔……已经早上了？')} />}
      {stage === 'ask' && <div className="card gh-ask" onClick={(e) => e.stopPropagation()}>
        <span className="pix gh-day">{t('DAY 1', '第 1 天')}</span>
        <h3>{t('Your first real day. Ready to start now?', '第一天了……要不要现在就开始工作？')}</h3>
        <p className="sub">{t('Find a quiet spot at your desk or computer, so you can focus for a bit.', '找个安静的地方，坐在书桌或电脑前，这样就能专心一会儿。')}</p>
        <p className="gh-rule">{rule}</p>
        <div className="gh-btns"><button className="btn primary" onClick={() => { play('coin', 0.5); start(); }}>{t("I'm set up. Start now →", '准备好了，现在开始 →')}</button>
          <button className="btn ghost" onClick={() => { tap(); setStage('bed'); }}>{t('Five more minutes in bed', '再赖一会儿床')}</button></div></div>}
      {stage === 'bed' && <div className="card gh-ask bed" onClick={(e) => e.stopPropagation()}>
        <h3>{t('Snug. No rush.', '暖暖的，不着急。')}</h3>
        <p className="sub">{t("Get your space ready: some water, a comfy chair, phone on silent. Your first day starts whenever you're ready.", '先把环境准备好：倒杯水，坐舒服点，手机静音。你准备好了，第一天就开始。')}</p>
        <div className="gh-btns"><button className="btn primary" onClick={() => { play('coin', 0.5); setStage('ask'); }}>{t("Okay, I'm up", '好啦，起床')}</button></div></div>}
    </div>
  );
}
