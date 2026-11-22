import { COMPANIES, COWORKERS, CompanyId, CoworkerId, Trip } from './data';
import { ZH, t as tr } from './lang';

// The office clock, in minutes since midnight (it keeps counting past 1440 on later days). It follows the real clock,
// and runs faster while Fast demo time is on. It is shared, so the office and the desk computer agree on the time.
const d0 = new Date();
let acc = d0.getHours() * 60 + d0.getMinutes() + d0.getSeconds() / 60, last = performance.now();
export function officeClock(scale: number) { const now = performance.now(); acc += ((now - last) / 60000) * scale; last = now; return acc; }
export const hhmm = (clock: number) => { const m = ((Math.round(clock) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

// the trip a coworker is on at this clock minute (from their schedule), if any, and when it ends
export function tripAt(id: CoworkerId, clock: number): { trip: Trip; ends: number } | null {
  const day = Math.floor(clock / 1440), mins = ((clock % 1440) + 1440) % 1440, hour = Math.floor(mins / 60), mh = mins % 60;
  const trip = (COWORKERS[id].schedule ?? []).find((e) => (e.h === undefined || e.h === hour) && mh >= e.m && mh < e.m + e.stay);
  return trip ? { trip, ends: day * 1440 + hour * 60 + trip.m + trip.stay } : null;
}

// what a coworker is up to right now, for the desk computer
const MEETING = new Set(['editorial', 'idea_wall', 'colab']);
const PLACE: Record<string, string> = ZH ? { pantry: '茶水间', lounge: '休息区', bakery: '线轴面包房', reception: '前台', editorial: '编辑部', closet: '时装间',
  kitchen: '厨房', colab: '协作室', game_room: '游戏室', arcade: '街机角', idea_wall: '点子墙', booth: '入口小亭' } : { pantry: 'the pantry', lounge: 'the lounge', bakery: 'Bobbin Bakery', reception: 'reception', editorial: 'the editorial floor', closet: 'the fashion closet',
  kitchen: 'the kitchen', colab: 'the co-lab', game_room: 'the game room', arcade: 'the arcade nook', idea_wall: 'the idea wall', booth: 'the entrance booth' };
export type Status = { kind: 'working' | 'break' | 'meeting' | 'lunch'; where: string; free: number | null };
export function statusOf(id: CoworkerId, clock: number): Status {
  const now = tripAt(id, clock);
  if (now) {
    const { trip, ends } = now, kind = trip.stay >= 20 ? 'lunch' : MEETING.has(trip.to) ? 'meeting' : 'break';
    return { kind, where: PLACE[trip.to] ?? trip.to, free: ends };
  }
  // at their desk working: free at their next break (look ahead minute by minute, up to a day)
  for (let m = Math.ceil(clock); m < clock + 1440; m++) { const t = tripAt(id, m); if (t) return { kind: 'working', where: tr('their desk', '自己的工位'), free: m }; }
  return { kind: 'working', where: tr('their desk', '自己的工位'), free: null };
}
export const people = (co: CompanyId) => COMPANIES[co].people.filter((p) => !COWORKERS[p].pet);
