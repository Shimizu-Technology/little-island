import type { Surface } from './course';

export const DECK_HEIGHT = .85, RAMP_DEPTH = .18, DECK_TAIL = .015;
// The track camera scales vertical lift with depth. Short incline quads keep that
// projected curve within a pixel of the profile, rather than linearly spanning it.
export const RAMP_SECTIONS = 3;
type Platform = { surface: Surface; length: number; shellLane: number };

/** Row-local distance behind its top edge. Negative distances approach the ramp foot.
 * The existing trailing support margin is also drawn, so support never outlasts the deck. */
export function surfaceProfile(row: Platform, behind: number, lane = row.shellLane) {
  'worklet';
  if (row.surface === 'sand' || behind > row.length + DECK_TAIL) return 0;
  if (row.surface === 'ramp') return Math.abs(lane-row.shellLane) > .43 ? 0 : DECK_HEIGHT * Math.min(1, Math.max(0, (behind + RAMP_DEPTH) / RAMP_DEPTH));
  return behind >= (row.surface === 'gap' ? RAMP_DEPTH : 0) ? DECK_HEIGHT : 0;
}

/** Front/back row-local coordinates for the flat surface or its separate approach. */
export function surfaceSpan(row: Platform, incline = -1): readonly [number, number] {
  'worklet';
  return incline >= 0 ? [-RAMP_DEPTH * (1-incline/RAMP_SECTIONS), -RAMP_DEPTH * (1-(incline+1)/RAMP_SECTIONS)] : [row.surface === 'gap' ? RAMP_DEPTH : 0, row.length + DECK_TAIL];
}
