import { gEmit } from './Guide';
import { useEffect, useRef, useState } from 'react';
import { COWORKERS, CoworkerId } from './data';
import { Save } from './state';
import { play } from './sfx';
import { LiquidTabs, useTear } from './ui';
import { ZH, t } from './lang';

// ---------------- blind boxes, from the glass piggy bank ----------------
// Every hour of finished work fills the piggy bank and earns one box (at most 8 a day). Opening one costs 45 Coins
// (30 minutes' worth). Inside: Normal 66%, Cute 29%, Secret 5%; repeats can happen in every tier.
const A = `${import.meta.env.BASE_URL}assets/blind/`;
const tap = () => play('ui_tap', 0.4);
export const BOX_COST = 45, BOX_MINS = 60, BOX_DAY_MAX = 8;
type Tier = 'normal' | 'cute' | 'secret';
export interface Item { id: string; name: string; tier: Tier | 'shop' | 'bakery' | 'fridge'; price?: number; cat?: string; x: number; y: number; w: number; h: number; fav: string | null; why: string | null }
const TIER: Record<Tier, { label: string; pct: string; col: string }> = {
  normal: { label: t('Normal', '普通'), pct: '66%', col: '#ece6dc' }, cute: { label: t('Cute', '可爱'), pct: '29%', col: '#fad6e2' }, secret: { label: t('Secret', '隐藏'), pct: '5%', col: '#ded4fa' } };
const today = () => new Date().toDateString();
const tAll = t('All', '全部');

let itemsP: Promise<{ odds: Record<Tier, number>; items: Item[] }> | null = null;
// the Chinese build shows each item's Chinese name (name_zh / why_zh in items.json)
export const loadItems = () => (itemsP ||= fetch(`${A}items.json`).then((r) => r.json()).then((d) => (ZH ? { ...d, items: d.items.map((i: Item & { name_zh?: string; why_zh?: string }) => ({ ...i, name: i.name_zh ?? i.name, why: i.why_zh ?? i.why })) } : d)));

// the piggy bank's state for today (a new day resets the 8-a-day count)
export const piggyToday = (b: Save['blind']) => (b.day === today() ? b : { ...b, day: today(), earned: 0 });
// add minutes of finished work: every full hour becomes a box, up to 8 a day; leftover minutes carry over
export function addMinutes(b0: Save['blind'], mins: number): Save['blind'] {
  const b = { ...piggyToday(b0) }; b.mins += mins;
  while (b.mins >= BOX_MINS && b.earned < BOX_DAY_MAX) { b.mins -= BOX_MINS; b.ready += 1; b.earned += 1; }
  if (b.earned >= BOX_DAY_MAX) b.mins = Math.min(b.mins, BOX_MINS);
  return b;
}
function draw(items: Item[], odds: Record<Tier, number>): Item {
  const r = Math.random(), tier: Tier = r < odds.normal ? 'normal' : r < odds.normal + odds.cute ? 'cute' : 'secret';
  const pool = items.filter((i) => i.tier === tier); return pool[Math.floor(Math.random() * pool.length)];   // (shop and food items are never in a box)
}

// one item picture from the atlas, scaled up crisply to fit a box of `size` px
export function ItemPic({ it, size, hide }: { it: Item; size: number; hide?: boolean }) {
  const k = Math.max(1, Math.floor(Math.min(size / it.w, size / it.h) * 2) / 2);
  return <span className={hide ? 'bb-pic hidden' : 'bb-pic'} style={{ width: it.w * k, height: it.h * k, backgroundImage: `url(${A}items.png)`, backgroundSize: `${768 * k}px ${768 * k}px`, backgroundPosition: `-${it.x * k}px -${it.y * k}px` }} />;
}

