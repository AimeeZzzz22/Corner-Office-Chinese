import { COMPANIES, CoworkerId, CompanyId } from './data';
import { Save } from './state';
import { ZH, t } from './lang';
import { GOAL_LINE, goalMet } from './meetScript';

// ---------------- the job itself: clocking in, a daily minimum, and a boss who checks in ----------------
// Stitchlight keeps office hours: clock in by 9:00 on weekdays, and focus at least 30 minutes a day. Moonpuff is
// looser: no clock-in, but at least an hour of focus a day. Weekends are off. The boss writes in the Chat app on the
// computer: a worried note if you haven't clocked in, a perfect-attendance bonus, and, if you missed the minimum on
// two or more days in a week, an invitation to a short one-to-one. Never a penalty: the boss asks how you are.
export interface WorkRules { clockIn: number | null; grace: number; minFocus: number; boss: CoworkerId }
export const WORK: Record<CompanyId, WorkRules> = {
  stitchlight: { clockIn: 9 * 60, grace: 5, minFocus: 30, boss: 'margaux' },
  moonpuff: { clockIn: null, grace: 0, minFocus: 60, boss: 'rio' },
};
export const ATTENDANCE_BONUS = 60;
export interface ChatMsg { id: number; from: CoworkerId | 'me'; at: number; text: string; kind?: 'late' | 'award' | 'meet' | 'praise' | 'hello'; coins?: number; done?: boolean; replies?: string[] }
export const dayKey = (d = new Date()) => d.toDateString();
export const isWorkday = (d = new Date()) => d.getDay() !== 0 && d.getDay() !== 6;
export const minsNow = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
export const fmtClock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const focusOn = (s: Save, day: string) => s.history.filter((h) => new Date(h.at).toDateString() === day).reduce((a, h) => a + h.worked, 0);
export const rulesOf = (s: Save) => WORK[s.company];
// the work rules start on the player's first real day (after orientation)
export const ruled = (s: Save, d = new Date()) => !!s.day1 && isWorkday(d) && new Date(d.toDateString()).getTime() >= new Date(s.day1).getTime();

// what the boss says, by company: Margaux is precise and a little stern but kind; Rio is relaxed and warm
const LINES = {
  late: {
    margaux: [t("Good morning. I didn't see you clock in at 9. Is everything alright? Did something happen on the way?", '早上好。九点没看到你打卡，一切还好吗？路上出什么事了吗？'),
      t("Morning. No clock-in yet today. Just checking you're alright.", '早。今天还没看到你打卡，确认一下你没事。')],
  },
  lateReply: {
    margaux: [t('Glad you made it. Let me know if mornings are hard.', '你来了就好。早上要是困难，跟我说。')],
  },
  award: {
    margaux: [t('On time every day this week. That is exactly what I like to see. A little perfect-attendance bonus for you.', '这周每天都准时。我就喜欢看到这样。给你一点全勤奖。')],
  },
  praise: {
    margaux: [t('A steady week. Thank you.', '稳稳的一周，谢谢你。')],
    rio: [t('Nice rhythm this week! Keep doing your thing.', '这周节奏很好！继续保持你的步调。')],
  },
  meet: {
    margaux: [t("Do you have ten minutes? Come by my office when you're free. Nothing serious, I just want to hear how you're doing.", '有十分钟吗？有空来我办公室一趟。不是什么严重的事，就是想听听你最近怎么样。')],
    rio: [t("Hey! Grab a coffee with me when you have a sec? Want to hear how things are going for you.", '嘿！有空跟我喝杯咖啡？想听听你最近怎么样。')],
  },
} as const;
const pick = (arr: readonly string[], n: number) => arr[n % arr.length];
export const bossLine = (kind: keyof typeof LINES, boss: CoworkerId, n = 0) => { const set = (LINES[kind] as Record<string, readonly string[]>)[boss] ?? (LINES[kind] as Record<string, readonly string[]>).margaux; return pick(set, n); };
export const QUICK_LATE = () => [t('Sorry, on my way!', '抱歉，在路上了！'), t('All good, just a slow morning.', '没事，只是早上有点慢。')];

