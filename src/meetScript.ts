import { COWORKERS, CoworkerId } from './data';
import { Save } from './state';
import { ZH, t } from './lang';
import { focusOn, meetIntro, rulesOf } from './work';

// ---------------- what the one-to-one is about, step by step ----------------
// 1 small talk · 2 how are you (the week's missed minimum) · 3 a follow-up on that answer · 4 a small goal for this
// week · 5 something you did well (from your real work) · 6 the boss shares a story, asks what would help, and gives
// you something small. Margaux is precise and quietly kind; Rio is relaxed and warm. Small talk and stories rotate,
// so a second or third one-to-one isn't the same. Nothing here is ever a penalty.
export type Emote = 'nod' | 'smile' | 'sip' | 'think' | 'laugh' | 'heart' | 'note' | 'wow' | 'sweat';
export const EMOTE: Record<Emote, string> = { nod: '·ᴗ·', smile: '♪', sip: '☕', think: '…', laugh: 'ha!', heart: '♥', note: '✎', wow: '!', sweat: '💧' };
export interface Choice { key: string; text: string; reply: string; emote?: Emote; me?: Emote }
export interface Step { id: string; say: string; emote?: Emote; choices?: Choice[]; cont?: string }
export type Boss = 'margaux' | 'rio';
export type GoalKey = 'min3' | 'short' | 'morning' | 'rest';

const pick = <T,>(arr: T[], n: number) => arr[((n % arr.length) + arr.length) % arr.length];

