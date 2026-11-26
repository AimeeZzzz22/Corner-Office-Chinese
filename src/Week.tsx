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
  plan.forEach((n, d) => { for (let k = 0; k < n; k++) {
    const mins = [15, 25, 25, 45, 60][(d * 3 + k) % 5], finished = (d + k) % 6 !== 5, who = (d + k) % 4 === 3 ? null : people[(d * 2 + k) % people.length];
    out.push({ at: start + d * 864e5 + (9 + k * 1.7) * 36e5, mins, worked: finished ? mins : Math.round(mins * 0.6), who, job: '', focus: '', type: types[(d + k * 2) % types.length], finished,
      coins: finished ? coinsAt(pay(mins), s.xp) : 0, xp: 0, steps: 0, stepsDone: 0 });
  } });
  return out;
}
export function WeekJournal({ s, name, start, sample, close }: { s: Save; name: string; start: number; sample?: boolean; close: () => void }) {
  const co = COMPANIES[s.company], host = COWORKERS[co.host];
  const hist = useMemo(() => (sample ? sampleWeek(s, start) : s.history.filter((h) => h.at >= start && h.at < start + WEEK_MS)), [sample, start]);
  const [items, setItems] = useState<Item[]>([]);
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
      <div className="wk-book">
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
                {i === best && m > 0 && <em className="wk-hand wk-bestnote" style={{ bottom: 28 + (Math.max(4, (m / top) * 80) / 100) * 124 }}>{t('best day!', '最棒的一天！')}</em>}
                {i === best && m > 0 && <svg className="wk-circle" viewBox="0 0 60 40"><path d="M8 22 C6 8 50 4 54 18 C58 32 14 38 7 26 C4 20 14 12 30 11" fill="none" stroke="#e8708a" strokeWidth="2.2" strokeLinecap="round" /></svg>}
              </span>))}</div>
          </div>
          <div className="wk-row">
            <div className="wk-pop wk-stamp" style={d()}><b className="pix">{done.length}</b><span>{t('orders finished', '张工作单完成')}</span></div>
            {topType && <div className="wk-pop wk-tag" style={d()}><span className="wk-label">{t('Mostly', '主要在做')}</span><b className="wk-hand">{TYPE_LABEL[topType]}</b></div>}
          </div>
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
        </div>
      </div>
    </div>
  );
}
