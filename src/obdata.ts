// Onboarding content (English), from the design files.
import { CompanyId } from './data';
import { ZH, t } from './lang';

export const LETTER: Record<CompanyId, { zh: string; sub: string; title: string; body: string; rows: [string, string][]; note: string; who: string; serif: boolean; prefix: string }> = {
  stitchlight: { zh: '织光杂志社', sub: t('A BRAMBLEWICK MEDIA MAGAZINE', '荆芯传媒旗下时尚杂志'), title: t('Fashion Intern', '时尚实习生'), serif: true, prefix: 'SL',
    body: t('We are delighted to offer you the position of Fashion Intern in our fashion closet, starting today.', '我们很高兴地通知你：你被录用为我们时装间的时尚实习生，今天就入职。'),
    rows: [[t('Your desk', '你的工位'), t('A cosy corner desk in the fashion closet, between the racks', '时装间里一张温馨的角落工位，就在衣架之间')], [t('Pay', '薪酬'), t('Coins for every work order you finish', '每完成一张工作单都有金币')], [t('Hours', '工作时间'), t('Whenever suits you. Short breaks are part of the job.', '你方便就好。短暂休息也是工作的一部分。')], [t('Dress code', '着装要求'), t("Chic but comfortable, you'll be on your feet", '时髦但要舒服，你会经常走来走去')]],
    note: t('Lovely to have you.  — Margaux', '很高兴有你加入。  —— 玛戈'), who: t('Margaux Vale, Editor-in-Chief  ·  with Odette, People & Culture', '主编 玛戈·维尔  ·  人事与文化 奥黛特') },
  moonpuff: { zh: '月芙工作室', sub: t('TINY INDIE GAMES, MADE WITH SNACKS', '小小独立游戏，配着零食做出来'), title: t('Game Dev Intern', '游戏开发实习生'), serif: false, prefix: 'MP',
    body: t("Welcome to the team! You're our new Game Dev Intern, starting today.", '欢迎加入！你是我们新的游戏开发实习生，今天就开始。'),
    rows: [[t('Your desk', '你的工位'), t('A corner desk by the arcade cabinet, two monitors, one brave plant', '街机旁边的角落工位，两台显示器，一盆勇敢的绿植')], [t('Pay', '薪酬'), t('Coins for every work order you finish', '每完成一张工作单都有金币')], [t('Hours', '工作时间'), t('Whenever suits you. Breaks count as playtesting.', '你方便就好。休息也算试玩。')], [t('Dress code', '着装要求'), t('Wear whatever you game in', '平时打游戏穿什么就穿什么')]],
    note: t("Can't wait to show you the build!  — Rio", '等不及给你看新版本啦！  —— 里奥'), who: t('Rio, Creative Director  ·  with Mei, Studio Ops', '创意总监 里奥  ·  工作室运营 小美') },
};
export const KIND_NOTE = t('Nobody here keeps score of anyone else, and nobody will ever be upset with you for stopping early.', '这里没有人会给别人打分，也没有人会因为你提前停下来而不高兴。');

// welcome tour: zone (from the map), stop name, two lines from the host
export const TOUR: Record<CompanyId, [string, string, string][]> = {
  stitchlight: [
    ['reception', t('Reception', '前台'), t("Welcome to Stitchlight! I'm Odette, and I look after everyone here. Let me show you around. You can skip the tour any time.", '欢迎来到织光杂志社！我是奥黛特，负责照顾这里的每一个人。我带你四处转转吧，随时都可以跳过参观。')],
    ['lounge', t('Lounge', '休息区'), t('This is the lounge. Sit down whenever your head feels full. A break here is part of the job, never a mark against you.', '这里是休息区。脑子装满了就来坐坐。在这儿休息是工作的一部分，绝不会扣分。')],
    ['bakery', t('Bobbin Bakery', '线轴面包房'), t('Bobbin Bakery, our little cafe. The Coins you earn from tasks can be spent on treats and on things for your desk.', '线轴面包房，我们的小咖啡馆。做任务赚到的金币可以买点心，也可以买工位上的小东西。')],
    ['assistant_desk', t("Priya's desk", '普丽娅的工位'), t("Priya is Margaux's assistant. She hands out the chores, the small tidy-up tasks that keep the day moving.", '普丽娅是玛戈的助理。杂务都由她来发，就是那些让一天顺利运转的小活儿。')],
    ['editor_office', t("Margaux's office", '玛戈的办公室'), t('Margaux is the Editor-in-Chief. Writing tasks come from her. She is kinder than the door suggests.', '玛戈是主编，写作任务都来自她。她本人比这扇门看起来温柔多了。')],
    ['editorial_floor', t('Editorial floor', '编辑部'), t('Jonah does art, Camille does beauty. Each coworker owns a kind of task. Finish theirs and they warm to you, one heart at a time.', '乔纳负责美术，卡米尔负责美妆。每位同事都管一类任务。帮他们做完，他们就会和你越来越亲近，一颗心一颗心地攒。')],
    ['pantry', t('Pantry', '茶水间'), t('Coffee, tea and snacks live here. Help yourself between tasks.', '咖啡、茶和零食都在这儿。做任务的间隙随便拿。')],
    ['fashion_closet', t('Fashion closet: your desk', '时装间：你的工位'), t('And this corner is yours. Theo, the other intern, sits nearby. Decorate it however you like. Now, your badge photo!', '这个角落就是你的啦。另一位实习生西奥就坐在旁边。想怎么布置都行。现在，去拍工牌照吧！')],
  ].map(([z, n, l]) => [z, n, l] as [string, string, string]),
  moonpuff: [
    ['entrance_booth', t('Entrance booth', '入口小亭'), t("Welcome to Moonpuff! I'm Mei, I keep the studio running. Quick lap of the place. You can skip the tour any time.", '欢迎来到月芙！我是小美，工作室的日常运转都归我管。带你快速转一圈，随时都可以跳过参观。')],
    ['beans_corner', t("Bean's corner", '豆豆的角落'), t('This is Bean, our studio cat. Bean is in charge of chores. Yes, really. Do your chores and Bean will like you.', '这是豆豆，我们工作室的猫。杂务归豆豆管，真的。把杂务做好，豆豆就会喜欢你。')],
    ['arcade_nook', t('Arcade nook', '街机角'), t('Arcade cabinets and air hockey. Here a break counts as playtesting.', '街机和桌上冰球。在这儿休息就算试玩。')],
    ['game_room', t('Game room', '游戏室'), t('The game room: big screen, beanbags, moon rug. Come and sit whenever your head feels full.', '游戏室：大屏幕、懒人沙发、月亮地毯。脑子装满了就来坐坐。')],
    ['open_desks', t('Open desks', '开放工位'), t('Sam codes, Ada is the other intern, Kofi talks to players, Rio dreams things up. Each of them owns a kind of task.', '萨姆写代码，艾达是另一位实习生，科菲负责和玩家聊天，里奥负责天马行空。他们每个人都管一类任务。')],
    ['colab', t('Co-lab', '协作室'), t("Builds get tested here. Finish a coworker's tasks and they warm to you, one heart at a time.", '新版本都在这里测试。帮同事做完任务，他们就会和你越来越亲近，一颗心一颗心地攒。')],
    ['kitchen', t('Kitchen', '厨房'), t('Snacks, drinks and the vending machine. The Coins you earn from tasks buy treats and things for your desk.', '零食、饮料和自动售货机。做任务赚的金币可以买点心，也可以买工位上的小东西。')],
    ['idea_wall', t('Idea wall', '点子墙'), t('Any idea can go up on this wall, even the silly ones. Especially the silly ones.', '任何点子都可以贴到这面墙上，傻点子也行。尤其是傻点子。')],
    ['your_corner', t('Your corner', '你的角落'), t('And this corner is yours, right by the arcade cabinets. Make it cosy. Now, your badge photo!', '这个角落就是你的啦，就在街机旁边。把它布置得舒舒服服的。现在，去拍工牌照吧！')],
  ].map(([z, n, l]) => [z, n, l] as [string, string, string]),
};

export const BOOTH_LINE: Record<CompanyId, string> = { stitchlight: t('Chin up a little... perfect. This goes on your badge!', '下巴抬高一点……完美。这张要印在你的工牌上！'), moonpuff: t("Say 'cheese'! Bean is trying to get in the shot again.", '说“茄子”！豆豆又想挤进镜头了。') };
export const BDAY_LINE: Record<CompanyId, string> = { stitchlight: t("Last thing: when's your birthday? We always do cake.", '最后一件事：你的生日是哪天？我们每次都会准备蛋糕。'), moonpuff: t("When's your birthday? Bean likes parties (and cake).", '你的生日是哪天？豆豆最喜欢派对（还有蛋糕）。') };

