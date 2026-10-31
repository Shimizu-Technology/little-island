import { tintPalette, type TintId } from "../catalogMore";
/** Blend towards cream/ink rather than changing opacity over the room. */
export function shade(hex: string, amount: number) {
  const target = amount > 0 ? 255 : 0;
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - Math.abs(amount)) + target * Math.abs(amount)).toString(16).padStart(2, '0')).join('');
}
export function material(tint: TintId, original: string) { return tintPalette[tint] ?? original; }