// 1 ---- small talk (rotates)
const SMALL: Record<Boss, { say: string; choices: Choice[] }[]> = {
  margaux: [
    { say: t('Sit, please. It has turned cold this week. How was the journey in?', '坐吧。这周降温了，过来的路上还好吗？'), choices: [
      { key: 'crowd', text: t('The train was packed.', '地铁挤得不行。'), reply: t('It always is on Mondays. I read on the way to survive it.', '周一总是这样。我都靠在路上看书撑过去。'), emote: 'nod', me: 'sweat' },
      { key: 'walk', text: t('I walked. It was nice, actually.', '我走路来的，其实挺舒服。'), reply: t('Good. A walk clears the head before the first meeting.', '很好。开会前走一走，脑子会清楚很多。'), emote: 'smile' },
      { key: 'fine', text: t('Fine, thanks.', '还行，谢谢。'), reply: t('Good. Then let us not waste your morning.', '好，那我们别浪费你的上午。'), emote: 'nod' } ] },
    { say: t('Come in. Have you tried the bakery downstairs yet? Their almond croissant is dangerous.', '进来吧。楼下面包房你去过了吗？他们的杏仁可颂很危险。'), choices: [
      { key: 'yes', text: t('Yes! Way too many times.', '去过了！去太多次了。'), reply: t('Then we understand each other.', '那我们彼此理解。'), emote: 'laugh', me: 'heart' },
      { key: 'notyet', text: t('Not yet.', '还没有。'), reply: t('Go on Friday. Consider it an instruction.', '周五去一趟。就当是工作安排。'), emote: 'smile' },
      { key: 'diet', text: t("I'm trying to be good.", '我在努力克制。'), reply: t('Admirable. I gave up years ago.', '佩服。我好几年前就放弃了。'), emote: 'laugh' } ] },
    { say: t('Thank you for coming. The proofs for the spring issue just landed, so forgive the mess.', '谢谢你过来。春季刊的校样刚到，桌上有点乱，别介意。'), choices: [
      { key: 'peek', text: t('Can I have a peek?', '我能看一眼吗？'), reply: t('After we talk. The cover is good this time.', '聊完再看。这期封面很不错。'), emote: 'smile', me: 'wow' },
      { key: 'busy', text: t('You look busy. I can be quick.', '您看起来很忙，我可以快一点。'), reply: t('No. This is the part of the week I protect.', '不用。这是我一周里特意留出来的时间。'), emote: 'nod' },
      { key: 'ok', text: t('No problem at all.', '完全不介意。'), reply: t('Good.', '好。'), emote: 'nod' } ] },
  ],
  rio: [
    { say: t("Okay, coffee first. Did you sleep alright? You look like a 'one more episode' person.", '先喝咖啡。昨晚睡得好吗？你看起来像那种「再看一集」的人。'), choices: [
      { key: 'guilty', text: t('Guilty. Three more episodes.', '被你说中了，看了三集。'), reply: t('Respect. Which show? No, wait, tell me later or we will be here all day.', '佩服。哪部剧？算了，晚点再说，不然要聊一整天。'), emote: 'laugh', me: 'sweat' },
      { key: 'slept', text: t('I actually slept well!', '我昨晚睡得挺好！'), reply: t("Look at you. Teach me your ways.", '厉害啊，教教我。'), emote: 'wow' },
      { key: 'meh', text: t('So-so.', '一般般吧。'), reply: t("Then this coffee's arrived just in time.", '那这杯咖啡来得正好。'), emote: 'sip' } ] },
    { say: t('Have you tried the vending machine yet? Button C4 is a mystery snack. It changes. Nobody knows who fills it.', '你试过那台售货机了吗？C4 是神秘零食，每次都不一样，没人知道是谁补的货。'), choices: [
      { key: 'try', text: t("I'm pressing C4 after this.", '聊完我就去按 C4。'), reply: t('Report back. This is the most important research at Moonpuff.', '回来汇报。这是月芙最重要的研究课题。'), emote: 'laugh', me: 'wow' },
      { key: 'scared', text: t('That sounds a bit scary.', '听起来有点吓人。'), reply: t('Last week it was a single gummy bear. One. In a big bag.', '上周掉出来一颗小熊软糖。就一颗。装在一个大袋子里。'), emote: 'laugh' },
      { key: 'no', text: t('I bring my own snacks.', '我自己带零食。'), reply: t('Smart. Very smart.', '聪明，非常聪明。'), emote: 'nod' } ] },
    { say: t("Thanks for coming over! I needed an excuse to get away from a bug that's been chasing me all morning.", '谢谢你过来！我正好需要个借口躲开一个追了我一上午的 bug。'), choices: [
      { key: 'help', text: t('Want a fresh pair of eyes later?', '晚点要不要我帮你看看？'), reply: t("Maybe! Turns out it was a semicolon. It's always a semicolon.", '也许！结果是个分号。永远都是分号。'), emote: 'laugh', me: 'smile' },
      { key: 'escape', text: t('Happy to be your excuse.', '很高兴能当你的借口。'), reply: t('Best excuse I have had all week.', '这周最好的借口。'), emote: 'smile' },
      { key: 'bug', text: t('What kind of bug?', '什么样的 bug？'), reply: t('The kind where the cat walks through walls. On purpose, apparently.', '就是猫会穿墙的那种。而且好像还是故意的。'), emote: 'think' } ] },
  ],
};

