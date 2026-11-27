import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANIES, COWORKERS, CompanyId, CoworkerId } from './data';
import { DIR_COL, Look, Parts, compose, randomLook } from './look';
import { BDAY_LINE, BOOTH_LINE, Focus, KIND_NOTE, LETTER, MONTHS, QUIZ, Reminders, SoundMode, TOUR, VIBES } from './obdata';
import { Save } from './state';
import Sprite from './Sprite';
import { ZH, t, t as tr } from './lang';
import VibeAnim from './VibeAnim';
import { alarmOff, alarmRing, phoneBuzz, play, preloadTear, tear } from './sfx';

const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
const Head = ({ id, size = 56 }: { id: CoworkerId; size?: number }) => <span className="head" style={{ width: size, height: size }}><img src={`${A}heads/${id}.png`} alt="" /></span>;
export function Host({ co, line, size = 64 }: { co: CompanyId; line: string; size?: number }) {
  const h = COWORKERS[COMPANIES[co].host];
  return <div className="row host"><Head id={h.id} size={size} /><div><b>{h.name}</b> <span className="sub">{h.role}</span><div>{line}</div></div></div>;
}
const today = () => (ZH ? new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) : new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', ''));

// ---------------- offer letter: envelope -> letter (type your name, sign) -> HIRED ----------------
export function Offer({ co, onDone }: { co: CompanyId; onDone: (name: string) => void }) {
  const [step, setStep] = useState<'intro' | 'envelope' | 'unfold' | 'letter' | 'hired' | 'ask' | 'leaving'>('intro');
  const [name, setName] = useState(''); const [signed, setSigned] = useState(false);
  const L = LETTER[co], c = COMPANIES[co];
  const body = (live: boolean) => <>
            <img className="logo" src={`${A}ob/logo_${co}.png`} alt="" />
            <div className={L.serif ? 'brand serif-title' : 'brand pix'}>{ZH ? L.zh.split('').join(' ') : L.serif ? 'S T I T C H L I G H T' : c.name}</div>
            <div className="brand-zh">{ZH ? (L.serif ? 'S T I T C H L I G H T' : 'MOONPUFF STUDIO') : L.zh.split('').join(' ')}</div>
            <div className="brand-sub">{L.sub}</div>
            <div className="rule" /><div className="date">{today()}</div>
            <div className="dear"><span>{t('Dear', '亲爱的')}</span>
              <input className="hand" value={name} maxLength={14} autoFocus={live} disabled={!live || step !== 'letter'} tabIndex={live ? 0 : -1} placeholder={t('your name', '你的名字')} onChange={(e) => { setName(e.target.value); setSigned(false); }} />
            </div>
            <p className="body">{L.body}</p>
            <div className="rows">{L.rows.map(([k, v]) => <div key={k}><b>{k}</b><span>{v}</span></div>)}</div>
            <p className="kind">{KIND_NOTE}</p>
            <div className="note hand">{L.note}</div>
            <div className="who">{L.who}</div>
            <div className="sign-row">
              <button className="sign" disabled={!live || !name.trim() || step !== 'letter'} onClick={() => { play('ui_tap', 0.5); setSigned(true); }}>
                <span className="lbl">{t('SIGN HERE', '在此签名')}</span>{signed ? <span className="hand signed">{name}</span> : <span className="hint">{name.trim() ? t('Click to sign', '点击签名') : ''}</span>}
              </button>
              <button className="btn primary accept" disabled={!live || !signed || step !== 'letter'} onClick={() => { play('order_finished', 0.5); setStep('hired'); setTimeout(() => { play('heart_pop', 0.4); setStep('ask'); }, 1500); }}>{step === 'letter' || step === 'unfold' ? t('Accept the offer', '接受录用') : t('Accepted!', '已接受！')}</button>
            </div>
  </>;
  return (
    <div className="desk" style={{ backgroundImage: `url(${A}ob/desk.png)` }}>
      {step === 'intro' && <Intro co={co} done={() => setStep('envelope')} />}
      {step === 'envelope' && (
        <div className="envelope-screen arrive">
          <div className="pix mail-title">{t('You have mail', '你有一封信')}</div><div className="mail-sub">{t('An envelope is waiting on your desk. Pull the zip strip to open it.', '桌上有一个信封在等你。拉开封条就能打开。')}</div>
          <ZipEnvelope co={co} onOpen={() => { setStep('unfold'); setTimeout(() => setStep('letter'), UNFOLD_MS); }} />
        </div>
      )}
      {step !== 'envelope' && step !== 'intro' && (
        <>
          {step === 'letter' && <div className="tip"><b>{t('Type your name', '写下你的名字')}</b><span>{t('in the blank, then sign at the bottom.', '填在空白处，再在底部签名。')}</span></div>}
          {step === 'unfold' ? <LetterFold cls={`letter ${L.serif ? 'serif' : 'pixel'}`} co={co}>{body(false)}</LetterFold> : (
          <div className={`letter after-fold ${L.serif ? 'serif' : 'pixel'}`}>
            {body(true)}
            {step !== 'letter' && <div className="stamp pix">{t('HIRED', '录用')}</div>}
          </div>)}
          {(step === 'ask' || step === 'leaving') && (
            <div className={step === 'leaving' ? 'ask-dim leaving' : 'ask-dim'}>
              <div className="ask">
                <div className="ask-icon">✨</div>
                <div className="pix ask-title">{t('Your big day is tomorrow!', '明天就是你的大日子！')}</div>
                <div>{ZH ? `明天第一天去${c.name}上班。睡觉前，先挑好明天要穿什么吧。` : `First day at ${c.name}. Before you go to bed, pick what you'll wear on your big day.`}</div>
                <button className="btn primary" onClick={() => { tap(); setStep('leaving'); setTimeout(() => onDone(name.trim()), 650); }}>{t('Choose my first-day look', '挑选第一天的造型')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------- the letter comes out folded in three, then opens ----------------
// Three panels, each showing its third of the same letter. Folded inward like a real letter: the bottom third up first,
// then the top third down over it, so you see the back of the top flap. It opens in reverse: the top flap, then the bottom.
const UNFOLD_MS = 2450;
// whole-pixel thirds (235 + 235 + 234 = 704), so the words on each panel sit exactly where they sit on the real letter
const FOLD_TOP = [0, 235, 470];
function LetterFold({ cls, co, children }: { cls: string; co: CompanyId; children: React.ReactNode }) {
  return (
    <div className="lfold-wrap"><i className="lfold-shadow" /><div className="lfold">
      {[1, 2, 0].map((i) => (
        <div key={i} className={`lfold-panel p${i}`}>
          <div className="lfold-face front"><div className={cls} style={{ top: -FOLD_TOP[i] }}>{children}</div><i className="lfold-shade" /></div>
          {i !== 1 && <div className="lfold-face back">{i === 0 && <img src={`${A}ob/logo_${co}.png`} alt="" />}<i className="lfold-shade" /></div>}
        </div>))}
    </div></div>
  );
}

// ---------------- zip-strip envelope ----------------
// The strip is perforated: it gives way one notch at a time. Between notches it holds and stretches a little (the tab
// leans toward your finger); once you pull far enough it snaps to the next notch with a rip, a jolt and a tiny shake.
// Pull fast and the notches go in quick succession, but never all at once, so it always feels like tearing paper.
const ENV_W = 504, NOTCHES = 24, STEP = ENV_W / NOTCHES;
function ZipEnvelope({ co, onOpen }: { co: CompanyId; onOpen: () => void }) {
  const [open, setOpen] = useState(false); const [started, setStarted] = useState(false);
  const box = useRef<HTMLDivElement>(null), env = useRef<HTMLDivElement>(null), slit = useRef<HTMLDivElement>(null), strip = useRef<HTMLDivElement>(null);
  const curl = useRef<HTMLDivElement>(null), tab = useRef<HTMLButtonElement>(null);
  const st = useRef({ pointer: 0, dragging: false, notch: 0, shown: 0, lastSnap: 0, pending: 0, shake: 0, auto: false, done: false, jolt: 0, last: 0 });
  useEffect(() => { preloadTear(); }, []);
  useEffect(() => {
    let raf = 0;
    const frame = (now: number) => {
      const s = st.current, dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0; s.last = now;
      if (s.auto) s.pointer = Math.max(s.pointer, s.shown) + dt * ENV_W / 1.4;     // tapped: it tears itself open at a steady pace
      // the strip stays right under the pointer: it tears exactly as far as you pull (it never goes back)
      if ((s.dragging || s.auto) && !s.done) s.shown = Math.max(s.shown, Math.min(ENV_W, s.pointer));
      const x = s.shown;
      // the bumpy feel comes from the notches: each one you pull past gives a snap, a jolt and a little shake
      const crossed = Math.min(NOTCHES, Math.floor(x / STEP + 0.001));
      while (s.notch < crossed) { s.notch += 1; s.pending = Math.min(3, s.pending + 1); s.shake = 1; s.jolt = 1; }
      if (s.pending > 0 && now - s.lastSnap > 38) { s.pending -= 1; s.lastSnap = now; tear(0.8 + Math.random() * 0.4); try { navigator.vibrate?.(6); } catch { /* no vibration */ } }
      if (s.notch >= NOTCHES && !s.done) { s.done = true; s.dragging = false; s.auto = false; setTimeout(() => { setOpen(true); play('order_start', 0.5); setTimeout(onOpen, 1500); }, 120); }
      s.shake *= 0.8; s.jolt *= 0.72;
      const sx = (Math.random() - 0.5) * 3 * s.shake, sy = (Math.random() - 0.5) * 2 * s.shake;
      if (env.current) env.current.style.transform = `translate(${sx}px, ${sy}px) rotate(-3deg)`;
      if (slit.current) slit.current.style.width = `${x}px`;
      if (strip.current) { strip.current.style.transform = `translateX(${x}px)`; strip.current.style.width = `${ENV_W - x}px`; }
      if (curl.current) {
        // the torn-off part is stiff card: a straight strip lifting up and back from the tear, jolting up with each notch
        // the torn part is as long as everything torn so far; it leans back less as it gets longer, so a long strip stays near the envelope
        const len = x, lift = Math.max(10, 28 - len / 22) + s.jolt * 7;   // positive: the free end points up and back
        curl.current.style.width = `${len}px`; curl.current.style.opacity = x > 3 ? '1' : '0';
        curl.current.style.transform = `translate(${x - len}px, 0) rotate(${lift}deg)`;
      }
      // the tab sits exactly where the pointer holds it; each notch only gives it a small upward tick
      if (tab.current) tab.current.style.transform = `translate(${x - 8}px, ${-s.jolt * 3}px) rotate(${-s.jolt * 4}deg)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [onOpen]);
  // how far along the strip the pointer is: the mouse movement since grabbing the tab, measured along the tilted
  // envelope and undone from the screen scaling, so the tab stays exactly under the pointer
  const grab = useRef({ x: 0, y: 0, from: 0 });
  const alongStrip = (cx: number, cy: number) => {
    const stage = box.current!.closest('.stage') as HTMLElement | null, k = stage ? stage.getBoundingClientRect().width / 1280 : 1;
    const a = (3 * Math.PI) / 180, dx = cx - grab.current.x, dy = cy - grab.current.y;
    return grab.current.from + (dx * Math.cos(a) - dy * Math.sin(a)) / k;
  };
  const img = `url(${A}ob/envelope_flat.png)`;
  return (
    <>
      <div className={open ? 'zip open' : 'zip'} ref={env}>
        <div className="zip-inner" ref={box}>
          <div className="paper"><img src={`${A}ob/logo_${co}.png`} alt="" /><i /><i /><i /><i /></div>
          <div className="zip-body" style={{ backgroundImage: img }} />
          <div className="zip-top" style={{ backgroundImage: img }} />
          <div className="slit" ref={slit} />
          {!open && <div className="strip" ref={strip}><span>{t('PULL TO OPEN', '拉开这里')}</span></div>}
          {!open && <div className="curl" ref={curl} />}
          {!open && (
            <button className="tab" ref={tab} aria-label={t('Pull the zip strip', '拉开封条')}
              onPointerDown={(e) => { const s = st.current; s.dragging = true; grab.current = { x: e.clientX, y: e.clientY, from: s.shown }; s.pointer = s.shown; e.currentTarget.setPointerCapture(e.pointerId); setStarted(true); }}
              onPointerMove={(e) => { const s = st.current; if (s.dragging) s.pointer = alongStrip(e.clientX, e.clientY); }}
              onPointerUp={() => { st.current.dragging = false; }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { st.current.auto = true; setStarted(true); } }}>
              <svg viewBox="0 0 40 28" width="34" height="24" aria-hidden><path d="M3 14h20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /><path d="M19 2 L38 14 L19 26 Z" fill="currentColor" /></svg></button>
          )}
        </div>
      </div>
      {!open && <button className="pill" onClick={() => { st.current.auto = true; setStarted(true); }}>{started ? t('Keep pulling →', '继续拉 →') : t('Drag the tab, or tap here', '拖动拉片，或者点这里')}</button>}
    </>
  );
}

// ---------------- the opening ----------------
// 0. A black screen: "click anywhere to begin" (browsers only play sound after a click).
// 1. Still black: an alarm clock rings... and a hand slaps it off.
// 2. A beam of light falls from above onto a phone lying in the dark. It buzzes: an email pops up, your offer.
// 3. Dark again. "Corner Office" appears.
// 4. Click: the desk lamp comes on and the envelope drops onto the desk, ready to open.
type OpStage = 'gate' | 'alarm' | 'slap' | 'beam' | 'notify' | 'dim' | 'title' | 'lamp' | 'drop' | 'landed' | 'out';
function Intro({ co, done }: { co: CompanyId; done: () => void }) {
  const [stage, setStage] = useState<OpStage>('gate');
  const [goReady, setGoReady] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const T = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const click = () => {
    if (stage === 'gate') {
      preloadTear(); setStage('alarm'); const ring = alarmRing(3, 0.7, 0.28) * 1000 || 2900;
      // slow and soft: a quiet beat after the alarm, the light comes up gently over the bedside table, the email
      // stays up long enough to read, then a slow fade to black before the title
      T(ring + 80, () => { setStage('slap'); alarmOff(); });
      T(ring + 1700, () => setStage('beam'));                      // light fades in over ~3 s
      T(ring + 5200, () => { setStage('notify'); phoneBuzz(); try { navigator.vibrate?.([40, 80, 40]); } catch { /* none */ } });
      T(ring + 11000, () => setStage('dim'));                      // fades out over ~1.8 s
      T(ring + 13300, () => setStage('title'));
      T(ring + 16000, () => setGoReady(true));
    } else if (stage === 'title' && goReady) {
      setStage('lamp'); play('ui_tap', 0.7);
      T(1500, () => setStage('drop'));
      T(2150, () => { setStage('landed'); play('heart_pop', 0.45); });
      T(3700, () => setStage('out'));
      T(4300, done);
    }
  };
  const c = COMPANIES[co], dark = ['gate', 'alarm', 'slap', 'beam', 'notify', 'dim'].includes(stage);
  const phone = stage === 'beam' || stage === 'notify' || stage === 'dim';
  return (
    <div className={`opening st-${stage}`} onClick={click}>
      <div className="intro-night" />
      <div className={dark ? 'op-black on' : 'op-black'} />
      <div className="intro-light" />
      {stage === 'gate' && <div className="op-gate"><div>{t('Click anywhere to begin', '点击任意位置开始')}</div><span>{t('best with the sound on 🔊', '建议打开声音 🔊')}</span></div>}
      {phone && (
        <div className={`op-scene ${stage}`}>
          <div className="op-table"><img className="op-clock" src={`${A}ob/op_clock.png`} alt="" /><img className="op-books" src={`${A}ob/op_books.png`} alt="" /></div>
          <div className="op-glow" />
          <div className="op-phone">
            <div className={stage === 'notify' ? 'op-screen lit' : 'op-screen'}>
              <div className="pix op-time">7:00</div><div className="op-date">{today()}</div>
              {stage === 'notify' && (
                <div className="op-note">
                  <img src={`${A}ob/logo_${co}.png`} alt="" />
                  <div><b>{c.name}{t(' Careers', '招聘')}</b><span>{ZH ? `恭喜！你收到了${c.name}的录用通知 🎉` : `Congratulations! Your offer from ${c.name} 🎉`}</span><small>{ZH ? `我们很高兴地通知你，你被录用为${c.role}……` : `We're delighted to offer you the position of ${c.role}...`}</small></div>
                  <em>{t('now', '刚刚')}</em>
                </div>)}
            </div>
          </div>
        </div>)}
      {stage === 'title' && (
        <div className="intro-title">
          {stage === 'title' && <>
            <div className="intro-name" role="heading" aria-label={t('Corner Office', '角落办公室')}>{(ZH ? ['角落办公室'] : ['CORNER', 'OFFICE']).map((w, l) => <div key={w} className={ZH ? 'intro-line zh' : 'intro-line'}>{[...w].map((ch, i) => <img key={i} src={`${A}ob/title/${ZH ? `zh${i}` : ch}.png`} alt="" draggable={false} style={{ animationDelay: `${0.25 + (l * 6 + i) * (ZH ? 0.12 : 0.08)}s` }} />)}</div>)}</div>
            <div className="intro-tag">{t('everyone deserves a cozy corner', '每个人都值得拥有一个温暖的角落')}</div>
            <div className="intro-go" style={{ visibility: goReady ? 'visible' : 'hidden' }}>{t('Click anywhere to continue', '点击任意位置继续')}</div>
          </>}
        </div>)}
      {stage !== 'out' && <button className="linkish intro-skip" onClick={(e) => { e.stopPropagation(); tap(); timers.current.forEach(clearTimeout); done(); }}>{t('Skip intro', '跳过开场')}</button>}
      {/* the envelope, landing exactly where the openable one sits next */}
      <div className="envelope-screen intro-stage">
        <div className="pix mail-title" style={{ visibility: 'hidden' }}>{t('You have mail', '你有一封信')}</div><div className="mail-sub" style={{ visibility: 'hidden' }}>.</div>
        <div className="intro-env-wrap">
          {(stage === 'drop' || stage === 'landed' || stage === 'out') && <>
            <div className="intro-env" style={{ backgroundImage: `url(${A}ob/envelope_flat.png)` }} />
            {stage !== 'drop' && <div className="intro-dust">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ ['--a' as string]: `${i * 60 + 15}deg` }} />)}</div>}
            {stage === 'landed' && <div className="intro-glint" />}
          </>}
        </div>
      </div>
    </div>
  );
}

// ---------------- welcome tour card (the office itself walks and zooms) ----------------
// The guide's line types itself out once both have arrived at the stop; while they walk there is no dialog.
export function TourCard({ co, stop, go, skip, done, top, ready }: { co: CompanyId; stop: number; go: (i: number) => void; skip: () => void; done: () => void; top: boolean; ready: boolean }) {
  const stops = TOUR[co], [, title, full] = stops[stop], last = stop === stops.length - 1;
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [stop]);
  useEffect(() => {
    if (!ready || n >= full.length) return;
    const id = setTimeout(() => { setN((k) => Math.min(full.length, k + 1)); if (n % 3 === 0) play('ui_tap', 0.08); }, /[.,!?]/.test(full[n - 1] ?? '') ? 160 : 26);
    return () => clearTimeout(id);
  }, [ready, n, full]);
  const typing = n < full.length, line = full.slice(0, n);
  if (!ready) return !last ? <button className="btn ghost tour-skip" onClick={() => { tap(); skip(); }}>{t('Skip tour', '跳过参观')}</button> : null;
  return (
    <>
      <div className="card tour-title"><div className="sub caps">{ZH ? `欢迎参观 · 第 ${stop + 1} / ${stops.length} 站` : `WELCOME TOUR · STOP ${stop + 1} OF ${stops.length}`}</div><b>{title}</b></div>
      {!last && <button className="btn ghost tour-skip" onClick={() => { tap(); skip(); }}>{t('Skip tour', '跳过参观')}</button>}
      <div className={top ? 'card tour-card top' : 'card tour-card'}>
        <div onClick={() => setN(full.length)} className="typed"><Host co={co} line={line} size={76} /><span className="ghost-text" aria-hidden>{full.slice(n)}</span></div>
        <div className="between foot">
          <div className="dots">{stops.map((_, i) => <i key={i} className={i <= stop ? 'on' : ''} />)}</div>
          <div className="row">
            {stop > 0 && <button className="btn ghost" onClick={() => { tap(); go(stop - 1); }}>{t('Back', '上一站')}</button>}
            <button className="btn primary" onClick={() => { tap(); if (typing) { setN(full.length); return; } last ? done() : go(stop + 1); }}>{last ? t('Take my badge photo', '去拍工牌照') : t('Next stop', '下一站')}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- badge photo booth: make your look, then pet & birthday ----------------
const TABS = ['Skin', 'Eyes', 'Hair', 'Top', 'Bottom', 'Extras', 'Pet & birthday'] as const;
type Tab = (typeof TABS)[number];
function Thumb({ parts, look, crop, scale = 3 }: { parts: Parts; look: Look; crop: [number, number]; scale?: number }) {
  const sheet = useMemo(() => compose(parts, look), [parts, look]);
  return <Sprite sheet={sheet} scale={scale} still crop={crop} />;
}
export function PetSprite({ pet, scale = 4, still = false }: { pet: string; scale?: number; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const im = new Image(); im.src = `${A}ob/pets/${pet}.png`; let raf = 0; const t0 = performance.now();
    const cv = ref.current!, x = cv.getContext('2d')!; x.imageSmoothingEnabled = false;
    const draw = (now: number) => { const f = still ? 0 : Math.floor((now - t0) / 500) % 2; x.clearRect(0, 0, cv.width, cv.height); if (im.complete) x.drawImage(im, f * 16, 0, 16, 20, 0, 0, 16 * scale, 20 * scale); raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [pet, scale, still]);
  return <canvas ref={ref} width={16 * scale} height={20 * scale} className="sprite" />;
}
const PET_NAMES: Record<string, string> = ZH ? { orange_cat: '橘猫', tuxedo_cat: '奶牛猫', bunny: '兔子', corgi: '柯基', hamster: '仓鼠', fox: '狐狸', duckling: '小鸭', frog: '青蛙' } : { orange_cat: 'Orange cat', tuxedo_cat: 'Tuxedo cat', bunny: 'Bunny', corgi: 'Corgi', hamster: 'Hamster', fox: 'Fox', duckling: 'Duckling', frog: 'Frog' };
// the booth's tabs and hair colours, as shown on screen
const TAB_LABEL: Record<string, string> = { Skin: t('Skin', '肤色'), Eyes: t('Eyes', '眼睛'), Hair: t('Hair', '发型'), Top: t('Top', '上衣'), Bottom: t('Bottom', '下装'), Extras: t('Extras', '配饰'), 'Pet & birthday': t('Pet & birthday', '桌宠和生日') };
const HAIR_LABEL: Record<string, string> = ZH ? { Ginger: '姜红', Chestnut: '栗色', Brown: '棕色', 'Dark brown': '深棕', Grey: '灰色', Black: '黑色', Blonde: '金色', Pink: '粉色', Lavender: '薰衣草紫', Mint: '薄荷绿', Sky: '天蓝' } : {};
export const petName = (k: string) => PET_NAMES[k] ?? k;

// first = picking your first-day look right after the offer letter; otherwise a retake at the badge photo
export function Booth({ s, parts, up, done, first }: { s: Save; parts: Parts | null; up: (p: Partial<Save>) => void; done: () => void; first: boolean }) {
  const [tab, setTab] = useState<Tab>(first ? 'Skin' : 'Top'); const [view, setView] = useState<'front' | 'left' | 'back'>('front');
  // guided on the first day: one tab at a time, in order. A tab's Next button appears once you've picked something there;
  // tabs you haven't reached yet are locked, tabs you've been to stay open
  // skin, eyes and the desk pet start with a default already picked, so Next works straight away; hair, top and bottom
  // start empty and need a pick
  const [chosen, setChosen] = useState<Set<Tab>>(() => new Set(first ? ['Skin', 'Eyes', 'Pet & birthday'] as Tab[] : TABS));
  const [reached, setReached] = useState(first ? 0 : TABS.length - 1);
  const pick = (t: Tab) => setChosen((c) => new Set(c).add(t));
  const sheet = useMemo(() => (parts ? compose(parts, s.look) : null), [parts, s.look]);
  const set = (p: Partial<Look>) => { tap(); up({ look: { ...s.look, ...p } }); pick(tab); };
  const idx = TABS.indexOf(tab), nextTab = TABS[idx + 1];
  const goNext = () => { tap(); setTab(nextTab); setReached((r) => Math.max(r, idx + 1)); };
  const bdayOk = !!s.birthday && s.birthday.d > 0;
  const HINT: Record<Tab, string> = { Skin: t('Pick a skin tone', '选一个肤色'), Eyes: t('Pick your eyes', '选你的眼睛'), Hair: t('Pick a hairstyle', '选一个发型'), Top: t('Pick a top', '选一件上衣'), Bottom: t('Pick a bottom', '选一件下装'), Extras: t('Optional', '可选'), 'Pet & birthday': t('Pick a desk pet and your birthday', '选一只桌宠，再填生日') };
  const petTab = tab === 'Pet & birthday';
  if (!parts) return <div className="room-bg" style={{ backgroundImage: `url(${A}ob/room_${s.company}.png)` }} />;
  const tiles = (n: number, make: (i: number) => Look, on: (i: number) => boolean, crop: [number, number], pick: (i: number) => void, scale = 3) => (
    <div className="tiles">{Array.from({ length: n }, (_, i) => <button key={i} className={on(i) ? 'tile on' : 'tile'} onClick={() => pick(i)}><Thumb parts={parts} look={make(i)} crop={crop} scale={scale} /></button>)}</div>
  );
  return (
    <div className="room-bg dimmed" style={{ backgroundImage: `url(${A}ob/room_${s.company}.png)` }}>
      <div className="card booth-stage">
        <div className="card speech">{first
          ? <><b>{petTab ? t('Almost ready', '快准备好了') : t('Getting ready for day one', '为第一天做准备')}</b><div>{petTab ? t('Bring a desk pet along, and tell us your birthday.', '带一只桌宠一起去，再告诉我们你的生日。') : ZH ? `明天第一天去${COMPANIES[s.company].name}上班！穿什么好呢？` : `First day at ${COMPANIES[s.company].name} tomorrow! What will you wear?`}</div></>
          : <Host co={s.company} line={petTab ? BDAY_LINE[s.company] : BOOTH_LINE[s.company]} size={0} />}</div>
        <div className="viewfinder"><i /><i /><i /><i />
          <div className="model"><Sprite sheet={sheet} dir={view} scale={petTab ? 10 : 13} crop={[6, 26]} />{petTab && <PetSprite pet={s.pet} scale={7} />}</div>
        </div>
        <div className="between stage-foot">
          <div className="row">{(['front', 'left', 'back'] as const).map((v) => <button key={v} className={v === view ? 'chip on' : 'chip'} onClick={() => setView(v)}>{v === 'left' ? t('Side', '侧面') : v === 'front' ? t('Front', '正面') : t('Back', '背面')}</button>)}</div>
          <button className="btn ghost" onClick={() => { set(randomLook(parts)); setChosen((c) => { const n = new Set(c); TABS.slice(0, 6).forEach((t) => n.add(t)); return n; }); setReached((r) => Math.max(r, 5)); }}>🎲 {t('Surprise me', '随机来一套')}</button>
        </div>
      </div>
      <div className="card booth-panel">
        <div className="between"><div className="pix h1">{petTab ? t('Almost done', '快完成了') : first ? t('Your first-day look', '你的第一天造型') : t('Make your look', '打造你的造型')}</div><span className="sub">{ZH ? `第 ${idx + 1} / ${TABS.length} 步` : `Step ${idx + 1} of ${TABS.length}`}</span></div>
        <div className="row tabs">{TABS.map((t, i) => <button key={t} disabled={i > reached} className={t === tab ? 'chip on' : chosen.has(t) ? 'chip done' : 'chip'} onClick={() => { tap(); setTab(t); }}>{chosen.has(t) && t !== tab ? '✓ ' : ''}{TAB_LABEL[t]}</button>)}</div>
        <div className="tab-body">
          {tab === 'Skin' && <><div className="label">{t('Skin tone', '肤色')}</div><div className="swatches">{parts.skin.map((c, i) => <button key={i} className={i === s.look.body ? 'sw on' : 'sw'} style={{ background: c }} onClick={() => set({ body: i })} aria-label={`${t('Skin', '肤色')} ${i + 1}`} />)}</div>
            {tiles(parts.count.body, (i) => ({ ...s.look, body: i }), (i) => i === s.look.body, [4, 26], (i) => set({ body: i }))}</>}
          {tab === 'Eyes' && <><div className="label">{t('Eyes', '眼睛')}</div>{tiles(parts.count.eyes, (i) => ({ ...s.look, eyes: i, acc: null, hair: -1 }), (i) => i === s.look.eyes, [16, 8], (i) => set({ eyes: i }), 5)}</>}
          {tab === 'Hair' && <>{tiles(parts.count.hair, (i) => ({ ...s.look, hair: i }), (i) => i === s.look.hair, [4, 18], (i) => set({ hair: i }))}
            <div className="label">{t('Hair colour', '发色')}</div>
            <div className="swatches">{Object.entries(parts.hairColours).map(([k, v]) => <button key={k} title={HAIR_LABEL[k] ?? k} className={k === s.look.hairColour ? 'sw on' : 'sw'} style={{ background: v.swatch }} onClick={() => set({ hairColour: k })} />)}<span className="sub">{HAIR_LABEL[s.look.hairColour] ?? s.look.hairColour}</span></div></>}
          {tab === 'Top' && tiles(parts.count.top, (i) => ({ ...s.look, top: i }), (i) => i === s.look.top, [12, 17], (i) => set({ top: i }))}
          {tab === 'Bottom' && tiles(parts.count.bottom, (i) => ({ ...s.look, bottom: i }), (i) => i === s.look.bottom, [20, 12], (i) => set({ bottom: i }))}
          {tab === 'Extras' && <><div className="sub">{t('Glasses, hats and more · tap again to take off · optional, you can go on without one', '眼镜、帽子等等 · 再点一次可以摘掉 · 可选，不选也能继续')}</div>
            {tiles(parts.count.acc, (i) => ({ ...s.look, acc: i }), (i) => i === s.look.acc, [4, 27], (i) => set({ acc: s.look.acc === i ? null : i }))}</>}
          {petTab && <>
            <div className="label">{t('Pick a desk pet', '选一只桌宠')}</div>
            <div className="pets">{Object.keys(PET_NAMES).map((k) => <button key={k} className={k === s.pet && (chosen.has('Pet & birthday') || !first) ? 'tile pet on' : 'tile pet'} onClick={() => { tap(); up({ pet: k }); pick('Pet & birthday'); }}><PetSprite pet={k} scale={3} still /><span>{PET_NAMES[k]}</span></button>)}</div>
            <div className="bday">
              <b>{t('Your birthday', '你的生日')} <span className="req">{t('required', '必填')}</span></b><div className="sub">{t('Coworkers who like you will send a gift that day. No year needed.', '喜欢你的同事会在那天送你礼物。不用填年份。')}</div>
              <div className="row">
                <select className={s.birthday ? '' : 'need'} value={s.birthday?.m ?? ''} onChange={(e) => up({ birthday: e.target.value === '' ? null : { m: +e.target.value, d: s.birthday?.d ?? 0 } })}><option value="">{t('Month', '月')}</option>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                <select className={bdayOk ? '' : 'need'} value={s.birthday?.d || ''} disabled={!s.birthday} onChange={(e) => up({ birthday: { m: s.birthday!.m, d: +e.target.value } })}><option value="">{t('Day', '日')}</option>{Array.from({ length: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][s.birthday?.m ?? 0] }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
              </div>
            </div>
          </>}
        </div>
        <div className="between foot">
          <button className="btn ghost" onClick={() => { tap(); setTab(TABS[Math.max(0, idx - 1)]); }} disabled={tab === 'Skin'}>{t('← Previous', '← 上一步')}</button>
          {petTab ? <button className={bdayOk ? 'btn primary pulse' : 'btn primary'} disabled={!bdayOk || (first && !chosen.has('Pet & birthday'))} onClick={() => { play('order_start', 0.5); done(); }}>{first ? t("I'm ready for day one", '我准备好上班啦') : t('Take my badge photo', '去拍工牌照')}</button>
            : chosen.has(tab) || tab === 'Extras' ? <button className="btn primary pulse" onClick={goNext}>{t('Next: ', '下一步：')}{TAB_LABEL[nextTab]} →</button>
            : <span className="sub hint">{HINT[tab]} to continue</span>}
        </div>
      </div>
    </div>
  );
}

export function Badge({ s, sheet, retake, next }: { s: Save; sheet: HTMLCanvasElement | null; retake: () => void; next: () => void }) {
  const c = COMPANIES[s.company], L = LETTER[s.company];
  const bars = useMemo(() => { let seed = +s.badgeNo || 7; const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); const out: [number, number][] = []; let x = 0; while (x < 220) { const w = [2, 2, 4, 6][Math.floor(r() * 4)]; out.push([x, w]); x += w + 2 + Math.floor(r() * 3); } return out; }, [s.badgeNo]);
  return (
    <div className="room-bg dimmed" style={{ backgroundImage: `url(${A}ob/room_${s.company}.png)` }}>
      <div className="flash" />
      <div className="lanyard"><i /><i /></div>
      <div className="card badge">
        <div className="band"><span className="slot" /><span className="pix">{c.name}</span></div>
        <div className="badge-main">
          <div className="photo"><Sprite sheet={sheet} scale={8} still crop={[7, 23]} /></div>
          <div className="facts">
            <div className="sub caps">{t('NAME', '姓名')}</div><div className="pix big-name">{s.name || t('Juniper', '小柏')}</div>
            <div className="sub caps">{t('ROLE', '职位')}</div><div className="v">{L.title}</div>
            <div className="row two">
              <div><div className="sub caps">{t('BIRTHDAY', '生日')}</div><div className="v">{s.birthday ? (ZH ? `${s.birthday.m + 1}月${s.birthday.d}日` : `${MONTHS[s.birthday.m]} ${s.birthday.d}`) : '—'}</div></div>
              <div><div className="sub caps">{t('DESK PET', '桌宠')}</div><div className="row"><PetSprite pet={s.pet} scale={2} still /><span className="v small">{petName(s.pet)}</span></div></div>
            </div>
          </div>
        </div>
        <div className="barcode">{bars.map(([x, w], i) => <i key={i} style={{ left: x, width: w }} />)}<div className="idno"><span className="sub caps">{t('ID NO.', '工号')}</span><b>{L.prefix}-{s.badgeNo}</b></div></div>
        <div className="welcome pix">{t('WELCOME!', '欢迎！')}</div>
      </div>
      <div className="card badge-host"><b>{COWORKERS[c.host].name}</b><div>{t('Love it. Wear this and nobody will stop you at the door.', '好看！戴上它，门口就没人会拦你了。')}</div></div>
      <div className="badge-btns"><button className="btn ghost" onClick={() => { tap(); retake(); }}>{t('Retake photo', '重拍')}</button><button className="btn primary" onClick={() => { tap(); next(); }}>{t('Continue', '继续')}</button></div>
    </div>
  );
}

// the backs of the face-down vibe cards: six versions to choose from (picked in the work vibe gallery for now)
export const CARD_BACKS = [
  { id: 'classic', name: t('Classic dots', '经典圆点') }, { id: 'stars', name: t('Starry night', '星空') }, { id: 'lamp', name: t('Desk lamp light', '台灯光芒') },
  { id: 'gingham', name: t('Gingham and stitches', '格子布和缝线') }, { id: 'holo', name: t('Holographic foil', '镭射') }, { id: 'note', name: t('Sticky note', '便利贴') },
  { id: 'cow', name: t('Gingham: office cow', '格子布：打工牛') }, { id: 'horse', name: t('Gingham: workhorse', '格子布：打工马') }, { id: 'duo', name: t('Cow print: clocking in', '奶牛纹：牛马打卡') },
  { id: 'niuma', name: t('Cow or horse, swaps on redraw', '牛或马，重抽就换') },
] as const;
// the game uses the cow and horse cards; the gallery can preview the others
export const CARD_BACK = 'niuma';
// for the cow-and-horse back: all three cards in a draw are the same animal; each redraw switches to the other one
export const niumaFor = (first: 'cow' | 'horse', draw: number): string[] => { const a = draw % 2 ? (first === 'cow' ? 'horse' : 'cow') : first; return [a, a, a]; };
export const backClass = (back: string, i: number, mix: string[]) => `cb-${back === 'niuma' ? mix[i] : back}`;

// the reveal's centrepiece: the character doing their vibe inside a soft bubble of the vibe's colour
export function VibeHero({ v, sheet, who, parts = true }: { v: (typeof VIBES)[number]; sheet: HTMLCanvasElement | null; who: string; parts?: boolean }) {
  return (
    <div className="vb-hero" style={{ ['--c' as string]: v.colour }}>
      <div className="vb-glow" />
      {parts && [0, 1, 2, 3, 4].map((i) => <i key={i} className={`vb-spark s${i}`}>✦</i>)}
      <VibeAnim id={v.id} sheet={sheet} />
      {parts && <span className="vb-say">{v.bubble.replace(/"/g, '')}</span>}
      {parts && <span className="vb-badge"><img src={`${A}ob/vibe/${v.id}.png`} alt="" /></span>}
      {parts && <span className="vb-caption">{ZH ? `${who}的小憩时间` : `${who} on a tiny break`}</span>}
    </div>
  );
}

// ---------------- work vibe: pick a face-down card; up to 2 redraws ----------------
export function Vibe({ s, sheet, up, next }: { s: Save; sheet: HTMLCanvasElement | null; up: (p: Partial<Save>) => void; next: () => void }) {
  const [view, setView] = useState<'cards' | 'reveal' | 'final'>(s.vibe ? (s.vibeDraws >= 2 ? 'final' : 'reveal') : 'cards');
  const left = 2 - s.vibeDraws, v = VIBES.find((x) => x.id === s.vibe);
  const draw = () => { const pool = VIBES.filter((x) => x.id !== s.vibe); const pick = pool[Math.floor(Math.random() * pool.length)]; play('heart_pop', 0.5); up({ vibe: pick.id }); setView(s.vibeDraws >= 2 ? 'final' : 'reveal'); };
  // drawing a card takes a moment: the other two slide away, the picked one lifts and shakes harder and harder,
  // then it bursts into light and the vibe is revealed
  const [picked, setPicked] = useState<number | null>(null);
  const [burst, setBurst] = useState(false);
  const [first] = useState<'cow' | 'horse'>(() => (Math.random() < 0.5 ? 'cow' : 'horse'));   // the first draw's animal, picked at random
  const mix = niumaFor(first, s.vibeDraws);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i); tap();
    [350, 700, 1000, 1250, 1450, 1620, 1760].forEach((ms) => timers.current.push(window.setTimeout(() => play('ui_tap', 0.25), ms)));
    timers.current.push(window.setTimeout(() => { setBurst(true); play('coin', 0.4); }, 1900));
    timers.current.push(window.setTimeout(() => { draw(); setPicked(null); }, 2350));
    timers.current.push(window.setTimeout(() => setBurst(false), 2900));
  };
  const line = view === 'cards' ? t('One last thing. Everyone here has a work vibe. Pick a card and see yours.', '最后一件事。这里每个人都有自己的工作风格。抽一张卡，看看你的是什么。') : view === 'final' ? t("That's the one. It's yours now.", '就是它了，以后它就是你的了。') : t('Ha, I had a feeling. That suits you.', '哈，我就觉得是这个。很适合你。');
  return (
    <div className="room-bg dimmed" style={{ backgroundImage: `url(${A}ob/room_${s.company}.png)` }}>
      {burst && <div className="vibe-burst" />}
      <div className={`card vibe-card${view !== 'cards' ? ' fit' : ''}`}>
        <Host co={s.company} line={line} size={56} />
        <div className="pix h1">{view === 'cards' ? t('Draw your work vibe', '抽取你的工作风格') : t('Your work vibe', '你的工作风格')}</div>
        {view === 'cards' && <>
          <div className={picked !== null ? 'facedown drawing' : 'facedown'}>{[0, 1, 2].map((i) => <button key={i} className={`${picked === null ? 'fd' : picked === i ? 'fd picked' : 'fd away'} ${backClass(CARD_BACK, i, mix)}`} onClick={() => pick(i)}><span>?</span></button>)}</div>
          <div className="center sub">{t('Tap any card. It only decides the little thing your character does on a tiny break.', '随便点一张。它只决定你的角色在小憩时会做的小动作。')}</div>
          <div className="center note">{t('It never changes your pay or progress.', '它不会影响你的薪酬和进度。')}</div>
        </>}
        {view !== 'cards' && v && (() => {
          const who = s.name || t('Juniper', '小柏'), act = ZH ? v.quirk : v.quirk[0].toLowerCase() + v.quirk.slice(1);
          return (
          <div className="vb" key={v.id} style={{ ['--c' as string]: v.colour }}>
            {/* the character, in a soft bubble of the vibe's colour */}
            <VibeHero v={v} sheet={sheet} who={who} />
            <div className="vb-info">
              <div className="vb-kicker">{t("You're", '你是')}</div>
              <div className="pix vb-name">{v.name}</div>
              <p className="vb-line">{ZH ? <>小憩的时候，{who}会<b>{act}</b>，然后马上回去工作，就像你一样。</> : <>On a tiny break, {who} <b>{act}</b>, then gets straight back to work, just like you.</>}</p>
              <div className="vb-note">{t('Purely for fun. It never changes your pay or progress.', '纯属好玩，不会影响你的薪酬和进度。')}</div>
              <div className="vb-redraw">
                <span className="row">{[0, 1].map((i) => <i key={i} className={i < left ? 'token on' : 'token'} />)}<b>{ZH ? `还能重抽 ${left} 次` : `${left} redraw${left === 1 ? '' : 's'} left`}</b></span>
                <span className="sub">{view === 'final' ? t('This is your work vibe for good.', '这就是你永久的工作风格了。') : t('After that, this vibe is yours for good.', '之后这个风格就永久属于你了。')}</span>
              </div>
              <div className="row vb-btns">
                {view === 'reveal' ? <><button className="btn primary" onClick={() => { tap(); setView('final'); }}>{t('Keep this one', '就要这个')}</button><button className="btn ghost" onClick={() => { tap(); up({ vibeDraws: s.vibeDraws + 1 }); setView('cards'); }}>{t('Draw again', '重抽')}</button></>
                  : <button className="btn primary" onClick={() => { tap(); next(); }}>{t('Continue', '继续')}</button>}
              </div>
            </div>
          </div>); })()}
      </div>
    </div>
  );
}

// ---------------- work style quiz: 3 skippable questions, then a summary ----------------
export function Quiz({ s, up, finish }: { s: Save; up: (p: Partial<Save>) => void; finish: () => void }) {
  const [step, setStep] = useState(0);
  const keys = ['focus', 'sound', 'reminders'] as const;
  const q = s.quiz;
  const setA = (k: (typeof keys)[number], v: Focus | SoundMode | Reminders) => { tap(); up({ quiz: { ...q, [k]: v } }); };
  const label = (k: (typeof keys)[number]) => { const o = (QUIZ[k].opts as [unknown, string, string][]).find((x) => x[0] === q[k]); return o ? [o[1], o[2]] : [t('Not set', '未设置'), t('You skipped this one', '你跳过了这一题')] as [string, string]; };
  const sum = step === 3;
  return (
    <div className="room-bg dimmed" style={{ backgroundImage: `url(${A}ob/room_${s.company}.png)` }}>
      <div className="card quiz-card">
        <div className="between"><span className="chip on small">{t('Work style quiz', '工作习惯小测验')}</span>{!sum && <div className="steps">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>}{!sum ? <button className="linkish" onClick={() => { tap(); setStep(3); }}>{t('Skip quiz', '跳过测验')}</button> : <span />}</div>
        <Host co={s.company} line={sum ? t("Got it. I've set things up the way you like.", '明白了，我已经按你喜欢的方式设置好了。') : QUIZ[keys[step]].line} size={56} />
        {!sum && <>
          <div className="pix h1">{QUIZ[keys[step]].q}</div>
          <div className="opts">{(QUIZ[keys[step]].opts as [Focus | SoundMode | Reminders, string, string][]).map(([v, a, b]) => (
            <button key={String(v)} className={q[keys[step]] === v ? 'opt2 on' : 'opt2'} onClick={() => setA(keys[step], v)}><i /><span><b>{a}</b><small>{b}</small></span></button>))}</div>
          <div className="between foot"><span className="sub">{t('You can change this any time in Settings.', '随时都可以在设置里修改。')}</span>
            <div className="row">{step > 0 && <button className="btn ghost" onClick={() => { tap(); setStep(step - 1); }}>{t('Previous', '上一题')}</button>}<button className="btn primary" onClick={() => { tap(); setStep(step + 1); }}>{step < 2 ? t('Next', '下一题') : t('See my work style', '看看我的工作习惯')}</button></div></div>
        </>}
        {sum && <>
          <div className="pix h1">{t('Your work style', '你的工作习惯')}</div>
          {([[tr('Work orders', '工作单'), 'focus'], [tr('Sound', '声音'), 'sound'], [tr('Reminders', '提醒'), 'reminders']] as const).map(([t, k]) => { const [a, b] = label(k); return (
            <div key={k} className="sumrow"><span className="sub caps">{t}</span><div><b>{a}</b><small>{k === 'focus' && q.focus ? (ZH ? `${q.focus} 分钟的工作单会标上“适合你”，想接哪张都可以` : `${q.focus}-minute orders are marked "Suits you"; take any order you like`) : b}</small></div></div>); })}
          <div className="note">{tr('Nothing here is locked in. Change it any time in Settings.', '这些都不是定死的，随时可以在设置里修改。')}</div>
          <div className="between foot"><button className="btn ghost" onClick={() => { tap(); setStep(0); }}>{tr('Change my answers', '修改我的答案')}</button><button className="btn primary" onClick={() => { tap(); finish(); }}>{tr('Go to my desk →', '去我的工位 →')}</button></div>
        </>}
      </div>
    </div>
  );
}
