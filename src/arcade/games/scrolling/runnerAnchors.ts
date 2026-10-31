import { backPoses } from '../../../islander/rig/poses';
/** Kite and runner origins relative to the same contact point, in track pixels.
 * The kite always selects apex frame 9. Resolve this once, outside the worklet. */
export const KITE_HANDS = [backPoses[9].joints.leftHand, backPoses[9].joints.rightHand]
  .map(([x, y]) => [x - 4, y + 70] as const);
export const KITE_STRINGS = KITE_HANDS.map(([x, y]) => `M36 72L${x} ${y}`).join('');
