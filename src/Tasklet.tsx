import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MagnifyDock, TeamAccordion } from './ui';
import { piggyToday } from './BlindBox';
import { hhmm, officeClock, people, statusOf } from './clock';
import { COMPANIES, COWORKERS, CoworkerId, PRACTICE_PAY, coinsAt, pay } from './data';
import { gEmit } from './Guide';
import { Note, Save } from './state';
import { play } from './sfx';
import { ZH, t as tx } from './lang';

const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);
const Head = ({ id, size = 28 }: { id: CoworkerId; size?: number }) => <span className="head" style={{ width: size, height: size }}><img src={`${A}heads/${id}.png`} alt="" /></span>;
const when = (t: number) => {
  const d = new Date(t), now = new Date(), same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const day = same(d, now) ? tx('Today', '今天') : same(d, y) ? tx('Yesterday', '昨天') : ZH ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${day} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

type Pick = NonNullable<Save['picked']>;
// The computer on the player's desk, seen from the chair: a desktop with the Tasklet app on it.
// Tasklet holds the new work orders and everything the character has done. Close the app to get back to the
// desktop; leave the computer to get back to the desk.
type Tab = 'new' | 'past' | 'team';
export default function Computer({ s, name, close, take, openShop, openMail, practice }: { s: Save; name: string; close: () => void; take: (p: Pick) => void; openShop: (t: 'shop' | 'blind') => void; openMail: (n: Note, opened: boolean) => void; practice?: boolean }) {
  const [app, setAppRaw] = useState<Tab | 'mail' | null>(null);
  const setApp = (a: Tab | 'mail' | null) => { if (a === 'new') gEmit('tasklet'); setAppRaw(a); };
  const ready = piggyToday(s.blind).ready;
  const co = COMPANIES[s.company], os = s.company === 'stitchlight' ? tx('Stitch Desk', '织光桌面') : tx('PuffOS', '月芙系统');
  const clock = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="pc-dim">
      <div className="pc">
        <div className="pc-bezel">
          <div className="pc-screen">
            <div className="pc-top"><span className="pix">{os}</span><span>{ZH ? `${name}的工位 · ${co.name}` : `${name}'s desk · ${co.name}`}</span><span>{clock}</span></div>
            <div className="pc-desktop">
              <button className="pc-icon" onClick={() => { tap(); setApp('new'); }}>
                <span className="pc-icon-img"><i /><i /><i /></span><span>{tx('Tasklet', '任务夹')}</span>{/* a number badge here is kept for later: messages from coworkers, not orders you haven't taken */}
              </button>
            </div>
            {app && app !== 'mail' && <Tasklet key={app} s={s} name={name} tab0={app} practice={practice} close={() => { tap(); setApp(null); }} take={take} />}
            {app === 'mail' && <MailApp s={s} name={name} open={openMail} close={() => { tap(); setApp(null); }} />}
            <MagnifyDock open={(k) => (k === 'shop' || k === 'blind' ? openShop(k) : setApp(k as Tab | 'mail'))} apps={[
              { key: 'new', label: tx('Tasklet', '任务夹'), icon: '📥', bg: '#f6d37a', badge: s.tray.length },
              { key: 'mail', label: tx('Mail', '信箱'), icon: '✉️', bg: '#f7c9a6', badge: s.notes.length },
              { key: 'team', label: tx('Coworkers', '同事'), icon: '👥', bg: '#a7d8b8' },
              { key: 'past', label: tx('Past orders', '历史工作单'), icon: '🗂', bg: '#b9c7f2' },
              { key: 'blind', label: tx('Blind packs', '盲包'), icon: '🎁', bg: '#d9c6f4', badge: ready },
              { key: 'shop', label: tx('Shop', '商店'), icon: '🛍', bg: '#f6b9cb' },
            ]} />
          </div>
        </div>
        <div className="pc-stand" />
      </div>
      <button className="btn ghost pc-leave" onClick={() => { tap(); close(); }}>{tx('← Leave the computer', '← 离开电脑')}</button>
    </div>
  );
}

