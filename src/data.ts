// Game data for the demo. Numbers come from the design doc.
import { t } from './lang';
export type CoworkerId = 'margaux' | 'priya' | 'theo' | 'camille' | 'jonah' | 'odette' | 'rio' | 'sam' | 'ada' | 'kofi' | 'mei' | 'bean';
export type CompanyId = 'stitchlight' | 'moonpuff';
export type TaskType = 'Writing' | 'Reading' | 'Studying' | 'Coding' | 'Admin' | 'Chores' | 'Creative';
export const TASK_TYPES: TaskType[] = ['Writing', 'Reading', 'Studying', 'Coding', 'Admin', 'Chores', 'Creative'];
// what each task type is called on screen
export const TYPE_LABEL: Record<TaskType, string> = { Writing: t('Writing', '写作'), Reading: t('Reading', '阅读'), Studying: t('Studying', '学习'), Coding: t('Coding', '编程'), Admin: t('Admin', '行政'), Chores: t('Chores', '杂务'), Creative: t('Creative', '创意') };

export interface Job { title: string; doing: string }
// A coworker's day: each trip starts at minute m of the hour (or only in hour h, e.g. lunch), goes to a named place and
// lasts `stay` minutes, then they walk back to their desk. Times follow the real clock (Fast demo time runs it 60x).
export interface Trip { m: number; to: string; stay: number; h?: number }
export interface Coworker {
  id: CoworkerId; name: string; role: string; owns: TaskType[];
  spot: [number, number];        // where to click them while seated, in map pixels
  seat: [number, number, number, number?]; // seated: centre x, top y, rows that sets the chair's tile (see Office seatTiles), rows of the sitting sprite shown when a table hides the legs (default all)
  pet?: boolean;                 // Bean naps on her bed and never walks
  chat: string;                  // placeholder line for the demo
  schedule?: Trip[];             // when they get up from their desk and where they go
  jobs: Job[];                   // the character's jobs for this coworker (placeholder wording)
}

