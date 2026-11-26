import { useEffect, useMemo, useState } from 'react';
import { COMPANIES, COWORKERS, CoworkerId, TYPE_LABEL, TaskType, coinsAt, pay } from './data';
import { Item, ItemPic, loadItems } from './BlindBox';
import { Past, Save } from './state';
import { Head, fmtMins } from './ui';
import { play } from './sfx';
import { ZH, t } from './lang';

// ---------------- "My week": a bullet-journal spread ----------------
// It unlocks after the first 7 days of play (see App): from then on a "your week" letter arrives in Mail at the start of
// every new week, and the pull-down summary can open the week so far. A taped title, highlighter bars for each day's
// focus with the best day circled, polaroids of who you helped, coin and blind-pack stickers. Everything sticks on one by one.
export const WEEK_MS = 7 * 864e5;
const DAY = ZH ? ['一', '二', '三', '四', '五', '六', '日'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const INK = ['#ffb3c7', '#ffd36e', '#9fe0b8', '#9cc8ff', '#c9b2ff', '#ffb38a', '#a8e6e0'];
const tap = () => play('ui_tap', 0.4);
const range = (start: number) => {
  const a = new Date(start), b = new Date(start + 6 * 864e5);
  return ZH ? `${a.getMonth() + 1}月${a.getDate()}日 – ${b.getMonth() + 1}月${b.getDate()}日` : `${a.getDate()}${a.getMonth() !== b.getMonth() ? ` ${a.toLocaleDateString('en-GB', { month: 'short' })}` : ''} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'short' })}`;
};
// a made-up week, for the sample: a few orders most days, fewer at the weekend, mostly for coworkers
function sampleWeek(s: Save, start: number): Past[] {
  const people = COMPANIES[s.company].people, types: TaskType[] = ['Writing', 'Reading', 'Studying', 'Coding', 'Admin', 'Creative'];
  const plan = [3, 4, 2, 5, 3, 1, 0], out: Past[] = [];
  const notes = ZH ? ['读完论文第 3 章', '写报告初稿', '整理收件箱', '背 30 个单词', '画分镜草图', '回复客户邮件', '复习统计', '做 PPT 前 5 页']
    : ['Read chapter 3 of my thesis', 'Draft the report', 'Clear my inbox', 'Learn 30 new words', 'Sketch the storyboard', 'Reply to client emails', 'Revise statistics', 'First 5 slides of the deck'];
  plan.forEach((n, d) => { for (let k = 0; k < n; k++) {
    const mins = [15, 25, 25, 45, 60][(d * 3 + k) % 5], finished = (d + k) % 6 !== 5, who = (d + k) % 4 === 3 ? null : people[(d * 2 + k) % people.length];
    out.push({ at: start + d * 864e5 + (9 + k * 1.7) * 36e5, mins, worked: finished ? mins : Math.round(mins * 0.6), who, job: '', focus: notes[(d * 3 + k) % notes.length], type: types[(d + k * 2) % types.length], finished,
      coins: finished ? coinsAt(pay(mins), s.xp) : 0, xp: 0, steps: 0, stepsDone: 0 });
  } });
  return out;
}
// a made-up month: four or five sample weeks, a little different each
function sampleMonth(s: Save, m0: number): Past[] {
  const d0 = new Date(m0), days = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate(), out: Past[] = [];
  for (let w = -1; w < 6; w++) { const ws = m0 + w * WEEK_MS - ((d0.getDay() + 6) % 7) * 864e5; sampleWeek(s, ws).forEach((h, i) => { if ((i + w) % 4 !== 0 && h.at >= m0 && h.at < m0 + days * 864e5) out.push(h); }); }
  return out;
}
const fmtDay = (t: number) => { const d = new Date(t); return ZH ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
export function WeekJournal({ s, name, start, sample, close }: { s: Save; name: string; start: number; sample?: boolean; close: () => void }) {
  const co = COMPANIES[s.company], host = COWORKERS[co.host];
  const hist = useMemo(() => (sample ? sampleWeek(s, start) : s.history.filter((h) => h.at >= start && h.at < start + WEEK_MS)), [sample, start]);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<'week' | 'month'>('week');
  useEffect(() => { loadItems().then((d) => setItems(d.items)).catch(() => {}); play('blindbox_open', 0.35); }, []);
  const finds = useMemo(() => {
    if (!items.length) return [];
    if (sample) { const pick = (tier: string, n: number) => items.filter((i) => i.tier === tier).slice(3, 3 + n); return [...pick('normal', 3), ...pick('cute', 2), ...pick('secret', 1)]; }
    return s.finds.filter((f) => f.at >= start && f.at < start + WEEK_MS).map((f) => items.find((i) => i.id === f.id)).filter(Boolean).slice(-6) as Item[];
  }, [items, sample, start]);
  const mins = hist.reduce((a, h) => a + h.worked, 0), done = hist.filter((h) => h.finished), coins = hist.reduce((a, h) => a + h.coins, 0);
  const byDay = DAY.map((_, i) => hist.filter((h) => Math.floor((h.at - start) / 864e5) === i).reduce((a, h) => a + h.worked, 0));
  const top = Math.max(30, ...byDay), best = byDay.indexOf(Math.max(...byDay));
  const who: Record<string, number> = {}; done.forEach((h) => { if (h.who) who[h.who] = (who[h.who] ?? 0) + 1; });
  const friends = (Object.entries(who) as [CoworkerId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const types: Record<string, number> = {}; hist.forEach((h) => { types[h.type] = (types[h.type] ?? 0) + h.worked; });
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] as TaskType | undefined;
  let n = 0; const d = () => ({ ['--d' as string]: `${0.9 + (n++) * 0.12}s` });   // each sticker lands a little after the last
  return (
    <div className="wk" onClick={(e) => { if (e.target === e.currentTarget) { tap(); close(); } }}>
      <button className="bb-x wk-x" onClick={() => { tap(); close(); }} aria-label={t('Close', '关闭')}>✕</button>
      <div className="wk-book" key={tab}>
        <div className="wk-tabs">{(['week', 'month'] as const).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { if (tab !== k) { tap(); setTab(k); } }}>{k === 'week' ? t('This week', '这一周') : t('This month', '这个月')}</button>)}</div>
        {tab === 'month' ? <MonthPages s={s} name={name} start={start} sample={sample} /> : <>
        <div className="wk-page left">
          <i className="wk-tape" />
          <div className="wk-pop wk-titles" style={d()}>
            <div className="wk-hand wk-title">{ZH ? `${name}的一周` : `${name}'s week`}</div>
            <div className="wk-small">{co.name} · {range(start)}</div>
          </div>
          <div className="wk-pop wk-box" style={d()}>
            <div className="wk-label">{t('Focus', '专注')}</div>
            <div className="wk-big pix">{fmtMins(mins)}</div>
            <div className="wk-bars">{byDay.map((m, i) => (
              <span key={i} className={i === best && m > 0 ? 'best' : ''}>
                <i style={{ height: `${Math.max(4, (m / top) * 80)}%`, background: INK[i], ['--d' as string]: `${1.2 + i * 0.08}s` }} />
                <b className="wk-hand">{DAY[i]}</b>
                {i === best && m > 0 && <em className="wk-hand wk-bestnote" style={{ bottom: 28 + (Math.max(4, (m / top) * 80) / 100) * 86 }}>{t('best day!', '最棒的一天！')}</em>}
                {i === best && m > 0 && <svg className="wk-circle" viewBox="0 0 60 40"><path d="M8 22 C6 8 50 4 54 18 C58 32 14 38 7 26 C4 20 14 12 30 11" fill="none" stroke="#e8708a" strokeWidth="2.2" strokeLinecap="round" /></svg>}
              </span>))}</div>
          </div>
          <div className="wk-row">
            <div className="wk-pop wk-stamp" style={d()}><b className="pix">{done.length}</b><span>{t('orders finished', '张工作单完成')}</span></div>
            {topType && <div className="wk-pop wk-tag" style={d()}><span className="wk-label">{t('Mostly', '主要在做')}</span><b className="wk-hand">{TYPE_LABEL[topType]}</b></div>}
          </div>
          {/* what the player actually did: their own words from the focus box */}
          {(() => { const mine = hist.filter((h) => h.focus && h.focus !== t('Focus time', '专注时间')), seen = new Set<string>(), list = mine.filter((h) => !seen.has(h.focus) && seen.add(h.focus)).slice(-3);
            return list.length > 0 && <div className="wk-pop wk-did" style={d()}><div className="wk-label">{t('What you did', '你这周做了什么')}</div>
              {list.map((h, i) => <div key={i} className="wk-hand"><i>{h.finished ? '✓' : '◐'}</i>{h.focus}</div>)}</div>; })()}
        </div>
        <div className="wk-spine" />
        <div className="wk-page right">
          {sample && <span className="wk-sample">{t('SAMPLE', '示例')}</span>}
          <div className="wk-label">{t('Who you helped', '你帮过的人')}</div>
          <div className="wk-polas">{friends.length ? friends.map(([id, k], i) => (
            <div key={id} className="wk-pop wk-pola" style={{ ...d(), ['--r' as string]: `${[-6, 3, -2][i]}deg` }}>
              <i className="wk-tape small" /><Head id={id} size={64} /><b className="wk-hand">{COWORKERS[id].name}</b><small>{ZH ? `${k} 张工作单` : `${k} order${k > 1 ? 's' : ''}`}</small>
            </div>)) : <div className="wk-hand wk-empty">{t('Take an order for a coworker to start a friendship.', '帮同事接一张工作单，开始一段友谊吧。')}</div>}</div>
          <div className="wk-row">
            <div className="wk-pop wk-coin" style={d()}><img src={`${import.meta.env.BASE_URL}assets/coin.png`} alt="" /><b className="pix">+{coins}</b><span>{t('coins earned', '赚到的金币')}</span></div>
            <div className="wk-finds">
              <div className="wk-label">{t('Blind pack finds', '盲包收获')}</div>
              <div className="wk-stickers">{finds.length ? finds.map((it, i) => <span key={i} className={`wk-pop wk-sticker ${it.tier}`} style={{ ...d(), ['--r' as string]: `${(i % 3 - 1) * 7}deg` }}><ItemPic it={it} size={44} /></span>)
                : <span className="wk-hand wk-empty">{t('No packs opened this week.', '这周还没拆盲包。')}</span>}</div>
            </div>
          </div>
          <div className="wk-pop wk-hand wk-sign" style={d()}>{ZH ? `这周辛苦啦，${name}！下周一见。` : `Lovely week, ${name}. See you Monday!`}<br /><span>— {host.name}</span></div>
        </div></>}
      </div>
    </div>
  );
}

// ---------------- the month: a calendar with a highlighter dot on every day you focused, and the month in numbers ----------------
function MonthPages({ s, name, start, sample }: { s: Save; name: string; start: number; sample?: boolean }) {
  const d0 = new Date(start), m0 = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime(), days = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const hist = useMemo(() => (sample ? sampleMonth(s, m0) : s.history.filter((h) => h.at >= m0 && h.at < m0 + days * 864e5)), [sample, m0]);
  const per = Array.from({ length: days }, (_, i) => hist.filter((h) => new Date(h.at).getDate() === i + 1).reduce((a, h) => a + h.worked, 0));
  const top = Math.max(1, ...per), lead = (new Date(m0).getDay() + 6) % 7;
  const mins = hist.reduce((a, h) => a + h.worked, 0), done = hist.filter((h) => h.finished).length, daysOn = per.filter((m) => m > 0).length;
  const longest = hist.reduce<Past | null>((a, h) => (!a || h.worked > a.worked ? h : a), null);
  const types: Record<string, number> = {}; hist.forEach((h) => { types[h.type] = (types[h.type] ?? 0) + h.worked; });
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] as TaskType | undefined;
  const who: Record<string, number> = {}; hist.forEach((h) => { if (h.who && h.finished) who[h.who] = (who[h.who] ?? 0) + 1; });
  const pal = (Object.entries(who) as [CoworkerId, number][]).sort((a, b) => b[1] - a[1])[0];
  const month = ZH ? `${d0.getFullYear()}年${d0.getMonth() + 1}月` : d0.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  let n = 0; const d = () => ({ ['--d' as string]: `${0.5 + (n++) * 0.12}s` });
  return <>
    <div className="wk-page left">
      <i className="wk-tape" />
      {sample && <span className="wk-sample">{t('SAMPLE', '示例')}</span>}
      <div className="wk-pop" style={d()}><div className="wk-hand wk-title">{ZH ? `${name}的这个月` : `${name}'s month`}</div><div className="wk-small">{month}</div></div>
      <div className="wk-cal wk-pop" style={d()}>
        {DAY.map((x, i) => <b key={'h' + i} className="wk-hand">{x}</b>)}
        {Array.from({ length: lead }, (_, i) => <span key={'e' + i} />)}
        {per.map((m, i) => <span key={i} className={m ? 'on' : ''}><small>{i + 1}</small>{m > 0 && <i style={{ background: INK[i % INK.length], scale: `${0.55 + 0.45 * (m / top)}`, ['--d' as string]: `${0.8 + i * 0.03}s` }} />}</span>)}
      </div>
      <div className="wk-small wk-legend">{t('Each dot is a day you focused. Bigger dot, longer focus.', '每个圆点是你专注过的一天，圆点越大，专注越久。')}</div>
    </div>
    <div className="wk-spine" />
    <div className="wk-page right">
      <div className="wk-label">{t('Your month in numbers', '这个月的你')}</div>
      <div className="wk-mgrid">
        <div className="wk-pop wk-mcard" style={d()}><b className="pix">{fmtMins(mins)}</b><span>{t('in focus', '专注总时长')}</span></div>
        <div className="wk-pop wk-mcard" style={d()}><b className="pix">{done}</b><span>{t('orders finished', '完成的工作单')}</span></div>
        <div className="wk-pop wk-mcard" style={d()}><b className="pix">{daysOn}</b><span>{ZH ? `天有专注（共 ${days} 天）` : `days with focus, of ${days}`}</span></div>
        <div className="wk-pop wk-mcard" style={d()}><b className="pix">{longest ? fmtMins(longest.worked) : '–'}</b><span>{longest ? (ZH ? `最长的一次 · ${fmtDay(longest.at)}` : `longest focus · ${fmtDay(longest.at)}`) : t('longest focus', '最长的一次')}</span></div>
      </div>
      <div className="wk-row">
        {topType && <div className="wk-pop wk-tag" style={d()}><span className="wk-label">{t('Mostly', '主要在做')}</span><b className="wk-hand">{TYPE_LABEL[topType]}</b></div>}
        {pal && <div className="wk-pop wk-pola small" style={{ ...d(), ['--r' as string]: '3deg' }}><i className="wk-tape small" /><Head id={pal[0]} size={48} /><b className="wk-hand">{COWORKERS[pal[0]].name}</b><small>{ZH ? `最常帮的人 · ${pal[1]} 张` : `helped most · ${pal[1]}`}</small></div>}
      </div>
      <div className="wk-pop wk-hand wk-sign" style={d()}>{daysOn ? (ZH ? `一个月 ${daysOn} 天，一点一点都算数。` : `${daysOn} days this month. Every bit counts.`) : t('A fresh month. Start whenever you like.', '新的一个月，随时开始都好。')}</div>
    </div>
  </>;
}