// 3 ---- a follow-up on how you are
const FOLLOW: Record<string, Record<Boss, { say: string; choices: Choice[] }>> = {
  busy: {
    margaux: { say: t('What took most of your time, work or life?', '主要是什么占了时间？工作还是生活？'), choices: [
      { key: 'life', text: t('Life stuff. It should calm down.', '生活上的事，应该快忙完了。'), reply: t("Then don't fight it. Small sessions until it settles.", '那就别硬扛。先做些短的，等事情过去。'), emote: 'nod' },
      { key: 'work', text: t('Other work piled up.', '别的工作堆起来了。'), reply: t('Tell me when that happens. I can move deadlines. I cannot read minds.', '下次遇到这种情况告诉我。截止日期我可以调，但我读不了心。'), emote: 'note' } ] },
    rio: { say: t('Busy good or busy stressful?', '是开心的忙，还是焦虑的忙？'), choices: [
      { key: 'good', text: t('Busy good, mostly.', '大部分是开心的忙。'), reply: t('Love that. Just keep a little time for the slow stuff too.', '那太好了。也给慢一点的事留点时间。'), emote: 'smile' },
      { key: 'stress', text: t('A bit stressful, honestly.', '说实话，有点焦虑。'), reply: t('Thanks for saying so. We can make this week lighter, no problem.', '谢谢你说出来。这周我们可以轻松一点，没问题。'), emote: 'heart' } ] },
  },
  tired: {
    margaux: { say: t('Would it help to lighten the load this week?', '这周把任务减轻一点，会有帮助吗？'), choices: [
      { key: 'yes', text: t('Yes, a little.', '会，一点点就好。'), reply: t('Then the minimum is enough. Nothing more is expected.', '那就做到最低要求就够了，不需要更多。'), emote: 'nod' },
      { key: 'no', text: t("No, I'd rather keep going.", '不用，我想继续保持。'), reply: t('Alright. But you tell me if that changes.', '好。但如果情况变了，要告诉我。'), emote: 'think' } ] },
    rio: { say: t('Do you want to talk about it, or just drink coffee for a minute?', '想聊聊吗？还是先安静喝口咖啡？'), choices: [
      { key: 'talk', text: t("It's just been a heavy week.", '就是这周有点累。'), reply: t("Heavy weeks happen. You don't have to be at 100 here.", '累的一周总会有的。在这里你不需要每天都满格。'), emote: 'heart' },
      { key: 'coffee', text: t('Just coffee, please.', '先喝咖啡吧。'), reply: t('Coffee it is.', '那就喝咖啡。'), emote: 'sip' } ] },
  },
  rhythm: {
    margaux: { say: t('When in the day do you focus best?', '你一天里什么时候最专注？'), choices: [
      { key: 'am', text: t('Mornings.', '早上。'), reply: t('Then protect your mornings. Meetings can wait until after lunch.', '那就保护好你的早上。会议可以放到午饭后。'), emote: 'note' },
      { key: 'pm', text: t('Afternoons.', '下午。'), reply: t('Then use the mornings for small things and save the afternoon.', '那早上做小事，下午留给重要的。'), emote: 'note' },
      { key: 'idk', text: t("I'm not sure yet.", '我还不确定。'), reply: t('Try both this week and notice. That is a task in itself.', '这周两个时段都试试，留意一下。这本身就是一项任务。'), emote: 'think' } ] },
    rio: { say: t("What usually gets you going? Music? A deadline? Snacks?", '平时什么能让你进入状态？音乐？截止日期？零食？'), choices: [
      { key: 'music', text: t('Music.', '音乐。'), reply: t("Same! I'll send you my 'boss fight' playlist.", '我也是！我把我的「打 boss」歌单发给你。'), emote: 'smile', me: 'heart' },
      { key: 'deadline', text: t('A deadline, sadly.', '可惜是截止日期。'), reply: t('Then let us make tiny deadlines. Fifteen minutes, go.', '那我们就定一些迷你截止日期。十五分钟，开始。'), emote: 'laugh' },
      { key: 'snacks', text: t('Snacks. Definitely snacks.', '零食，绝对是零食。'), reply: t('C4 it is.', '那就 C4 吧。'), emote: 'laugh' } ] },
  },
};