// the one-to-one: three honest answers, each met kindly
export const MEET_CHOICES = () => [
  { key: 'busy', text: t('It was a busy week outside work.', '这周工作以外的事比较多。'), reply: { margaux: t("That happens. Thank you for telling me. Let's aim for the minimum again this week; small is fine.", '这很正常，谢谢你告诉我。这周我们再试试达到最低要求，少一点也没关系。'), rio: t('Totally get it. Life happens! Even a short session counts. See you around.', '完全理解，生活总有忙的时候！哪怕短短一会儿也算数。回头见。') } },
  { key: 'tired', text: t("I haven't been feeling great.", '我最近状态不太好。'), reply: { margaux: t('Then rest comes first. Take care of yourself. Come back when you can; your desk will be here.', '那就先休息。照顾好自己，能回来的时候再回来，你的工位一直在。'), rio: t("Oh no, look after yourself first. Work can wait. Ping me if you need anything.", '哎呀，先照顾好自己，工作可以等。需要什么随时找我。') } },
  { key: 'rhythm', text: t('Honestly, I lost my rhythm.', '说实话，我有点没找到节奏。'), reply: { margaux: t('Try this: one short order first thing each day. Rhythm comes back faster than you think.', '试试这样：每天一开始先做一张短的工作单。节奏会比你想的更快回来。'), rio: t('Same here sometimes. Start with a 15-minute order, no pressure. Momentum does the rest.', '我有时候也这样。从一张 15 分钟的工作单开始，没压力，惯性会带着你走。') } },
];
export const meetIntro = (boss: CoworkerId, missed: number, min: number) => boss === 'rio'
  ? (ZH ? `我注意到上周有 ${missed} 天没到每天 ${min} 分钟的专注。不是要批评你，就是想问问你最近还好吗？` : `I noticed last week had ${missed} days under the ${min}-minute focus we aim for. Not a telling-off, I promise. How are you doing?`)
  : (ZH ? `上周有 ${missed} 天没有达到每天 ${min} 分钟的专注要求。我想先问问你，最近怎么样？` : `Last week, ${missed} days were under the ${min}-minute daily focus. Before anything else: how are you doing?`);

// ---- the checks. Each runs at most once per day (late) or once per week (the review), and only adds messages.
export function checkLate(s: Save, now = new Date()): Partial<Save> | null {
  const r = rulesOf(s), day = dayKey(now);
  if (r.clockIn === null || !ruled(s, now) || s.clock[day] !== undefined || s.lateSent === day || day === s.day1) return null;
  if (minsNow(now) <= r.clockIn + 15) return null;
  const n = Object.keys(s.clock).length;
  return { lateSent: day, chat: [...s.chat, { id: Date.now(), from: r.boss, at: Date.now(), text: bossLine('late', r.boss, n), kind: 'late', replies: QUICK_LATE() }] };
}
export function clockIn(s: Save, now = new Date()): Partial<Save> {
  const r = rulesOf(s), day = dayKey(now), m = minsNow(now), late = r.clockIn !== null && m > r.clockIn + r.grace;
  const chat = s.lateSent === day ? [...s.chat, { id: Date.now(), from: r.boss, at: Date.now() + 1, text: bossLine('lateReply', r.boss) }] : s.chat;
  return { clock: { ...s.clock, [day]: m }, chat, ...(late ? {} : {}) };
}
// the weekly review: run on the first visit of a new week, about the week before
export function weekReview(s: Save, weekStartOf: (d: Date) => Date, key: string, force?: 'award' | 'meet'): Partial<Save> | null {
  if (!force && (!s.day1 || s.reviewWeek === key)) return null;
  const r = rulesOf(s), last = weekStartOf(new Date(Date.now() - 7 * 864e5)).getTime();
  const days = Array.from({ length: 5 }, (_, i) => new Date(last + i * 864e5)).filter((d) => d.getTime() >= new Date(s.day1 || 0).getTime());
  const missed = force === 'meet' ? 2 : days.filter((d) => focusOn(s, d.toDateString()) < r.minFocus).length;
  const onTime = force === 'award' || (r.clockIn !== null && days.length >= 3 && days.every((d) => { const c = s.clock[d.toDateString()]; return c !== undefined && c <= r.clockIn! + r.grace; }));
  const msgs: ChatMsg[] = [], now = Date.now();
  let goal = s.goal;
  if (goal && goal.week === new Date(last).toDateString()) {   // the goal from last week's one-to-one: how did it go?
    const g = GOAL_LINE[r.boss as 'margaux' | 'rio'], txt = goal.key === 'rest' ? g.rest : goalMet(s, goal.key, last) ? g.met : g.missed;
    msgs.push({ id: now - 1, from: r.boss, at: now - 1, text: txt, kind: 'praise' }); goal = null;
  }
  if (r.clockIn !== null && onTime) msgs.push({ id: now, from: r.boss, at: now, text: bossLine('award', r.boss), kind: 'award', coins: ATTENDANCE_BONUS });
  if (missed >= 2) msgs.push({ id: now + 1, from: r.boss, at: now + 1, text: bossLine('meet', r.boss), kind: 'meet', coins: missed });
  else if (!force && days.length >= 3 && !onTime) msgs.push({ id: now + 2, from: r.boss, at: now + 2, text: bossLine('praise', r.boss), kind: 'praise' });
  return { reviewWeek: key, goal, chat: [...s.chat, ...msgs] };
}
export const unreadChat = (s: Save) => s.chat.filter((m) => m.from !== 'me' && m.id > s.chatSeen).length;
export const bossOf = (s: Save) => rulesOf(s).boss;
export const companyBoss = (c: CompanyId) => WORK[c].boss;
export const COMPANY_OF = (s: Save) => COMPANIES[s.company];
