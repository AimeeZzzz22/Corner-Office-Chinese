import { useEffect, useRef, useState } from 'react';
import { VIBES } from './obdata';
import { CARD_BACK, CARD_BACKS, VibeHero, backClass, niumaFor } from './Onboarding';
import { play } from './sfx';

// A reference page for everything in the work vibe moment, numbered so each piece can be talked about and changed:
// D = the draw (face-down cards), R = the reveal page's parts, V = the six vibes and their animations.
const A = `${import.meta.env.BASE_URL}assets/`;
const tap = () => play('ui_tap', 0.4);

const ANIM: Record<string, { what: string; loop: string }> = {
  spinner: { what: 'Spins round twice in the desk chair with a swoosh line, then gets dizzy: swirly eyes, a wobble that slowly settles, three stars circling the head and a "whoa…".', loop: '4.8 s loop: 2.4 s spinning, 2.4 s dizzy' },
  napper: { what: 'Nods off standing up ("…", eyes closing), sways, then tips over onto a bed beside them with a little bounce. A blanket comes up from the feet to the chin, covering the whole body and draping over the bed, and rises and falls with each breath; Zs float up. Then it fades and starts again.', loop: '7.2 s loop: 1.8 s nodding, 0.95 s tipping over, 0.7 s blanket, 3.2 s asleep, 0.6 s fade' },
  snacker: { what: 'Holds a cookie up to the mouth and eats it one bite at a time: each bite leaves a round bite mark, with a "nom" and falling crumbs. After the fourth bite it is gone: happy ^ ^ eyes, a heart and "yum!".', loop: '4.6 s loop: 0.45 s cookie up, 4 bites 0.7 s apart, 1.15 s happy' },
  scroller: { what: 'Holds the phone in both hands and flicks the feed with a thumb. Then the phone zooms up to fill the bubble: a short video of someone dancing, with a like button, a caption, a progress bar and a heart popping on a double tap. Then it shrinks back to scrolling.', loop: '7.6 s loop: 2.4 s scrolling, 0.5 s zoom in, 3.5 s video, 0.5 s zoom out, 0.7 s scrolling' },
  stretcher: { what: 'A chibi stretch: slim arms out to the sides, then up in a V beside the head, eyes shut, leaning slowly left and right with sparkles and a "mmmh…". Then the arms come down with an "ahh".', loop: '3.8 s loop: 0.25 s arms out, 2.2 s up and leaning, 0.25 s down, 1.1 s rest' },
  plant: { what: 'Chats to the desk plant (hearts and notes float over)... until the plant suddenly shoots up and says "You too!". The character jumps with a red "!" and a sweat drop, then they trade hearts, and the plant shrinks back as if nothing happened.', loop: '7 s loop: 2.2 s chatting, 0.7 s growing, 1.5 s talking back and the jump, 1.6 s hearts, 0.5 s shrinking back' },
};

const DRAW = [
  { n: 'D1', name: 'Face-down cards', what: 'Three cards, face down, on gingham with stitching: all three are office cows in ties, or all three are workhorses with badges; the first draw picks one at random, and each redraw swaps to the other. Hover lifts a card and tilts it.' },
  { n: 'D2', name: 'The other two slide away', what: 'The cards you did not pick drop down and fade out (0.45 s).' },
  { n: 'D3', name: 'Lift and shake', what: 'The picked card lifts (0.35 s), then shakes harder and harder for 1.55 s, with 7 little taps getting closer together.' },
  { n: 'D4', name: 'Burst of light', what: 'At 1.9 s a warm white burst fills the screen (1 s), and the reveal appears under it at 2.35 s.' },
];

const PARTS = [
  { n: 'R1', name: 'Glow bubble', what: 'A round radial gradient: white in the middle, the vibe colour, then fading out. It breathes (grows 3.5% and back, 4.2 s).' },
  { n: 'R2', name: 'Dotted ring', what: 'A dotted circle inside the bubble, turning very slowly (one turn in 40 s).' },
  { n: 'R3', name: 'Sparkles', what: 'Five ✦ around the bubble that twinkle on and off at different times (2.4 s).' },
  { n: 'R4', name: 'Speech bubble', what: 'The vibe\'s line in a white comic bubble at the top right. Pops in, then floats up and down.' },
  { n: 'R5', name: 'Icon sticker', what: 'The vibe\'s icon in a white circle at the top left, tilted like a sticker. Spins in.' },
  { n: 'R6', name: 'Caption', what: '"<name> on a tiny break" in a small pill at the bottom of the bubble.' },
  { n: 'R7', name: 'Name and sentence', what: '"YOU\'RE", the vibe name in big pixel type, and one sentence with the action highlighted in the vibe colour.' },
  { n: 'R8', name: 'Redraws and buttons', what: 'Two coins for redraws left in a tinted box, then Keep this one and Draw again (or Continue after the last draw).' },
];