export const COWORKERS: Record<CoworkerId, Coworker> = {
  margaux: { id: 'margaux', name: t('Margaux', '玛戈'), role: t('Editor-in-Chief', '主编'), owns: ['Writing'], spot: [424, 60], seat: [424, 43, 27], schedule: [{ m: 10, to: 'pantry', stay: 5 }, { m: 40, to: 'editorial', stay: 6 }, { h: 12, m: 0, to: 'bakery', stay: 35 }],
    chat: t('Make it sharp. Then make it shorter.', '写得利落点。然后再短一点。'),
    jobs: [{ title: t('Cover story draft', '封面故事初稿'), doing: t('Drafting the cover story', '正在写封面故事') }, { title: t('Headline options', '标题备选'), doing: t('Writing headlines', '正在想标题') }, { title: t("Editor's letter notes", '主编寄语笔记'), doing: t("Noting ideas for the editor's letter", '正在记主编寄语的点子') }] },
  priya: { id: 'priya', name: t('Priya', '普丽娅'), role: t("Margaux's assistant", '主编助理'), owns: ['Chores'], spot: [440, 172], seat: [440, 139, 27], schedule: [{ m: 5, to: 'reception', stay: 4 }, { m: 25, to: 'pantry', stay: 5 }, { m: 50, to: 'bakery', stay: 4 }],
    chat: t('If it is on the calendar, it is real.', '写进日历的事，才算真的有。'),
    jobs: [{ title: t('Tidy the calendar', '整理日程'), doing: t('Tidying the calendar', '正在整理日程') }, { title: t('Sort the mail', '分拣信件'), doing: t('Sorting the mail', '正在分拣信件') }, { title: t('Restock the supply shelf', '补货办公用品架'), doing: t('Restocking supplies', '正在补货') }] },
  theo: { id: 'theo', name: t('Theo', '西奥'), role: t('Fellow intern', '实习生同事'), owns: ['Studying', 'Coding'], spot: [200, 60], seat: [200, 43, 27], schedule: [{ m: 15, to: 'bakery', stay: 6 }, { m: 45, to: 'lounge', stay: 5 }, { h: 12, m: 30, to: 'pantry', stay: 30 }],
    chat: t('Wait, which tab was I on?', '等等，我刚才在看哪个标签页来着？'),
    jobs: [{ title: t('Fact-check notes', '核对资料'), doing: t('Fact-checking', '正在核对资料') }, { title: t('Research the archive', '翻查旧刊档案'), doing: t('Digging through the archive', '正在翻档案') }, { title: t('Fix the site links', '修网站链接'), doing: t('Fixing site links', '正在修链接') }] },
  camille: { id: 'camille', name: t('Camille', '卡米尔'), role: t('Beauty editor', '美妆编辑'), owns: ['Reading'], spot: [280, 60], seat: [280, 43, 27], schedule: [{ m: 0, to: 'closet', stay: 5 }, { m: 30, to: 'pantry', stay: 4 }],
    chat: t('Read it out loud. You will hear the typo.', '大声读一遍，错字自己会跳出来。'),
    jobs: [{ title: t('Proof the feature', '校对专题'), doing: t('Proofreading the feature', '正在校对专题') }, { title: t('Read the reader mail', '看读者来信'), doing: t('Reading reader mail', '正在看读者来信') }, { title: t('Review the press notes', '看新闻通稿'), doing: t('Reading press notes', '正在看通稿') }] },
  jonah: { id: 'jonah', name: t('Jonah', '乔纳'), role: t('Art director', '艺术总监'), owns: ['Creative'], spot: [248, 142], seat: [248, 124, 20, 24], schedule: [{ m: 20, to: 'lounge', stay: 6 }, { m: 52, to: 'closet', stay: 4 }, { h: 13, m: 0, to: 'bakery', stay: 30 }],
    chat: t('More white space. Always more white space.', '留白再多一点。永远再多一点。'),
    jobs: [{ title: t('Mood board', '情绪板'), doing: t('Building a mood board', '正在拼情绪板') }, { title: t('Layout sketches', '版式草图'), doing: t('Sketching layouts', '正在画版式') }, { title: t('Pick shoot props', '挑拍摄道具'), doing: t('Picking shoot props', '正在挑道具') }] },
  odette: { id: 'odette', name: t('Odette', '奥黛特'), role: t('People & Culture', '人事与文化'), owns: ['Admin'], spot: [248, 286], seat: [248, 267, 32], schedule: [{ m: 35, to: 'lounge', stay: 4 }, { m: 56, to: 'pantry', stay: 3 }],
    chat: t('Welcome back. The kettle is on.', '回来啦。水壶已经烧上了。'),
    jobs: [{ title: t('File the forms', '归档表格'), doing: t('Filing forms', '正在归档表格') }, { title: t('Update the staff list', '更新员工名单'), doing: t('Updating the staff list', '正在更新名单') }, { title: t('Book the meeting room', '预订会议室'), doing: t('Booking the meeting room', '正在订会议室') }] },
  rio: { id: 'rio', name: t('Rio', '里奥'), role: t('Creative Director', '创意总监'), owns: ['Creative'], spot: [360, 60], seat: [360, 43, 27], schedule: [{ m: 8, to: 'idea_wall', stay: 6 }, { m: 38, to: 'game_room', stay: 5 }, { h: 12, m: 15, to: 'kitchen', stay: 35 }],
    chat: t('New idea. Hear me out.', '我有个新点子，你听我说。'),
    jobs: [{ title: t('Concept sketches', '概念草图'), doing: t('Sketching concepts', '正在画概念图') }, { title: t('Pick the level palette', '定关卡配色'), doing: t('Picking colours', '正在挑颜色') }, { title: t('Mood board for level 4', '第 4 关情绪板'), doing: t('Building a mood board', '正在拼情绪板') }] },
  sam: { id: 'sam', name: t('Sam', '萨姆'), role: t('Lead Developer', '主程序'), owns: ['Coding'], spot: [168, 60], seat: [168, 43, 27], schedule: [{ m: 22, to: 'kitchen', stay: 5 }, { m: 52, to: 'colab', stay: 4 }],
    chat: t('(a calm thumbs-up)', '（淡定地比了个赞）'),
    jobs: [{ title: t('Fix a small bug', '修一个小 bug'), doing: t('Fixing a bug', '正在修 bug') }, { title: t('Test the save system', '测试存档系统'), doing: t('Testing saves', '正在测存档') }, { title: t('Clean up the build', '整理构建'), doing: t('Cleaning up the build', '正在整理构建') }] },
  ada: { id: 'ada', name: t('Ada', '艾达'), role: t('Fellow intern', '实习生同事'), owns: ['Studying'], spot: [232, 60], seat: [232, 43, 27], schedule: [{ m: 12, to: 'arcade', stay: 5 }, { m: 42, to: 'kitchen', stay: 5 }, { h: 13, m: 0, to: 'game_room', stay: 30 }],
    chat: t('I have three tabs open too!', '我也开着三个标签页！'),
    jobs: [{ title: t('Balance level 3', '平衡第 3 关'), doing: t('Balancing level 3', '正在调第 3 关') }, { title: t('Read the design notes', '看设计笔记'), doing: t('Reading design notes', '正在看设计笔记') }, { title: t('Study the playtest data', '研究试玩数据'), doing: t('Studying playtest data', '正在研究试玩数据') }] },
  kofi: { id: 'kofi', name: t('Kofi', '科菲'), role: t('Community Manager', '社区经理'), owns: ['Writing', 'Reading'], spot: [296, 60], seat: [296, 43, 27], schedule: [{ m: 3, to: 'colab', stay: 5 }, { m: 30, to: 'game_room', stay: 6 }],
    chat: t('A player said your patch made their day.', '有玩家说你的更新让他开心了一整天。'),
    jobs: [{ title: t('Write the patch notes', '写更新说明'), doing: t('Writing patch notes', '正在写更新说明') }, { title: t('Read player feedback', '看玩家反馈'), doing: t('Reading player feedback', '正在看玩家反馈') }, { title: t('Draft the newsletter', '写简报草稿'), doing: t('Drafting the newsletter', '正在写简报') }] },
  mei: { id: 'mei', name: t('Mei', '小美'), role: t('Studio Ops', '工作室运营'), owns: ['Admin'], spot: [328, 270], seat: [328, 251, 32], schedule: [{ m: 18, to: 'kitchen', stay: 4 }, { m: 48, to: 'idea_wall', stay: 3 }],
    chat: t('Badge working okay? Good.', '工牌能用吧？那就好。'),
    jobs: [{ title: t('Sort the studio mail', '分拣工作室信件'), doing: t('Sorting the studio mail', '正在分拣信件') }, { title: t('Book the playtest room', '预订试玩室'), doing: t('Booking the playtest room', '正在订试玩室') }, { title: t('Update the asset list', '更新素材清单'), doing: t('Updating the asset list', '正在更新素材清单') }] },
  bean: { id: 'bean', name: t('Bean', '豆豆'), role: t('The studio cat', '工作室的猫'), owns: ['Chores'], spot: [392, 326], seat: [392, 312, 20], pet: true,
    chat: t('Mrrp. (sits on your keyboard)', '喵呜。（坐到了你的键盘上）'),
    jobs: [{ title: t("Refill Bean's water", '给豆豆添水'), doing: t("Refilling Bean's water", '正在给豆豆添水') }, { title: t('Brush Bean', '给豆豆梳毛'), doing: t('Brushing Bean', '正在给豆豆梳毛') }, { title: t('Tidy the cat corner', '收拾猫咪角'), doing: t('Tidying the cat corner', '正在收拾猫咪角') }] },
};
export const COWORKER_IDS = Object.keys(COWORKERS) as CoworkerId[];

