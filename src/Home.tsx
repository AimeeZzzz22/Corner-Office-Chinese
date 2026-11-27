// At home, outside office hours (8:00 to 17:00): walk around the flat and do things that make you better at
// your life rather than your job. They earn XP only: no coins, no friendship, no piggy-bank minutes.
import { useEffect, useState } from 'react';
import { ZH, t } from './lang';
import { CLOSE_H, HomeAct, OPEN_H, pay, xpAt } from './data';
import { HomeTask, Save } from './state';
import { play } from './sfx';

type Act = Exclude<HomeAct, 'door'>;
export const ACTS: Record<Act, { emoji: string; title: string; doing: string; ideas: string[] }> = {
  cook: { emoji: '🍳', title: t('Cook something', '做个菜'), doing: t('Cooking', '在做饭'),
    ideas: [t('Try a new recipe', '试一道新菜'), t('Meal-prep tomorrow\'s lunch', '准备明天的午饭'), t('Bake something sweet', '烤点甜的'), t('A proper breakfast', '好好吃个早餐')] },
  read: { emoji: '📖', title: t('Read a book', '看会儿书'), doing: t('Reading', '在看书'),
    ideas: [t('A chapter of a novel', '小说读一章'), t('A book for work', '和工作有关的书'), t('Something in another language', '读点外语'), t('Poems before bed', '睡前读诗')] },
  study: { emoji: '📚', title: t('Learn something', '学点新东西'), doing: t('Studying', '在学习'),
    ideas: [t('An online course', '上一节网课'), t('Language practice', '练外语'), t('Drawing practice', '练习画画'), t('Plan the week', '规划这一周')] },
  workout: { emoji: '💪', title: t('Work out', '健身'), doing: t('Working out', '在健身'),
    ideas: [t('Yoga', '瑜伽'), t('Strength training', '力量训练'), t('A stretch session', '拉伸放松'), t('Dance it out', '跟着音乐跳舞')] },
};
export const isAct = (k: HomeAct): k is Act => k !== 'door';
export const actButton = (k: HomeAct) => (k === 'door' ? t('Head out', '出门') : ACTS[k].title);
export const MINS = [10, 20, 30, 45];
export const homeXp = (mins: number, xp: number) => xpAt(pay(mins), xp);
export const fmtHM = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// the little card for one activity: what to do and for how long
export function ActSheet({ k, s, start, close }: { k: Act; s: Save; start: (task: HomeTask) => void; close: () => void }) {
  const a = ACTS[k]; const [what, setWhat] = useState(a.ideas[0]); const [mins, setMins] = useState(20);
  return (
    <div className="card home-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="hs-head"><i>{a.emoji}</i><div><b className="pix">{a.title}</b><span>{t('At home · for yourself', '在家 · 为自己')}</span></div></div>
      <div className="hs-label">{t('What will you do?', '做什么？')}</div>
      <div className="hs-chips">{a.ideas.map((x) => <button key={x} className={x === what ? 'on' : ''} onClick={() => { play('ui_tap', 0.4); setWhat(x); }}>{x}</button>)}</div>
      <div className="hs-label">{t('For how long?', '多长时间？')}</div>
      <div className="hs-chips mins">{MINS.map((m) => <button key={m} className={m === mins ? 'on' : ''} onClick={() => { play('ui_tap', 0.4); setMins(m); }}>{m} {t('min', '分钟')}</button>)}</div>
      <div className="hs-reward"><span>⭐ +{homeXp(mins, s.xp)} {t('XP', '经验')}</span><small>{t('At home you only earn XP: no coins, no friendship.', '在家只加经验，不加金币和好感度。')}</small></div>
      <div className="hs-btns"><button className="btn ghost" onClick={() => { play('ui_tap', 0.4); close(); }}>{t('Not now', '先不了')}</button>
        <button className="btn primary" onClick={() => { const now = Date.now(); start({ key: k, what, mins, startedAt: now, endsAt: now + (mins * 60000) / (s.fast ? 60 : 1) }); }}>{t('Start', '开始')}</button></div>
    </div>
  );
}

// the running task, as a strip at the bottom of the flat; when time is up (or you stop) it shows the XP
export function HomeTimer({ s, finish }: { s: Save; finish: (finished: boolean) => void }) {
  const task = s.homeTask!; const a = ACTS[task.key as Act]; const [now, setNow] = useState(Date.now());
  const [asking, setAsking] = useState(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const left = task.endsAt - now, done = left <= 0, total = task.endsAt - task.startedAt;
  useEffect(() => { if (done) play('times_up', 0.5); }, [done]);
  const worked = Math.min(task.mins, Math.floor(((Math.min(now, task.endsAt) - task.startedAt) / total) * task.mins));
  const partial = Math.floor((homeXp(task.mins, s.xp) * worked) / task.mins);
  return (
    <div className={'card home-timer' + (done ? ' done' : '')}>
      <i className="ht-emoji">{a.emoji}</i>
      <div className="ht-body">
        <b>{done ? t('Done!', '完成啦！') : `${a.doing}${ZH ? '：' : ': '}${task.what}`}</b>
        {done ? <span>{ZH ? `${task.what}，${task.mins} 分钟。` : `${task.what}, ${task.mins} min.`}</span>
          : <div className="ht-bar" style={{ ['--pct' as string]: `${Math.min(100, ((now - task.startedAt) / total) * 100)}%` }}><em className="pix">{mmss(left * (s.fast ? 60 : 1))}</em></div>}
        {asking && !done && <small className="ht-warn">{ZH ? `现在结束只拿已做时间的经验：+${partial}。` : `Stop now and you keep the XP for the time done: +${partial}.`}</small>}
      </div>
      {done ? <button className="btn primary" onClick={() => finish(true)}>⭐ +{homeXp(task.mins, s.xp)} {t('XP', '经验')}</button>
        : asking ? <div className="ht-btns"><button className="btn ghost" onClick={() => { play('ui_tap', 0.4); setAsking(false); }}>{t('Keep going', '继续')}</button><button className="btn primary" onClick={() => finish(false)}>{t('Stop', '结束')}</button></div>
        : <button className="btn ghost" onClick={() => { play('ui_tap', 0.4); setAsking(true); }}>{t('Stop early', '提前结束')}</button>}
    </div>
  );
}

// the line under "Home" in the corner card
export const homeStatus = (d = new Date()) => {
  const h = d.getHours();
  if (h >= OPEN_H && h < CLOSE_H) return t('The office is open. Head out the front door when you\'re ready.', '公司开门了，准备好就从大门出发吧。');
  return h < OPEN_H ? (ZH ? `公司 ${OPEN_H}:00 开门` : `The office opens at ${OPEN_H}:00`) : (ZH ? `下班时间 · 公司明早 ${OPEN_H}:00 开门` : `Off the clock · the office opens at ${OPEN_H}:00`);
};