// 4 ---- a small goal for this week (checked next week)
export const GOAL_TEXT: Record<GoalKey, string> = {
  min3: t('Reach the daily minimum on at least 3 days', '至少 3 天达到每日最低专注'),
  short: t('Start each day with one short order', '每天先做一张短的工作单'),
  morning: t('Focus in the morning on at least 3 days', '至少 3 天在上午专注'),
  rest: t('Rest first. No goal this week', '先休息，这周不定目标'),
};
function goalStep(boss: Boss, how: string): Step {
  const say = boss === 'rio' ? t('Want to pick one tiny thing for this week? Totally optional.', '要不要给这周定一个小小的目标？完全可选。') : t('Let us choose one small, concrete thing for this week.', '我们给这周定一件小而具体的事吧。');
  const reply: Record<GoalKey, Record<Boss, string>> = {
    min3: { margaux: t('Three days. Clear and fair. I will check in on Monday.', '三天，清楚又合理。周一我再问问你。'), rio: t('Three days, nice and doable. I believe in you.', '三天，很可行。我相信你。') },
    short: { margaux: t('A good habit. The first order of the day sets the tone.', '好习惯。一天的第一张单会定下整天的节奏。'), rio: t('Ooh, a warm-up level. Classic game design.', '哦，新手热身关。经典的游戏设计。') },
    morning: { margaux: t('Mornings it is. I will keep my meetings out of them.', '那就上午。我会把会议都挪开。'), rio: t('Morning person mode, unlocked.', '早起模式，解锁。') },
    rest: { margaux: t('Rest is the right call. Come back when you are ready.', '休息是对的。准备好了再回来。'), rio: t('Rest is a goal too. A good one.', '休息也是一种目标，很好的那种。') },
  };
  const keys: GoalKey[] = how === 'tired' ? ['rest', 'min3', 'short'] : ['min3', 'short', 'morning'];
  return { id: 'goal', say, emote: 'note', choices: keys.map((k) => ({ key: k, text: GOAL_TEXT[k], reply: reply[k][boss], emote: k === 'rest' ? 'heart' : 'nod', me: 'note' })) };
}

// 5 ---- something you did well, from your own work
function praiseStep(s: Save, boss: Boss, n: number): Step {
  const since = Date.now() - 14 * 864e5, recent = s.history.filter((h) => h.at >= since);
  const lines: string[] = [];
  const byWho = new Map<CoworkerId, number>();
  recent.filter((h) => h.finished && h.who).forEach((h) => byWho.set(h.who!, (byWho.get(h.who!) ?? 0) + 1));
  const top = [...byWho.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[0] !== boss) { const nm = COWORKERS[top[0]].name;
    lines.push(boss === 'rio' ? (ZH ? `对了，${nm}一直在夸你。你最近帮 TA 做了 ${top[1]} 张单，TA 说帮了大忙。` : `Oh, and ${nm} keeps talking about you. You've done ${top[1]} orders for them lately. Big help, they said.`)
      : (ZH ? `我注意到你最近为${nm}完成了 ${top[1]} 张工作单。TA 跟我提过，说你很可靠。` : `I noticed you finished ${top[1]} orders for ${nm} recently. They mentioned you are reliable.`)); }
  const longest = recent.reduce((m, h) => Math.max(m, h.worked), 0);
  if (longest >= 20) lines.push(boss === 'rio' ? (ZH ? `我看到你有一次连续专注了 ${longest} 分钟！太强了。` : `I saw you did a ${longest}-minute focus stretch! That's huge.`)
    : (ZH ? `你有一次连续专注了 ${longest} 分钟。这需要真正的定力。` : `You held one focus for ${longest} minutes. That takes real discipline.`));
  const days = new Set(recent.filter((h) => h.finished).map((h) => new Date(h.at).toDateString())).size;
  if (days >= 2) lines.push(boss === 'rio' ? (ZH ? `过去两周你有 ${days} 天都在做事，这很稳。` : `You showed up on ${days} different days in the last two weeks. That's solid.`)
    : (ZH ? `过去两周你有 ${days} 天都有完成的工作。稳定比冲刺更重要。` : `You finished work on ${days} separate days in the last two weeks. Consistency matters more than sprints.`));
  const total = recent.reduce((m, h) => m + h.worked, 0);
  if (!lines.length) lines.push(boss === 'rio' ? t("And hey, you're still here and still trying. That counts for a lot.", '还有，你还在这里，还在努力。这很重要。')
    : (total ? (ZH ? `过去两周你一共专注了 ${total} 分钟。每一分钟都算数。` : `You put in ${total} minutes of focus in the last two weeks. Every one of them counts.`) : t('You came today, and you were honest with me. That is a good start.', '你今天来了，也对我说了实话。这是一个好的开始。')));
  return { id: 'praise', say: pick(lines, n), emote: 'smile', cont: boss === 'rio' ? t('Aw, thanks!', '嘿嘿，谢谢！') : t('Thank you.', '谢谢您。') };
}