// Order lengths and pay (set in the design doc). Custom times sit on the line between, rounded down to 5.
export const SLIP_MINS = [15, 30, 60, 90] as const;
const PAY: [number, number][] = [[0, 0], [15, 20], [30, 45], [60, 100], [90, 150], [120, 200]];
export const PRACTICE_PAY = 10;   // the first-day guide's 1-minute practice order
export function pay(mins: number): number {
  for (let i = 0; i < PAY.length - 1; i++) {
    const [a, pa] = PAY[i], [b, pb] = PAY[i + 1];
    if (mins >= a && mins <= b) {
      const v = pa + ((pb - pa) * (mins - a)) / (b - a);
      return (SLIP_MINS as readonly number[]).includes(mins) ? Math.round(v) : Math.floor(v / 5) * 5;
    }
  }
  return 200;
}
export const HEART_POINTS = 10;      // a heart is 10 points; a finished order adds 1 point
export const XP_TO_NEXT = 500;       // Intern I -> Intern II (starting value)

export interface GameSpot { name: string; at: [number, number]; stand: [number, number] }
export interface Company {
  id: CompanyId; name: string; role: string; people: CoworkerId[];
  host: CoworkerId;                         // who greets you and hands out the order tray
  start: [number, number];                  // player's first tile
  games: GameSpot[];                        // mini-game spots (only the marker and bubble exist in this demo)
  pc: { at: [number, number]; stand: [number, number]; desk: [number, number, number, number] };   // the computer on your corner desk; desk = clickable area (map px)
  places: Record<string, [number, number]>;   // named places coworkers walk to (map pixels)
  food: GameSpot;       // where treats are sold (Stitchlight: Bobbin Bakery; Moonpuff: the kitchen counter)
  fridge: GameSpot;     // the office fridge: now and then a free little treat turns up in it
  surprise: GameSpot;   // the welcome gift in a common area, waiting after onboarding
  giftInMap?: { x0: number; x1: number; y0: number; y1: number; src: number };   // the welcome gift is part of the map picture (map px): once opened, the table is painted over it, copying the table rows from `src`
}
export const COMPANIES: Record<CompanyId, Company> = {
  stitchlight: { id: 'stitchlight', name: t('Stitchlight', '织光杂志社'), role: t('Fashion Intern', '时尚实习生'), people: ['margaux', 'priya', 'theo', 'camille', 'jonah', 'odette'], host: 'odette', start: [2, 7],
    games: [{ name: t('Closet Rush', '衣橱大作战'), at: [96, 80], stand: [6, 6] }], pc: { at: [40, 54], stand: [4, 5], desk: [16, 40, 64, 80] },
    places: { pantry: [70, 270], lounge: [232, 236], bakery: [400, 296], reception: [190, 300], editorial: [300, 196], closet: [104, 150] },
    food: { name: t('Bobbin Bakery', '线轴面包房'), at: [416, 238], stand: [25, 17] }, fridge: { name: t('The fridge', '冰箱'), at: [136, 222], stand: [8, 16] }, surprise: { name: t('A gift for you!', '给你的礼物！'), at: [263, 176], stand: [17, 10] }, giftInMap: { x0: 257, x1: 268, y0: 161, y1: 175, src: 176 } },
  moonpuff: { id: 'moonpuff', name: t('Moonpuff Studio', '月芙工作室'), role: t('Game Dev Intern', '游戏开发实习生'), people: ['rio', 'sam', 'ada', 'kofi', 'mei', 'bean'], host: 'mei', start: [4, 7],
    games: [{ name: t('Bug Triage', '抓虫大作战'), at: [168, 80], stand: [9, 4] }], pc: { at: [48, 54], stand: [4, 5], desk: [16, 40, 64, 80] },
    places: { kitchen: [96, 304], colab: [256, 196], game_room: [440, 100], arcade: [440, 262], idea_wall: [100, 208], booth: [240, 300] },
    food: { name: t('Kitchen counter', '厨房吧台'), at: [112, 274], stand: [6, 19] }, fridge: { name: t('The fridge', '冰箱'), at: [136, 268], stand: [8, 19] }, surprise: { name: t('A gift for you!', '给你的礼物！'), at: [184, 214], stand: [11, 14] } },   // on the coffee table by the green chairs
};
