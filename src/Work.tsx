import { useEffect, useState } from 'react';
import { COMPANIES, COWORKERS, CoworkerId } from './data';
import { Save } from './state';
import { play } from './sfx';
import { ZH, t } from './lang';
import { ChatMsg, MEET_CHOICES, meetIntro, rulesOf } from './work';

const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
const Head = ({ id, size = 56 }: { id: CoworkerId; size?: number }) => <span className="head" style={{ width: size, height: size }}><img src={`${A}heads/${id}.png`} alt="" /></span>;

// ---------------- the one-to-one: the boss asks how you are; three honest answers, each met kindly ----------------
export function Meeting({ s, msg, close }: { s: Save; msg: ChatMsg; close: (choice: string | null) => void }) {
  const r = rulesOf(s), boss = COWORKERS[r.boss], rio = r.boss === 'rio';
  const [pick, setPick] = useState<ReturnType<typeof MEET_CHOICES>[number] | null>(null);
  return (
    <div className="pc-dim mt-dim">
      <div className={`card mt-card${rio ? ' rio' : ''}`}>
        <div className="mt-top"><span className="mt-tag pix">{rio ? t('COFFEE CHAT', '咖啡小聊') : t('ONE-TO-ONE', '一对一约谈')}</span><button className="mt-x" aria-label={t('Later', '稍后')} onClick={() => { tap(); close(null); }}>✕</button></div>
        <div className="mt-room" aria-hidden>{rio ? <><i className="mt-cup" /><i className="mt-cup b" /></> : <><i className="mt-desk" /><i className="mt-lamp" /></>}</div>
        <div className="mt-who"><Head id={boss.id} size={54} /><div><b>{boss.name}</b><small>{boss.role}</small></div></div>
        <p className="mt-say">“{pick ? pick.reply[r.boss as 'margaux' | 'rio'] : meetIntro(r.boss, msg.coins ?? 2, r.minFocus)}”</p>
        {!pick ? <div className="mt-opts">{MEET_CHOICES().map((c) => <button key={c.key} className="opt" onClick={() => { tap(); setPick(c); }}><b>{c.text}</b></button>)}</div>
          : <div className="mt-foot"><span className="sub">{t('No penalty, ever. Your boss just wanted to check in.', '没有任何惩罚，上司只是想关心一下你。')}</span><button className="btn primary" onClick={() => { play('heart_pop', 0.5); close(pick.key); }}>{t('Thanks, see you', '谢谢，回头见')}</button></div>}
      </div>
    </div>
  );
}

