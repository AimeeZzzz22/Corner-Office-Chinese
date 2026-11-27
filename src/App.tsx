import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Office from './Office';
import { COMPANIES, COWORKERS, CompanyId, CoworkerId, GRADES, GRADE_NAME, HEART_POINTS, PRACTICE_PAY, RAISE, TASK_TYPES, TYPE_LABEL, TaskType, coinsAt, gradeOf, pay, xpAt } from './data';
import { Order, Result, Save, fresh, load, newTray, store, wipe } from './state';
import { play, setSound } from './sfx';
import { Badge, Booth, Offer, Quiz, TourCard, Vibe } from './Onboarding';
import DeskView, { PLANT, WorkScene } from './Desk';
import { DEFAULT_LOOK, Parts, compose, loadParts } from './look';
import { TOUR } from './obdata';
import Computer from './Tasklet';
import Shop, { BOX_DAY_MAX, BOX_MINS, PITY, addMinutes, featured, piggyToday } from './BlindBox';
import VibeGallery from './VibeGallery';
import { ZH, t, t as tr } from './lang';
import { AvatarStack, MailLetter, PullSummary, thisWeek, weekKey, weekStart } from './ui';
import { WEEK_MS, WeekJournal } from './Week';
import { BIRTHDAY, Holiday, birthdayToday, holidayOn, isBirthday } from './holidays';
import type { Note } from './state';
import { Bakery, Fridge } from './Bakery';
import { FORTUNES, FRIDGE, fridgeToday, treat, treatsToday } from './treats';
import { Unwrap } from './Desk';
import { freeSlot } from './deskSlots';
import type { Tile } from './Office';
import { Coach, GCtx, STEPS, TIPS, gEmit } from './Guide';
import { ChatMsg, MEET_CHOICES, checkLate, clockIn, fmtClock, minsNow, rulesOf, ruled, unreadChat, weekReview, QUICK_LATE, bossLine } from './work';
import { GoHome, Meeting } from './Work';

const A = `${import.meta.env.BASE_URL}assets/`;
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const Head = ({ id, size = 56 }: { id: CoworkerId; size?: number }) => <span className="head" style={{ width: size, height: size }}><img src={`${A}heads/${id}.png`} alt="" /></span>;
const Coin = () => <img className="coin" src={`${A}coin.png`} alt="" />;

function Hearts({ points }: { points: number }) {
  const full = Math.floor(points / HEART_POINTS);
  return <span className="hearts">{Array.from({ length: 10 }, (_, i) => <img key={i} src={`${A}${i < full ? 'heart' : 'heart_empty'}.png`} alt="" />)}</span>;
}

