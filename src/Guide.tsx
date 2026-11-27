import { useEffect, useRef, useState } from 'react';
import { ZH, t } from './lang';
import { COMPANIES, COWORKERS, Company, CoworkerId } from './data';
import type { Save } from './state';
import { play } from './sfx';

// ---------------- first-day guide: a coach that walks the player through every part of the game ----------------
// Each step frames one thing on screen (a button, a panel, or a spot on the office map), with one short line and a
// pointing hand. Most steps wait for the player to actually do the thing; a few just show something and have an OK.
// Steps move on by themselves when their condition comes true, so the player can also wander off and come back.

const A = `${import.meta.env.BASE_URL}assets/`;
// components that can't be seen from the App's state tell the guide what happened
export const gEmit = (e: string) => window.dispatchEvent(new CustomEvent('guide', { detail: e }));

export interface GCtx {
  s: Save; co: Company; name: string; ev: Set<string>;
  menu: CoworkerId | null; chat: boolean; spot: string | null; shop: string | null; week: boolean; pcOpen: boolean; mail: boolean; peek: boolean;
}
type Rect = [number, number, number, number];                 // x, y, w, h
type Target = { sel: string; pop?: boolean } | { map: Rect } | { npc: CoworkerId } | null;
export interface GStep {
  id: string; at: 'office' | 'desk' | 'any';
  text: (c: GCtx) => string;
  target: (c: GCtx) => Target;
  done?: (c: GCtx) => boolean;      // a "do" step: moves on when this comes true
  ok?: boolean;                     // a "look" step: moves on with the OK button
  hide?: (c: GCtx) => boolean;      // step back while a window of its own is open
  chain?: [string, string][];       // a little picture row: icon and label, joined by arrows (the goal card)
}
const has = (sel: string) => !!document.querySelector(sel);
const spotRect = (at: [number, number], w = 26, h = 26): Rect => [at[0] - w / 2, at[1] - h + 6, w, h];
// a spot on the map, or the button in its bubble once the player has walked up to it
const spotOr = (at: [number, number], kind: string): Target => (has(`.spot-bubble[data-kind=${kind}] .bubble-btn`) ? { sel: `.spot-bubble[data-kind=${kind}] .bubble-btn` } : { map: spotRect(at) });
const hostLine = (c: GCtx) => (ZH ? `去和${COWORKERS[c.co.host].name}打个招呼` : `Go say hi to ${COWORKERS[c.co.host].name}`);
// the way to the practice order, from wherever the player is: desk, computer, Tasklet, the order
const deskPath = (c: GCtx): Target => (c.s.phase === 'free' ? { sel: '.new-order' } : !c.pcOpen ? { sel: '.pc-hot', pop: false } : has('.g-practice') ? { sel: '.g-practice .pc-take' } : { sel: '.pc-icon' });