function Tasklet({ s, name, close, take, tab0, practice }: { s: Save; name: string; close: () => void; take: (p: Pick) => void; tab0: Tab; practice?: boolean }) {
  const [tab, setTab] = useState<Tab>(tab0);
  const [own, setOwn] = useState(25);
  const [filter, setFilter] = useState<'all' | CoworkerId>('all');
  const co = COMPANIES[s.company];
  const past = useMemo(() => [...s.history].reverse().filter((h) => filter === 'all' || h.who === filter), [s.history, filter]);
  const done = s.history.filter((h) => h.finished).length, mins = s.history.reduce((a, h) => a + h.worked, 0), coins = s.history.reduce((a, h) => a + h.coins, 0);
  return (
            <div className="pc-win">
              <div className="pc-title"><i /><i /><i /><b>{tx('Tasklet', '任务夹')}</b><button className="pc-x" onClick={close} aria-label={tx('Close Tasklet', '关闭任务夹')}>✕</button></div>
              <div className="pc-body">
                <div className="pc-side">
                  <SideBlob tab={tab} />
                  <button data-t="new" className={tab === 'new' ? 'on' : ''} onClick={() => { tap(); setTab('new'); }}>📥 {tx('New orders', '新工作单')} <em>{s.tray.length}</em></button>
                  <button data-t="past" className={tab === 'past' ? 'on' : ''} onClick={() => { tap(); setTab('past'); }}>🗂 {tx('Past orders', '历史工作单')} <em>{s.history.length}</em></button>
                  <button data-t="team" className={tab === 'team' ? 'on' : ''} onClick={() => { tap(); setTab('team'); }}>👥 {tx('Coworkers', '同事')}</button>
                  <div className="pc-stats">
                    <div><b>{done}</b><span>{tx('finished', '已完成')}</span></div>
                    <div><b>{ZH ? (mins >= 60 ? `${Math.floor(mins / 60)} 小时${mins % 60 ? ` ${mins % 60} 分` : ''}` : `${mins} 分钟`) : mins >= 60 ? `${Math.floor(mins / 60)} hr${mins % 60 ? ` ${mins % 60} min` : ''}` : `${mins} min`}</b><span>{tx('focused', '专注时间')}</span></div>
                    <div><b>{coins.toLocaleString()}</b><span>{tx('coins earned', '赚到的金币')}</span></div>
                  </div>
                </div>
                <div className="pc-main">
                  {tab === 'new' && <>
                    <div className="pc-h">{ZH ? `给${name}的新工作单` : `New orders for ${name}`}</div>
                    <div className="sub">{ZH ? `选一张，再设定你要专注做的事。你忙自己的事时，${name}会去完成这张工作单。` : `Pick one and set your focus. ${name} does the order while you work on your own thing.`}</div>
                    <div className="pc-list">
                      {practice && (() => { const h = COWORKERS[co.host]; return (   // the first-day guide's practice order: one minute
                        <div className="pc-row g-practice">
                          <div className="pc-mins pix">1<small>{tx('min', '分钟')}</small></div>
                          <Head id={h.id} size={34} />
                          <div className="pc-what"><b>{tx('Practice order', '练习单')}</b><span>{ZH ? `${h.name}准备的 · 1 分钟就好` : `From ${h.name} · just one minute`}</span></div>
                          <div className="pc-pay">+{PRACTICE_PAY} {tx('coins', '金币')}<br /><span>{tx('+1/10 heart', '+1/10 颗心')}</span></div>
                          <button className="btn primary pc-take" onClick={() => { tap(); take({ mins: 1, who: h.id, job: 0, practice: true }); }}>{tx('Take', '接单')}</button>
                        </div>); })()}
                      {s.tray.map((t) => { const c = COWORKERS[t.who]; return (
                        <div key={t.mins} className="pc-row">
                          <div className="pc-mins pix">{t.mins}<small>{tx('min', '分钟')}</small></div>
                          <Head id={t.who} size={34} />
                          <div className="pc-what"><b>{c.jobs[t.job].title}</b><span>{ZH ? `帮${c.name} · ${c.role}` : `For ${c.name} · ${c.role}`}</span></div>
                          {s.quiz.focus === t.mins && <span className="suits static">{tx('Suits you', '适合你')}</span>}
                          <div className="pc-pay">+{coinsAt(pay(t.mins), s.xp)} {tx('coins', '金币')}<br /><span>{tx('+1/10 heart', '+1/10 颗心')}</span></div>
                          <button className="btn primary pc-take" onClick={() => { tap(); take({ mins: t.mins, who: t.who, job: t.job }); }}>{tx('Take', '接单')}</button>
                        </div>); })}
                      <div className="pc-row own">
                        <div className="pc-mins pix">{own}<small>{tx('min', '分钟')}</small></div>
                        <span className="head blank" style={{ width: 34, height: 34 }}>⏱</span>
                        <div className="pc-what"><b>{tx('Set your own time', '自己定时间')}</b><span>{tx('5 to 120 minutes · no coworker, so no heart', '5 到 120 分钟 · 不帮同事，所以没有心')}</span>
                          <span className="pc-steps"><button onClick={() => { tap(); setOwn(Math.max(5, own - 5)); }}>−</button><button onClick={() => { tap(); setOwn(Math.min(120, own + 5)); }}>+</button></span></div>
                        <div className="pc-pay">+{coinsAt(pay(own), s.xp)} {tx('coins', '金币')}<br /><span>{tx('no heart', '没有心')}</span></div>
                        <button className="btn primary pc-take" onClick={() => { tap(); take({ mins: own, who: null, job: 0 }); }}>{tx('Take', '接单')}</button>
                      </div>
                    </div>
                    <div className="sub">{tx('New orders arrive after each one you finish.', '每完成一张，就会来新的工作单。')}</div>
                  </>}
                  {tab === 'team' && <><div className="between"><div className="pc-h">{tx('Coworkers', '同事')}</div><span className="sub">{tx('Click a strip to open it', '点一条就能展开')}</span></div><TeamAccordion s={s} /></>}
                  {tab === 'past' && <>
                    <div className="between"><div className="pc-h">{tx('Past orders', '历史工作单')}</div>
                      <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | CoworkerId)}>
                        <option value="all">{tx('Everyone', '所有人')}</option>{co.people.map((k) => <option key={k} value={k}>{COWORKERS[k].name}</option>)}
                      </select></div>
                    {!past.length && <div className="pc-empty">{tx('Nothing here yet. Finished and stopped orders show up here.', '这里还什么都没有。完成或中途停下的工作单都会出现在这里。')}</div>}
                    <div className="pc-list">
                      {past.map((h) => (
                        <div key={h.at} className="pc-row past">
                          <div className="pc-mins pix">{h.mins}<small>{tx('min', '分钟')}</small></div>
                          {h.who ? <Head id={h.who} size={34} /> : <span className="head blank" style={{ width: 34, height: 34 }}>⏱</span>}
                          <div className="pc-what"><b>{h.job}</b><span>{h.who ? (ZH ? `帮${COWORKERS[h.who].name} · ` : `For ${COWORKERS[h.who].name} · `) : ''}{tx('You: ', '你：')}{h.focus}{h.steps ? (ZH ? ` · ${h.stepsDone}/${h.steps} 步` : ` · ${h.stepsDone}/${h.steps} steps`) : ''}</span><small>{when(h.at)}</small></div>
                          <span className={h.finished ? 'pc-res ok' : 'pc-res'}>{h.finished ? tx('Finished', '已完成') : ZH ? `停在 ${h.worked} 分钟` : `Stopped at ${h.worked} min`}</span>
                          <div className="pc-pay">+{h.coins} {tx('coins', '金币')}<br /><span>{h.finished && h.who ? tx('+1/10 heart', '+1/10 颗心') : tx('no heart', '没有心')}</span></div>
                        </div>))}
                    </div>
                  </>}
                </div>
              </div>
            </div>
  );
}