export default function App() {
  const [s, setS] = useState<Save>(load);
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState<CoworkerId | null>(null);
  const [chat, setChat] = useState(false);
  const [settings, setSettings] = useState(false);
  const [pcOpen, setPcOpen] = useState(false);      // the computer, opened from the desk view
  const [fromDesk, setFromDesk] = useState(false);  // the current order was taken at the desk (so it goes back there after)
  const [backAt, setBackAt] = useState<Tile | undefined>(undefined);   // back from the desk: the player stands beside it
  const [goDesk, setGoDesk] = useState(0);
  const [shop, setShop] = useState<null | 'shop' | 'blind'>(() => (typeof location !== 'undefined' && location.hash === '#blindbox' ? 'blind' : null));   // the shop (and its blind boxes)
  const [spot, setSpot] = useState<null | 'food' | 'fridge' | 'surprise'>(null);   // the bakery menu, the fridge, or the welcome gift
  // the fridge gets a fresh roll each day: on some days there's a little treat in it
  useEffect(() => { if (s.fridge.day !== new Date().toDateString()) up({ fridge: fridgeToday(s.fridge) }); }, [s.phase]);
  const [vibes, setVibes] = useState(() => typeof location !== 'undefined' && location.hash === '#vibes');   // the work vibe gallery
  const [mail, setMail] = useState<{ note: Note; opened: boolean } | null>(null);   // a letter being read (opened from the computer's Mail app)
  const [week, setWeek] = useState<{ start: number; sample?: boolean } | null>(null);   // the weekly journal (which week, or a sample)
  const weekOpen = s.started <= Date.now() - WEEK_MS;   // "my week" unlocks after the first 7 days of play
  const weekLeft = Math.max(1, Math.ceil((s.started + WEEK_MS - Date.now()) / 864e5));
  const [tray, setTray] = useState(false);       // the result screen's peek tray
  // payday: from Friday on, an envelope with a little extra (10% of the week's coins) arrives once a week
  const payday = (force = false) => setS((o) => {
    const wk = weekKey(), day = new Date().getDay();
    if (!force && (o.payWeek === wk || !(day === 5 || day === 6 || day === 0) || o.notes.some((n) => n.kind === 'payday'))) return o;
    const earned = thisWeek(o.history).reduce((a, h) => a + h.coins, 0); if (!force && !earned) return o;
    return { ...o, payWeek: wk, notes: [...o.notes, { id: Date.now(), kind: 'payday', from: null, level: 0, coins: Math.max(10, Math.round(earned * 0.1 / 5) * 5), week: wk }] };
  });
  useEffect(() => { if (s.phase === 'free') payday(); }, [s.phase]);
  // from the second week on: at the start of each new week, a "your week" letter with last week's journal
  const recap = (force = false) => setS((o) => {
    const wk = weekKey(); if (!force && (o.started > Date.now() - WEEK_MS || o.recapWeek === wk)) return o;
    const last = weekStart(new Date(Date.now() - WEEK_MS)), had = o.history.some((h) => h.at >= last.getTime() && h.at < last.getTime() + WEEK_MS);
    if (!force && !had) return { ...o, recapWeek: wk };
    return { ...o, recapWeek: wk, notes: [...o.notes, { id: Date.now() + 2, kind: 'recap', from: null, level: 0, coins: 0, week: weekKey(last) }] };
  });
  useEffect(() => { if (s.phase === 'free' || s.phase === 'desk') recap(); }, [s.phase]);
  // the player's birthday: once a year, a card from everyone with a little gift
  const bdayCard = (force = false) => setS((o) => {
    const y = new Date().getFullYear(); if (!force && (!isBirthday(o.birthday) || o.bdayYear === y)) return o;
    return { ...o, bdayYear: y, notes: [...o.notes, { id: Date.now() + 3, kind: 'birthday', from: COMPANIES[o.company].host, level: 0, coins: 100, week: weekKey() }] };
  });
  useEffect(() => { if (s.lookDone && (s.phase === 'free' || s.phase === 'desk')) bdayCard(); }, [s.phase]);
  const [decoPreview, setDecoPreview] = useState<Holiday | null | undefined>(undefined);   // test: show a holiday's decorations now
  const deco = decoPreview === undefined ? holidayOn() : decoPreview;
  const bdays = birthdayToday(COMPANIES[s.company].people);
  // welcome back: after 6 hours or more away, a little card of what happened meanwhile (only good news, never a penalty)
  const [away] = useState(() => (s.lookDone && s.guide < 0 && ['free', 'desk'].includes(s.phase) && Date.now() - s.lastSeen > 6 * 36e5 ? s.lastSeen : 0));
  const [welcomeBack, setWelcomeBack] = useState(!!away);
  useEffect(() => { const seen = () => setS((o) => ({ ...o, lastSeen: Date.now() })); seen(); const id = setInterval(seen, 60000); return () => clearInterval(id); }, []);
  const thanks = (who: CoworkerId, before: number, after: number): Note[] => Math.floor(after / HEART_POINTS) > Math.floor(before / HEART_POINTS)
    ? [{ id: Date.now(), kind: 'thanks', from: who, level: Math.floor(after / HEART_POINTS), coins: 0, week: weekKey() }] : [];
  const [tourReady, setTourReady] = useState(-1);   // the tour stop both have walked to; the dialog shows only then
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const up = useCallback((p: Partial<Save>) => setS((o) => ({ ...o, ...p })), []);
  // the job: a clock-in check every minute (Stitchlight), and the weekly review on the first visit of a new week
  const working = s.phase === 'free' || s.phase === 'desk';
  useEffect(() => { if (!working) return; const tick = () => setS((o) => { const p = checkLate(o); return p ? { ...o, ...p } : o; }); tick(); const id = setInterval(tick, 60000); return () => clearInterval(id); }, [working]);
  useEffect(() => { if (working) setS((o) => { const p = weekReview(o, weekStart, weekKey()); return p ? { ...o, ...p } : o; }); }, [working]);
  const rules = rulesOf(s), needClock = working && rules.clockIn !== null && ruled(s) && s.clock[new Date().toDateString()] === undefined;
  const [clockToast, setClockToast] = useState<string | null>(null);
  const [meet, setMeet] = useState<ChatMsg | null>(null);
  const [meetWalk, setMeetWalk] = useState<ChatMsg | null>(null);   // walking over to the boss's office
  const [goBoss, setGoBoss] = useState<{ n: number; id: CoworkerId } | null>(null);
  // orientation ends once the first-day guide has shown everything and only the first focus is left: you go home,
  // and the practice order waits for the morning of day one
  const practiceStep = STEPS.findIndex((x) => x.id === 'practice');
  useEffect(() => {
    if (s.guide !== practiceStep || s.day1 || (s.phase !== 'desk' && s.phase !== 'free')) return;
    const id = setTimeout(() => { setPcOpen(false); setMenu(null); setShop(null); setGoHomeFresh(true); up({ phase: 'home' }); }, 700);
    return () => clearTimeout(id);
  }, [s.guide, s.day1, s.phase]);
  const [loadPhase] = useState(s.phase);   // reloading while at home starts again at the morning alarm
  const [goHomeFresh, setGoHomeFresh] = useState(false);
  // a new message from the boss pops up as a small toast in the office or at the desk
  const lastBoss = [...s.chat].reverse().find((m) => m.from !== 'me');
  const [toastFor, setToastFor] = useState(0);
  useEffect(() => { if (lastBoss && lastBoss.id > s.chatSeen) { setToastFor(lastBoss.id); const id = setTimeout(() => setToastFor(0), 9000); return () => clearTimeout(id); } }, [lastBoss?.id]);
  const co = COMPANIES[s.company], host = COWORKERS[co.host], myLabels = s.labelsBy[s.company] ?? null;
  const onLabels = useCallback((rows: string[], d: string[]) => { setCopied(false); setS((o) => ({ ...o, labelsBy: { ...o.labelsBy, [o.company]: rows.join() === d.join() ? undefined : rows } })); }, []);
  const setLabels = (rows: string[] | undefined) => setS((o) => ({ ...o, labelsBy: { ...o.labelsBy, [o.company]: rows } }));
  useEffect(() => { store(s); setSound(s.sound, s.quiz.sound === 'chime'); }, [s]);
  // the player's own look, built from character parts in the browser
  const [parts, setParts] = useState<Parts | null>(null);
  useEffect(() => { loadParts().then(setParts).catch(() => setParts(null)); }, []);
  const sheet = useMemo(() => (parts ? compose(parts, s.look) : null), [parts, s.look]);
  // tour stops are zones drawn on the Tiled maps
  const [zones, setZones] = useState<Record<string, Record<string, [number, number, number, number]>> | null>(null);
  useEffect(() => { fetch(`${A}ob/zones.json`).then((r) => r.json()).then(setZones).catch(() => {}); }, []);
  const stopZone = s.phase === 'tour' && zones ? zones[s.company][TOUR[s.company][s.tourStop][0]] : null;
  const onboarding = s.phase === 'offer' || s.phase === 'tour' || s.phase === 'booth' || s.phase === 'badge' || s.phase === 'vibe' || s.phase === 'quiz' || s.phase === 'gifts';

  // fit the 1280x720 stage to the window
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => { const k = Math.min(window.innerWidth / 1280, window.innerHeight / 720); if (stage.current) stage.current.style.transform = `translate(-50%,-50%) scale(${k})`; };
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);

  // the timer runs on timestamps: it keeps counting through reloads and background tabs
  useEffect(() => {
    if (s.phase !== 'work') { document.title = t('Corner Office', '角落办公室'); return; }
    const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id);
  }, [s.phase]);
  const left = s.order ? s.order.endsAt - now : 0;
  useEffect(() => {
    if (s.phase !== 'work' || !s.order) return;
    const speed = s.fast ? 60 : 1;
    document.title = `${mmss(left * speed)} · ${t('Corner Office', '角落办公室')}`;
    if (left <= 0) { play('times_up', 0.5); up({ phase: 'timesup' }); }
  }, [left, s.phase, s.order, s.fast, up]);

  const tap = () => play('ui_tap', 0.4);
  const openTray = () => { tap(); setMenu(null); setFromDesk(false); up({ phase: 'tray', picked: s.picked ?? { mins: s.tray[1].mins, who: s.tray[1].who, job: s.tray[1].job } }); };

  const start = (focus: string, type: TaskType, steps: string[]) => {
    const p = s.picked!; const job = p.who ? COWORKERS[p.who].jobs[p.job] : null;
    const startedAt = Date.now(), ms = (p.mins * 60000) / (s.fast ? 60 : 1);
    const order: Order = { mins: p.mins, who: p.who, jobTitle: job?.title ?? t('Custom time', '自定时间'), doing: job ? (ZH ? `帮${COWORKERS[p.who!].name}${job.doing.replace(/^正在/, '')}……` : `${job.doing} for ${COWORKERS[p.who!].name}...`) : t('Working...', '工作中……'),
      focus: focus.trim() || t('Focus time', '专注时间'), type, steps: steps.filter((t) => t.trim()).map((text) => ({ text, done: false })), startedAt, endsAt: startedAt + ms, practice: p.practice };
    play('order_start'); setNow(startedAt); up({ order, phase: 'work', firstOrder: false });
  };

  // Finished: coins, XP and 1 point (1/10 heart). Stopping: coins and XP for the time worked, no heart.
  const end = (finished: boolean) => {
    const o = s.order!; const total = o.endsAt - o.startedAt;
    const worked = Math.min(o.mins, Math.floor((Math.min(Date.now(), o.endsAt) - o.startedAt) / total * o.mins));
    const reward = o.practice ? PRACTICE_PAY : finished ? pay(o.mins) : worked >= o.mins ? pay(o.mins) : Math.floor(pay(o.mins) * (worked / o.mins) / 5) * 5;
    const bday = !!o.who && finished && isBirthday(BIRTHDAY[o.who]);   // an order on their birthday counts double for friendship
    const before = o.who ? s.hearts[o.who] : 0, after = finished && o.who ? before + (bday ? 2 : 1) : before;
    // today's treats: iced coffee +50% coins on the first finished order, strawberry milk +10% XP, matcha +10 piggy minutes
    // the raise from promotions (and Intern III's extra XP) comes before the treats
    const tt = treatsToday(s.treats), bonus: string[] = []; let coins = o.practice ? reward : coinsAt(reward, s.xp), xp = o.practice ? reward : xpAt(reward, s.xp), extraMins = 0;
    if (bday) bonus.push(ZH ? `${COWORKERS[o.who!].name}今天生日：友情 +1` : `${COWORKERS[o.who!].name}'s birthday: +1 friendship`);
    const base = coins; const used = [...tt.used];
    if (finished && tt.have.includes('iced_coffee') && !used.includes('iced_coffee')) { coins = Math.round(base * 1.5); used.push('iced_coffee'); bonus.push(ZH ? `冰咖啡：+${coins - base} 金币` : `Iced coffee: +${coins - base} coins`); }
    if (finished && tt.have.includes('strawberry_milk')) { const x0 = xp; xp = Math.round(x0 * 1.1); bonus.push(ZH ? `草莓牛奶：+${xp - x0} 经验` : `Strawberry milk: +${xp - x0} XP`); }
    if (finished && tt.have.includes('matcha_latte')) { extraMins = 10; bonus.push(t('Matcha latte: +10 piggy bank minutes', '抹茶拿铁：存钱罐 +10 分钟')); }
    const g0 = gradeOf(s.xp), g1 = gradeOf(s.xp + xp);
    if (g1 > g0) setTimeout(() => play('heart_level', 0.6), 1200);
    const result: Result = { finished, coins, xp, promoted: g1 > g0 ? g1 : undefined, who: o.who, heartBefore: before, heartAfter: after, minutes: worked, bonus };
    play(finished ? 'order_finished' : 'stopping_here'); if (finished && reward) setTimeout(() => play('coins_many', 0.5), 350);
    if (after > before) setTimeout(() => play(Math.floor(after / HEART_POINTS) > Math.floor(before / HEART_POINTS) ? 'heart_level' : 'heart_pop', 0.5), 800);
    const past = { at: Date.now(), mins: o.mins, worked, who: o.who, job: o.jobTitle, focus: o.focus, type: o.type, finished, coins, xp, steps: o.steps.length, stepsDone: o.steps.filter((x) => x.done).length };
    // the practice order ends with a welcome letter from the host, so the guide can show the mail
    const welcome: Note[] = o.practice ? [{ id: Date.now() + 1, kind: 'welcome', from: co.host, level: 0, coins: 0, week: weekKey() }] : [];
    setTray(false); up({ phase: 'result', result, order: null, notes: [...(o.who ? [...s.notes, ...thanks(o.who, before, after)] : s.notes), ...welcome], blind: finished ? addMinutes(s.blind, o.mins + extraMins) : s.blind, treats: { ...tt, used }, history: [...s.history, past].slice(-200), coins: s.coins + coins, xp: s.xp + xp, tray: newTray(s.company), picked: null,
      hearts: o.who ? { ...s.hearts, [o.who]: after } : s.hearts, ordersDone: finished && o.who ? { ...s.ordersDone, [o.who]: s.ordersDone[o.who] + 1 } : s.ordersDone,
      ...(finished && s.plantLast !== new Date().toDateString() ? { plantDays: s.plantDays + 1, plantLast: new Date().toDateString() } : {}) });
  };

  const [menuX, setMenuX] = useState(0);

  // ---- the first-day guide (Guide.tsx): what has happened since the current step began, and moving on
  const [gev, setGev] = useState<Set<string>>(() => new Set());
  const [tip, setTip] = useState<{ id: string; i: number } | null>(null);   // a one-time tip running right now
  // tips wait for things the App doesn't see change (a shop's list loading in): look again now and then
  const [, look] = useState(0);
  useEffect(() => { if (s.guide >= 0 || tip || onboarding) return; const id = setInterval(() => look((x) => x + 1), 700); return () => clearInterval(id); }, [s.guide, tip, onboarding]);
  useEffect(() => { setGev(new Set()); }, [s.guide, tip?.id, tip?.i]);
  useEffect(() => { const on = (e: Event) => setGev((o) => new Set(o).add((e as CustomEvent).detail)); window.addEventListener('guide', on); return () => window.removeEventListener('guide', on); }, []);
  const gctx: GCtx = { s, co, name: s.name || t('Juniper', '小柏'), ev: gev, menu, chat, spot, shop, week: !!week, pcOpen, mail: !!mail, peek: tray };
  useEffect(() => {
    if (s.guide < 0 || onboarding) return;
    const st = STEPS[s.guide]; if (!st) { up({ guide: -1 }); return; }
    if (st.done?.(gctx)) up({ guide: s.guide + 1 >= STEPS.length ? -1 : s.guide + 1 });
  });
  // one-time tips, once the guide is over: start one when its moment comes, move it on, and drop it if the moment passes
  const endTip = (seen: boolean) => { if (tip && seen) up({ tipsSeen: [...s.tipsSeen, tip.id] }); setTip(null); };
  useEffect(() => {
    if (s.guide >= 0 || onboarding || editing) { if (tip) setTip(null); return; }
    if (!tip) { const tp = TIPS.find((x) => !s.tipsSeen.includes(x.id) && x.when(gctx)); if (tp) setTip({ id: tp.id, i: 0 }); return; }
    const tp = TIPS.find((x) => x.id === tip.id)!;
    if (tp.steps[tip.i].done?.(gctx)) { if (tip.i + 1 >= tp.steps.length) endTip(true); else setTip({ id: tip.id, i: tip.i + 1 }); return; }
    if (!tp.keep(gctx) && !tp.steps[tip.i].ok) endTip(false);
  });
  // the coworker menu closes once the guide moves on from it
  useEffect(() => { if (STEPS[s.guide]?.id === 'stack') { setMenu(null); setChat(false); } }, [s.guide]);
  // the fridge step needs something in the fridge
  useEffect(() => { if (STEPS[s.guide]?.id === 'fridge' && (!s.fridge.item || s.fridge.day !== new Date().toDateString())) up({ fridge: { day: new Date().toDateString(), item: FRIDGE[0].key, fortune: Math.floor(Math.random() * FORTUNES.length) } }); }, [s.guide]);
  const onCoworker = useCallback((id: CoworkerId | null, x?: number) => { setMenu(id); setChat(false); if (id) { setMenuX(x ?? 0); play('ui_tap', 0.4); } }, []);
  const name = s.name || t('Juniper', '小柏');
  const inOffice = s.phase === 'free' || s.phase === 'tray' || (s.phase === 'focus' && !fromDesk) || s.phase === 'tour';

  return (
    <div className={`stage co-${s.company}`} ref={stage}>
      {inOffice && s.phase === 'free' && bdays.length > 0 && <div className="bday-ribbon">🎂 {ZH ? `今天是${bdays.map((id) => COWORKERS[id].name).join('和')}的生日！` : `Today is ${bdays.map((id) => COWORKERS[id].name).join(' and ')}'s birthday!`}<small>{t(' An order for them counts double for friendship.', ' 今天帮TA接单，友情加倍。')}</small></div>}
      {inOffice && <Office key={s.company} co={co} onCoworker={onCoworker} frozen={s.phase !== 'free' || !!spot || !!shop} menu={menu} startAt={backAt} goDesk={goDesk} goBoss={goBoss} onBoss={() => { if (meetWalk) { play('ui_tap', 0.5); setMeet(meetWalk); setMeetWalk(null); } }} extras={{ fridge: !!s.fridge.item && s.fridge.day === new Date().toDateString(), surprise: s.surprise === 'waiting', deco }} onSpot={(k) => { play('ui_tap', 0.5); setMenu(null); setSpot(k); }} onPc={() => { play('ui_tap', 0.5); setMenu(null); up({ phase: 'desk' }); }} editing={editing} labels={myLabels} onLabels={onLabels} playerSheet={sheet} tour={stopZone ? { zone: stopZone, stop: s.tourStop } : null} onTourArrive={setTourReady} clockScale={s.fast ? 60 : 1} />}
      {(s.phase === 'work' || s.phase === 'timesup' || s.phase === 'result') && <WorkScene sheet={sheet} pet={s.pet} place={s.place} />}
      {s.phase === 'desk' && <DeskView s={s} sheet={sheet} up={up} mode="desk" openPc={() => setPcOpen(true)} leave={() => { setPcOpen(false); setBackAt([...co.pc.stand] as Tile); up({ phase: 'free' }); }} />}
      {s.phase === 'focus' && fromDesk && <DeskView s={s} sheet={sheet} up={up} mode="still" />}

      {!onboarding && !editing && (
        <div className="hud">
          <div className="hud-l"><div className="card hud-left"><div className="pix title">{co.name}</div><div className="sub">{co.role}{ZH ? ' ' : ' '}{GRADE_NAME(gradeOf(s.xp))}</div>
            {(() => { const g = gradeOf(s.xp), lo = GRADES[g], hi = GRADES[g + 1]; return hi ? <><div className="xp"><span style={{ width: `${((s.xp - lo) / (hi - lo)) * 100}%` }} /></div><div className="sub">{s.xp} / {hi} {ZH ? `经验升到实习生${GRADE_NAME(g + 1)}` : `XP to Intern ${GRADE_NAME(g + 1)}`}{g > 0 ? (ZH ? ` · 加薪 +${g * RAISE * 100}%` : ` · raise +${g * RAISE * 100}%`) : ''}</div></>
            : <><div className="xp"><span style={{ width: '100%' }} /></div><div className="sub">{t(`Top intern grade · raise +${g * RAISE * 100}%`, `实习生最高级 · 加薪 +${g * RAISE * 100}%`)}</div></>; })()}</div>
            <AvatarStack s={s} /></div>
          <div className="hud-r">
            {treatsToday(s.treats).have.length > 0 && <div className="card hud-treats">{treatsToday(s.treats).have.map((k) => { const t = treat(k); return (
              <span key={k} className={treatsToday(s.treats).used.includes(k) ? 'used' : ''} title={`${t.name}${t.bonus ? `${ZH ? '：' : ': '}${t.bonus}` : ''}${treatsToday(s.treats).used.includes(k) ? (ZH ? '（今天已用）' : ' (used today)') : ''}`}><img src={`${A}ob/treats/${k}.png`} alt={t.name} /></span>); })}</div>}
            <div className="card hud-right"><Coin /><b>{s.coins.toLocaleString()}</b></div>
          </div>
        </div>
      )}
      {!onboarding && !editing && <button className="btn ghost settings-btn" onClick={() => { tap(); setSettings(!settings); }}>{t('Settings', '设置')}</button>}
      {settings && (
        <div className="card settings">
          <label><input type="checkbox" checked={s.fast} disabled={s.phase === 'work'} onChange={(e) => up({ fast: e.target.checked })} /> {t('Fast demo time (1 minute = 1 second)', '快速演示时间（1 分钟 = 1 秒）')}</label>
          <label><input type="checkbox" checked={s.sound} onChange={(e) => up({ sound: e.target.checked })} /> {t('Sound', '声音')}</label>
          {(s.phase === 'free' || s.phase === 'desk') && <button className="btn ghost" onClick={() => { tap(); setSettings(false); setMenu(null); up({ guide: 0, tipsSeen: [] }); }}>{t('Replay the first-day guide', '重看新手引导')}</button>}
          <div className="set-h">{t('Test tools', '测试工具')}</div>
          {s.phase === 'free' && <button className="btn ghost" onClick={() => { tap(); setEditing(true); setSettings(false); setMenu(null); }}>{t('Edit walk labels', '编辑行走标记')}</button>}
          {s.phase === 'free' && (() => { const other: CompanyId = s.company === 'stitchlight' ? 'moonpuff' : 'stitchlight'; return (
            <button className="btn ghost" onClick={() => { tap(); setMenu(null); setSettings(false); up({ company: other, tray: newTray(other), picked: null }); }}>{t('Switch to ', '切换到')}{COMPANIES[other].name}</button>); })()}
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); setMenu(null); setShop('blind'); }}>{t('Blind pack test page', '盲包测试页')}</button>
          {!ZH && <button className="btn ghost" onClick={() => { tap(); setSettings(false); setVibes(true); }}>{t('Work vibe gallery', '工作风格总览')}</button>}
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); setWeek({ start: weekStart().getTime(), sample: true }); }}>{t('See a sample week (test)', '看一个示例周（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); up({ started: Math.min(s.started, Date.now() - WEEK_MS - 1000), recapWeek: '' }); setTimeout(() => recap(true), 50); }}>{t('Jump a week ahead (test)', '快进一周（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); up({ chat: [...s.chat, { id: Date.now(), from: rules.boss, at: Date.now(), text: bossLine('late', rules.boss, s.chat.length), kind: 'late', replies: QUICK_LATE() }] }); }}>{t('Boss: no clock-in (test)', '上司：没打卡（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); const p = weekReview(s, weekStart, weekKey(), 'award'); if (p) up(p); }}>{t('Boss: perfect week (test)', '上司：全勤奖（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); const p = weekReview(s, weekStart, weekKey(), 'meet'); if (p) up(p); }}>{t('Boss: one-to-one (test)', '上司：约谈（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); setPcOpen(false); setGoHomeFresh(true); up({ phase: 'home' }); }}>{t('Go home after orientation (test)', '入职结束回家（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); bdayCard(true); }}>{t('Birthday card (test)', '生日贺卡（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); const all: (Holiday | null)[] = ['winter', 'lunar', 'love', 'spooky', null]; setDecoPreview(all[(all.indexOf(deco) + 1) % all.length]); }}>{t('Next holiday decorations (test)', '换个节日装饰（测试）')}{deco ? ` · ${deco}` : ''}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); setWelcomeBack(true); }}>{t('Welcome-back card (test)', '欢迎回来卡片（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); up({ plantDays: [2, 5, 10, 20, 0][[0, 2, 5, 10, 20].indexOf(PLANT.reduce((a, d) => (s.plantDays >= d ? d : a), 0))] }); }}>{t('Grow the plant (test)', '让绿植长大（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); payday(true); }}>{t('Payday envelope (test)', '发薪信封（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); const id = co.people[Math.floor(Math.random() * co.people.length)]; up({ notes: [...s.notes, { id: Date.now(), kind: 'thanks', from: id, level: Math.max(1, Math.floor(s.hearts[id] / HEART_POINTS)), coins: 0, week: weekKey() }] }); }}>{t('Thank-you note (test)', '感谢信（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); up({ fridge: { day: new Date().toDateString(), item: FRIDGE[Math.floor(Math.random() * FRIDGE.length)].key, fortune: Math.floor(Math.random() * FORTUNES.length) } }); }}>{t('Put a treat in the fridge (test)', '往冰箱放点心（测试）')}</button>
          {s.phase === 'free' && <button className="btn ghost" onClick={() => { tap(); setSettings(false); setMenu(null); up({ phase: 'offer', tourStop: 0, lookDone: false, desk: [], place: {}, surprise: 'none', guide: -1, firstOrder: true, look: { ...DEFAULT_LOOK }, pet: 'orange_cat', birthday: null, vibe: null, vibeDraws: 0, quiz: { focus: null, sound: null, reminders: null } }); }}>{t('Replay onboarding', '重玩入职流程')}</button>}
          <button className="btn ghost" onClick={() => { wipe(); setS(fresh()); setSettings(false); setMenu(null); }}>{t('Reset the demo', '重置演示')}</button>
        </div>
      )}

      {s.phase === 'offer' && <Offer co={s.company} onDone={(n) => up({ name: n || t('Juniper', '小柏'), phase: 'booth', lookDone: false })} />}
      {s.phase === 'tour' && <TourCard ready={tourReady === s.tourStop} top={!!stopZone && stopZone[1] + stopZone[3] / 2 > 190} co={s.company} stop={s.tourStop} go={(i) => { setTourReady(-1); up({ tourStop: i }); }} skip={() => up({ phase: 'badge' })} done={() => up({ phase: 'badge' })} />}
      {s.phase === 'booth' && <Booth s={s} parts={parts} up={up} first={!s.lookDone} done={() => up(s.lookDone ? { phase: 'badge' } : { phase: 'tour', tourStop: 0, lookDone: true })} />}
      {s.phase === 'badge' && <Badge s={s} sheet={sheet} retake={() => up({ phase: 'booth' })} next={() => up({ phase: 'vibe' })} />}
      {s.phase === 'vibe' && <Vibe s={s} sheet={sheet} up={up} next={() => up({ phase: 'quiz' })} />}
      {s.phase === 'quiz' && <Quiz s={s} up={up} finish={() => {
        up({ phase: 'gifts', firstOrder: true, sound: s.quiz.sound !== 'silent' });
      }} />}

      {shop && <Shop s={s} up={up} tab={shop} close={() => setShop(null)} />}
      {spot === 'food' && s.phase === 'free' && <Bakery s={s} up={up} close={() => setSpot(null)} />}
      {spot === 'fridge' && s.phase === 'free' && <Fridge s={s} up={up} close={() => setSpot(null)} />}
      {spot === 'surprise' && s.phase === 'free' && <Unwrap id="smile_mug" close={() => setSpot(null)} done={(toDesk) => { play('coin', 0.5); setSpot(null);
        up({ surprise: 'opened', desk: s.desk.includes('smile_mug') ? s.desk : [...s.desk, 'smile_mug'], place: { ...s.place, smile_mug: toDesk ? freeSlot('smile_mug', s.place) : null } }); }} />}
      {s.phase === 'gifts' && <DeskView s={s} sheet={sheet} up={up} mode="gifts" />}
      {editing && s.phase === 'free' && (
        <div className={`card editor ${side}`}>
          <div className="between"><b>{t('Walk labels', '行走标记')}</b><button className="chip" onClick={() => setSide(side === 'left' ? 'right' : 'left')}>{t('Move panel ⇄', '移动面板 ⇄')}</button></div>
          <div className="sub">{t('Click a tile to change it. It cycles free → solid → tall.', '点格子来修改，依次切换：可走 → 实心 → 高物。')}</div>
          <div className="key"><i style={{ background: '#5fc878' }} /> {t('Free floor', '可走的地面')}</div>
          <div className="key"><i style={{ background: '#e85a5a' }} /> {t("Solid: can't walk here", '实心：不能走')}</div>
          <div className="key"><i style={{ background: '#ffd200' }} /> {t('Tall: walk behind it', '高物：可从后面走过')}</div>
          <div className="key"><i style={{ background: '#4a3c4a' }} /> {t('Wall (fixed)', '墙（固定）')}</div>
          <div className="key"><i style={{ background: '#2a1f2a', width: 6 }} /> {t('Thin wall: blocks only that edge', '薄墙：只挡那一条边')}</div>
          <div className="sub">{myLabels ? t('You have changed the labels. They are saved in this browser.', '你改过标记了，已保存在这个浏览器里。') : t("These are the map's own labels.", '这些是地图自带的标记。')}</div>
          <button className="btn ghost" disabled={!myLabels} onClick={() => { tap(); setLabels(undefined); setCopied(false); }}>{t("Reset to the map's labels", '恢复地图自带的标记')}</button>
          <button className="btn ghost" disabled={!myLabels} onClick={() => { tap(); navigator.clipboard?.writeText(myLabels!.join('\n')).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{copied ? t('Copied!', '已复制！') : t('Copy labels', '复制标记')}</button>
          {myLabels && <textarea readOnly value={myLabels.join('\n')} onFocus={(e) => e.currentTarget.select()} />}
          <button className="btn primary" onClick={() => { tap(); setEditing(false); }}>{t('Done, try walking', '好了，试着走走')}</button>
        </div>
      )}
      {s.phase === 'free' && !editing && (
        <>
          <PullSummary s={s} ready={piggyToday(s.blind).ready} earned={piggyToday(s.blind).earned} dayMax={BOX_DAY_MAX} treats={treatsToday(s.treats).have.map((k) => treat(k).name)} weekOpen={weekOpen} weekLeft={weekLeft} onWeek={() => setWeek({ start: weekStart().getTime() })} />
          {!s.history.length && s.guide < 0 && <div className="walk-hint">{t('Click to walk · walk up to a coworker to talk · walk to your desk for orders', '点击走路 · 走到同事身边聊天 · 走到工位接工作单')}</div>}
          <button className="btn primary new-order" onClick={() => { tap(); setGoDesk((n) => n + 1); }}>{t('My desk', '我的工位')}</button>
          {menu && (
            <div className={menuX > 256 ? 'card menu left' : 'card menu'}>
              <div className="row"><Head id={menu} /><div><b>{COWORKERS[menu].name}</b><div className="sub">{COWORKERS[menu].role}</div><Hearts points={s.hearts[menu]} /></div></div>
              <div className="sub">{ZH ? `离下一颗心 ${s.hearts[menu] % HEART_POINTS} / ${HEART_POINTS} · ${name}帮TA完成了 ${s.ordersDone[menu]} 张工作单` : `${s.hearts[menu] % HEART_POINTS} / ${HEART_POINTS} to the next heart · ${name} finished ${s.ordersDone[menu]} of their orders`}</div>
              {chat ? <div className="chat">“{(() => { const last = [...s.history].reverse().find((h) => h.who === menu && h.at > Date.now() - 3 * 864e5);
                if (isBirthday(BIRTHDAY[menu])) return t("It's my birthday today! Thanks for stopping by.", '今天是我生日！谢谢你过来看我。');
                if (last?.focus && last.focus !== t('Focus time', '专注时间')) return ZH ? `“${last.focus}”做得怎么样？谢谢你帮我${last.finished ? '完成' : '做'}「${last.job}」。` : `How did “${last.focus}” go? Thanks again for ${last.job.toLowerCase()}.`;
                return COWORKERS[menu].chat; })()}”</div> : <button className="opt" onClick={() => { tap(); setChat(true); }}><b>{t('Chat', '聊天')}</b><span>{t('Say hi', '打个招呼')}</span></button>}
              {(() => { const t = treatsToday(s.treats); return t.have.includes('macaron_tower') && !t.used.includes('macaron_tower')
                ? <button className="opt g-gift" onClick={() => { play('heart_pop', 0.5); gEmit('gift'); up({ hearts: { ...s.hearts, [menu]: s.hearts[menu] + 2 }, treats: { ...t, used: [...t.used, 'macaron_tower'] }, notes: [...s.notes, ...thanks(menu, s.hearts[menu], s.hearts[menu] + 2)] }); }}><b>{tr('Share your macarons', '分享马卡龙')}</b><span>{tr('+2 friendship points', '友情 +2')}</span></button>
                : <button className="opt" disabled><b>{tr('Give a gift', '送礼物')}</b><span>{tr('No gifts in the backpack yet', '背包里还没有礼物')}</span></button>; })()}
              <button className="opt" onClick={openTray}><b>{t('Take an order', '接工作单')}</b><span>{ZH ? `打开${name}的工作单托盘` : `Opens ${name}'s order tray`}</span></button>
            </div>
          )}
        </>
      )}

      {pcOpen && s.phase === 'desk' && <Computer s={s} name={name} practice={s.guide >= 0 && s.guide <= STEPS.findIndex((x) => x.id === 'practice')} openShop={(t) => { setShop(t); }} openMail={(note, opened) => { if (note.kind === 'recap') { if (!opened) up({ notes: s.notes.filter((x) => x.id !== note.id), mailbox: [note, ...s.mailbox].slice(0, 40) }); setWeek({ start: new Date(note.week).getTime() }); } else setMail({ note, opened }); }} close={() => setPcOpen(false)} take={(p) => { setPcOpen(false); setFromDesk(true); up({ phase: 'focus', picked: p }); }} upChat={up} openMeet={(m) => { setPcOpen(false); setBackAt([...co.pc.stand] as Tile); up({ phase: 'free' }); setMeetWalk(m); setGoBoss({ n: Date.now(), id: rules.boss }); }} />}
      {s.phase === 'tray' && <Tray s={s} name={name} pick={(p) => { tap(); up({ picked: p }); }} back={() => { tap(); up({ phase: 'free' }); }} next={() => { tap(); up({ phase: 'focus' }); }} />}
      {s.phase === 'focus' && s.picked && <Focus s={s} name={name} back={() => { tap(); if (fromDesk) { setPcOpen(true); up({ phase: 'desk' }); } else up({ phase: 'tray' }); }} start={start} />}

      {s.phase === 'work' && s.order && (
        <>
          <div className="doodle"><span>{s.order.doing}</span></div>
          <div className="card focus-card">
            <div className="label">{t('Your focus', '你的专注')}</div><div className="big">{s.order.focus}</div>
            <div className="fill-row time" style={{ ['--pct' as string]: `${Math.min(100, ((now - s.order.startedAt) / (s.order.endsAt - s.order.startedAt)) * 100)}%` }}><b className="pix">{mmss(left * (s.fast ? 60 : 1))}</b><span>{ZH ? `剩余 · 共 ${s.order.mins} 分钟` : `left of ${s.order.mins} min`}</span></div>
            {s.order.steps.length > 0 && (() => { const n = s.order.steps.length, d = s.order.steps.filter((x) => x.done).length; return (
              <div key={d === n ? 'all' : 'some'} className={`fill-steps${d === n ? ' all' : ''}`} style={{ ['--pct' as string]: `${(d / n) * 100}%` }}>
                <div className="fill-head"><b>{t('Small steps', '小步骤')}</b><span>{d === n ? t('All done ✦', '全部完成 ✦') : `${d} / ${n}`}</span></div>
                {s.order.steps.map((st, i) => (
                  <label key={i} className={st.done ? 'step done' : 'step'}><input type="checkbox" checked={st.done} onChange={() => { tap(); up({ order: { ...s.order!, steps: s.order!.steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) } }); }} /> {st.text}</label>
                ))}
              </div>); })()}
            <button className="btn ghost" onClick={() => { tap(); up({ phase: 'timesup' }); }}>{t('Stop early', '提前结束')}</button>
          </div>
          <div className="card caption">{ZH ? `你专注做自己的事时，${name}在工位上处理工作单。` : `${name} works on the order at the desk while you focus on your own task.`}</div>
        </>
      )}

      {s.phase === 'timesup' && s.order && (
        <div className="card side">
          <div className="pix h1">{left <= 0 ? t("Time's up!", '时间到！') : t('Stopping early?', '要提前结束吗？')}</div>
          <div className="sub">{ZH ? `“${s.order.focus}”做得怎么样？` : `How did “${s.order.focus}” go?`}</div>
          {left <= 0 ? (
            <><button className="btn primary" onClick={() => end(true)}>{t('Finished!', '完成啦！')}</button>
              <div className="reward"><Coin /> +{s.order.practice ? PRACTICE_PAY : coinsAt(pay(s.order.mins), s.xp)} {t('coins', '金币')} · +{s.order.practice ? PRACTICE_PAY : xpAt(pay(s.order.mins), s.xp)} {t('XP', '经验')}{s.order.who ? t(' · +1/10 heart', ' · +1/10 颗心') : ''}</div></>
          ) : <button className="btn primary" onClick={() => { tap(); up({ phase: 'work' }); }}>{t('Keep going', '继续')}</button>}
          <button className="btn ghost" onClick={() => end(false)}>{t('Stopping here', '就到这里')}</button>
          <div className="sub">{t('You keep the coins and XP for the time worked.', '已工作时间的金币和经验都归你。')}</div><div className="note">{t('No heart this time. Nothing else is lost.', '这次没有心，其他什么都不会损失。')}</div>
        </div>
      )}

      {s.phase === 'result' && s.result && (
        <div className="result-wrap"><div className="card side">
          <div className="pix h1">{s.result.finished ? t('Nice work!', '干得漂亮！') : t('Good stopping point', '停在这里刚刚好')}</div>
          <div className="sub">{s.result.finished ? (ZH ? `${name}完成了这张工作单。` : `${name} finished the order.`) : ZH ? `${name}做了 ${s.result.minutes} 分钟后收工了。` : `${name} wrapped up after ${s.result.minutes} min.`}</div>
          {s.result.promoted && <div className="promo"><b className="pix">🎉 {ZH ? `升职啦！实习生${GRADE_NAME(s.result.promoted)}` : `Promoted! Intern ${GRADE_NAME(s.result.promoted)}`}</b><span>{ZH ? `加薪：以后每张工作单金币 +${s.result.promoted * RAISE * 100}%` : `A raise: +${s.result.promoted * RAISE * 100}% coins on every order from now on`}{s.result.promoted >= 2 ? t(', and +20% XP', '，经验也 +20%') : ''}</span></div>}
          <div className="gain"><div className="gain-chip coins"><Coin /><div><span className="pix">+{s.result.coins}</span><small>{t('coins', '金币')}</small></div></div><div className="gain-chip xpc"><i>⭐</i><div><span className="pix">+{s.result.xp}</span><small>{t('XP', '经验')}</small></div></div></div>
          {!!s.result.bonus?.length && <div className="bonus-list">{s.result.bonus.map((b) => <span key={b}>✦ {b}</span>)}</div>}
          {s.result.who && s.result.heartAfter > s.result.heartBefore && (
            <div className="pill"><Head id={s.result.who} size={40} /><div><b>{COWORKERS[s.result.who].name}</b> <em>+1</em>
              <div className="bar pink"><span style={{ width: `${((s.result.heartAfter % HEART_POINTS) / HEART_POINTS) * 100 || 100}%` }} /></div></div>
              <span className="sub">{s.result.heartAfter % HEART_POINTS || HEART_POINTS}/{HEART_POINTS}</span></div>
          )}
          {/* "almost there": the one or two goals closest to done, so the next session already has a reason */}
          {(() => { const r = s.result!, b = piggyToday(s.blind), g = gradeOf(s.xp), hi = GRADES[g + 1], cands: { k: string; f: number; text: string; icon: string }[] = [];
            if (b.earned < BOX_DAY_MAX) { const left = Math.ceil(BOX_MINS - b.mins); cands.push({ k: 'pack', f: b.mins / BOX_MINS, icon: '🎁', text: ZH ? `再专注 ${left} 分钟，就能攒到下一个盲包` : `${left} more min of focus for your next blind pack` }); }
            if (r.who) { const pts = r.heartAfter % HEART_POINTS, n = Math.floor(r.heartAfter / HEART_POINTS) + 1, c = COWORKERS[r.who];
              if (pts > 0) cands.push({ k: 'heart', f: pts / HEART_POINTS, icon: '💗', text: ZH ? `再帮${c.name} ${HEART_POINTS - pts} 次，就是第 ${n} 颗心` : `Help ${c.name} ${HEART_POINTS - pts} more time${HEART_POINTS - pts > 1 ? 's' : ''} for heart no. ${n}` }); }
            if (hi) { const lo = GRADES[g]; cands.push({ k: 'xp', f: (s.xp - lo) / (hi - lo), icon: '⭐', text: ZH ? `离升职还差 ${hi - s.xp} 经验` : `${hi - s.xp} XP to your next promotion` }); }
            const pity = PITY - (s.sinceSecret ?? 0); if (pity <= 10) cands.push({ k: 'pity', f: 1 - pity / PITY, icon: '✦', text: ZH ? `再拆 ${pity} 个盲包，保证出隐藏款` : `A secret is guaranteed within ${pity} more pack${pity > 1 ? 's' : ''}` });
            const pick = cands.filter((x) => x.f >= 0.4).sort((a, b) => b.f - a.f).slice(0, 2);
            return pick.length > 0 && <div className="nudges"><b>{t('Almost there', '就差一点')}</b>{pick.map((x) => <div key={x.k} className="nudge"><i>{x.icon}</i><span>{x.text}</span><em style={{ ['--f' as string]: `${Math.min(100, x.f * 100)}%` }} /></div>)}</div>; })()}
          <button className="btn primary" onClick={() => { tap(); up({ phase: fromDesk ? 'desk' : 'free', result: null }); }}>{fromDesk ? t('Back to my desk', '回到我的工位') : t('Back to the office', '回到办公室')}</button>
        </div>
        {(() => { const b = piggyToday(s.blind), tt = treatsToday(s.treats), today = s.history.filter((h) => new Date(h.at).toDateString() === new Date().toDateString()); return (
          <div className={`peek${tray ? ' open' : ''}`}>
            <button className="peek-line" onClick={() => { tap(); setTray(!tray); }}><span>🐷 {t('Piggy bank: ', '存钱罐：')}{b.ready ? (ZH ? `${b.ready} 个盲包待拆` : `${b.ready} pack${b.ready > 1 ? 's' : ''} ready`) : ZH ? `${Math.floor(b.mins)} / 60 分钟，到下一个盲包` : `${Math.floor(b.mins)} / 60 min to the next pack`}</span><i>{tray ? '▴' : '▾'}</i></button>
            <div className="peek-body"><div>
              <div className="fill-pill small" style={{ ['--pct' as string]: `${(b.mins / 60) * 100}%` }}><span className="pix">{Math.floor(b.mins)} / 60 {t('min', '分钟')}</span><small>{ZH ? `今天 ${b.earned} / ${BOX_DAY_MAX} 个盲包` : `${b.earned} of ${BOX_DAY_MAX} packs today`}</small></div>
              <div className="peek-row"><b>{t('Today', '今天')}</b><span>{(() => { const n = today.filter((h) => h.finished).length; return ZH ? `${n} 张工作单` : `${n} order${n === 1 ? '' : 's'}`; })()} · {today.reduce((a, h) => a + h.worked, 0)} {t('min', '分钟')} · {today.reduce((a, h) => a + h.coins, 0)} {t('coins', '金币')}</span></div>
              <div className="peek-row"><b>{t('Treats', '点心')}</b><span>{tt.have.length ? tt.have.map((k) => `${treat(k).name}${tt.used.includes(k) ? t(' (used)', '（已用）') : ''}`).join(t(', ', '、')) : t('None today', '今天没有')}</span></div>
              {b.ready > 0 && <button className="btn ghost" onClick={() => { tap(); setShop('blind'); }}>{t('Open a pack', '拆盲包')}</button>}
            </div></div>
          </div>); })()}
        </div>
      )}
      {mail && <MailLetter key={mail.note.id} note={mail.note} opened={mail.opened} weekOpen={weekOpen} name={name} s={s} keep={(n, wk) => {
        setMail(null); if (mail.opened) return;
        // a new letter goes into the kept letters once it's read (the newest 40); payday's coins are added
        play(n.kind === 'payday' || n.kind === 'birthday' ? 'coins_many' : 'heart_pop', 0.5);
        up({ notes: s.notes.filter((x) => x.id !== n.id), mailbox: [n, ...s.mailbox.filter((x) => x.id !== n.id)].slice(0, 40), coins: s.coins + (n.kind === 'payday' || n.kind === 'birthday' ? n.coins : 0) });
        if (wk) setWeek({ start: new Date(n.week).getTime() }); }} />}
      {s.guide >= 0 && !onboarding && !editing && s.phase !== 'home' && <Coach c={gctx} st={STEPS[s.guide]} step={s.guide} total={STEPS.length} stage={stage} next={() => up({ guide: s.guide + 1 >= STEPS.length ? -1 : s.guide + 1 })} skip={() => { tap(); up({ guide: -1 }); }} />}
      {tip && s.guide < 0 && (() => { const tp = TIPS.find((x) => x.id === tip.id)!; return <Coach key={tip.id} tip c={gctx} st={tp.steps[tip.i]} step={tip.i} total={tp.steps.length} stage={stage}
        next={() => (tip.i + 1 >= tp.steps.length ? endTip(true) : setTip({ id: tip.id, i: tip.i + 1 }))} skip={() => { tap(); endTip(true); }} />; })()}
      {vibes && <VibeGallery sheet={sheet} who={name} close={() => setVibes(false)} />}
      {needClock && !pcOpen && <button className="clockin" onClick={() => { const at = minsNow(); const late = rules.clockIn !== null && at > rules.clockIn + rules.grace; play(late ? 'ui_tap' : 'coin', 0.5); up(clockIn(s)); setClockToast(late ? (ZH ? `${fmtClock(at)} 打卡（稍微晚了一点）` : `Clocked in at ${fmtClock(at)} (a little late)`) : (ZH ? `${fmtClock(at)} 准时打卡 ✓` : `Clocked in at ${fmtClock(at)}, on time ✓`)); setTimeout(() => setClockToast(null), 3200); }}>
        <i>🕘</i><span><b>{t('Clock in', '打卡')}</b><small>{ZH ? `上班 ${fmtClock(rules.clockIn!)} · 现在 ${fmtClock(minsNow())}` : `Starts ${fmtClock(rules.clockIn!)} · now ${fmtClock(minsNow())}`}</small></span></button>}
      {clockToast && <div className="clock-toast">{clockToast}</div>}
      {meetWalk && !meet && <div className="clock-toast walk">{rules.boss === 'rio' ? (ZH ? `正去找${COWORKERS[rules.boss].name}喝咖啡……` : `Heading over to ${COWORKERS[rules.boss].name} for a coffee...`) : (ZH ? `正走去${COWORKERS[rules.boss].name}的办公室……` : `Walking to ${COWORKERS[rules.boss].name}'s office...`)}</div>}
      {working && toastFor > s.chatSeen && lastBoss && lastBoss.from !== 'me' && !pcOpen && <button className="chat-toast" onClick={() => { tap(); setToastFor(0); }}>
        <Head id={lastBoss.from} size={30} /><span><b>{COWORKERS[lastBoss.from].name}</b><small>{lastBoss.text}</small><em>{t('Reply in Chat on your computer', '去电脑的「消息」里回复')}</em></span></button>}
      {meet && <Meeting s={s} msg={meet} sheet={sheet} close={(choice) => { const b = rules.boss as 'margaux' | 'rio', c = MEET_CHOICES().find((x) => x.key === choice); const id = meet.id; setMeet(null); if (!c) return;
        const now = Date.now(); up({ chat: [...s.chat.map((m) => (m.id === id ? { ...m, done: true } : m)), { id: now, from: 'me', at: now, text: c.text }, { id: now + 1, from: rules.boss, at: now + 1, text: c.reply[b] }], chatSeen: now + 1 }); }} />}
      {s.phase === 'home' && <GoHome s={s} name={name} sheet={sheet} fresh={goHomeFresh || loadPhase !== 'home'} start={() => { setGoHomeFresh(false); const d = new Date().toDateString(), first = s.guide === practiceStep; up({ phase: first ? 'desk' : 'free', day1: d, clock: rules.clockIn !== null ? { [d]: minsNow() } : {} }); }} />}
      {welcomeBack && (() => {
        const b = piggyToday(s.blind), pal = co.people.filter((p) => s.hearts[p] >= HEART_POINTS).sort((a, b2) => s.hearts[b2] - s.hearts[a])[0];
        const newMonth = new Date(away).getMonth() !== new Date().getMonth(), feat = featured();
        const rows: [string, string][] = [];
        if (unreadChat(s)) rows.push(['💬', ZH ? `${COWORKERS[rulesOf(s).boss].name}给你发了 ${unreadChat(s)} 条消息（在电脑的「消息」里）` : `${COWORKERS[rulesOf(s).boss].name} sent you ${unreadChat(s)} message${unreadChat(s) > 1 ? 's' : ''} (in Chat on your computer)`]);
        if (s.notes.length) rows.push(['✉️', ZH ? `电脑信箱里有 ${s.notes.length} 封新信` : `${s.notes.length} new letter${s.notes.length > 1 ? 's' : ''} in your Mail`]);
        if (b.ready) rows.push(['🎁', ZH ? `${b.ready} 个盲包等你拆` : `${b.ready} blind pack${b.ready > 1 ? 's' : ''} waiting`]);
        if (s.fridge.day === new Date().toDateString() && s.fridge.item) rows.push(['🧁', t("There's something in the fridge today", '今天冰箱里有好吃的')]);
        if (pal) rows.push(['📝', ZH ? `${COWORKERS[pal].name}在你工位上贴了张便利贴：“${COWORKERS[pal].chat}”` : `${COWORKERS[pal].name} left a sticky note on your desk: “${COWORKERS[pal].chat}”`]);
        if (newMonth) rows.push([feat.icon, ZH ? `新的一个月：本月主推「${feat.name}」系列` : `New month: the ${feat.name} series is featured`]);
        rows.push(['🌱', ZH ? `你的绿植在等你：已经陪你专注了 ${s.plantDays} 天` : `Your plant is waiting: ${s.plantDays} focus day${s.plantDays === 1 ? '' : 's'} together`]);
        return <div className="wb-dim" onClick={() => setWelcomeBack(false)}><div className="card wb" onClick={(e) => e.stopPropagation()}>
          <i className="wb-tape" /><div className="wb-hand">{ZH ? `欢迎回来，${name}！` : `Welcome back, ${name}!`}</div>
          <div className="sub">{t('While you were away:', '你不在的时候：')}</div>
          <div className="wb-list">{rows.map(([ic, tx], i) => <div key={i} style={{ ['--d' as string]: `${0.2 + i * 0.12}s` }}><i>{ic}</i><span>{tx}</span></div>)}</div>
          <button className="btn primary" onClick={() => { tap(); setWelcomeBack(false); }}>{t("Let's go", '开始吧')}</button>
        </div></div>; })()}
      {week && <WeekJournal s={s} name={name} start={week.start} sample={week.sample} close={() => setWeek(null)} />}
    </div>
  );
}

