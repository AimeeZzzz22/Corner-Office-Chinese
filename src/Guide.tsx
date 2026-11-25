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
}
const has = (sel: string) => !!document.querySelector(sel);
const spotRect = (at: [number, number], w = 26, h = 26): Rect => [at[0] - w / 2, at[1] - h + 6, w, h];
// a spot on the map, or the button in its bubble once the player has walked up to it
const spotOr = (at: [number, number], kind: string): Target => (has(`.spot-bubble[data-kind=${kind}] .bubble-btn`) ? { sel: `.spot-bubble[data-kind=${kind}] .bubble-btn` } : { map: spotRect(at) });
const hostLine = (c: GCtx) => (ZH ? `去和${COWORKERS[c.co.host].name}打个招呼` : `Go say hi to ${COWORKERS[c.co.host].name}`);
// the way to the practice order, from wherever the player is: desk, computer, Tasklet, the order
const deskPath = (c: GCtx): Target => (c.s.phase === 'free' ? { sel: '.new-order' } : !c.pcOpen ? { sel: '.pc-hot', pop: false } : has('.g-practice') ? { sel: '.g-practice .pc-take' } : { sel: '.pc-icon' });

export const STEPS: GStep[] = [
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
  { id: 'xp', at: 'any', text: () => t('XP: fill it to get promoted', '经验：攒满就升职'), target: () => ({ sel: '.hud-left .xp' }), ok: true },
  { id: 'pull', at: 'office', text: () => t('Pull this down', '把这个往下拉'), target: () => ({ sel: '.pull-cap', pop: false }), done: (c) => c.ev.has('pull-open') },
  { id: 'week', at: 'office', text: () => t('Your whole week, in one scroll', '一整周的回顾'), target: () => ({ sel: '.pull-body .btn', pop: false }), done: (c) => c.week },
  { id: 'food', at: 'office', text: (c) => (ZH ? `去${c.co.food.name}看看` : `Visit the ${c.co.food.name.toLowerCase()}`), target: (c) => spotOr(c.co.food.at, 'food'), done: (c) => c.spot === 'food', hide: (c) => c.week },
  { id: 'menu', at: 'office', text: () => t('Treats give a bonus for the day', '点心当天有加成'), target: (c) => (c.spot === 'food' ? { sel: '.bakery-list', pop: false } : spotOr(c.co.food.at, 'food')), ok: true, hide: (c) => !!c.spot && c.spot !== 'food' },
  { id: 'fridge', at: 'office', text: () => t('Something is in the fridge…', '冰箱里好像有东西……'), target: (c) => spotOr(c.co.fridge.at, 'fridge'), done: (c) => c.spot === 'fridge', hide: (c) => !!c.spot },
  { id: 'shop', at: 'any', text: () => t('The shop', '逛逛商店'), target: () => ({ sel: '.shop-btn' }), done: (c) => !!c.shop, hide: (c) => !!c.spot },
  { id: 'shop-in', at: 'any', text: () => t('Desk things, and blind packs', '工位装饰和盲包都在这'), target: (c) => (c.shop ? { sel: '.bb-maintabs', pop: false } : { sel: '.shop-btn' }), ok: true },
  { id: 'settings', at: 'any', text: () => t('Sound and settings live here', '声音和设置在这里'), target: () => ({ sel: '.settings-btn' }), ok: true, hide: (c) => !!c.shop },
  { id: 'desk', at: 'office', text: () => t('Now, your desk', '现在去你的工位'), target: () => ({ sel: '.new-order' }), done: (c) => c.s.phase === 'desk', hide: (c) => !!c.shop },
  // ---- the desk and the computer
  { id: 'pc', at: 'desk', text: () => t('Your computer', '点电脑'), target: () => ({ sel: '.pc-hot', pop: false }), done: (c) => c.pcOpen },
  { id: 'dock', at: 'desk', text: () => t('Orders, coworkers, packs, shop', '工作单、同事、盲包、商店'), target: (c) => (c.pcOpen ? { sel: '.dock', pop: false } : { sel: '.pc-hot', pop: false }), ok: true },
  { id: 'tasklet', at: 'desk', text: () => t('Open Tasklet', '打开任务夹'), target: (c) => (c.pcOpen ? { sel: '.pc-icon' } : { sel: '.pc-hot', pop: false }), done: (c) => c.ev.has('tasklet') || has('.g-practice') },
  { id: 'practice', at: 'desk', text: () => t('A 1-minute practice order', '先接一张 1 分钟练习单'), target: (c) => deskPath(c),
    done: (c) => ['focus', 'work', 'timesup', 'result'].includes(c.s.phase) },
  { id: 'focus', at: 'any', text: () => t('Type what you will do, then start', '写下你要做的事，点开始'), target: (c) => (c.s.phase === 'focus' ? { sel: '.panel .foot .btn.primary' } : deskPath(c)),
    done: (c) => ['work', 'timesup', 'result'].includes(c.s.phase), hide: (c) => c.s.phase === 'tray' },
  { id: 'work', at: 'any', text: (c) => (ZH ? `你专注时，${c.name}在替你干活` : `While you focus, ${c.name} does the order`), target: () => ({ sel: '.focus-card', pop: false }), ok: true, hide: (c) => c.s.phase !== 'work' },
  { id: 'wait', at: 'any', text: () => t('Just one minute…', '只要 1 分钟……'), target: () => ({ sel: '.focus-card .fill-row', pop: false }),
    done: (c) => ['timesup', 'result'].includes(c.s.phase), hide: (c) => c.s.phase !== 'work' },
  { id: 'finish', at: 'any', text: () => t('Done!', '完成啦！'), target: () => ({ sel: '.side .btn.primary' }), done: (c) => c.s.phase === 'result', hide: (c) => c.s.phase !== 'timesup' },
  { id: 'gain', at: 'any', text: () => t('Coins, XP and a heart', '金币、经验和心，到手'), target: () => ({ sel: '.result-wrap .gain', pop: false }), ok: true, hide: (c) => c.s.phase !== 'result' },
  { id: 'piggy', at: 'any', text: () => t('Focus time fills the piggy bank: a pack every hour', '专注攒进存钱罐，满 60 分钟换一个盲包'), target: () => ({ sel: '.peek-line', pop: false }), done: (c) => c.peek, hide: (c) => c.s.phase !== 'result' },
  { id: 'back', at: 'any', text: () => t('Back to your desk', '回工位'), target: () => ({ sel: '.result-wrap .side .btn.primary' }), done: (c) => c.s.phase !== 'result', hide: (c) => c.s.phase !== 'result' },
  { id: 'mail', at: 'any', text: () => t('You have mail!', '你有一封信！'), target: () => ({ sel: '.hud-mail' }), done: (c) => c.mail || !c.s.notes.length, hide: (c) => c.s.phase === 'result' },
  { id: 'decor', at: 'desk', text: () => t('Drag things around your desk, or into the backpack', '拖动东西布置工位，或者收进背包'), target: () => ({ sel: '.desk-storage', pop: false }), ok: true, hide: (c) => c.mail },
  { id: 'end', at: 'any', text: () => t("That's everything! Take a real order whenever you're ready", '全都会啦！准备好了就接一张真正的工作单吧'), target: () => null, ok: true, hide: (c) => c.mail },
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

export function Coach({ c, step, total, next, skip, stage }: { c: GCtx; step: number; total: number; next: () => void; skip: () => void; stage: React.RefObject<HTMLDivElement> }) {
  const st = STEPS[step];
  const away = st ? awayStep(c, st) : null;
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
  }, [hidden, step, !!away]);
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
        {(st.ok && !away) && <button className="btn primary small" onClick={() => { play('ui_tap', 0.4); next(); }}>{step === total - 1 ? t('Start!', '开始吧！') : t('OK', '好')}</button>}
        <div className="coach-foot"><span className="coach-dots">{step + 1} / {total}</span><button className="linkish" onClick={skip}>{t('Skip the guide', '跳过引导')}</button></div>
      </div>
    </div>
  );
}