// why you're here: orders give XP and coins; XP gets you promoted; coins buy blind packs and desk things
const GOAL: [string, string][] = [['📋', t('Orders', '工作单')], ['⭐', t('XP', '经验')], ['⬆️', t('Promotion & raise', '升职加薪')], ['🪙', t('Coins', '金币')], ['🎁', t('Packs & things', '盲包和小东西')]];
export const STEPS: GStep[] = [
  { id: 'goal', at: 'any', text: () => t('Finish orders for XP and coins. Enough XP gets you promoted, and every promotion is a raise. Coins buy blind packs and desk things.', '做工作单赚经验和金币。经验攒满就升职，升职会加薪。金币可以买盲包和小东西。'), target: () => null, ok: true, chain: GOAL },
  // ---- the office
  { id: 'walk', at: 'office', text: () => t('Click the floor to walk', '点地面，走过去'),
    target: (c) => { const [x, y] = c.co.start; return { map: [(x + 2) * 16, (y + 1) * 16, 16, 16] }; }, done: (c) => c.ev.has('walked') },
  { id: 'gift', at: 'office', text: () => t('A gift for you! Walk up and open it', '有份礼物！走过去拆开'),
    target: (c) => spotOr(c.co.surprise.at, 'surprise'), done: (c) => c.s.surprise === 'opened', hide: (c) => c.spot === 'surprise' },
  { id: 'host', at: 'office', text: hostLine,
    target: (c) => ({ npc: c.co.host }), done: (c) => !!c.menu },
  { id: 'chat', at: 'office', text: (c) => (c.menu ? t('Have a chat', '聊两句') : hostLine(c)), target: (c) => (c.menu ? { sel: '.menu .opt' } : { npc: c.co.host }), done: (c) => c.chat },
  { id: 'hearts', at: 'office', text: () => t('Do their orders to fill these hearts', '帮TA做工作单，心会慢慢攒满'), target: (c) => (c.menu ? { sel: '.menu .hearts' } : { npc: c.co.host }), ok: true },
  { id: 'stack', at: 'office', text: () => t("Who's in today? Click to see", '今天谁在？点开看看'), target: () => ({ sel: '.avatar-stack' }), done: (c) => c.ev.has('stack-open') },
  { id: 'coins', at: 'any', text: () => t('Coins: you earn them with orders', '金币：做工作单赚的'), target: () => ({ sel: '.hud-right' }), ok: true },
  { id: 'xp', at: 'any', text: () => t('XP: fill it for a promotion and a raise', '经验：攒满就升职加薪'), target: () => ({ sel: '.hud-left .xp' }), ok: true },
  { id: 'pull', at: 'office', text: () => t('Pull this down', '把这个往下拉'), target: () => ({ sel: '.pull-cap', pop: false }), done: (c) => c.ev.has('pull-open') },
  { id: 'week', at: 'office', text: () => (has('.pull-lock') ? t('After your first week, your week becomes a little journal', '玩满一周后，你的一周会变成一本小手账') : t('Your week, as a little journal', '你的一周，做成了一本小手账')),
    target: () => (has('.pull-lock') ? { sel: '.pull-lock', pop: false } : { sel: '.pull-body .btn', pop: false }), done: (c) => c.week, ok: true },
  { id: 'food', at: 'office', text: (c) => (ZH ? `去${c.co.food.name}看看` : `Visit the ${c.co.food.name.toLowerCase()}`), target: (c) => spotOr(c.co.food.at, 'food'), done: (c) => c.spot === 'food', hide: (c) => c.week },
  { id: 'menu', at: 'office', text: () => t('Treats give a bonus for the day', '点心当天有加成'), target: (c) => (c.spot === 'food' ? { sel: '.bakery-list', pop: false } : spotOr(c.co.food.at, 'food')), ok: true, hide: (c) => !!c.spot && c.spot !== 'food' },
  { id: 'fridge', at: 'office', text: () => t('Something is in the fridge…', '冰箱里好像有东西……'), target: (c) => spotOr(c.co.fridge.at, 'fridge'), done: (c) => c.spot === 'fridge', hide: (c) => !!c.spot },
  { id: 'settings', at: 'any', text: () => t('Sound and settings live here', '声音和设置在这里'), target: () => ({ sel: '.settings-btn' }), ok: true, hide: (c) => !!c.shop || !!c.spot },
  { id: 'desk', at: 'office', text: () => t('Now, your desk', '现在去你的工位'), target: () => ({ sel: '.new-order' }), done: (c) => c.s.phase === 'desk', hide: (c) => !!c.shop || !!c.spot },
  // ---- the desk and the computer
  { id: 'pc', at: 'desk', text: () => t('Your computer', '点电脑'), target: () => ({ sel: '.pc-hot', pop: false }), done: (c) => c.pcOpen },
  { id: 'dock', at: 'desk', text: () => t('Orders, mail, coworkers, blind packs and the online shop all live here', '工作单、信箱、同事、盲包和网店都在电脑里'), target: (c) => (c.pcOpen ? { sel: '.dock', pop: false } : { sel: '.pc-hot', pop: false }), ok: true },
  { id: 'tasklet', at: 'desk', text: () => t('Open Tasklet', '打开任务夹'), target: (c) => (c.pcOpen ? { sel: '.pc-icon' } : { sel: '.pc-hot', pop: false }), done: (c) => c.ev.has('tasklet') || has('.g-practice') },
  { id: 'practice', at: 'desk', text: () => t('A 1-minute practice order', '先接一张 1 分钟练习单'), target: (c) => deskPath(c),
    done: (c) => ['focus', 'work', 'timesup', 'result'].includes(c.s.phase) },
  { id: 'focus', at: 'any', text: () => t('Type what you will do, then start', '写下你要做的事，点开始'), target: (c) => (c.s.phase === 'focus' ? { sel: '.panel .foot .btn.primary' } : deskPath(c)),
    done: (c) => ['work', 'timesup', 'result'].includes(c.s.phase), hide: (c) => c.s.phase === 'tray' },
  { id: 'work', at: 'any', text: (c) => (ZH ? `你专注时，${c.name}在替你干活` : `While you focus, ${c.name} does the order`), target: () => ({ sel: '.focus-card', pop: false }), ok: true, hide: (c) => c.s.phase !== 'work' },
  { id: 'wait', at: 'any', text: () => t('Just one minute… You can stop early, but only a finished order pays', '只要 1 分钟……可以提前结束，但做完才有奖励'), target: () => ({ sel: '.focus-card', pop: false }),
    done: (c) => ['timesup', 'result'].includes(c.s.phase), hide: (c) => c.s.phase !== 'work' },
  { id: 'finish', at: 'any', text: () => t('Done!', '完成啦！'), target: () => ({ sel: '.side .btn.primary' }), done: (c) => c.s.phase === 'result', hide: (c) => c.s.phase !== 'timesup' },
  { id: 'gain', at: 'any', text: () => t('Coins, XP and a heart', '金币、经验和心，到手'), target: () => ({ sel: '.result-wrap .gain', pop: false }), ok: true, hide: (c) => c.s.phase !== 'result' },
  { id: 'piggy', at: 'any', text: () => t('Focus time fills the piggy bank: a pack every hour', '专注攒进存钱罐，满 60 分钟换一个盲包'), target: () => ({ sel: '.peek-line', pop: false }), done: (c) => c.peek, hide: (c) => c.s.phase !== 'result' },
  { id: 'back', at: 'any', text: () => t('Back to your desk', '回工位'), target: () => ({ sel: '.result-wrap .side .btn.primary' }), done: (c) => c.s.phase !== 'result', hide: (c) => c.s.phase !== 'result' },
  { id: 'mail', at: 'desk', text: () => t('You have mail! It comes to your computer', '有你的信！信都寄到电脑里'), target: (c) => (!c.pcOpen ? { sel: '.pc-hot', pop: false } : has('.mb-row.new') ? { sel: '.mb-row.new' } : { sel: '.dock-app[data-key="mail"]' }), done: (c) => c.mail || !c.s.notes.length, hide: (c) => c.s.phase === 'result' },
  { id: 'decor', at: 'desk', text: () => t('Drag things around your desk, or into the backpack', '拖动东西布置工位，或者收进背包'), target: () => ({ sel: '.desk-storage', pop: false }), ok: true, hide: (c) => c.mail },
  { id: 'end', at: 'any', text: () => t("That's all of orientation! Time to clock out and head home", '入职培训全部完成！该下班回家啦'), target: () => null, ok: true, hide: (c) => c.mail, chain: GOAL },
];