export function BlindBoxTab({ s, up, close }: { s: Save; up: (p: Partial<Save>) => void; close: () => void }) {
  const [data, setData] = useState<{ odds: Record<Tier, number>; items: Item[] } | null>(null);
  useEffect(() => { loadItems().then(setData).catch(() => {}); }, []);
  const b = piggyToday(s.blind);
  const [puff, setPuff] = useState(0);            // the pig puffs up a little when coins drop in
  const [opening, setOpening] = useState<Item | null>(null);
  const [sim, setSim] = useState<Record<Tier, number> | null>(null);
  const [view, setView] = useState<Tier | 'all'>('all');
  const [wantNext, setWantNext] = useState(false);   // "Open another": opens once the last opening has been saved
  const pack = s.pack;
  const found = (t: Tier) => data ? data.items.filter((i) => i.tier === t && pack[i.id]).length : 0;
  const total = (t: Tier) => data ? data.items.filter((i) => i.tier === t).length : 0;
  const canOpen = b.ready > 0 && s.coins >= BOX_COST;

  const work = (mins: number) => {
    const nb = addMinutes(s.blind, mins); play('piggy_coin_drop', 0.5); setPuff((p) => p + 1);
    if (nb.ready > b.ready) setTimeout(() => play('box_earned', 0.5), 450);
    up({ blind: nb });
  };
  const open = () => {
    gEmit('pack-open');
    if (!data || !canOpen) return;
    const it = draw(data.items, data.odds);
    up({ coins: s.coins - BOX_COST, blind: { ...b, ready: b.ready - 1 }, pack: { ...pack, [it.id]: (pack[it.id] ?? 0) + 1 } });
    setOpening(it);
  };
  // test: open lots of boxes at once (free, not added to your pack) to see the odds come out
  const simulate = (n: number) => {
    if (!data) return; const t: Record<Tier, number> = { normal: 0, cute: 0, secret: 0 };
    for (let i = 0; i < n; i++) t[draw(data.items, data.odds).tier as Tier] += 1; setSim(t); tap();
  };
  useEffect(() => { if (wantNext) { setWantNext(false); open(); } }, [wantNext]);
  const pigImg = `${A}piggy_${Math.min(3, b.ready)}.png`;
  const left = BOX_MINS - b.mins, full = b.earned >= BOX_DAY_MAX;

  return (
    <>
        <div className="bb-cols">
          {/* the piggy bank */}
          <div className="bb-panel">
            <div className="pix bb-h">{t('Your piggy bank', '你的存钱罐')}</div>
            <div className="sub">{t('Every hour of finished tasks earns a blind pack.', '每完成一小时的任务，就能得到一个盲包。')}</div>
            <div className="bb-pig"><img key={puff} className={puff ? 'puff' : ''} src={pigImg} alt={t('The glass piggy bank', '玻璃存钱罐')} /></div>
            <div className="fill-pill" style={{ ['--pct' as string]: `${(b.mins / BOX_MINS) * 100}%` }}><span className="pix">{Math.floor(b.mins)} / {BOX_MINS} {t('min', '分钟')}</span><small>{t('to the next pack', '到下一个盲包')}</small></div>
            <div className="bb-line">{full ? t("That's 8 packs today. The piggy bank rests until tomorrow.", '今天已经攒了 8 个盲包。存钱罐休息到明天。') : ZH ? `再做 ${left} 分钟任务，就能得到下一个盲包` : `${left} more minutes of tasks to your next pack`}</div>
            <div className="sub">{t('Short tasks add up, and nothing resets.', '短任务也会累积，什么都不会清零。')}</div>
            <div className="bb-today"><b>{t('Today', '今天')}</b><span>{Array.from({ length: BOX_DAY_MAX }, (_, i) => <i key={i} className={i < b.earned ? 'on' : ''} />)}</span><span className="sub">{b.earned} / {BOX_DAY_MAX}</span></div>
          </div>
          {/* boxes waiting */}
          <div className="bb-panel mid">
            <div className="pix bb-h">{b.ready ? (ZH ? `${b.ready} 个盲包待拆` : `${b.ready} pack${b.ready > 1 ? 's' : ''} ready`) : t('No packs yet', '还没有盲包')}</div>
            <div className="bb-boxes">{b.ready ? Array.from({ length: Math.min(3, b.ready) }, (_, i) => <img key={i} src={`${A}pack_${PACKS[i]}.png`} alt="" style={{ transform: `translate(${(i - (Math.min(3, b.ready) - 1) / 2) * 56}px, ${i % 2 ? 14 : 0}px) rotate(${(i - 1) * 6}deg)`, zIndex: 3 - i }} />)
              : <div className="sub center">{t('Finish an hour of work orders to earn one.', '完成一小时的工作单就能得到一个。')}</div>}</div>
            {b.ready > 0 && <div className="bb-q">{t('What will it be?', '会是什么呢？')}</div>}
            <button className="btn primary bb-open" disabled={!canOpen} onClick={() => { tap(); open(); }}>{t('Open a pack', '拆一个盲包')} · {BOX_COST} {t('coins', '金币')}</button>
            <div className="sub center">{b.ready > 0 && s.coins < BOX_COST ? (ZH ? `还差 ${BOX_COST - s.coins} 金币。` : `You need ${BOX_COST - s.coins} more coins.`) : t("That's 30 minutes of coins. You keep the rest.", '相当于 30 分钟的金币，剩下的归你。')}</div>
            <button className="btn ghost" onClick={() => { tap(); close(); }}>{t('Save for later', '留着以后拆')}</button>
          </div>
          {/* what's inside */}
          <div className="bb-panel inside">
            <div className="between"><div className="pix bb-h">{t("What's inside", '里面有什么')}</div>
              <div className="row bb-tabs">{(['all', 'normal', 'cute', 'secret'] as const).map((t) => <button key={t} className={view === t ? 'chip small on' : 'chip small'} onClick={() => { tap(); setView(t); }}>{t === 'all' ? tAll : TIER[t].label}</button>)}</div></div>
            <div className="bb-tiers">
              {(['normal', 'cute', 'secret'] as Tier[]).filter((t) => view === 'all' || view === t).map((t) => (
                <div key={t} className="bb-tier">
                  <div className="between"><span className="bb-tag" style={{ background: TIER[t].col }}>{TIER[t].label} {TIER[t].pct}</span><span className="sub">{ZH ? `已收集 ${found(t)} / ${total(t)}` : `${found(t)} / ${total(t)} found`}</span></div>
                  <div className="bb-grid">{data?.items.filter((i) => i.tier === t).map((i) => (
                    <span key={i.id} className={`bb-cell${pack[i.id] ? '' : ' unfound'}${t === 'secret' && !pack[i.id] ? ' secret' : ''}`} title={pack[i.id] ? `${i.name}${pack[i.id] > 1 ? ` ×${pack[i.id]}` : ''}` : '???'}>
                      <ItemPic it={i} size={40} hide={!pack[i.id]} />{t === 'secret' && !pack[i.id] && <em>?</em>}{pack[i.id] > 1 && <small>×{pack[i.id]}</small>}
                    </span>))}</div>
                </div>))}
            </div>
          </div>
        </div>
        {/* test controls, only on this page */}
        <div className="bb-test">
          <b>{t('Test controls', '测试按钮')}</b>
          <button className="chip" onClick={() => { tap(); work(15); }}>{t('+15 min of finished work', '+15 分钟已完成的工作')}</button>
          <button className="chip" onClick={() => { tap(); work(60); }}>{t('+1 hour of finished work', '+1 小时已完成的工作')}</button>
          <button className="chip" onClick={() => { tap(); play('coins_many', 0.4); up({ coins: s.coins + 200 }); }}>{t('+200 coins', '+200 金币')}</button>
          <button className="chip" onClick={() => { tap(); up({ blind: { ...b, day: 'reset', earned: 0 } }); }}>{t('New day', '新的一天')}</button>
          <button className="chip" onClick={() => simulate(1000)}>{t('Check the odds (1,000 free draws)', '检查概率（免费抽 1000 次）')}</button>
          <button className="chip" onClick={() => { tap(); up({ pack: {}, blind: { mins: 0, ready: 0, day: '', earned: 0 } }); setSim(null); }}>{t('Start over', '重新开始')}</button>
          {sim && <span className="bb-sim">{TIER.normal.label} {(sim.normal / 10).toFixed(1)}% · {TIER.cute.label} {(sim.cute / 10).toFixed(1)}% · {TIER.secret.label} {(sim.secret / 10).toFixed(1)}%</span>}
        </div>
      {opening && <Opening it={opening} count={pack[opening.id] ?? 1} again={canOpen} next={() => { setOpening(null); setWantNext(true); }} done={() => setOpening(null)} />}
    </>
  );
}

