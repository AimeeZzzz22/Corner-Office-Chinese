import { t } from './lang';
// ---------------- where things can go on the player's desk ----------------
// All numbers are in the desk picture's own pixels (1280 x 832, public/assets/ob/starter/back.png).
// A slot's [x, y] is where the bottom-middle of an item stands. Each slot has a kind: what sort of place it is.
// Each item lists the kinds of slot it may go in, so a mug can be kept off the wall shelves, say.
// To add a slot or let an item go somewhere new, edit the lists below.

export type SlotKind = 'desk' | 'shelf' | 'wall';

export interface Slot { id: string; kind: SlotKind; at: [number, number]; lean?: -1 | 1 }   // lean: which wall a hanging picture is on (it slants with the wall)
export const SLOTS: Slot[] = [
  // desk top, left arm (front to back), then the right arm. Spots are evenly spaced along each arm, halfway between the front edge and the raised back shelf.
  { id: 'desk-l1', kind: 'desk', at: [388, 528] },
  { id: 'desk-l2', kind: 'desk', at: [454, 495] },
  { id: 'desk-l3', kind: 'desk', at: [524, 464] },
  { id: 'desk-r1', kind: 'desk', at: [772, 460] },
  { id: 'desk-r2', kind: 'desk', at: [832, 498] },
  { id: 'desk-r3', kind: 'desk', at: [904, 528] },
  // the four wall shelves, two spots each
  { id: 'shelf-lt1', kind: 'shelf', at: [288, 268] },
  { id: 'shelf-lt2', kind: 'shelf', at: [384, 220] },
  { id: 'shelf-lb1', kind: 'shelf', at: [288, 348] },
  { id: 'shelf-lb2', kind: 'shelf', at: [384, 300] },
  { id: 'shelf-rt1', kind: 'shelf', at: [896, 220] },
  { id: 'shelf-rt2', kind: 'shelf', at: [992, 268] },
  { id: 'shelf-rb1', kind: 'shelf', at: [896, 300] },
  { id: 'shelf-rb2', kind: 'shelf', at: [992, 348] },
  // pictures and boards hang on the walls, clear of the shelves: above the desk either side of the corner, and under
  // each window. They slant with their wall (left wall rises to the right, right wall falls to the right).
  { id: 'wall-l1', kind: 'wall', at: [548, 222], lean: -1 },
  { id: 'wall-r1', kind: 'wall', at: [732, 222], lean: 1 },
  { id: 'wall-l2', kind: 'wall', at: [150, 452], lean: -1 },
  { id: 'wall-r2', kind: 'wall', at: [1130, 452], lean: 1 },
];

export interface DeskItem {
  id: string; name: string; line: string;
  box: [number, number, number, number];   // where the item sits in its own picture (ob/starter/<id>.png)
  fits: SlotKind[];                         // the kinds of slot it may go in
  home: string;                             // the slot it starts in when unwrapped
  starter?: boolean;                        // one of the first-day gifts on the desk (default yes)
  src?: [number, number, number, number];   // a blind-pack or shop thing: where it sits in the blind/items.png atlas (drawn at 2x)
}
export const ITEMS: DeskItem[] = [
  { id: 'lamp', name: t('Desk lamp', '台灯'), line: t('A warm little lamp for late study sessions.', '一盏暖暖的小台灯，陪你熬夜学习。'), box: [356, 456, 64, 72], fits: ['desk'], home: 'desk-l1' },
  { id: 'clipboard', name: t('Clipboard', '写字板'), line: t('For your plans and tiny to-do lists.', '用来写计划和小小的待办清单。'), box: [492, 428, 64, 36], fits: ['desk', 'shelf'], home: 'desk-l3' },
  { id: 'piggy', name: t('Glass piggy bank', '玻璃存钱罐'), line: t('It fills up with coins as you finish work orders.', '每完成一张工作单，它就会多装一些金币。'), box: [742, 412, 60, 48], fits: ['desk', 'shelf'], home: 'desk-r1' },
  { id: 'phone', name: t('Desk phone', '座机电话'), line: t('A classic desk phone. Very good for looking busy.', '一部经典座机。装忙的好帮手。'), box: [878, 496, 52, 32], fits: ['desk'], home: 'desk-r3' },
  // the welcome surprise found in the office after onboarding
  { id: 'smile_mug', name: t('Smiley mug', '笑脸马克杯'), line: t('A coffee mug that is always happy to see you.', '一只每次见到你都很开心的咖啡杯。'), box: [432, 455, 44, 44], fits: ['desk', 'shelf'], home: 'desk-l2', starter: false },
];

export const STARTER = ITEMS.filter((i) => i.starter !== false);

// ---- things from blind packs and the shop: everything that fits on a desk goes into the backpack ("bb:" + item id)
// Furniture, rugs, wallpaper and garlands don't fit on a desk, so blind packs no longer hold them.
const DESK_CATS = ['small', 'wide', 'lamp', 'riser', 'fav', 'pet', 'wall_frame', 'wall_board', 'trailing'];
const NOT_DESK = new Set(['pet:pet_bed', 'pet:food_bowl']);
export const deskable = (id: string) => DESK_CATS.includes(id.split(':')[0]) && !NOT_DESK.has(id);
export const bbId = (id: string) => `bb:${id}`;
const BLIND = new Map<string, DeskItem>();
export function registerBlind(list: { id: string; name: string; x: number; y: number; w: number; h: number }[]) {
  for (const i of list) if (deskable(i.id)) BLIND.set(bbId(i.id), { id: bbId(i.id), name: i.name, line: '', box: [0, 0, i.w * 2, i.h * 2], src: [i.x, i.y, i.w, i.h],
    fits: /^wall_/.test(i.id) ? ['wall'] : /^trailing/.test(i.id) ? ['shelf'] : ['desk', 'shelf'], home: '', starter: false });
}
export const item = (id: string): DeskItem => ITEMS.find((i) => i.id === id) ?? BLIND.get(id) ?? { id, name: '', line: '', box: [0, 0, 48, 48], fits: ['desk', 'shelf'], home: '', starter: false };
export const slot = (id: string) => SLOTS.find((s) => s.id === id)!;
export const fits = (itemId: string, slotId: string) => item(itemId).fits.includes(slot(slotId).kind);
// a free slot for an item: its home if that's free, otherwise the first free slot it fits in
export function freeSlot(itemId: string, place: Record<string, string | null>): string | null {
  const used = new Set(Object.values(place).filter(Boolean));
  const it = item(itemId);
  if (it.home && !used.has(it.home)) return it.home;
  return SLOTS.find((s) => it.fits.includes(s.kind) && !used.has(s.id))?.id ?? null;
}
