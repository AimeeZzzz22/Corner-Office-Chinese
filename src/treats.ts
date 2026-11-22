import { Save } from './state';
import { t as tr } from './lang';

// ---------------- food and drink ----------------
// Treats last for today only: they sit on the desk, and their bonus (if any) works until the day ends.
// Only the four with a bonus are sold, at the bakery (Moonpuff: the kitchen counter). Four cheap ones turn up now
// and then in the office fridge as a free surprise; they're just for fun.
export interface Treat { id: string; key: string; name: string; price?: number; bonus?: string; line: string }
export const BAKERY: Treat[] = [
  { id: 'small:iced_coffee', key: 'iced_coffee', name: tr('Iced coffee', '冰咖啡'), price: 40, bonus: tr('The next order you finish today pays +50% coins (once a day).', '今天完成的下一张工作单金币 +50%（每天一次）。'), line: tr('Cold, strong, and gone too fast.', '冰冰的，浓浓的，一下就喝完了。') },
  { id: 'small:matcha_latte', key: 'matcha_latte', name: tr('Matcha latte', '抹茶拿铁'), price: 40, bonus: tr('Every order you finish today adds +10 minutes to your piggy bank.', '今天每完成一张工作单，存钱罐多存 10 分钟。'), line: tr('Calm and green.', '平静又绿意盎然。') },
  { id: 'small:strawberry_milk', key: 'strawberry_milk', name: tr('Strawberry milk', '草莓牛奶'), price: 30, bonus: tr('+10% XP on every order you finish today.', '今天完成的每张工作单经验 +10%。'), line: tr('Pink, sweet, a little bit nostalgic.', '粉粉的，甜甜的，有点怀旧。') },
  { id: 'small:macaron_tower', key: 'macaron_tower', name: tr('Macarons', '马卡龙'), price: 35, bonus: tr('Share them with a coworker today for +2 friendship points.', '今天分给一位同事，友情 +2。'), line: tr('Too pretty to eat. Almost.', '漂亮得舍不得吃。差一点。') },
];
export const FRIDGE: Treat[] = [
  { id: 'small:donut_plate', key: 'donut_plate', name: tr('Donut', '甜甜圈'), line: tr('Someone left a donut with your name on it.', '有人留了一个写着你名字的甜甜圈。') },
  { id: 'small:fortune_cookie', key: 'fortune_cookie', name: tr('Fortune cookie', '幸运饼干'), line: '' },
  { id: 'small:gummy_jar', key: 'gummy_jar', name: tr('Gummies', '小熊软糖'), line: tr('A little jar of gummies. Sweet!', '一小罐软糖，甜甜的！') },
  { id: 'small:cocoa', key: 'cocoa', name: tr('Cocoa', '热可可'), line: tr('A warm cocoa, still steaming.', '一杯热可可，还冒着热气。') },
];
export const FORTUNES = [tr('A small step today is still a step.', '今天的一小步，也是一步。'), tr('Your next idea will be a good one.', '你的下一个点子会很棒。'), tr('Someone here is glad you joined.', '这里有人很高兴你来了。'), tr('Rest is part of the work.', '休息也是工作的一部分。'), tr('Today you will finish something.', '今天你会完成一件事。'), tr('Good things are already on their way.', '好事已经在路上了。')];
export const ALL_TREATS = [...BAKERY, ...FRIDGE];
export const treat = (key: string) => ALL_TREATS.find((t) => t.key === key)!;
export const FRIDGE_CHANCE = 0.4;      // on about 2 days in 5 there's something in the fridge

const today = () => new Date().toDateString();
export const treatsToday = (t: Save['treats']): Save['treats'] => (t.day === today() ? t : { day: today(), have: [], used: [] });
export function fridgeToday(f: Save['fridge']): Save['fridge'] {
  if (f.day === today()) return f;
  const item = Math.random() < FRIDGE_CHANCE ? FRIDGE[Math.floor(Math.random() * FRIDGE.length)].key : null;
  return { day: today(), item, fortune: Math.floor(Math.random() * FORTUNES.length) };
}