// ---------------- the shop: the catalogue (bought with coins) and the blind boxes, opened from the Shop button ----------------
export default function Shop({ s, up, close, tab: tab0 = 'shop' }: { s: Save; up: (p: Partial<Save>) => void; close: () => void; tab?: 'shop' | 'blind' }) {
  const [tab, setTab] = useState(tab0);
  const ready = piggyToday(s.blind).ready;
  return (
    <div className="bb-dim">
      <div className="card bb">
        {/* an online shop, opened from the computer: a little browser bar on top */}
        <div className="bb-browser"><i /><i /><i /><span>🔒 {t('Little Things · online shop', '小物杂货铺 · 网店')}</span></div>
        <div className="bb-head">
          <div className="pix bb-title">{t('Little Things Shop', '小物杂货铺')}</div>
          <LiquidTabs className="bb-maintabs" value={tab} onChange={setTab} tabs={[{ key: 'shop', label: t('Shop', '商店') }, { key: 'blind', label: <>{t('Blind packs', '盲包')}{ready > 0 && <em>{ready}</em>}</> }]} />
          <div className="bb-coins"><img src={`${import.meta.env.BASE_URL}assets/coin.png`} alt="" /> <b>{s.coins.toLocaleString()}</b></div>
          <button className="bb-x" onClick={() => { tap(); close(); }} aria-label={t('Close', '关闭')}>✕</button>
        </div>
        {tab === 'blind' ? <BlindBoxTab s={s} up={up} close={close} /> : <Catalogue s={s} up={up} />}
      </div>
    </div>
  );
}
const CATS = ['All', 'Desk', 'Shelf', 'Wall', 'Floor', 'Chairs', 'Wallpaper', 'Pets'];
const CAT_LABEL: Record<string, string> = { All: t('All', '全部'), Desk: t('Desk', '桌面'), Shelf: t('Shelf', '架子'), Wall: t('Wall', '墙上'), Floor: t('Floor', '地面'), Chairs: t('Chairs', '椅子'), Wallpaper: t('Wallpaper', '墙纸'), Pets: t('Pets', '宠物') };
function Catalogue({ s, up }: { s: Save; up: (p: Partial<Save>) => void }) {
  const [data, setData] = useState<Item[] | null>(null);
  const [cat, setCat] = useState('All');
  const [just, setJust] = useState<string | null>(null);
  useEffect(() => { loadItems().then((d) => setData(d.items.filter((i: Item) => i.tier === 'shop'))).catch(() => {}); }, []);
  const buy = (it: Item) => {
    if (it.price && s.coins >= it.price) gEmit('bought');
    if (!it.price || s.coins < it.price) return;
    play('purchase', 0.5); up({ coins: s.coins - it.price, pack: { ...s.pack, [it.id]: (s.pack[it.id] ?? 0) + 1 } }); setJust(it.id);
  };
  const list = (data ?? []).filter((i) => cat === 'All' || i.cat === cat).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  return (
    <div className="shop-body">
      <div className="between"><div className="row bb-tabs">{CATS.map((c) => <button key={c} className={cat === c ? 'chip small on' : 'chip small'} onClick={() => { tap(); setCat(c); }}>{CAT_LABEL[c]}</button>)}</div>
        <span className="sub">{t('New things arrive every week. Food and drink are at the bakery.', '每周都有新东西上架。吃的喝的在面包房。')}</span></div>
      <div className="shop-grid">
        {list.map((it) => { const owned = s.pack[it.id] ?? 0, can = s.coins >= (it.price ?? 0); return (
          <div key={it.id} className={`shop-item${just === it.id ? ' just' : ''}`}>
            <div className="shop-pic"><ItemPic it={it} size={60} /></div>
            <b>{it.name}</b>
            <span className="sub">{CAT_LABEL[it.cat ?? ''] ?? it.cat}{owned ? (ZH ? ` · 已有 ${owned} 个` : ` · you have ${owned}`) : ''}</span>
            <button className="btn primary shop-buy" disabled={!can} onClick={() => buy(it)}>
              <img src={`${import.meta.env.BASE_URL}assets/coin.png`} alt="" /> {it.price}</button>
          </div>); })}
      </div>
      <div className="sub">{t('Things you buy go into your backpack. Placing them in your corner comes later in the demo.', '买到的东西会放进背包。把它们摆到你的角落，会在之后的版本里加入。')}</div>
    </div>
  );
}