// who's where right now: at their desk working, on a break, at lunch or in a meeting, and when they'll be free
const LABEL = { working: 'Working', break: 'On a break', lunch: 'At lunch', meeting: 'In a meeting' } as const;
function Team({ s }: { s: Save }) {
  const scale = s.fast ? 60 : 1;
  const [clock, setClock] = useState(() => officeClock(scale));
  useEffect(() => { const id = setInterval(() => setClock(officeClock(scale)), 1000); return () => clearInterval(id); }, [scale]);
  return <>
    <div className="between"><div className="pc-h">Coworkers</div><span className="sub">Office time {hhmm(clock)}</span></div>
    <div className="sub">At their desk means they're working. Away from it, they're on a break, at lunch or in a meeting.</div>
    <div className="pc-list">
      {people(s.company).map((id) => { const c = COWORKERS[id], st = statusOf(id, clock); return (
        <div key={id} className="pc-row team">
          <Head id={id} size={34} />
          <div className="pc-what"><b>{c.name}</b><span>{c.role}</span></div>
          <span className={`pc-status ${st.kind}`}><i />{LABEL[st.kind]}</span>
          <div className="pc-when">
            {st.kind === 'working' ? <>At their desk<br /><span>{st.free !== null ? `Next break around ${hhmm(st.free)}` : 'Working all day'}</span></>
              : st.kind === 'meeting' ? <>At {st.where}<br /><span>Free around {hhmm(st.free!)}</span></>
              : <>At {st.where}<br /><span>Back at their desk around {hhmm(st.free!)}</span></>}
          </div>
        </div>); })}
    </div>
  </>;
}

