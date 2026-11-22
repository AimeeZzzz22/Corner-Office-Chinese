import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Office from './Office';
import { COMPANIES, COWORKERS, CompanyId, CoworkerId, HEART_POINTS, TASK_TYPES, TYPE_LABEL, TaskType, XP_TO_NEXT, pay } from './data';
import { Order, Result, Save, fresh, load, newTray, store, wipe } from './state';
import { play, setSound } from './sfx';
import { Badge, Booth, Offer, Quiz, TourCard, Vibe } from './Onboarding';
import DeskView, { WorkScene } from './Desk';
import { DEFAULT_LOOK, Parts, compose, loadParts } from './look';
import { TOUR } from './obdata';
import Computer from './Tasklet';
import Shop, { BOX_DAY_MAX, addMinutes, piggyToday } from './BlindBox';
import VibeGallery from './VibeGallery';
import { ZH, t, t as tr } from './lang';
import { AvatarStack, MailLetter, PullSummary, WeekRecap, thisWeek, weekKey } from './ui';
import type { Note } from './state';
import { Bakery, Fridge } from './Bakery';
import { FORTUNES, FRIDGE, fridgeToday, treat, treatsToday } from './treats';
import { Unwrap } from './Desk';
import { freeSlot } from './deskSlots';
import type { Tile } from './Office';

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
  const [mail, setMail] = useState(false);       // reading the letter on top of the mail pile
  const [week, setWeek] = useState(false);       // the weekly recap
  const [tray, setTray] = useState(false);       // the result screen's peek tray
  // payday: from Friday on, an envelope with a little extra (10% of the week's coins) arrives once a week
  const payday = (force = false) => setS((o) => {
    const wk = weekKey(), day = new Date().getDay();
    if (!force && (o.payWeek === wk || !(day === 5 || day === 6 || day === 0) || o.notes.some((n) => n.kind === 'payday'))) return o;
    const earned = thisWeek(o.history).reduce((a, h) => a + h.coins, 0); if (!force && !earned) return o;
    return { ...o, payWeek: wk, notes: [...o.notes, { id: Date.now(), kind: 'payday', from: null, level: 0, coins: Math.max(10, Math.round(earned * 0.1 / 5) * 5), week: wk }] };
  });
  useEffect(() => { if (s.phase === 'free') payday(); }, [s.phase]);
  const thanks = (who: CoworkerId, before: number, after: number): Note[] => Math.floor(after / HEART_POINTS) > Math.floor(before / HEART_POINTS)
    ? [{ id: Date.now(), kind: 'thanks', from: who, level: Math.floor(after / HEART_POINTS), coins: 0, week: weekKey() }] : [];
  const [tourReady, setTourReady] = useState(-1);   // the tour stop both have walked to; the dialog shows only then
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const up = useCallback((p: Partial<Save>) => setS((o) => ({ ...o, ...p })), []);
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
      focus: focus.trim() || t('Focus time', '专注时间'), type, steps: steps.filter((t) => t.trim()).map((text) => ({ text, done: false })), startedAt, endsAt: startedAt + ms };
    play('order_start'); setNow(startedAt); up({ order, phase: 'work', firstOrder: false });
  };

  // Finished: coins, XP and 1 point (1/10 heart). Stopping: coins and XP for the time worked, no heart.
  const end = (finished: boolean) => {
    const o = s.order!; const total = o.endsAt - o.startedAt;
    const worked = Math.min(o.mins, Math.floor((Math.min(Date.now(), o.endsAt) - o.startedAt) / total * o.mins));
    const reward = finished ? pay(o.mins) : worked >= o.mins ? pay(o.mins) : Math.floor(pay(o.mins) * (worked / o.mins) / 5) * 5;
    const before = o.who ? s.hearts[o.who] : 0, after = finished && o.who ? before + 1 : before;
    // today's treats: iced coffee +50% coins on the first finished order, strawberry milk +10% XP, matcha +10 piggy minutes
    const tt = treatsToday(s.treats), bonus: string[] = []; let coins = reward, xp = reward, extraMins = 0; const used = [...tt.used];
    if (finished && tt.have.includes('iced_coffee') && !used.includes('iced_coffee')) { coins = Math.round(reward * 1.5); used.push('iced_coffee'); bonus.push(ZH ? `冰咖啡：+${coins - reward} 金币` : `Iced coffee: +${coins - reward} coins`); }
    if (finished && tt.have.includes('strawberry_milk')) { xp = Math.round(reward * 1.1); bonus.push(ZH ? `草莓牛奶：+${xp - reward} 经验` : `Strawberry milk: +${xp - reward} XP`); }
    if (finished && tt.have.includes('matcha_latte')) { extraMins = 10; bonus.push(t('Matcha latte: +10 piggy bank minutes', '抹茶拿铁：存钱罐 +10 分钟')); }
    const result: Result = { finished, coins, xp, who: o.who, heartBefore: before, heartAfter: after, minutes: worked, bonus };
    play(finished ? 'order_finished' : 'stopping_here'); if (finished && reward) setTimeout(() => play('coins_many', 0.5), 350);
    if (after > before) setTimeout(() => play(Math.floor(after / HEART_POINTS) > Math.floor(before / HEART_POINTS) ? 'heart_level' : 'heart_pop', 0.5), 800);
    const past = { at: Date.now(), mins: o.mins, worked, who: o.who, job: o.jobTitle, focus: o.focus, type: o.type, finished, coins, xp, steps: o.steps.length, stepsDone: o.steps.filter((x) => x.done).length };
    setTray(false); up({ phase: 'result', result, order: null, notes: o.who ? [...s.notes, ...thanks(o.who, before, after)] : s.notes, blind: finished ? addMinutes(s.blind, o.mins + extraMins) : s.blind, treats: { ...tt, used }, history: [...s.history, past].slice(-200), coins: s.coins + coins, xp: s.xp + xp, tray: newTray(s.company), picked: null,
      hearts: o.who ? { ...s.hearts, [o.who]: after } : s.hearts, ordersDone: finished && o.who ? { ...s.ordersDone, [o.who]: s.ordersDone[o.who] + 1 } : s.ordersDone });
  };

  const [menuX, setMenuX] = useState(0);
  const onCoworker = useCallback((id: CoworkerId | null, x?: number) => { setMenu(id); setChat(false); if (id) { setMenuX(x ?? 0); play('ui_tap', 0.4); } }, []);
  const name = s.name || t('Juniper', '小柏');
  const inOffice = s.phase === 'free' || s.phase === 'tray' || (s.phase === 'focus' && !fromDesk) || s.phase === 'tour';

  return (
    <div className={`stage co-${s.company}`} ref={stage}>
      {inOffice && <Office key={s.company} co={co} onCoworker={onCoworker} frozen={s.phase !== 'free' || !!spot || !!shop} menu={menu} startAt={backAt} goDesk={goDesk} extras={{ fridge: !!s.fridge.item && s.fridge.day === new Date().toDateString(), surprise: s.surprise === 'waiting' }} onSpot={(k) => { play('ui_tap', 0.5); setMenu(null); setSpot(k); }} onPc={() => { play('ui_tap', 0.5); setMenu(null); up({ phase: 'desk' }); }} editing={editing} labels={myLabels} onLabels={onLabels} playerSheet={sheet} tour={stopZone ? { zone: stopZone, stop: s.tourStop } : null} onTourArrive={setTourReady} clockScale={s.fast ? 60 : 1} />}
      {(s.phase === 'work' || s.phase === 'timesup' || s.phase === 'result') && <WorkScene sheet={sheet} pet={s.pet} place={s.place} />}
      {s.phase === 'desk' && <DeskView s={s} sheet={sheet} up={up} mode="desk" openPc={() => setPcOpen(true)} leave={() => { setPcOpen(false); setBackAt([...co.pc.stand] as Tile); up({ phase: 'free' }); }} />}
      {s.phase === 'focus' && fromDesk && <DeskView s={s} sheet={sheet} up={up} mode="still" />}

      {!onboarding && !editing && (
        <div className="hud">
          <div className="hud-l"><div className="card hud-left"><div className="pix title">{co.name}</div><div className="sub">{co.role}{ZH ? ' 一级' : ' I'}</div>
            <div className="xp"><span style={{ width: `${Math.min(100, (s.xp / XP_TO_NEXT) * 100)}%` }} /></div><div className="sub">{Math.min(s.xp, XP_TO_NEXT)} / {XP_TO_NEXT} {t('XP to Intern II', '经验升到实习生二级')}</div></div>
            <AvatarStack s={s} /></div>
          <div className="hud-r">
            {s.notes.length > 0 && <button className="card hud-mail" onClick={() => { tap(); setMenu(null); setMail(true); }} title={t('You have mail', '你有新信件')}><span className="hud-env" />{s.notes.length > 1 && <em>{s.notes.length}</em>}</button>}
            {treatsToday(s.treats).have.length > 0 && <div className="card hud-treats">{treatsToday(s.treats).have.map((k) => { const t = treat(k); return (
              <span key={k} className={treatsToday(s.treats).used.includes(k) ? 'used' : ''} title={`${t.name}${t.bonus ? `${ZH ? '：' : ': '}${t.bonus}` : ''}${treatsToday(s.treats).used.includes(k) ? (ZH ? '（今天已用）' : ' (used today)') : ''}`}><img src={`${A}ob/treats/${k}.png`} alt={t.name} /></span>); })}</div>}
            <div className="card hud-right"><Coin /><b>{s.coins.toLocaleString()}</b></div>
            <button className="btn primary shop-btn" onClick={() => { tap(); setMenu(null); setShop('shop'); }}>🛍 {t('Shop', '商店')}</button>
          </div>
        </div>
      )}
      {!onboarding && !editing && <button className="btn ghost settings-btn" onClick={() => { tap(); setSettings(!settings); }}>{t('Settings', '设置')}</button>}
      {settings && (
        <div className="card settings">
          <label><input type="checkbox" checked={s.fast} disabled={s.phase === 'work'} onChange={(e) => up({ fast: e.target.checked })} /> {t('Fast demo time (1 minute = 1 second)', '快速演示时间（1 分钟 = 1 秒）')}</label>
          <label><input type="checkbox" checked={s.sound} onChange={(e) => up({ sound: e.target.checked })} /> {t('Sound', '声音')}</label>
          {s.phase === 'free' && <button className="btn ghost" onClick={() => { tap(); setEditing(true); setSettings(false); setMenu(null); }}>{t('Edit walk labels', '编辑行走标记')}</button>}
          {s.phase === 'free' && (() => { const other: CompanyId = s.company === 'stitchlight' ? 'moonpuff' : 'stitchlight'; return (
            <button className="btn ghost" onClick={() => { tap(); setMenu(null); setSettings(false); up({ company: other, tray: newTray(other), picked: null }); }}>{t('Switch to ', '切换到')}{COMPANIES[other].name}</button>); })()}
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); setMenu(null); setShop('blind'); }}>{t('Blind pack test page', '盲包测试页')}</button>
          {!ZH && <button className="btn ghost" onClick={() => { tap(); setSettings(false); setVibes(true); }}>{t('Work vibe gallery', '工作风格总览')}</button>}
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); payday(true); }}>{t('Payday envelope (test)', '发薪信封（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); const id = co.people[Math.floor(Math.random() * co.people.length)]; up({ notes: [...s.notes, { id: Date.now(), kind: 'thanks', from: id, level: Math.max(1, Math.floor(s.hearts[id] / HEART_POINTS)), coins: 0, week: weekKey() }] }); }}>{t('Thank-you note (test)', '感谢信（测试）')}</button>
          <button className="btn ghost" onClick={() => { tap(); setSettings(false); up({ fridge: { day: new Date().toDateString(), item: FRIDGE[Math.floor(Math.random() * FRIDGE.length)].key, fortune: Math.floor(Math.random() * FORTUNES.length) } }); }}>{t('Put a treat in the fridge (test)', '往冰箱放点心（测试）')}</button>
          {s.phase === 'free' && <button className="btn ghost" onClick={() => { tap(); setSettings(false); setMenu(null); up({ phase: 'offer', tourStop: 0, lookDone: false, desk: [], place: {}, look: { ...DEFAULT_LOOK }, pet: 'orange_cat', birthday: null, vibe: null, vibeDraws: 0, quiz: { focus: null, sound: null, reminders: null } }); }}>{t('Replay onboarding', '重玩入职流程')}</button>}
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
          <PullSummary s={s} ready={piggyToday(s.blind).ready} earned={piggyToday(s.blind).earned} dayMax={BOX_DAY_MAX} treats={treatsToday(s.treats).have.map((k) => treat(k).name)} onWeek={() => setWeek(true)} />
          {!s.history.length && <div className="walk-hint">{t('Click to walk · walk up to a coworker to talk · walk to your desk for orders', '点击走路 · 走到同事身边聊天 · 走到工位接工作单')}</div>}
          <button className="btn primary new-order" onClick={() => { tap(); setGoDesk((n) => n + 1); }}>{t('My desk', '我的工位')}</button>
          {menu && (
            <div className={menuX > 256 ? 'card menu left' : 'card menu'}>
              <div className="row"><Head id={menu} /><div><b>{COWORKERS[menu].name}</b><div className="sub">{COWORKERS[menu].role}</div><Hearts points={s.hearts[menu]} /></div></div>
              <div className="sub">{ZH ? `离下一颗心 ${s.hearts[menu] % HEART_POINTS} / ${HEART_POINTS} · ${name}帮他完成了 ${s.ordersDone[menu]} 张工作单` : `${s.hearts[menu] % HEART_POINTS} / ${HEART_POINTS} to the next heart · ${name} finished ${s.ordersDone[menu]} of their orders`}</div>
              {chat ? <div className="chat">“{COWORKERS[menu].chat}”</div> : <button className="opt" onClick={() => { tap(); setChat(true); }}><b>{t('Chat', '聊天')}</b><span>{t('Say hi', '打个招呼')}</span></button>}
              {(() => { const t = treatsToday(s.treats); return t.have.includes('macaron_tower') && !t.used.includes('macaron_tower')
                ? <button className="opt" onClick={() => { play('heart_pop', 0.5); up({ hearts: { ...s.hearts, [menu]: s.hearts[menu] + 2 }, treats: { ...t, used: [...t.used, 'macaron_tower'] }, notes: [...s.notes, ...thanks(menu, s.hearts[menu], s.hearts[menu] + 2)] }); }}><b>{tr('Share your macarons', '分享马卡龙')}</b><span>{tr('+2 friendship points', '友情 +2')}</span></button>
                : <button className="opt" disabled><b>{tr('Give a gift', '送礼物')}</b><span>{tr('No gifts in the backpack yet', '背包里还没有礼物')}</span></button>; })()}
              <button className="opt" onClick={openTray}><b>{t('Take an order', '接工作单')}</b><span>{ZH ? `打开${name}的工作单托盘` : `Opens ${name}'s order tray`}</span></button>
            </div>
          )}
        </>
      )}

      {pcOpen && s.phase === 'desk' && <Computer s={s} name={name} openShop={(t) => { setShop(t); }} close={() => setPcOpen(false)} take={(p) => { setPcOpen(false); setFromDesk(true); up({ phase: 'focus', picked: p }); }} />}
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
              <div className="reward"><Coin /> +{pay(s.order.mins)} {t('coins', '金币')} · +{pay(s.order.mins)} {t('XP', '经验')}{s.order.who ? t(' · +1/10 heart', ' · +1/10 颗心') : ''}</div></>
          ) : <button className="btn primary" onClick={() => { tap(); up({ phase: 'work' }); }}>{t('Keep going', '继续')}</button>}
          <button className="btn ghost" onClick={() => end(false)}>{t('Stopping here', '就到这里')}</button>
          <div className="sub">{t('You keep the coins and XP for the time worked.', '已工作时间的金币和经验都归你。')}</div><div className="note">{t('No heart this time. Nothing else is lost.', '这次没有心，其他什么都不会损失。')}</div>
        </div>
      )}

      {s.phase === 'result' && s.result && (
        <div className="result-wrap"><div className="card side">
          <div className="pix h1">{s.result.finished ? t('Nice work!', '干得漂亮！') : t('Good stopping point', '停在这里刚刚好')}</div>
          <div className="sub">{s.result.finished ? (ZH ? `${name}完成了这张工作单。` : `${name} finished the order.`) : ZH ? `${name}做了 ${s.result.minutes} 分钟后收工了。` : `${name} wrapped up after ${s.result.minutes} min.`}</div>
          <div className="gain"><Coin /><span className="pix">+{s.result.coins}</span><span className="pix xpgain">+{s.result.xp} {t('XP', '经验')}</span></div>
          {!!s.result.bonus?.length && <div className="bonus-list">{s.result.bonus.map((b) => <span key={b}>✦ {b}</span>)}</div>}
          {s.result.who && s.result.heartAfter > s.result.heartBefore && (
            <div className="pill"><Head id={s.result.who} size={40} /><div><b>{COWORKERS[s.result.who].name}</b> <em>+1</em>
              <div className="bar pink"><span style={{ width: `${((s.result.heartAfter % HEART_POINTS) / HEART_POINTS) * 100 || 100}%` }} /></div></div>
              <span className="sub">{s.result.heartAfter % HEART_POINTS || HEART_POINTS}/{HEART_POINTS}</span></div>
          )}
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
      {mail && s.notes[0] && <MailLetter key={s.notes[0].id} note={s.notes[0]} name={name} s={s} keep={(n, wk) => {
        play(n.kind === 'payday' ? 'coins_many' : 'heart_pop', 0.5);
        const rest = s.notes.filter((x) => x.id !== n.id); up({ notes: rest, coins: s.coins + (n.kind === 'payday' ? n.coins : 0) });
        if (wk) { setMail(false); setWeek(true); } else if (!rest.length) setMail(false); }} />}
      {vibes && <VibeGallery sheet={sheet} who={name} close={() => setVibes(false)} />}
      {week && <WeekRecap s={s} name={name} close={() => setWeek(false)} />}
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
            <div className="reward"><Coin /> +{pay(t.mins)} {tr('coins', '金币')} · +{pay(t.mins)} {tr('XP', '经验')}</div>
          </button>); })}
      </div>
      <div className={custom ? 'custom on' : 'custom'}>
        <div><b>{t('Or set your own time', '或者自己定时间')}</b><div className="sub">{t('5 to 120 minutes · no coworker, so no heart', '5 到 120 分钟 · 不帮同事，所以没有心')}</div></div>
        <button className="sq" onClick={() => setCustom(mins - 5)}>−</button><div className="val">{mins} {t('min', '分钟')}</div><button className="sq" onClick={() => setCustom(mins + 5)}>+</button>
        {[10, 20, 45].map((q) => <button key={q} className={custom && mins === q ? 'chip on' : 'chip'} onClick={() => setCustom(q)}>{q} {t('min', '分钟')}</button>)}
        {custom && <div className="reward"><Coin /> +{pay(mins)} {t('coins', '金币')} · +{pay(mins)} {t('XP', '经验')}</div>}
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
          <div className="reward"><Coin /> +{pay(p.mins)} {t('coins', '金币')} · +{pay(p.mins)} {t('XP', '经验')}</div></div>
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