// ---- little tips that show up once, at the moment they matter (and only when the first-day guide is done)
export interface Tip { id: string; when: (c: GCtx) => boolean; keep: (c: GCtx) => boolean; steps: GStep[] }
const firstOn = (sel: string) => { const el = [...document.querySelectorAll(sel)].find((e) => !(e as HTMLButtonElement).disabled); if (el) el.setAttribute('data-g', '1'); return el ? `${sel}[data-g="1"]` : sel; };
export const TIPS: Tip[] = [
  { id: 'pack', when: () => has('.bb-open:not([disabled])'), keep: () => has('.bb'),
    steps: [{ id: 'pack-open', at: 'any', text: () => t('You have a pack and enough coins. Open it!', '有盲包，金币也够了：拆开看看！'), target: () => ({ sel: '.bb-open' }), done: (c) => c.ev.has('pack-open') }] },
  { id: 'pack-ready', when: (c) => c.pcOpen && c.s.blind.ready > 0 && !c.shop, keep: (c) => c.pcOpen && !c.shop,
    steps: [{ id: 'pack-app', at: 'any', text: () => t('A blind pack is ready! Open the Blind packs app', '攒够一个盲包啦！打开盲包应用'), target: () => ({ sel: '.dock-app[data-key="blind"]', pop: false }), done: (c) => c.shop === 'blind' }] },
  { id: 'buy', when: () => has('.shop-grid .shop-buy:not([disabled])'), keep: () => has('.shop-grid'),
    steps: [
      { id: 'buy-one', at: 'any', text: () => t('You can afford this one. Buy it!', '金币够了，买一个吧！'), target: () => ({ sel: firstOn('.shop-grid .shop-buy'), pop: false }), done: (c) => c.ev.has('bought') },
      { id: 'buy-where', at: 'any', text: () => t('Bought! It goes into your collection', '买好啦！东西会收进你的收藏'), target: () => null, ok: true },
    ] },
  { id: 'treat', when: (c) => c.spot === 'food' && has('.bakery-list .shop-buy:not([disabled])'), keep: (c) => c.spot === 'food',
    steps: [{ id: 'treat-buy', at: 'any', text: () => t('Enough coins for a treat. Its bonus lasts all day', '金币够买点心了，加成持续一整天'), target: () => ({ sel: firstOn('.bakery-list .shop-buy'), pop: false }), done: (c) => c.ev.has('treat') }] },
  { id: 'gift', when: (c) => !!c.menu && has('.menu .g-gift'), keep: (c) => !!c.menu,
    steps: [{ id: 'gift-give', at: 'any', text: () => t('Share your macarons: +2 friendship', '把马卡龙分给TA：友情 +2'), target: () => ({ sel: '.menu .g-gift' }), done: (c) => c.ev.has('gift') }] },
];