// The chosen sidebar tab and the main panel are one shape: the tab's colour flows into the panel through two soft
// inward curves, with no seam. Its top and bottom follow the chosen tab on springs, so switching looks liquid.
function SideBlob({ tab }: { tab: Tab }) {
  const svg = useRef<SVGSVGElement>(null), path = useRef<SVGPathElement>(null);
  const st = useRef({ t: 0, b: 0, vt: 0, vb: 0, init: false }), raf = useRef(0);
  useLayoutEffect(() => {
    const side = svg.current!.parentElement!, el = side.querySelector<HTMLElement>(`[data-t="${tab}"]`); if (!el) return;
    const W = side.offsetWidth, tt = el.offsetTop, tb = el.offsetTop + el.offsetHeight, s = st.current;
    if (!s.init) { s.t = tt; s.b = tb; s.init = true; }
    const down = tt > s.t, R = 14, r = 10, x0 = 8;
    let last = performance.now();
    const draw = () => { const t = s.t, b = s.b;
      path.current!.setAttribute('d', `M${x0} ${t + r} Q${x0} ${t} ${x0 + r} ${t} L${W - R} ${t} Q${W} ${t} ${W} ${t - R} L${W + 4} ${t - R} L${W + 4} ${b + R} L${W} ${b + R} Q${W} ${b} ${W - R} ${b} L${x0 + r} ${b} Q${x0} ${b} ${x0} ${b - r} Z`); };
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      const kt = down ? 170 : 460, kb = down ? 460 : 170, c = 24;
      s.vt += (-kt * (s.t - tt) - c * s.vt) * dt; s.t += s.vt * dt; s.vb += (-kb * (s.b - tb) - c * s.vb) * dt; s.b += s.vb * dt;
      draw(); if (Math.abs(s.t - tt) + Math.abs(s.b - tb) + Math.abs(s.vt) + Math.abs(s.vb) > 0.4) raf.current = requestAnimationFrame(step);
    };
    draw(); cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [tab]);
  return <svg className="pc-blob" ref={svg} aria-hidden><path ref={path} /></svg>;
}

// ---------------- Mail: the letters coworkers and the company send, as envelopes in a little inbox ----------------
// New letters are sealed (a wax seal in the sender's colour, a stamp, "new"); clicking one opens it with the tear-open
// envelope. Letters you've read stay here, flap open, to read again.
const SEAL: Record<Note['kind'], { c: string; mark: string }> = { thanks: { c: '#e8708a', mark: '♥' }, payday: { c: '#e0a93a', mark: '¢' }, welcome: { c: '#5fb38a', mark: '★' } };
function MailApp({ s, name, open, close }: { s: Save; name: string; open: (n: Note, opened: boolean) => void; close: () => void }) {
  const co = COMPANIES[s.company];
  const fresh = [...s.notes].sort((a, b) => b.id - a.id), kept = s.mailbox;
  const subject = (n: Note) => n.kind === 'payday' ? (ZH ? `发薪日的额外奖励 · ${n.coins} 金币` : `Payday bonus · ${n.coins} coins`)
    : n.kind === 'welcome' ? tx('Welcome to the team, properly', '正式欢迎你加入') : (ZH ? `谢谢你！· ${n.level} 颗心` : `Thank you! · ${n.level} heart${n.level > 1 ? 's' : ''}`);
  const row = (n: Note, isNew: boolean) => { const from = n.from ? COWORKERS[n.from] : null, seal = SEAL[n.kind]; return (
    <button key={n.id} className={`mb-row${isNew ? ' new' : ''}`} onClick={() => { tap(); open(n, !isNew); }}>
      <span className="mb-flap" />
      <span className="mb-seal" style={{ background: seal.c }}>{seal.mark}</span>
      {from ? <Head id={from.id} size={34} /> : <span className="head mb-co pix" style={{ width: 34, height: 34 }}>{co.name.slice(0, 1)}</span>}
      <span className="mb-what"><b>{from ? from.name : co.name}</b><span>{subject(n)}</span></span>
      <span className="mb-when">{when(n.id)}</span>
      <span className="mb-stamp">{isNew ? tx('NEW', '新') : tx('read', '已读')}</span>
    </button>); };
  return (
    <div className="pc-win mb-win">
      <div className="pc-title"><i /><i /><i /><b>{tx('Mail', '信箱')}</b><button className="pc-x" onClick={close} aria-label={tx('Close Mail', '关闭信箱')}>✕</button></div>
      <div className="mb-body">
        <div className="mb-head"><div><div className="pc-h">{ZH ? `${name}的信箱` : `${name}'s mail`}</div>
          <div className="sub">{fresh.length ? (ZH ? `${fresh.length} 封新信，点开看看` : `${fresh.length} new letter${fresh.length > 1 ? 's' : ''}. Click one to open it.`) : tx('All read. Coworkers write when you help them, and payday comes once a week.', '都读完啦。帮同事完成工作单，他们会写信给你；每周还有一次发薪日。')}</div></div>
          <span className="mb-box" aria-hidden><i />{fresh.length > 0 && <em>{fresh.length}</em>}</span></div>
        <div className="mb-list">
          {fresh.map((n) => row(n, true))}
          {kept.length > 0 && <div className="mb-sep">{tx('Letters you kept', '收好的信')}</div>}
          {kept.map((n) => row(n, false))}
          {!fresh.length && !kept.length && <div className="mb-empty">✉<span>{tx('No letters yet', '还没有信')}</span></div>}
        </div>
      </div>
    </div>
  );
}