export default function VibeGallery({ sheet, who, close }: { sheet: HTMLCanvasElement | null; who: string; close: () => void }) {
  const [hero, setHero] = useState(VIBES[0].id);
  const [back, setBack] = useState<string>(CARD_BACK);
  const pickBack = (id: string) => { tap(); setBack(id); };
  const hv = VIBES.find((v) => v.id === hero)!;
  // a small working copy of the draw: click Replay to watch D1 to D4
  const [picked, setPicked] = useState<number | null>(null), [burst, setBurst] = useState(false), [round, setRound] = useState(0);
  const [drawNo, setDrawNo] = useState(0), mix = niumaFor('cow', drawNo);   // each replay counts as a redraw, so it swaps animal
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const replay = (i = 1) => {
    timers.current.forEach(clearTimeout); timers.current = []; setPicked(null); setBurst(false); setRound((r) => r + 1); if (round > 0) setDrawNo((d) => d + 1);
    timers.current.push(window.setTimeout(() => { setPicked(i); tap(); }, 400));
    [750, 1100, 1400, 1650, 1850, 2020, 2160].forEach((ms) => timers.current.push(window.setTimeout(() => play('ui_tap', 0.25), ms)));
    timers.current.push(window.setTimeout(() => { setBurst(true); play('coin', 0.4); }, 2300));
    timers.current.push(window.setTimeout(() => setPicked(null), 2750));
    timers.current.push(window.setTimeout(() => setBurst(false), 3300));
  };
  return (
    <div className="vg">
      <div className="vg-head"><div><div className="pix vg-h">Work vibe: everything in it</div><div className="sub">Each piece has a number. Tell me which one to change and how, for example "V3: make the crumbs bigger".</div></div>
        <button className="bb-x" onClick={() => { tap(); close(); }} aria-label="Close">✕</button></div>
      {/* jump to a section; the page scrolls for the rest */}
      <nav className="vg-nav">{[['vg-d', 'D', 'The draw'], ['vg-r', 'R', 'The reveal page'], ['vg-v', 'V', 'The six vibes']].map(([id, k, t]) => (
        <button key={id} onClick={() => { tap(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><b>{k}</b>{t}</button>))}
        <span className="sub">Scroll down to see everything ↓</span></nav>

      <section id="vg-d">
        <h2><b>D</b> The draw</h2>
        <div className="vg-row">
          <div className="vg-drawbox">
            {burst && <div className="vibe-burst" />}
            <div key={round} className={picked !== null ? 'facedown drawing' : 'facedown'}>{[0, 1, 2].map((i) => <button key={i} className={`${picked === null ? 'fd' : picked === i ? 'fd picked' : 'fd away'} ${backClass(back, i, mix)}`} onClick={() => replay(i)}><span>?</span></button>)}</div>
            <button className="btn ghost vg-replay" onClick={() => replay()}>Replay the draw</button>
          </div>
          <ol className="vg-list">{DRAW.map((d) => <li key={d.n}><em>{d.n}</em><div><b>{d.name}</b><span>{d.what}</span></div></li>)}</ol>
        </div>
        <div className="vg-backs-h"><b>D1 card back: the game uses D1-j (all cows or all horses; a redraw swaps)</b><span className="sub">Click any version to preview it in the draw above.</span></div>
        <div className="vg-backs">{CARD_BACKS.map((c, i) => (
          <button key={c.id} className={c.id === back ? 'on' : ''} onClick={() => pickBack(c.id)}>
            <span className="vg-back-card"><span className={`fd cb-${c.id === 'niuma' ? 'cow' : c.id}`}><span>?</span></span>{c.id === 'niuma' && <span className="fd cb-horse vg-mixed"><span>?</span></span>}</span>
            <em>D1-{'abcdefghij'[i]}</em><b>{c.name}</b>{c.id === CARD_BACK && <small>in the game</small>}
          </button>))}</div>
      </section>

      <section id="vg-r">
        <h2><b>R</b> The reveal page</h2>
        <div className="vg-row">
          <div className="vg-heroBox">
            <VibeHero v={hv} sheet={sheet} who={who} />
            <div className="vg-pick">{VIBES.map((v) => <button key={v.id} className={v.id === hero ? 'on' : ''} style={{ ['--c' as string]: v.colour }} onClick={() => { tap(); setHero(v.id); }}><img src={`${A}ob/vibe/${v.id}.png`} alt="" />{v.name.replace('The ', '')}</button>)}</div>
          </div>
          <ol className="vg-list">{PARTS.map((d) => <li key={d.n}><em>{d.n}</em><div><b>{d.name}</b><span>{d.what}</span></div></li>)}</ol>
        </div>
      </section>

      <section id="vg-v">
        <h2><b>V</b> The six vibes</h2>
        <div className="vg-grid">
          {VIBES.map((v, i) => (
            <div key={v.id} className="vg-vibe" style={{ ['--c' as string]: v.colour }}>
              <div className="vg-vhead"><em>V{i + 1}</em><span className="pix">{v.name}</span></div>
              <div className="vg-mini"><VibeHero v={v} sheet={sheet} who={who} parts={false} /></div>
              <div className="vg-meta">
                <div className="vg-icon"><img src={`${A}ob/vibe/${v.id}.png`} alt="" /><small>icon</small></div>
                <div className="vg-sw"><i style={{ background: v.colour }} /><small>{v.colour}</small></div>
              </div>
              <dl>
                <dt>Does</dt><dd>{v.quirk}</dd>
                <dt>Says</dt><dd>{v.bubble}</dd>
                <dt>Animation</dt><dd>{ANIM[v.id].what}</dd>
                <dt>Timing</dt><dd>{ANIM[v.id].loop}</dd>
              </dl>
            </div>))}
        </div>
      </section>
    </div>
  );
}
