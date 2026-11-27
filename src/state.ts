import { ChatMsg } from './work';
import { ZH } from './lang';
import { COMPANIES, COWORKERS, COWORKER_IDS, CompanyId, CoworkerId, SLIP_MINS, TaskType, HomeAct } from './data';
import { DEFAULT_LOOK, Look, fixLook } from './look';
import { Focus, Reminders, SoundMode } from './obdata';
import { freeSlot } from './deskSlots';

export interface Slip { mins: number; who: CoworkerId; job: number }
export interface Order {
  mins: number; who: CoworkerId | null; jobTitle: string; doing: string;
  focus: string; type: TaskType; steps: { text: string; done: boolean }[];
  startedAt: number; endsAt: number;          // timestamps, so the timer survives a reload or a closed tab
  practice?: boolean;                         // the guide's 1-minute practice order
}
export interface Result { finished: boolean; coins: number; xp: number; promoted?: number; bonus?: string[]; who: CoworkerId | null; heartBefore: number; heartAfter: number; minutes: number }
// onboarding: offer letter -> first-day look -> welcome tour -> badge photo -> work vibe -> work style quiz -> first work order
// one finished or stopped work order, kept for the desk computer's history
// a letter in the mail: a coworker's thank-you when a new heart fills, or the end-of-week payday envelope
export interface Note { id: number; kind: 'thanks' | 'payday' | 'welcome' | 'recap' | 'birthday'; from: CoworkerId | null; level: number; coins: number; week: string }
export interface Past { at: number; mins: number; worked: number; who: CoworkerId | null; job: string; focus: string; type: TaskType; finished: boolean; coins: number; xp: number; steps: number; stepsDone: number }
export type Phase = 'offer' | 'tour' | 'booth' | 'badge' | 'vibe' | 'quiz' | 'gifts' | 'desk' | 'home' | 'house' | 'free' | 'tray' | 'focus' | 'work' | 'timesup' | 'result';
export interface HomeTask { key: HomeAct; what: string; mins: number; startedAt: number; endsAt: number; stopped?: number }
export interface HomeDone { at: number; key: HomeAct; what: string; mins: number; worked: number; xp: number; finished: boolean }
export interface Save {
  v: 1; name: string; coins: number; xp: number; company: CompanyId;
  hearts: Record<CoworkerId, number>; ordersDone: Record<CoworkerId, number>;
  tray: Slip[]; picked: { mins: number; who: CoworkerId | null; job: number; practice?: boolean } | null;
  tipsSeen: string[];   // the one-time tips already shown (Guide.tsx TIPS)
  guide: number;   // the first-day guide: the step it's on, or -1 when it's done or skipped (see Guide.tsx)
  order: Order | null; result: Result | null; phase: Phase;
  fast: boolean; sound: boolean;              // fast: demo speed, 1 minute = 1 second
  labelsBy: Partial<Record<CompanyId, string[]>>;   // walk labels edited in the demo, per office; missing = the map's own labels
  look: Look; pet: string; badgeNo: string;
  birthday: { m: number; d: number } | null;   // d = 0 while the day isn't picked yet
  vibe: string | null; vibeDraws: number;     // up to 2 redraws, then the vibe is set for good
  quiz: { focus: Focus | null; sound: SoundMode | null; reminders: Reminders | null };
  tourStop: number; firstOrder: boolean; lookDone: boolean;
  history: Past[];
  // at home after hours: one self-improvement task at a time (XP only), and a log of them
  homeTask: HomeTask | null; homeLog: HomeDone[];
  // lookDone: the first-day look was picked (the booth then works as a retake)
  desk: string[];     // starter gifts already unwrapped
  place: Record<string, string | null>;
  // the piggy bank: minutes of finished work toward the next blind box, boxes waiting to be opened, and today's count
  blind: { mins: number; ready: number; day: string; earned: number };
  pack: Record<string, number>;
  sinceSecret: number; sparkles: number; setsClaimed: string[];
  plantDays: number; plantLast: string; lastSeen: number;
  bdayYear: number;
  day1: string; clock: Record<string, number>; lateSent: string; reviewWeek: string;   // the first real workday; clock-in time (minutes after midnight) by day; work-rule checks already done
  chat: ChatMsg[]; chatSeen: number;
  goal: { key: 'min3' | 'short' | 'morning' | 'rest'; week: string } | null; meets: number;   // the small goal set at the last one-to-one (checked the next week); one-to-ones so far        // messages in the Chat app (the boss), and the newest one already seen                          // the last year the birthday card came   // days with a finished order (the desk plant grows on them), the last such day; when the player was last here   // packs since the last secret (a secret is guaranteed by 40), sparkles from repeats, finished series already rewarded
  treats: { day: string; have: string[]; used: string[] };   // today's food and drink; used = bonuses already spent today
  fridge: { day: string; item: string | null; fortune: number };   // what (if anything) is in the fridge today
  notes: Note[]; mailbox: Note[]; payWeek: string;
  started: number; recapWeek: string;        // when this save first started; the last week a "your week" letter was sent (the recap unlocks after 7 days)
  finds: { id: string; at: number }[];       // blind pack finds with their time, for the weekly journal (the newest 80)   // letters waiting in the mail (thank-you notes, payday), and the last week that was paid
  surprise: 'none' | 'waiting' | 'opened';   // the welcome gift in the office, after onboarding   // things won from blind boxes, with how many of each   // where each unwrapped item is: a slot id (see deskSlots.ts), or null when it's in storage
}

