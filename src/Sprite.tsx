import { useEffect, useRef } from 'react';
import { DIR_COL } from './look';
// Draws one frame of a 16x32 character sheet, scaled up crisply. Animates the idle loop unless `still`.
export default function Sprite({ sheet, dir = 'front', scale = 6, still = false, crop }: { sheet: HTMLCanvasElement | null; dir?: keyof typeof DIR_COL; scale?: number; still?: boolean; crop?: [number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [y0, h] = crop ?? [0, 32];
  useEffect(() => {
    if (!sheet) return; const cv = ref.current!, x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; let raf = 0; const t0 = performance.now();
    const draw = (now: number) => { const f = still ? 0 : Math.floor((now - t0) / 220) % 6; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(sheet, (DIR_COL[dir] + f) * 16, y0, 16, h, 0, 0, 16 * scale, h * scale); if (!still) raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [sheet, dir, scale, still, y0, h]);
  return <canvas ref={ref} width={16 * scale} height={h * scale} className="sprite" />;
}