function Tray({ s, name, pick, back, next }: { s: Save; name: string; pick: (p: NonNullable<Save['picked']>) => void; back: () => void; next: () => void }) {
  const p = s.picked!; const custom = p.who === null;
  const [mins, setMins] = useState(custom ? p.mins : 45);
  const setCustom = (m: number) => { const v = Math.max(5, Math.min(120, m)); setMins(v); pick({ mins: v, who: null, job: 0 }); };
  return (
    <div className="dim"><div className="card panel">
      <div className="row"><Head id={COMPANIES[s.company].host} size={76} /><div><b>{COWORKERS[COMPANIES[s.company].host].name}</b> <span className="sub">{COWORKERS[COMPANIES[s.company].host].role}</span>
        <div>{ZH ? `${s.firstOrder ? `${name}的第一张工作单在等着了。` : `给${name}的新工作单来了。`}你专注做自己的事时，${name}会完成这张工作单。` : `${s.firstOrder ? `${name}'s first work order is waiting.` : `Fresh orders for ${name}.`} ${name} does the order while you focus on your own work.`}</div></div></div>
      <div className="between"><div className="pix h1">{ZH ? `给${name}挑一张工作单` : `Pick ${name}'s work order`}</div><div className="sub">{ZH ? `时长就是你的专注时间，任务是${name}的活儿。` : `The length is your focus time. The task is ${name}'s job.`}</div></div>
      <div className="slips">
        {s.tray.map((t) => { const c = COWORKERS[t.who], on = !custom && p.mins === t.mins; return (
          <button key={t.mins} className={on ? 'slip on' : 'slip'} onClick={() => pick({ mins: t.mins, who: t.who, job: t.job })}>
            {s.quiz.focus === t.mins && <span className="suits">{tr('Suits you', '适合你')}</span>}
            <div className="mins"><span className="pix">{t.mins}</span> {tr('min', '分钟')}</div>
            <div className="for"><Head id={t.who} size={30} /><b>{tr('For ', '帮')}{c.name}</b></div>
            <div className="job">{c.jobs[t.job].title}</div>
            <div className="reward"><Coin /> +{coinsAt(pay(t.mins), s.xp)} {tr('coins', '金币')} · +{xpAt(pay(t.mins), s.xp)} {tr('XP', '经验')}</div>
          </button>); })}
      </div>
      <div className={custom ? 'custom on' : 'custom'}>
        <div><b>{t('Or set your own time', '或者自己定时间')}</b><div className="sub">{t('5 to 120 minutes · no coworker, so no heart', '5 到 120 分钟 · 不帮同事，所以没有心')}</div></div>
        <button className="sq" onClick={() => setCustom(mins - 5)}>−</button><div className="val">{mins} {t('min', '分钟')}</div><button className="sq" onClick={() => setCustom(mins + 5)}>+</button>
        {[10, 20, 45].map((q) => <button key={q} className={custom && mins === q ? 'chip on' : 'chip'} onClick={() => setCustom(q)}>{q} {t('min', '分钟')}</button>)}
        {custom && <div className="reward"><Coin /> +{coinsAt(pay(mins), s.xp)} {t('coins', '金币')} · +{xpAt(pay(mins), s.xp)} {t('XP', '经验')}</div>}
      </div>
      <div className="between foot"><div><div className="note">{t('Longer orders pay a little extra.', '越长的工作单，报酬多一点点。')}</div><div className="sub">{t('Stopping early still pays for the time worked, but adds no heart.', '提前结束也按已工作时间付钱，只是不加心。')}</div></div>
        <div className="row"><button className="btn ghost" onClick={back}>{t('Back to the office', '回到办公室')}</button><button className="btn primary" onClick={next}>{t('Take this order', '接这张工作单')}</button></div></div>
    </div></div>
  );
}

function Focus({ s, name, back, start }: { s: Save; name: string; back: () => void; start: (focus: string, type: TaskType, steps: string[]) => void }) {
  const p = s.picked!; const c = p.who ? COWORKERS[p.who] : null;
  const [focus, setFocus] = useState(''); const [type, setType] = useState<TaskType>('Reading'); const [steps, setSteps] = useState(['', '', '']);
  return (
    <div className="dim"><div className="card panel">
      <div className="row"><Head id={COMPANIES[s.company].host} size={76} /><div><b>{COWORKERS[COMPANIES[s.company].host].name}</b> <span className="sub">{COWORKERS[COMPANIES[s.company].host].role}</span><div>{ZH ? `选得好。工作单交给${name}，这段时间你要专注做什么？` : `Nice pick. ${name} handles the order. What will you focus on meanwhile?`}</div></div></div>
      <div className="pix h1">{t('Set your focus', '设定你的专注')}</div>
      <div className="cols">
        <div className="slip on fixed"><div className="mins"><span className="pix">{p.mins}</span> {t('min', '分钟')}</div>
          {c ? <><div className="for"><Head id={c.id} size={30} /><b>{t('For ', '帮')}{c.name}</b></div><div className="job">{c.jobs[p.job].title}</div></> : <div className="job">{t('Custom time', '自定时间')}</div>}
          <div className="reward"><Coin /> +{p.practice ? PRACTICE_PAY : coinsAt(pay(p.mins), s.xp)} {t('coins', '金币')} · +{p.practice ? PRACTICE_PAY : xpAt(pay(p.mins), s.xp)} {t('XP', '经验')}</div></div>
        <div className="form">
          <b>{t('What will you focus on in real life?', '现实中你要专注做什么？')}</b>
          <input className="field" autoFocus maxLength={60} placeholder={t('Read chapter 3', '读第三章')} value={focus} onChange={(e) => setFocus(e.target.value)} />
          <b>{t('What kind of task is it?', '这是哪类任务？')}</b>
          <div className="chips">{TASK_TYPES.map((t) => <button key={t} className={t === type ? 'chip on' : 'chip'} onClick={() => setType(t)}>{TYPE_LABEL[t]}</button>)}</div>
          <div className="info">{c ? <><Head id={c.id} size={32} /> {ZH ? `你专注的时候，${name}会帮${c.name}做这张工作单。完成可得 1/10 颗心。` : `${name} does this order for ${c.name} while you focus. Finishing adds 1/10 heart.`}</> : <>{t('A custom-time order has no coworker, so it adds no heart.', '自定时间的工作单不帮同事，所以不加心。')}</>}</div>
          <b>{t('Small steps', '小步骤')} <span className="sub">{t('optional', '可选')}</span></b>
          {steps.map((st, i) => <input key={i} className="field small" maxLength={50} placeholder={t('Add a step', '添加一步')} value={st} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? e.target.value : x)))} />)}
        </div>
      </div>
      <div className="between foot"><button className="btn ghost" onClick={back}>{t('Back to orders', '回到工作单')}</button><button className="btn primary" onClick={() => start(focus, type, steps)}>{t('Start focusing', '开始专注')}</button></div>
    </div></div>
  );
}
