import type { HazardKind } from './course';
/** The bow reaches contact at z=1; the stern clears at 1+CANOE_DEPTH. */
export const CANOE_DEPTH = .24;
export function isCanoe(kind: HazardKind | string) { 'worklet'; return kind === 'canoe' || kind === 'moving-canoe'; }
/** Compress high flight in the camera only. Rules retain their original heights. */
export function visualRunHeight(height: number) { 'worklet'; return height <= 1 ? height : 1 + (height - 1) * .38; }

/** Convert equal world-depth plank spacing into the pinhole camera's screen fraction.
 * 102.856 is the projected width of a .86-lane deck at the contact plane. */
export function deckDepthFraction(nearWidth: number, farWidth: number, u: number) {
  'worklet';
  const width = 390 * (2 / 3) * .46 * .86;
  return u * (width + nearWidth) / Math.max(.001, (1-u) * (width+farWidth) + u * (width+nearWidth));
}

/** A duck remains below the beam even at the highest safe airborne contact. */
export const DUCK_MAX_ELEVATION = .08;