// 6 ---- the boss shares a story (rotates), then asks what would help
const STORY: Record<Boss, string[]> = {
  margaux: [
    t('When I started, I was an assistant here too. I was late for my first three weeks. My editor bought me an alarm clock. I still have it.', '我刚入行时，也是在这里当助理。头三个星期天天迟到。我的主编送了我一个闹钟，我到现在还留着。'),
    t('My first piece for this magazine came back covered in red ink. Every line. I framed that page. It reminds me that everyone starts somewhere.', '我给这本杂志写的第一篇稿子，退回来时满纸红笔，每一行都有。我把那页裱了起来，提醒自己每个人都是从头开始的。'),
    t('The best issue we ever made started as a mistake: the printer ran the cover in the wrong colour. We kept it. Sometimes the plan is not the point.', '我们做过最好的一期，起点是个失误：印刷厂把封面印错了颜色。我们最后用了它。有时候计划本身并不是重点。'),
  ],
  rio: [
    t("We're making a little game about a cat who runs a bakery. Playtest is Friday afternoon, in the games room. Come! There will be snacks.", '我们在做一个小游戏，讲一只开面包店的猫。周五下午在游戏室试玩，来吧！有零食。'),
    t("My first game had one level and the jump button didn't work. My mum still says it's her favourite game ever.", '我做的第一个游戏只有一关，跳跃键还是坏的。我妈到现在还说那是她最喜欢的游戏。'),
    t("Fun fact: the moon in our logo was a coffee stain on the first sketch. We just kept it.", '冷知识：我们 logo 上的月亮，其实是第一张草图上的咖啡渍。我们就留着了。'),
  ],
};
const ASK: Record<Boss, { say: string; choices: Choice[] }> = {
  margaux: { say: t('Before you go: is there anything I can do differently?', '你走之前：有什么是我可以做得不一样的吗？'), choices: [
    { key: 'quiet', text: t('A bit more quiet time would help.', '多一点安静的时间会有帮助。'), reply: t('Then I will send fewer messages in the mornings.', '那我上午少给你发消息。'), emote: 'note' },
    { key: 'clear', text: t('Clearer tasks, maybe.', '任务说得更清楚一点吧。'), reply: t('Fair. I will write the brief before I hand anything over.', '合理。以后交给你之前，我会先写好说明。'), emote: 'note' },
    { key: 'good', text: t("Honestly, it's all good.", '说实话，都挺好的。'), reply: t('Good. My door is open if that changes.', '好。如果有变化，我的门一直开着。'), emote: 'smile' } ] },
  rio: { say: t('Anything I could do to make work nicer for you?', '有什么我能做的，让你上班更舒服一点吗？'), choices: [
    { key: 'quiet', text: t('Some quiet hours would be great.', '能有几个安静的时段就好了。'), reply: t("Headphones-on hours. I'll make it a studio thing.", '「戴耳机时段」，我让整个工作室都这么做。'), emote: 'smile' },
    { key: 'clear', text: t('Clearer tasks would help.', '任务说清楚一点会有帮助。'), reply: t("Got it. I'll add little checklists to the orders.", '明白。我在工作单里加上小清单。'), emote: 'note' },
    { key: 'good', text: t("I'm good! I like it here.", '挺好的！我喜欢这里。'), reply: t('That makes my whole week.', '这句话让我一整周都开心。'), emote: 'heart' } ] },
};
const GIFT: Record<Boss, { say: string; treat: string; text: string }> = {
  margaux: { say: t('One more thing. Take this matcha, I ordered two by mistake. It helps in the afternoon.', '还有一件事。这杯抹茶拿去吧，我不小心点了两杯。下午喝很提神。'), treat: 'matcha_latte', text: t('A matcha latte from Margaux', '玛戈给的抹茶拿铁') },
  rio: { say: t('Oh, take a donut for the road! I bought way too many. Again.', '对了，带个甜甜圈走吧！我又买多了。'), treat: 'donut_plate', text: t('A donut from Rio', '里奥给的甜甜圈') },
};