const zero = () => Object.fromEntries(COWORKER_IDS.map((k) => [k, 0])) as Record<CoworkerId, number>;
// Each coworker owns their own tasks; only which length their order lands on is random.
export function newTray(company: CompanyId): Slip[] {
  const ids = [...COMPANIES[company].people].sort(() => Math.random() - 0.5).slice(0, SLIP_MINS.length);
  return SLIP_MINS.map((mins, i) => ({ mins, who: ids[i], job: Math.floor(Math.random() * COWORKERS[ids[i]].jobs.length) }));
}
export const fresh = (): Save => {
  const company: CompanyId = Math.random() < 0.5 ? 'stitchlight' : 'moonpuff';      // the offer letter comes from a random company
  return { v: 1, name: '', coins: 0, xp: 0, company, hearts: zero(), ordersDone: zero(), tray: newTray(company), picked: null, order: null, result: null, phase: 'offer', fast: false, sound: true, labelsBy: {},
    look: { ...DEFAULT_LOOK }, pet: 'orange_cat', birthday: null, badgeNo: `${String(Math.floor(Math.random() * 9000) + 1000)}`, vibe: null, vibeDraws: 0,
    quiz: { focus: null, sound: null, reminders: null }, tourStop: 0, firstOrder: true, lookDone: false, history: [], desk: [], place: {}, blind: { mins: 0, ready: 0, day: '', earned: 0 }, pack: {}, treats: { day: '', have: [], used: [] }, fridge: { day: '', item: null, fortune: 0 }, surprise: 'none', notes: [], mailbox: [], payWeek: '', started: Date.now(), recapWeek: '', finds: [], sinceSecret: 0, sparkles: 0, setsClaimed: [], plantDays: 0, plantLast: '', lastSeen: Date.now(), bdayYear: 0, day1: '', clock: {}, lateSent: '', reviewWeek: '', chat: [], chatSeen: 0, goal: null, meets: 0, guide: -1, tipsSeen: [], homeTask: null, homeLog: [] };
};

const KEY = ZH ? 'corner-office-demo-v1-zh' : 'corner-office-demo-v1';   // both sites share one origin on GitHub Pages
export function load(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 1) {
      // older saves: Stitchlight only, with one set of labels
      const labelsBy = s.labelsBy ?? (Array.isArray(s.labels) ? { stitchlight: s.labels } : {});
      const out: Save = { ...fresh(), ...s, labelsBy, hearts: { ...zero(), ...s.hearts }, ordersDone: { ...zero(), ...s.ordersDone } };
      delete (out as unknown as { labels?: unknown }).labels;
      if ((s.phase as string) === 'intro') out.phase = 'offer';
      // saves from before the starter gifts: anyone already past onboarding gets the full starter desk
      if (!Array.isArray(s.desk)) out.desk = s.lookDone && ['free', 'tray', 'focus', 'work', 'timesup', 'result'].includes(s.phase) ? ['lamp', 'clipboard', 'piggy', 'phone'] : [];
      // saves from before the desk phone was a gift: it was already on the desk
      if (out.desk.includes('piggy') && !out.desk.includes('phone') && out.phase !== 'gifts') out.desk = [...out.desk, 'phone'];
      // unwrapped things with no spot yet go to their home spot
      out.place = { ...(s.place ?? {}) }; for (const d of out.desk) if (!(d in out.place)) out.place[d] = freeSlot(d, out.place);
      // saves from before the welcome gift: anyone already past onboarding has it waiting
      if (typeof s.guide !== 'number') out.guide = -1;
      if (!Array.isArray(s.tipsSeen)) out.tipsSeen = [];
      if (!Array.isArray(s.mailbox)) out.mailbox = [];
      if (typeof s.started !== 'number') out.started = Math.min(Date.now(), ...(s.history ?? []).map((h: { at: number }) => h.at));
      if (typeof s.recapWeek !== 'string') out.recapWeek = '';
      if (!Array.isArray(s.finds)) out.finds = [];
      if (typeof s.sinceSecret !== 'number') out.sinceSecret = 0;
      if (typeof s.sparkles !== 'number') out.sparkles = 0;
      if (!Array.isArray(s.setsClaimed)) out.setsClaimed = [];
      if (typeof s.plantDays !== 'number') { const days = new Set((s.history ?? []).filter((h: { finished: boolean }) => h.finished).map((h: { at: number }) => new Date(h.at).toDateString())); out.plantDays = days.size; out.plantLast = ''; }
      if (typeof s.lastSeen !== 'number') out.lastSeen = Date.now();
      if (typeof s.bdayYear !== 'number') out.bdayYear = 0;
      if (typeof s.meets !== 'number') { out.meets = 0; out.goal = null; }
      if (typeof s.day1 !== 'string') { out.day1 = s.phase && !['offer', 'tour', 'booth', 'badge', 'vibe', 'quiz', 'gifts', 'desk'].includes(s.phase) ? new Date().toDateString() : ''; out.clock = {}; out.lateSent = ''; out.reviewWeek = ''; out.chat = []; out.chatSeen = 0; }   // letters already read, kept in the computer's Mail app
      if (!s.surprise) out.surprise = s.lookDone && ['free', 'tray', 'focus', 'work', 'timesup', 'result', 'desk'].includes(s.phase) ? 'waiting' : 'none';
      if (!Array.isArray(s.homeLog)) { out.homeLog = []; out.homeTask = null; }
      out.look = fixLook(out.look); out.history = out.history ?? [];
      return out;
    }
  } catch { /* storage unavailable */ }
  return fresh();
}
export function store(s: Save) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }
export function wipe() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }
