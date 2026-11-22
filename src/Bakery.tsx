import { useEffect, useState } from 'react';
import { COMPANIES } from './data';
import { Save } from './state';
import { play } from './sfx';
import { Item, ItemPic, loadItems } from './BlindBox';
import { BAKERY, FORTUNES, treat, treatsToday } from './treats';
import { ZH, t as tx } from './lang';

const tap = () => play('ui_tap', 0.4);
const COIN = `${import.meta.env.BASE_URL}assets/coin.png`;
function usePics() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { loadItems().then((d) => setItems(d.items)).catch(() => {}); }, []);
  return (id: string) => items.find((i) => i.id === id);
}

// ---------------- the treat counter: Bobbin Bakery at Stitchlight, the kitchen counter at Moonpuff ----------------
export function Bakery({ s, up, close }: { s: Save; up: (p: Partial<Save>) => void; close: () => void }) {
  const pic = usePics(), t = treatsToday(s.treats), where = COMPANIES[s.company].food.name;
  const buy = (key: string, price: number) => {
    if (s.coins < price || t.have.includes(key)) return;
    play('purchase', 0.5); up({ coins: s.coins - price, treats: { ...t, have: [...t.have, key] } });
  };
  return (
    <div className="dim"><div className="card bakery">
      <div className="between"><div className="pix h1">{where}</div><button className="bb-x" onClick={() => { tap(); close(); }} aria-label={tx('Close', '关闭')}>✕</button></div>
      <div className="sub">{tx('A treat lasts for today. It sits on your desk, and its bonus works until the day ends.', '点心只管今天。它会摆在你的桌上，加成一直有效到今天结束。')}</div>
      <div className="bakery-list">
        {BAKERY.map((b) => { const it = pic(b.id), got = t.have.includes(b.key), used = t.used.includes(b.key); return (
          <div key={b.key} className={got ? 'bakery-item got' : 'bakery-item'}>
            <div className="bakery-pic">{it && <ItemPic it={it} size={64} />}</div>
            <div className="bakery-what"><b>{b.name}</b><span className="sub">{b.line}</span><span className="bakery-bonus">✦ {b.bonus}</span></div>
            {got ? <span className="pc-res ok">{used ? tx('Enjoyed today', '今天已享用') : tx('On your desk today', '今天在你桌上')}</span>
              : <button className="btn primary shop-buy" disabled={s.coins < b.price!} onClick={() => buy(b.key, b.price!)}><img src={COIN} alt="" /> {b.price}</button>}
          </div>); })}
      </div>
      <div className="note">{tx('One of each a day. Tomorrow the cups are empty, and nothing is lost.', '每样每天一份。明天杯子就空了，但什么都不会损失。')}</div>
    </div></div>
  );
}

// ---------------- the fridge: on some days there's a little free treat in it ----------------
export function Fridge({ s, up, close }: { s: Save; up: (p: Partial<Save>) => void; close: () => void }) {
  const pic = usePics(), key = s.fridge.item, tr = key ? treat(key) : null, it = tr ? pic(tr.id) : undefined;
  if (!tr) return null;
  const line = tr.key === 'fortune_cookie' ? (ZH ? `纸条上写着：“${FORTUNES[s.fridge.fortune % FORTUNES.length]}”` : `It says: "${FORTUNES[s.fridge.fortune % FORTUNES.length]}"`) : tr.line;
  const take = () => { play('heart_pop', 0.5); const t = treatsToday(s.treats); up({ treats: { ...t, have: t.have.includes(tr.key) ? t.have : [...t.have, tr.key] }, fridge: { ...s.fridge, item: null } }); close(); };
  return (
    <div className="dim"><div className="card fridge-card">
      <div className="pix h1">{tx('Something in the fridge!', '冰箱里有东西！')}</div>
      <div className="fridge-pic">{it && <ItemPic it={it} size={110} />}<div className="bb-orbit">{Array.from({ length: 6 }, (_, k) => <i key={k} style={{ ['--a' as string]: `${k * 60}deg` }} />)}</div></div>
      <b className="fridge-name">{tr.name}</b>
      <div className="sub">{line}</div>
      <div className="note">{tx("A little surprise. It's on the house, and it'll sit on your desk today.", '一个小惊喜。免费的，今天它会摆在你的桌上。')}</div>
      <div className="row bb-btns"><button className="btn ghost" onClick={() => { tap(); close(); }}>{tx('Leave it for now', '先放着吧')}</button><button className="btn primary" onClick={take}>{tx('Take it', '拿走')}</button></div>
    </div></div>
  );
}