// ---------------- going home after orientation, and waking up for day one ----------------
// black screen with a thought → the walk home at night → morning alarm → "Day 1. Start now?" (or stay in bed a bit)
const VIBE_LINE: Record<string, [string, string]> = {
  snacker: ['First stop on the way home: the snack aisle.', '回家路上第一站：零食货架。'],
  napper: ['You could fall asleep standing up on the train.', '在地铁上站着都能睡着。'],
  scroller: ['Phone out. Scrolling the whole ride home.', '掏出手机，一路刷回家。'],
  stretcher: ['One huge stretch at the bus stop. Much better.', '在公交站伸了个超大的懒腰，舒服多了。'],
  spinner: ['You miss the spinny chair already.', '已经开始想念那把转椅了。'],
  plant: ['You tell the plant by the door all about your day.', '回家跟门口的绿植讲了今天的一切。'],
};
type Stage = 'black' | 'night' | 'alarm' | 'ask' | 'bed';
export function GoHome({ s, name, fresh, start }: { s: Save; name: string; fresh: boolean; start: () => void }) {
  const co = COMPANIES[s.company], boss = COWORKERS[rulesOf(s).boss], r = rulesOf(s);
  const [stage, setStage] = useState<Stage>(fresh ? 'black' : 'alarm');
  const [line, setLine] = useState(0);
  const lines = [
    ZH ? `${co.name}的入职培训……终于结束了。` : `Orientation at ${co.name}... finally over.`,
    s.company === 'stitchlight'
      ? (ZH ? `${boss.name}冲你点了一下头。在织光，这已经算是很高的评价了。` : `${boss.name} gave you one small nod. At Stitchlight, that counts as high praise.`)
      : (ZH ? `${boss.name}跟你击掌了两次，还说「明天见啦，${co.role}！」` : `${boss.name} high-fived you twice and said "See you tomorrow, new ${co.role.toLowerCase()}!"`),
    ...(s.vibe && VIBE_LINE[s.vibe] ? [ZH ? VIBE_LINE[s.vibe][1] : VIBE_LINE[s.vibe][0]] : []),
    t('Time to go home and rest.', '终于可以回家休息了。'),
  ];
  useEffect(() => {
    if (stage === 'black') { const id = setTimeout(() => (line < lines.length - 1 ? setLine(line + 1) : setStage('night')), line < lines.length - 1 ? 2200 : 2600); return () => clearTimeout(id); }
    if (stage === 'night') { const id = setTimeout(() => setStage('alarm'), 4200); return () => clearTimeout(id); }
  }, [stage, line]);
  useEffect(() => { if (stage !== 'alarm') return; play('coin', 0.35); const id = setInterval(() => play('ui_tap', 0.5), 700); return () => clearInterval(id); }, [stage]);
  const skip = () => { if (stage === 'black') { if (line < lines.length - 1) setLine(line + 1); else setStage('night'); } else if (stage === 'night') setStage('alarm'); };
  const rule = r.clockIn !== null
    ? (ZH ? `从明天起：工作日 9:00 打卡，每天至少专注 ${r.minFocus} 分钟。今天是第一天，不算迟到。` : `From tomorrow: clock in by 9:00 on weekdays, and focus at least ${r.minFocus} minutes a day. Today is day one, so no clock-in worries.`)
    : (ZH ? `${co.name}不用打卡，只要每天至少专注 ${r.minFocus} 分钟。` : `${co.name} has no clock-in. Just focus at least ${r.minFocus} minutes a day.`);
  return (
    <div className={`gh gh-s-${stage}`} onClick={skip}>
      {stage === 'black' && <div className="gh-lines">{lines.slice(0, line + 1).map((l, i) => <p key={i} className={i === line ? 'now' : ''}>{l}</p>)}<span className="gh-skip">{t('click to continue', '点击继续')}</span></div>}
      {stage === 'night' && <div className="gh-scene" aria-hidden>
        <i className="gh-moon" />{Array.from({ length: 14 }, (_, i) => <i key={i} className="gh-star" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 45}%`, animationDelay: `${(i % 5) * 0.4}s` }} />)}
        <div className="gh-city">{Array.from({ length: 9 }, (_, i) => <b key={i} style={{ height: `${40 + ((i * 29) % 50)}%` }}>{Array.from({ length: 6 }, (_, k) => <em key={k} className={(i + k) % 3 ? '' : 'lit'} />)}</b>)}</div>
        <div className="gh-street" /><div className="gh-walker"><i /></div>
        <p className="gh-cap">{ZH ? `${name}走在回家的路上……` : `${name} heads home...`}</p></div>}
      {(stage === 'alarm' || stage === 'ask' || stage === 'bed') && <div className="gh-room">
        <div className={`gh-window${stage === 'alarm' ? '' : ' day'}`}><i /></div>
        <div className="gh-bed"><span className="gh-pillow" /><span className="gh-blanket" /></div>
        <button className={`gh-clock${stage === 'alarm' ? ' ring' : ''}`} onClick={(e) => { e.stopPropagation(); if (stage === 'alarm') { tap(); setStage('ask'); } }}>
          <span>{stage === 'alarm' ? '07:30' : '07:31'}</span>{stage === 'alarm' && <em>{t('tap to stop the alarm', '点一下关掉闹钟')}</em>}</button>
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
          <div className="gh-btns"><button className="btn primary" onClick={() => { play('coin', 0.5); start(); }}>{t("Okay, I'm up. Let's go", '好啦，起床，出发')}</button></div></div>}
      </div>}
    </div>
  );
}
