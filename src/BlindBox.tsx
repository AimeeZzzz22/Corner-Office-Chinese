import { gEmit } from './Guide';
import { useEffect, useRef, useState } from 'react';
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
// Fairness: a secret is guaranteed within PITY packs; a repeat turns into sparkles, and sparkles swap for any missing item.
export const PITY = 40;
export const SPARK: Record<Tier, number> = { normal: 1, cute: 3, secret: 10 };      // sparkles a repeat gives
export const SWAP: Record<Tier, number> = { normal: 10, cute: 25, secret: 60 };     // sparkles to swap for a missing one
// Series: every blind item belongs to one themed set. Finishing a set pays SET_REWARD once. Each month one set is
// featured, and its items come up twice as often within their tier.
export const SET_REWARD = 150;
export const SERIES: { key: string; name: string; icon: string; ids: string[] }[] = [
  { key: 'cozy', name: t('Cozy corner', '温馨角落'), icon: '🛋', ids: ['velvet_chair', 'floor_lamp', 'rug', 'knit_throw', 'wicker_chair', 'brick', 'sunset_print', 'beanbag', 'lavender_rug', 'sheep_throw', 'lava_lamp', 'heart_cushion', 'star_lights'] },
  { key: 'plants', name: t('Plant friends', '绿植朋友'), icon: '🌿', ids: ['snake_plant', 'botanical_print', 'sage_rug', 'sage_wainscot', 'sage_desk', 'bonsai', 'cactus', 'tulips', 'terrarium', 'odette'] },
  { key: 'pets', name: t('Pet pals', '毛孩子'), icon: '🐾', ids: ['pet_bed', 'pet_hat', 'toy_mouse', 'tiny_scarf', 'yarn_ball', 'cat_print', 'goldfish_bowl', 'pet_bow', 'bean'] },
  { key: 'desk', name: t('Desk life', '工位日常'), icon: '📎', ids: ['alarm_clock', 'desk_fan', 'file_box', 'plaque', 'sticky_notes', 'hourglass', 'letter_board', 'mint_mesh_chair', 'white_desk', 'calendar_board', 'book_riser', 'pegboard', 'mei', 'margaux', 'jonah'] },
  { key: 'sweet', name: t('Sweet things', '甜甜的'), icon: '🍓', ids: ['pastel_bunting', 'gingham', 'snack_organiser', 'polka_dots', 'pink_desk', 'pumpkin_mug', 'rubber_duck', 'heart_garland', 'strawberry_chair', 'strawberry_rug', 'boba_tea', 'priya'] },
  { key: 'studio', name: t('Studio & style', '创作时光'), icon: '🎨', ids: ['film_camera', 'signed_polaroid', 'standing_mirror', 'perfume_tray', 'sketchbook', 'fashion_sketch', 'vanity_mirror', 'sewing_machine', 'record_player', 'dress_form', 'mini_mirror', 'camille', 'ada', 'rio', 'kofi'] },
  { key: 'dreamy', name: t('Dreamy', '梦幻'), icon: '🌙', ids: ['crystal', 'snow_globe', 'winter_lights', 'handheld', 'cloud_chair', 'fairy_riser', 'moon_lamp', 'bunny_plush', 'bunny_chair', 'starry_night', 'floral', 'lucky_cat', 'theo', 'sam'] },
];
export const seriesOf = (id: string) => SERIES.find((x) => x.ids.includes(id.split(':')[1]));
export const featured = (d = new Date()) => SERIES[(d.getFullYear() * 12 + d.getMonth()) % SERIES.length];
function draw(items: Item[], odds: Record<Tier, number>, sinceSecret = 0): Item {
  const r = Math.random(), tier: Tier = sinceSecret >= PITY - 1 ? 'secret' : r < odds.normal ? 'normal' : r < odds.normal + odds.cute ? 'cute' : 'secret';
  const pool = items.filter((i) => i.tier === tier), feat = featured();   // (shop and food items are never in a box)
  const weighted = pool.flatMap((i) => (feat.ids.includes(i.id.split(':')[1]) ? [i, i] : [i]));
  return weighted[Math.floor(Math.random() * weighted.length)];
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
  const [opening, setOpening] = useState<Got[] | null>(null);
  const [want, setWant] = useState(1);
  const [sim, setSim] = useState<Record<Tier, number> | null>(null);
  const [view, setView] = useState<Tier | 'all' | 'series'>('all');
  const [swapFor, setSwapFor] = useState<Item | null>(null);   // a missing item picked to swap sparkles for
  const [wantNext, setWantNext] = useState(false);   // "Open another": opens once the last opening has been saved
  const pack = s.pack;
  const found = (t: Tier) => data ? data.items.filter((i) => i.tier === t && pack[i.id]).length : 0;
  const total = (t: Tier) => data ? data.items.filter((i) => i.tier === t).length : 0;
  const most = Math.min(MAX_AT_ONCE, b.ready, Math.floor(s.coins / BOX_COST));   // how many can be opened right now
  const howMany = Math.max(1, Math.min(want, most));
  const canOpen = most > 0;
  const cell = (i: Item) => { const tr = i.tier as Tier, have = pack[i.id]; return (
    <button key={i.id} className={`bb-cell${have ? '' : ' unfound'}${tr === 'secret' && !have ? ' secret' : ''}${swapFor?.id === i.id ? ' want' : ''}`} title={have ? `${i.name}${have > 1 ? ` ×${have}` : ''}` : t('Missing: click to swap sparkles for it', '还没有：点一下用星屑换')}
      onClick={() => { if (!have) { tap(); setSwapFor(i); } }}>
      <ItemPic it={i} size={40} hide={!have} />{tr === 'secret' && !have && <em>?</em>}{have > 1 && <small>×{have}</small>}
    </button>); };

  const work = (mins: number) => {
    const nb = addMinutes(s.blind, mins); play('piggy_coin_drop', 0.5); setPuff((p) => p + 1);
    if (nb.ready > b.ready) setTimeout(() => play('box_earned', 0.5), 450);
    up({ blind: nb });
  };
  const open = () => {
    gEmit('pack-open');
    if (!data || !canOpen) return;
    const np = { ...pack }, got: Got[] = []; let since = s.sinceSecret, spark = 0;
    for (let i = 0; i < howMany; i++) {
      const it = draw(data.items, data.odds, since); since = it.tier === 'secret' ? 0 : since + 1;
      const isNew = !np[it.id], gain = isNew ? 0 : SPARK[it.tier as Tier]; spark += gain;
      got.push({ it, isNew, spark: gain }); np[it.id] = (np[it.id] ?? 0) + 1;
    }
    up({ coins: s.coins - BOX_COST * howMany, blind: { ...b, ready: b.ready - howMany }, pack: np, sinceSecret: since, sparkles: s.sparkles + spark, finds: [...s.finds, ...got.map((g) => ({ id: g.it.id, at: Date.now() }))].slice(-80) });
    setOpening(got);
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
            <div className="bb-boxes">{b.ready ? Array.from({ length: Math.min(3, b.ready) }, (_, i) => <div key={i} className="bb-mini" style={{ transform: `translate(${(i - (Math.min(3, b.ready) - 1) / 2) * 62}px, ${i % 2 ? 12 : 0}px) rotate(${(i - (Math.min(3, b.ready) - 1) / 2) * 7}deg) scale(.42)`, zIndex: 3 - i }}><PackArt look={LOOKS[i]} n={1} /></div>)
              : <div className="sub center">{t('Finish an hour of work orders to earn one.', '完成一小时的工作单就能得到一个。')}</div>}</div>
            {b.ready > 0 && <div className="bb-howmany"><span>{t('Open', '一次拆')}</span>{Array.from({ length: MAX_AT_ONCE }, (_, i) => i + 1).map((k2) => <button key={k2} className={`chip small${howMany === k2 ? ' on' : ''}`} disabled={k2 > Math.max(1, most)} onClick={() => { tap(); setWant(k2); }}>{k2}</button>)}<span>{t('at once', '个')}</span></div>}
            <button className="btn primary bb-open" disabled={!canOpen} onClick={() => { tap(); open(); }}>{howMany > 1 ? (ZH ? `拆 ${howMany} 个盲包` : `Open ${howMany} packs`) : t('Open a pack', '拆一个盲包')} · {BOX_COST * howMany} {t('coins', '金币')}</button>
            <div className="sub center">{b.ready > 0 && s.coins < BOX_COST ? (ZH ? `还差 ${BOX_COST - s.coins} 金币。` : `You need ${BOX_COST - s.coins} more coins.`) : t("That's 30 minutes of coins. You keep the rest.", '相当于 30 分钟的金币，剩下的归你。')}</div>
            <button className="btn ghost" onClick={() => { tap(); close(); }}>{t('Save for later', '留着以后拆')}</button>
          </div>
          {/* what's inside: by tier, or by series; a missing one can be swapped for sparkles */}
          <div className="bb-panel inside">
            <div className="between"><div className="pix bb-h">{t("What's inside", '里面有什么')}</div>
              <div className="row bb-tabs">{(['all', 'normal', 'cute', 'secret', 'series'] as const).map((v) => <button key={v} className={view === v ? 'chip small on' : 'chip small'} onClick={() => { tap(); setView(v); setSwapFor(null); }}>{v === 'all' ? tAll : v === 'series' ? t('Series', '系列') : TIER[v].label}</button>)}</div></div>
            <div className="bb-fair">
              <span title={t('Repeats turn into sparkles. Swap them for any item you are missing.', '重复的东西会变成星屑，可以换任何还没有的东西。')}>✦ <b>{s.sparkles}</b> {t('sparkles', '星屑')}</span>
              <span>{ZH ? `隐藏款保底：最多再拆 ${PITY - s.sinceSecret} 个` : `Secret guaranteed within ${PITY - s.sinceSecret} pack${PITY - s.sinceSecret > 1 ? 's' : ''}`}</span>
            </div>
            <div className="bb-tiers">
              {view === 'series' ? SERIES.map((se) => { const its = (data?.items ?? []).filter((i) => se.ids.includes(i.id.split(':')[1])), got = its.filter((i) => pack[i.id]).length, done = its.length > 0 && got === its.length, claimed = s.setsClaimed.includes(se.key), feat = featured().key === se.key; return (
                <div key={se.key} className={`bb-tier bb-series${feat ? ' feat' : ''}`}>
                  <div className="between"><span className="bb-sname">{se.icon} <b>{se.name}</b>{feat && <em>{t('This month · 2× likely', '本月主推 · 出现率 ×2')}</em>}</span><span className="sub">{got} / {its.length}</span></div>
                  <div className="bb-sbar"><i style={{ width: `${its.length ? (got / its.length) * 100 : 0}%` }} /></div>
                  {done && !claimed && <button className="btn primary small bb-claim" onClick={() => { play('coins_many', 0.5); up({ coins: s.coins + SET_REWARD, setsClaimed: [...s.setsClaimed, se.key] }); }}>{ZH ? `集齐啦！领取 ${SET_REWARD} 金币` : `Set complete! Collect ${SET_REWARD} coins`}</button>}
                  {done && claimed && <div className="sub">{t('Set complete ✓', '已集齐 ✓')}</div>}
                  <div className="bb-grid">{its.map((i) => cell(i))}</div>
                </div>); })
              : (['normal', 'cute', 'secret'] as Tier[]).filter((tr) => view === 'all' || view === tr).map((tr) => (
                <div key={tr} className="bb-tier">
                  <div className="between"><span className="bb-tag" style={{ background: TIER[tr].col }}>{TIER[tr].label} {TIER[tr].pct}</span><span className="sub">{ZH ? `已收集 ${found(tr)} / ${total(tr)}` : `${found(tr)} / ${total(tr)} found`}</span></div>
                  <div className="bb-grid">{data?.items.filter((i) => i.tier === tr).map((i) => cell(i))}</div>
                </div>))}
            </div>
            {swapFor && <div className="bb-swap"><ItemPic it={swapFor} size={36} hide={swapFor.tier === 'secret'} /><span>{swapFor.tier === 'secret' ? t('A mystery secret', '一件神秘的隐藏款') : swapFor.name}</span>
              <button className="btn primary small" disabled={s.sparkles < SWAP[swapFor.tier as Tier]} onClick={() => { play('purchase', 0.5); up({ sparkles: s.sparkles - SWAP[swapFor.tier as Tier], pack: { ...pack, [swapFor.id]: 1 } }); setSwapFor(null); }}>{ZH ? `用 ${SWAP[swapFor.tier as Tier]} ✦ 换` : `Swap ${SWAP[swapFor.tier as Tier]} ✦`}</button>
              <button className="bb-x small" onClick={() => setSwapFor(null)} aria-label={t('Close', '关闭')}>✕</button></div>}
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
      {opening && <Opening got={opening} again={canOpen} againN={howMany} next={() => { setOpening(null); setWantNext(true); }} done={() => setOpening(null)} />}
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

// ---------------- opening packs: a glossy foil pack with a game thing on it (a sticker). Tear the strip off the top (drag it, or
// just click), rainbow ribbons and confetti burst out, the cards fly up out of the pack, scatter, and settle in a row
// (up to five at once). Then they turn over one by one: a normal one right away, a cute one after glowing pink, a secret
// one after gathering gold light. All the light sits BEHIND the cards, so it never tints them. Each card tilts toward the
// pointer with a soft glare, and a face-down card can be clicked to turn it over sooner. ----
export const MAX_AT_ONCE = 5;
type Look = { key: string; name: string; c: string; d: string; l: string; ink: string; icon: string; sp: string };
// eight packs, each with a game thing on the front as a glossy sticker
export const LOOKS: Look[] = [
  { key: 'cow', name: t('Office cow', '牛马日常'), c: '#ff7f6e', d: '#e0594a', l: '#ffab9e', ink: '#ffffff', icon: 'cow', sp: '#ffe27a' },
  { key: 'horse', name: t('Workhorse', '马不停蹄'), c: '#2fbf9c', d: '#1d9a7c', l: '#72dcbf', ink: '#ffffff', icon: 'horse', sp: '#fff3a0' },
  { key: 'coffee', name: t('Coffee break', '续命咖啡'), c: '#b07d5b', d: '#8c5d40', l: '#d0a283', ink: '#ffffff', icon: 'coffee', sp: '#ffc2d4' },
  { key: 'star', name: t('Star of the month', '本月之星'), c: '#7d4ee6', d: '#5a30bc', l: '#a787f4', ink: '#ffffff', icon: 'star', sp: '#ffe27a' },
  { key: 'moon', name: t('Overtime', '加班到月亮'), c: '#2f3780', d: '#1f245c', l: '#5660b0', ink: '#ffffff', icon: 'moon', sp: '#fff1a8' },
  { key: 'clock', name: t('Clock out on time', '准时下班'), c: '#f7c843', d: '#dca424', l: '#ffe189', ink: '#4a3a10', icon: 'clock', sp: '#ff6f7f' },
  { key: 'gift', name: t('Payday treat', '发薪日'), c: '#f58fb8', d: '#d86894', l: '#fbb9d3', ink: '#ffffff', icon: 'gift', sp: '#fff3a0' },
  { key: 'piggy', name: t('Rainy day fund', '小金库'), c: '#3f8fe0', d: '#2a6cb8', l: '#7db6f0', ink: '#ffffff', icon: 'piggy', sp: '#ffd0dc' },
];
const TEASE: Record<Tier, number> = { normal: 450, cute: 1700, secret: 2800 };
const STRIP_W = 230;
const RIBBON = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];
const zig = (w: number, h: number, edge: 'top' | 'bottom', step = 10, depth = 7) => {
  const pts: string[] = [];
  if (edge === 'top') { for (let x = 0; x <= w; x += step / 2) pts.push(`${x}px ${(x / (step / 2)) % 2 ? 0 : depth}px`); pts.push(`${w}px ${h}px`, `0px ${h}px`); }
  else { pts.push('0px 0px', `${w}px 0px`); for (let x = w; x >= 0; x -= step / 2) pts.push(`${x}px ${h - ((x / (step / 2)) % 2 ? 0 : depth)}px`); }
  return `polygon(${pts.join(',')})`;
};
// where the twinkles sit around the sticker: x, y, size, delay, and whether it's just a dot
const SPARKS: [number, number, number, number, boolean][] = [
  [30, 96, 2, 0, false], [196, 86, 1.4, .7, false], [204, 176, 1.8, 1.3, false], [26, 190, 1.2, 1.9, false], [200, 212, 1, .4, false],
  [54, 76, 1, 1.1, true], [190, 132, 1, 2.2, true], [44, 150, 1, .2, true], [70, 228, 1, 1.6, true]];
// the pack itself, drawn in CSS (glossy foil, crimped ends, a "tear here" strip) around a pixel sticker
export function PackArt({ look, n, face = 0, tearP = 0, snap = false, torn = false, handlers }: { look: Look; n: number; face?: number; tearP?: number; snap?: boolean; torn?: boolean; handlers?: Record<string, unknown> }) {
  const strip = <><div className="ho-crimp" /><span className="ho-tearhere">{t('TEAR TO CLOCK OUT ⟶', '撕开就下班 ⟶')}</span></>;
  return (
    <div className="ho-pack" style={{ ['--c' as string]: look.c, ['--d' as string]: look.d, ['--l' as string]: look.l, ['--ink' as string]: look.ink }} {...handlers}>
      <div className={`ho-body${torn ? ' torn' : ''}`} style={{ clipPath: zig(230, 288, 'bottom') }}>
        <div className="ho-crimp bot" />
        <span className="ho-brand pix">{t('Corner Office', '角落办公室')}</span>
        <span className="ho-series">{look.name.toUpperCase()}</span>
        {/* twinkles and little dots around the sticker, in the pack's own colour */}
        <div className="ho-sparks" style={{ ['--sp' as string]: look.sp }}>{SPARKS.map(([x, y, k, d, dot], i) => <i key={i} className={dot ? 'dot' : ''} style={{ left: x, top: y, ['--k' as string]: k, animationDelay: `${d}s` }} />)}</div>
        <div className={`ho-mascot${face === 1 ? ' tug' : face === 2 ? ' pop' : ''}`} style={{ backgroundImage: `url(${A}icon_${look.icon}.png)`, ["--icon" as string]: `url("${new URL(`${A}icon_${look.icon}.png`, document.baseURI).href}")` }} />
        <span className="ho-foot l">{t('Office blind pack', '打工人盲包')}</span>
        <span className="ho-foot r">{ZH ? `${n} 件工位好物` : `${n} desk find${n > 1 ? 's' : ''}`}</span>
        <div className="ho-gloss" />
      </div>
      <div className={`ho-strip${snap ? ' snap' : ''}`} style={{ ['--p' as string]: tearP }}>
        <div className="ho-strip-part attached" style={{ clipPath: `inset(0 0 0 ${tearP * 100}%)` }}><div className="ho-strip-in" style={{ clipPath: zig(230, 48, 'top') }}>{strip}</div></div>
        <div className="ho-strip-part tornoff" style={{ clipPath: `inset(0 ${(1 - tearP) * 100}% 0 0)` }}><div className="ho-strip-in" style={{ clipPath: zig(230, 48, 'top') }}>{strip}</div></div>
      </div>
    </div>
  );
}
type Stage = 'in' | 'burst' | 'scatter' | 'row';
type Phase = 'down' | 'tease' | 'up';
interface Got { it: Item; isNew: boolean; spark: number }
function Opening({ got, again, againN, next, done }: { got: Got[]; again: boolean; againN: number; next: () => void; done: () => void }) {
  const n = got.length;
  const [stage, setStage] = useState<Stage>('in');
  const [look] = useState(() => LOOKS[Math.floor(Math.random() * LOOKS.length)]);
  const [phase, setPhase] = useState<Phase[]>(() => got.map(() => 'down'));
  const [face, setFace] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const T = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const tierOf = (i: number) => got[i].it.tier as Tier;
  // where each card goes: a row (bigger cards when there are fewer), a loose scatter on the way, and a stack in the pack
  const k = n === 1 ? 1.25 : n <= 3 ? 1 : 0.82, CW = 204 * k, gap = CW + (n <= 3 ? 34 : 18);
  const [scat] = useState(() => got.map(() => ({ x: (Math.random() - 0.5) * 520, y: -80 - Math.random() * 120, r: (Math.random() - 0.5) * 40 })));
  const place = (i: number) => {
    const off = i - (n - 1) / 2;
    if (stage === 'in') return { x: 0, y: 140, r: 0, s: 0.6 * k, o: 0 };
    if (stage === 'burst') return { x: off * 14, y: -205 - i * 8, r: off * 5, s: 0.78 * k, o: 1 };
    if (stage === 'scatter') return { x: scat[i].x, y: scat[i].y, r: scat[i].r, s: 0.92 * k, o: 1 };
    return { x: off * gap, y: Math.abs(off) * 10 - 30, r: off * 3, s: k, o: 1 };
  };
  const tf = (q: ReturnType<typeof place>) => `translate(${q.x}px, ${q.y}px) rotate(${q.r}deg) scale(${q.s})`;
  // tearing: the sticker wobbles while you pull, and hops once it's open; the burst, the scatter and the row follow
  const finish = () => {
    setFace(2); setStage('burst'); play('blindbox_open', 0.5);
    T(750, () => setStage('scatter'));
    T(1450, () => setStage('row'));
  };
  const { p, snap, handlers } = useTear(STRIP_W, finish);
  useEffect(() => { if (stage === 'in') setFace(p > 0.02 ? 1 : 0); }, [p, stage]);
  // the turn-overs: one at a time, left to right, each after its own build-up
  const turn = (i: number, ms: number) => {
    setPhase((ph) => ph.map((v, j) => (j === i ? 'tease' : v)));
    T(ms, () => { setPhase((ph) => ph.map((v, j) => (j === i ? 'up' : v))); const tr = tierOf(i); play(tr === 'secret' ? 'blindbox_secret' : tr === 'cute' ? 'blindbox_cute' : 'coin', 0.55); });
  };
  useEffect(() => {
    if (stage !== 'row' || phase.includes('tease')) return;
    const i = phase.indexOf('down'); if (i < 0) return;
    const id = window.setTimeout(() => turn(i, TEASE[tierOf(i)]), i === 0 && phase.every((v) => v === 'down') ? 900 : 380);
    return () => clearTimeout(id);
  }, [stage, phase]);
  const allUp = phase.every((v) => v === 'up');
  const teasing = phase.map((v, i) => (v === 'tease' ? tierOf(i) : null)).find((v) => v && v !== 'normal');
  // the pack and the cards lean toward the pointer, the glare follows it
  const lean = (e: React.PointerEvent) => {
    const el = scene.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', `${((e.clientX - r.left) / r.width - 0.5).toFixed(3)}`); el.style.setProperty('--py', `${((e.clientY - r.top) / r.height - 0.5).toFixed(3)}`);
  };
  const cardLean = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget, r = el.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${mx * 100}%`); el.style.setProperty('--my', `${my * 100}%`);
    el.style.setProperty('--ry', `${(mx - 0.5) * 24}deg`); el.style.setProperty('--rx', `${(0.5 - my) * 18}deg`);
  };
  const cardLeave = (e: React.PointerEvent<HTMLDivElement>) => { const el = e.currentTarget; el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); };
  const [bits] = useState(() => Array.from({ length: 60 }, (_, i) => ({
    dx: (Math.random() - 0.5) * 760, up: 220 + Math.random() * 300, fall: 380 + Math.random() * 260, r: (Math.random() - 0.5) * 900,
    c: RIBBON[i % RIBBON.length], w: Math.random() < 0.35 ? 12 : 8, h: Math.random() < 0.5 ? 5 : 9, d: Math.random() * 160 })));
  const [parts] = useState(() => got.map((g) => Array.from({ length: g.it.tier === 'secret' ? 16 : g.it.tier === 'cute' ? 10 : 0 }, () => ({
    x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 340, d: Math.random() * 2.2, s: 0.6 + Math.random() * 0.8 }))));
  const news = got.filter((g) => g.isNew).length;
  return (
    <div className={`ho-scene s-${stage}${allUp ? ' all-up' : ''}`} ref={scene} onPointerMove={lean}>
      <div className="ho-dust" />
      <div className="ho-hint">{stage === 'in' ? t('Drag along the top to tear it open, or just click the pack.', '沿着顶部拖动把它撕开，或者直接点一下盲包。')
        : teasing === 'secret' ? t('Golden light… a secret one?!', '金光闪闪……难道是隐藏款？！') : teasing === 'cute' ? t("It's glowing pink…", '泛起粉粉的光……')
        : stage === 'row' && !allUp ? t('Click a card to turn it over sooner.', '点一下卡片可以提前翻开。') : ' '}</div>
      <div className="ho-stage">
        {/* the light, in its own layer behind every card */}
        <div className="ho-glows">{got.map((g, i) => { const tr = g.it.tier as Tier, q = place(i), lit = phase[i] !== 'down'; return (
          <div key={i} className={`ho-glow ${tr}${lit ? ' lit' : ''}${phase[i] === 'up' ? ' up' : ''}`} style={{ transform: `translate(${q.x}px, ${q.y}px) scale(${q.s})`, ['--tease' as string]: `${TEASE[tr]}ms` }}>
            {lit && tr !== 'normal' && <div className="ho-aura" />}
            {lit && tr === 'secret' && <><div className="ho-rays" /><div className="ho-halo"><b /><b /><b /></div></>}
            {lit && tr === 'normal' && phase[i] === 'up' && <div className="ho-aura soft" />}
            {lit && parts[i].length > 0 && <div className="ho-parts">{parts[i].map((m, j) => <i key={j} style={{ left: m.x, top: m.y, animationDelay: `${m.d}s`, fontSize: `${18 * m.s}px` }}>{tr === 'cute' ? '♥' : '✦'}</i>)}</div>}
          </div>); })}</div>
        {/* ribbons and confetti, out of the top of the pack */}
        {stage !== 'in' && <div className="ho-burst">
          {RIBBON.map((c, i) => <svg key={i} className="ho-ribbon" style={{ ['--a' as string]: `${-48 + i * 16}deg`, animationDelay: `${i * 30}ms` }} viewBox="0 0 40 420" width="40" height="420">
            <path d={`M20 420 ${Array.from({ length: 14 }, (_, k2) => `Q ${20 + (k2 % 2 ? -14 : 14)} ${420 - k2 * 30 - 15} 20 ${420 - (k2 + 1) * 30}`).join(' ')}`} fill="none" stroke={c} strokeWidth="11" strokeLinecap="round" /></svg>)}
          {bits.map((q, i) => <i key={i} className="ho-bit" style={{ ['--dx' as string]: `${q.dx}px`, ['--up' as string]: `${-q.up}px`, ['--fall' as string]: `${q.fall}px`, ['--r' as string]: `${q.r}deg`, background: q.c, width: q.w, height: q.h, animationDelay: `${q.d}ms` }} />)}
        </div>}
        {/* the cards */}
        {got.map((g, i) => { const tr = g.it.tier as Tier, q = place(i); return (
          <div key={i} className={`ho-slot ${tr} ${phase[i]}`} style={{ transform: tf(q), opacity: q.o, transitionDelay: `${stage === 'row' ? i * 60 : stage === 'burst' ? i * 50 : 0}ms`, zIndex: stage === 'row' ? 10 + i : 10 + n - i }}>
            <div className={`ho-card${phase[i] === 'down' && stage === 'row' ? ' clickable' : ''}`} onPointerMove={cardLean} onPointerLeave={cardLeave}
              onClick={() => { if (stage === 'row' && phase[i] === 'down') { play('ui_tap', 0.4); turn(i, Math.min(TEASE[tr], tr === 'secret' ? 1400 : 700)); } }}>
              <div className="ho-flip">
                <div className="ho-face back" style={{ backgroundImage: `url(${A}card_back.png)` }} />
                <div className="ho-face front" style={{ backgroundImage: `url(${A}card_${tr}.png)` }}>
                  <div className="pk-win"><ItemPic it={g.it} size={120} /></div>
                  <div className="pk-plate pix">{TIER[tr].label}{tr === 'secret' ? ' ✦' : ''}</div>
                  <div className="ho-glare" />
                </div>
              </div>
            </div>
            {phase[i] === 'up' && <div className="ho-name"><b>{g.it.name}</b>{g.isNew ? <em>{t('NEW', '新')}</em> : <em className="spark">+{g.spark} ✦</em>}</div>}
          </div>); })}
        {/* the pack: tilts toward the pointer, then drops away once the cards are out */}
        <div className="ho-packwrap"><div className="ho-tilt"><PackArt look={look} n={n} face={face} tearP={p} snap={snap} torn={stage !== 'in'} handlers={stage === 'in' ? handlers : undefined} /></div><div className="ho-shadow" /></div>
      </div>
      <div className="ho-bar">
        {allUp ? <>
          <span className="ho-sum">{ZH ? (news ? `${news} 件新东西放进了背包` : '都放进了背包') : news ? `${news} new thing${news > 1 ? 's' : ''} in your backpack` : 'All in your backpack'}{n - news > 0 ? (ZH ? `，重复的变成了 ${got.reduce((a, g) => a + g.spark, 0)} 个星屑 ✦` : `, repeats became ${got.reduce((a, g) => a + g.spark, 0)} sparkles ✦`) : ''}</span>
          {again && <button className="btn ghost" onClick={() => { tap(); next(); }}>{ZH ? `再拆 ${againN} 个` : `Open ${againN} more`} · {againN * BOX_COST} {t('coins', '金币')}</button>}
          <button className="btn primary" onClick={() => { tap(); done(); }}>{t('Done', '完成')}</button>
        </> : stage === 'row' ? <button className="btn ghost small ho-skip" onClick={() => { tap(); setPhase((ph) => ph.map(() => 'up')); }}>{t('Turn them all over', '全部翻开')}</button> : null}
      </div>
    </div>
  );
}