// a step for the wrong room points the way back
const awayStep = (c: GCtx, st: GStep): { text: string; target: Target } | null => {
  if (st.at === 'desk' && c.s.phase === 'free') return { text: t('Back to your desk to carry on', '回工位继续'), target: { sel: '.new-order' } };
  if (st.at === 'office' && c.s.phase === 'desk' && !c.pcOpen) return { text: t('Back to the office to carry on', '回办公室继续'), target: { sel: '.desk-bar .btn' } };
  return null;
};

// where a target sits on the 1280x720 stage
function rectOf(tg: Target, stage: HTMLElement): Rect | null {
  if (!tg) return null;
  const st = stage.getBoundingClientRect(), k = st.width / 1280;
  const toStage = (l: number, tp: number, w: number, h: number): Rect => [(l - st.left) / k, (tp - st.top) / k, w / k, h / k];
  if ('sel' in tg) { const el = document.querySelector(tg.sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? toStage(r.left, r.top, r.width, r.height) : null; }
  const cv = document.querySelector('.office canvas') as HTMLCanvasElement | null; if (!cv) return null;
  const r = cv.getBoundingClientRect(), mk = r.width / 512;
  let m: Rect;
  if ('map' in tg) m = tg.map;
  else {
    const list = (window as unknown as { office?: { list: { id: string; x: number; y: number; state: string }[] } }).office?.list ?? [];
    const n = list.find((x) => x.id === tg.npc); if (!n) return null;
    const [sx, sy] = COWORKERS[tg.npc].seat; m = n.state === 'sit' ? [sx - 10, sy + 4, 20, 30] : [n.x - 10, n.y - 24, 20, 32];
  }
  return toStage(r.left + m[0] * mk, r.top + m[1] * mk, m[2] * mk, m[3] * mk);
}

export function Coach({ c, st, step, total, next, skip, stage, tip }: { c: GCtx; st: GStep | undefined; step: number; total: number; next: () => void; skip: () => void; stage: React.RefObject<HTMLDivElement>; tip?: boolean }) {
  const away = st && !tip ? awayStep(c, st) : null;
  const hidden = !st || (!away && st.hide?.(c));
  const text = away ? away.text : st ? st.text(c) : '';
  const tg = away ? away.target : st ? st.target(c) : null;
  const [r, setR] = useState<Rect | null>(null);
  const popped = useRef<Element | null>(null);
  // targets can change without the App drawing again (a spot's bubble opens, a walker moves): look every frame
  const getTg = useRef(() => tg); getTg.current = () => (away ? away.target : st ? st.target(c) : null);
  useEffect(() => {
    const unpop = () => { popped.current?.classList.remove('g-pop'); popped.current = null; };
    if (hidden) { setR(null); unpop(); return; }
    let raf = 0;
    const loop = () => {
      const cur = getTg.current();
      const nr = stage.current ? rectOf(cur, stage.current) : null;
      setR((o) => (o && nr && Math.abs(o[0] - nr[0]) + Math.abs(o[1] - nr[1]) + Math.abs(o[2] - nr[2]) + Math.abs(o[3] - nr[3]) < 0.5 ? o : nr));
      // the target itself grows a little and pulses
      const el = cur && 'sel' in cur && cur.pop !== false ? document.querySelector(cur.sel) : null;
      if (popped.current !== el) { unpop(); el?.classList.add('g-pop'); popped.current = el; }
      raf = requestAnimationFrame(loop);
    };
    loop(); return () => { cancelAnimationFrame(raf); unpop(); };
  }, [hidden, step, st?.id, !!away]);
  useEffect(() => { if (st && !hidden) play('ui_tap', 0.25); }, [step]);
  if (hidden || !st) return null;
  const P = 10, box = r ? [r[0] - P, r[1] - P, r[2] + P * 2, r[3] + P * 2] : null;
  // the line goes under the frame, or over it when the frame is low on the screen
  const below = box ? box[1] + box[3] < 520 : true;
  const bx = box ? Math.max(16, Math.min(1280 - 376, box[0] + box[2] / 2 - 180)) : 460;
  const by = box ? (below ? box[1] + box[3] + 18 : undefined) : undefined;
  const byB = box && !below ? 720 - box[1] + 18 : undefined;
  return (
    <div className="coach">
      {box ? <div className="coach-hole" style={{ left: box[0], top: box[1], width: box[2], height: box[3] }}><i className="coach-ring" /></div> : <div className="coach-dim" />}
      {box && !st.ok && <div className={`coach-hand${below ? '' : ' up'}`} style={{ left: box[0] + box[2] / 2 - 18, top: below ? box[1] + box[3] - 22 : box[1] - 30 }}>👆</div>}
      <div className={`coach-say${box ? '' : ' mid'}`} style={box ? { left: bx, top: by, bottom: byB } : undefined}>
        <span className="head"><img src={`${A}heads/${COMPANIES[c.s.company].host}.png`} alt="" /></span>
        <b>{text}</b>
        {(st.ok && !away) && <button className="btn primary small" onClick={() => { play('ui_tap', 0.4); next(); }}>{step === total - 1 ? (tip ? t('Got it', '知道啦') : t('Start!', '开始吧！')) : t('OK', '好')}</button>}
        {st.chain && <div className="coach-chain">{st.chain.map(([ic, lb], i) => <span key={i} style={{ animationDelay: `${i * 0.18}s` }}><i>{ic}</i><small>{lb}</small></span>)}</div>}
        <div className="coach-foot"><span className="coach-dots">{tip ? t('Tip', '小提示') : `${step + 1} / ${total}`}</span><button className="linkish" onClick={skip}>{tip ? t('Not now', '先不用') : t('Skip the guide', '跳过引导')}</button></div>
      </div>
    </div>
  );
}