export function smallTalk(boss: Boss, n: number): Step { const v = pick(SMALL[boss], n); return { id: 'small', say: v.say, emote: 'smile', choices: v.choices }; }
export function checkIn(s: Save, boss: Boss, missed: number, choices: Choice[]): Step { return { id: 'checkin', say: meetIntro(boss, missed, rulesOf(s).minFocus), emote: 'think', choices }; }
export function followUp(boss: Boss, how: string): Step { const v = FOLLOW[how]?.[boss] ?? FOLLOW.busy[boss]; return { id: 'follow', say: v.say, emote: 'think', choices: v.choices }; }
export { goalStep, praiseStep };
export function storyStep(boss: Boss, n: number): Step { return { id: 'story', say: pick(STORY[boss], n), emote: boss === 'rio' ? 'laugh' : 'sip', cont: boss === 'rio' ? t("Ha, that's great.", '哈哈，太好了。') : t('That is a lovely story.', '这个故事真好。') }; }
export function askStep(boss: Boss): Step { const v = ASK[boss]; return { id: 'ask', say: v.say, emote: 'nod', choices: v.choices }; }
export function giftStep(boss: Boss): Step & { treat: string; gift: string } { const g = GIFT[boss]; return { id: 'gift', say: g.say, emote: 'heart', cont: boss === 'rio' ? t('Thanks, Rio!', '谢谢里奥！') : t('Thank you, Margaux.', '谢谢您，玛戈。'), treat: g.treat, gift: g.text }; }

// the goal, checked at the start of the next week: did the week before meet it?
export function goalMet(s: Save, goal: GoalKey, weekStartMs: number): boolean {
  const r = rulesOf(s), days = Array.from({ length: 5 }, (_, i) => new Date(weekStartMs + i * 864e5).toDateString());
  if (goal === 'rest') return true;
  if (goal === 'min3') return days.filter((d) => focusOn(s, d) >= r.minFocus).length >= 3;
  if (goal === 'short') return days.filter((d) => s.history.some((h) => new Date(h.at).toDateString() === d && h.mins <= 15 && h.finished)).length >= 3;
  return days.filter((d) => s.history.some((h) => new Date(h.at).toDateString() === d && new Date(h.at).getHours() < 12)).length >= 3;
}
export const GOAL_LINE: Record<Boss, { met: string; missed: string; rest: string }> = {
  margaux: { met: t('You kept the goal we set last week. Well done. I noticed.', '上周我们定的目标你做到了。做得好，我都看在眼里。'), missed: t('Last week\'s goal did not quite happen. That is alright. Shall we try again, or choose something smaller?', '上周的目标没完全做到。没关系。要再试一次，还是换个更小的？'), rest: t('I hope last week gave you some rest. Welcome back.', '希望上周你好好休息了。欢迎回来。') },
  rio: { met: t('You smashed last week\'s goal! Little victory dance, please.', '上周的目标你完成啦！请跳一段小小的胜利舞。'), missed: t("Last week's goal didn't quite land. No biggie! Want to try a smaller one?", '上周的目标没完全做到。没关系！要不要换个小一点的？'), rest: t('Hope you got some real rest last week. Good to have you back.', '希望你上周好好休息了。很高兴你回来。') },
};