// ---------------- opening a box: a foil blind pack. Tear the strip off the top (drag it, or just click), ribbons and
// confetti burst out, one card rises, the pack drops away, the card back wiggles (harder for rarer finds) and flips. ----
type Stage = 'in' | 'tear' | 'rise' | 'tease' | 'flip' | 'reveal';
const PACKS = ['lilac', 'pink', 'mint', 'butter'];
// how long the face-down card builds up before it flips: a normal one barely waits, a cute one slowly glows pink,
// a secret one gathers gold and rainbow light for a good while
const TEASE: Record<Tier, number> = { normal: 600, cute: 1800, secret: 3000 };
const STRIP_W = 180;
const RIBBON = ['#ec6f6f', '#f2a65a', '#f2c14e', '#8fd18a', '#7ec4e8', '#9b8ce0', '#f4a6bf'];
function Opening({ it, count, again, next, done }: { it: Item; count: number; again: boolean; next: () => void; done: () => void }) {
  const tier = it.tier as Tier;
  const [stage, setStage] = useState<Stage>('in');
  const [color] = useState(() => PACKS[Math.floor(Math.random() * PACKS.length)]);
  const hero = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const T = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const [bits] = useState(() => Array.from({ length: 46 }, (_, i) => ({
    dx: (Math.random() - 0.5) * 520, up: 160 + Math.random() * 220, fall: 260 + Math.random() * 200, r: (Math.random() - 0.5) * 720,
    c: RIBBON[i % RIBBON.length], s: Math.random() < 0.3 ? 12 : 6, d: Math.random() * 120 })));
  const finish = () => {
    setStage('tear'); play('blindbox_open', 0.5);
    T(650, () => setStage('rise'));
    T(1500, () => setStage('tease'));
    T(1500 + 500 + TEASE[tier], () => { setStage('flip'); play('ui_tap', 0.4); });
    T(1500 + 500 + TEASE[tier] + 650, () => { setStage('reveal'); play(tier === 'secret' ? 'blindbox_secret' : tier === 'cute' ? 'blindbox_cute' : 'coin', 0.6); });
  };
  const { p, snap, handlers } = useTear(STRIP_W, finish);
  // the finished card tilts toward the pointer and its foil shine follows it
  const tilt = (e: React.PointerEvent) => {
    if (stage !== 'reveal' || !hero.current) return;
    const r = hero.current.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    hero.current.style.setProperty('--mx', `${mx * 100}%`); hero.current.style.setProperty('--my', `${my * 100}%`);
    hero.current.style.setProperty('--ry', `${(mx - 0.5) * 22}deg`); hero.current.style.setProperty('--rx', `${(0.5 - my) * 16}deg`);
  };
  // the light show's little bits: motes for a normal find, rising hearts for cute, sparkles for secret
  const [parts] = useState(() => Array.from({ length: tier === 'secret' ? 28 : tier === 'cute' ? 18 : 10 }, () => ({
    x: (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 170), y: (Math.random() - 0.5) * 320, d: Math.random() * 2.4, s: 0.6 + Math.random() * 0.9, h: Math.floor(Math.random() * 360) })));
  const [dust] = useState(() => Array.from({ length: 26 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, d: Math.random() * 6, s: 2 + Math.random() * 3 })));
  const lit = stage === 'tease' || stage === 'flip' || stage === 'reveal';
  const fav = it.fav ? COWORKERS[it.fav as CoworkerId] : null;
  const strip = `${A}pack_${color}_strip.png`;
  return (
    <div className={`bb-open-dim pk ${tier} s-${stage}`} onPointerMove={tilt} style={{ ['--tease' as string]: `${TEASE[tier]}ms` }}>
      {/* a dark velvet stage with drifting dust, so the pack and the card are the only things to look at */}
      <div className="rv-dust">{dust.map((d, i) => <i key={i} style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, animationDelay: `${d.d}s` }} />)}</div>
      {stage === 'reveal' && <div className={`bb-rays ${tier}`} />}
      <div className="pk-hero" ref={hero}>
        {/* the build-up behind the card: a glow in the tier's colour, a turning rainbow ring for a secret, and little bits */}
        {lit && <div className="rv-aura" />}
        {lit && tier === 'secret' && <div className="rv-halo" />}
        {lit && <div className="rv-parts">{parts.map((q, i) => <i key={i} style={{ ['--x' as string]: `${q.x}px`, ['--y' as string]: `${q.y}px`, ['--s' as string]: q.s, ['--h' as string]: q.h, animationDelay: `${q.d}s` }}>{tier === 'cute' ? '♥' : tier === 'secret' ? '✦' : ''}</i>)}</div>}
        {tier === 'secret' && stage === 'flip' && <div className="rv-flash" />}
        {/* ribbons and confetti, out of the top of the pack */}
        {stage !== 'in' && <div className="pk-burst">
          {RIBBON.map((c, i) => <svg key={i} className="pk-ribbon" style={{ ['--a' as string]: `${-54 + i * 18}deg`, animationDelay: `${i * 25}ms` }} viewBox="0 0 24 160" width="24" height="160" shapeRendering="crispEdges">
            <polyline points={Array.from({ length: 17 }, (_, k) => `${12 + Math.round(Math.sin(k * 0.9 + i) * 6)},${160 - k * 10}`).join(' ')} fill="none" stroke={c} strokeWidth="6" /></svg>)}
          {bits.map((b, i) => <i key={i} className="pk-bit" style={{ ['--dx' as string]: `${b.dx}px`, ['--up' as string]: `${-b.up}px`, ['--fall' as string]: `${b.fall}px`, ['--r' as string]: `${b.r}deg`, background: b.c, width: b.s, height: b.s, animationDelay: `${b.d}ms` }} />)}
        </div>}
        {/* the card: back first, then it flips to the find */}
        <div className="pk-card"><div className="pk-flip">
          <div className="pk-face back" style={{ backgroundImage: `url(${A}card_back.png)` }} />
          <div className="pk-face front" style={{ backgroundImage: `url(${A}card_${tier}.png)` }}>
            <div className="pk-win"><ItemPic it={it} size={120} /></div>
            <div className="pk-plate pix">{TIER[tier].label}{tier === 'secret' ? ' ✦' : ''}</div>
            <div className="pk-holo" />
          </div>
        </div></div>
        {/* the pack */}
        <div className="pk-pack" {...handlers}>
          <img className="pk-body" src={`${A}pack_${color}_body.png`} alt={t('A blind pack', '盲包')} draggable={false} />
          <div className={`pk-strip${snap ? ' snap' : ''}`} style={{ ['--p' as string]: p }}>
            <span className="pk-attached" style={{ backgroundImage: `url(${strip})` }} />
            <span className="pk-torn" style={{ backgroundImage: `url(${strip})` }} />
          </div>
          {stage === 'in' && <span className="pk-grab" style={{ opacity: p > 0.05 ? 0 : 1 }}>{t('drag ➜', '拖动 ➜')}</span>}
        </div>
      </div>
      <div className="pk-hint">{stage === 'in' ? t('Drag along the top to tear it open, or just click the pack.', '沿着顶部拖动把它撕开，或者直接点一下盲包。') : stage === 'tease' ? (tier === 'secret' ? t('Golden light… a secret one?!', '金光闪闪……难道是隐藏款？！') : tier === 'cute' ? t("It's glowing pink…", '泛起粉粉的光……') : ' ') : ' '}</div>
      {stage === 'reveal' && <div className="card bb-reveal">
        <span className="bb-tag" style={{ background: TIER[tier].col }}>{TIER[tier].label}{tier === 'secret' ? ' ✦' : ''}</span>
        <div className="pix h1">{it.name}</div>
        <div className="sub">{fav ? (ZH ? `${fav.name}最喜欢的礼物。${it.why}。` : `${fav.name}'s favourite gift. ${it.why}.`) : count > 1 ? (ZH ? `重复了：你现在有 ${count} 个。` : `A repeat: you have ${count} now.`) : t('New! It goes into your backpack.', '新的！已放进你的背包。')}</div>
        {count === 1 && <span className="bb-new">{t('NEW', '新')}</span>}
        <div className="row bb-btns">
          {again && <button className="btn ghost" onClick={() => { tap(); next(); }}>{t('Open another', '再拆一个')} · {BOX_COST} {t('coins', '金币')}</button>}
          <button className="btn primary" onClick={() => { tap(); done(); }}>{t('Done', '完成')}</button>
        </div>
      </div>}
    </div>
  );
}
