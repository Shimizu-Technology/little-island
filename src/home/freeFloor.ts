import { itemSpec } from './catalog';
import type { Instance } from './model';
/** Character edits use this without tightening validation of historical saves. */
export function freeFloor(items: readonly Instance[], x: number, y: number) {
  const cx = Number.isFinite(x) ? Math.max(0, Math.min(19, Math.round(x))) : 8;
  const cy = Number.isFinite(y) ? Math.max(0, Math.min(11, Math.round(y))) : 8;
  let best = { x: 18, y: cy }, distance = Infinity;
  for (let row = 0; row < 12; row++) for (let col = 0; col < 20; col++) {
    const occupied = items.some(i => {
      if (i.layer !== 'furniture' || i.on) return false;
      const [a,b] = itemSpec(i.item).footprint, [w,h] = i.rotation % 180 ? [b*2,a*2] : [a*2,b*2];
      return col >= i.x && col < i.x+w && row >= i.y && row < i.y+h;
    });
    const d = (col-cx)**2 + (row-cy)**2;
    if (!occupied && d < distance) { best = {x:col,y:row}; distance=d; }
  }
  return best;
}