// work vibes: purely cosmetic
export const VIBES: { id: string; name: string; quirk: string; bubble: string; colour: string }[] = [
  { id: 'snacker', name: t('The Snacker', '小馋猫'), quirk: t('Sneaks a snack from the desk drawer', '从抽屉里偷偷拿零食吃'), bubble: t('"Just one bite..."', '“就吃一口……”'), colour: '#fadec4' },
  { id: 'napper', name: t('The Napper', '瞌睡虫'), quirk: t('Takes a quick nap at the desk', '趁空打个小盹'), bubble: t('"Zzz... five minutes."', '“呼……就五分钟。”'), colour: '#e2daf4' },
  { id: 'scroller', name: t('The Scroller', '刷手机达人'), quirk: t('Scrolls their phone for a moment', '刷一会儿手机'), bubble: t('"Ooh, a cat video."', '“哇，猫咪视频。”'), colour: '#d0e4f6' },
  { id: 'stretcher', name: t('The Stretcher', '伸懒腰派'), quirk: t('Stands up for a big stretch', '站起来伸个大懒腰'), bubble: t('"Aaah, much better."', '“啊——舒服多了。”'), colour: '#d4eed6' },
  { id: 'spinner', name: t('The Spinner', '转椅选手'), quirk: t('Spins around in the chair', '坐在椅子上转圈圈'), bubble: t('"Wheee."', '“呜呼——”'), colour: '#fceeba' },
  { id: 'plant', name: t('The Plant Whisperer', '植物知己'), quirk: t('Chats to the desk plant', '跟桌上的绿植聊天'), bubble: t('"You are doing great, leafy."', '“小叶子，你真棒。”'), colour: '#d6e8cc' },
];

// work style quiz: every question can be skipped
export type Focus = 15 | 30 | 60 | 0;          // 0 = it changes every day
export type SoundMode = 'soft' | 'chime' | 'silent';
export type Reminders = 'nudge' | 'end' | 'none';
export const QUIZ = {
  focus: { q: t('How long can you usually focus?', '你通常能专注多久？'), line: t('Three quick questions so the work fits you. No wrong answers.', '三个小问题，让工作更适合你。没有错误答案。'),
    opts: [[15, t('About 15 minutes', '大约 15 分钟'), t('Quick task orders', '快速小任务')], [30, t('About 30 minutes', '大约 30 分钟'), t('Steady orders', '稳稳的任务')], [60, t('An hour or more', '一小时或更久'), t('Deep focus orders', '深度专注任务')], [0, t('It changes every day', '每天都不一样'), t("I'll ask you each time", '每次我都会问你')]] as [Focus, string, string][] },
  sound: { q: t('Do you like sound while you work?', '工作时你喜欢有声音吗？'), line: t('Some people focus with sound, some need quiet. Both are fine.', '有人听着声音更专注，有人需要安静。两种都很好。'),
    opts: [['soft', t('Soft background sounds', '轻柔的背景音'), t('Room sounds and gentle music', '环境声和轻音乐')], ['chime', t('Just a chime', '只要提示音'), t('Only when time is up', '只在时间到的时候响')], ['silent', t('Keep it silent', '保持安静'), t('No sound at all', '完全没有声音')]] as [SoundMode, string, string][] },
  reminders: { q: t('Do you want gentle reminders?', '需要温柔的提醒吗？'), line: t('Last one. I only ever nudge kindly, never nag.', '最后一个。我只会轻轻提醒，绝不唠叨。'),
    opts: [['nudge', t('Yes, nudge me kindly', '好呀，温柔地提醒我'), t('A soft reminder if a work order has been waiting', '工作单等太久时轻轻提醒一下')], ['end', t("Only when time's up", '只在时间到的时候'), t('Tell me when the timer ends, nothing else', '计时结束时告诉我，其他不用')], ['none', t('No reminders', '不用提醒'), t("I'll come back when I'm ready", '我准备好了自己会回来')]] as [Reminders, string, string][] },
};
export const MONTHS = ZH ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
