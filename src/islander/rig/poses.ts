import { runnerDrawings, type Point } from '../../arcade/games/scrolling/character';
export type { Point };
export type View = 'front' | 'back';
export type Expression = 'happy' | 'focused' | 'thinking' | 'surprised' | 'proud' | 'sleepy' | 'yum';
export type Side = 'left' | 'right';
export type Joint = 'head' | 'neck' | 'leftShoulder' | 'rightShoulder' | 'leftElbow' | 'rightElbow' | 'leftHand' | 'rightHand' | 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee' | 'leftFoot' | 'rightFoot';
export type Pose = Readonly<{ id: string; view: View; joints: Readonly<Record<Joint, Point>>; expression: Expression; compact?: boolean; seated?: boolean; desk?: boolean; frame?: number }>;
const point = (a: Point, length: number, degrees: number): Point => [a[0] + Math.cos(degrees * Math.PI / 180) * length, a[1] + Math.sin(degrees * Math.PI / 180) * length];
export const BONES = { upperArm: 16, forearm: 16, thigh: 14, shin: 14 } as const;
/** Two-bone IK preserves length while choosing the authored bend nearest the guide. */
function solve(a: Point, target: Point, guide: Point, length: number): [Point, Point] {
  const dx = target[0] - a[0], dy = target[1] - a[1], raw = Math.hypot(dx, dy), d = Math.max(.01, Math.min(raw, 2 * length));
  const ux = raw ? dx / raw : 0, uy = raw ? dy / raw : 1, h = Math.sqrt(length * length - d * d / 4), mid: Point = [a[0] + ux * d / 2, a[1] + uy * d / 2];
  const candidates: Point[] = [[mid[0] - uy * h, mid[1] + ux * h], [mid[0] + uy * h, mid[1] - ux * h]];
  const distance = (p: Point) => Math.hypot(p[0] - guide[0], p[1] - guide[1]);
  return [distance(candidates[0]) < distance(candidates[1]) ? candidates[0] : candidates[1], [a[0] + ux * d, a[1] + uy * d]];
}
function front(id: string, arms: number[] = [104, 96, 76, 84], legs: number[] = [94, 94, 86, 86], expression: Expression = 'happy', bob = 0, seated = false, desk = false): Pose {
  const j = { head: [40, 38 + bob], neck: [40, 66 + bob], leftShoulder: [28, 71 + bob], rightShoulder: [52, 71 + bob], leftHip: [32, 100 + bob], rightHip: [48, 100 + bob] } as unknown as Record<Joint, Point>;
  for (const [i, side] of (['left', 'right'] as const).entries()) {
    j[`${side}Elbow`] = point(j[`${side}Shoulder`], 16, arms[i * 2]); j[`${side}Hand`] = point(j[`${side}Elbow`], 16, arms[i * 2 + 1]);
    j[`${side}Knee`] = point(j[`${side}Hip`], BONES.thigh, legs[i * 2]); j[`${side}Foot`] = point(j[`${side}Knee`], BONES.thigh, legs[i * 2 + 1]);
  }
  if (desk) [j.rightElbow, j.rightHand] = solve(j.rightShoulder, [48, 87], [43, 72], 16);
  if (id === 'bathe') { j.leftKnee = [32, 86]; j.rightKnee = [48, 86]; j.leftFoot = [32, 100]; j.rightFoot = [48, 100]; }
  if (id === 'drink') [j.rightElbow, j.rightHand] = solve(j.rightShoulder, [42, 68], [64, 84], 16);
  if (id === 'eat') [j.rightElbow, j.rightHand] = solve(j.rightShoulder, [43, 57], [68, 63], 16);
  return { id, view: 'front', joints: j, expression, seated, desk };
}
export const frontPoses: readonly Pose[] = [
  front('idle'), front('idle-breathe', undefined, [96, 92, 84, 88], 'happy', -.7),
  front('sit-front', [95, 20, 85, 160], [15, 90, 40, 90], 'happy', 0, true),
  front('sit-side', [95, 20, 85, 160], [15, 90, 40, 90], 'happy', 0, true),
  front('lie', [88, 88, 92, 92], [90, 90, 90, 90]),
  front('lie-asleep', [88, 88, 92, 92], [90, 90, 90, 90], 'sleepy'),
  front('bathe', [160, 0, 20, 180], [15, 90, 40, 90], 'happy', 0, true),
  front('hold', [104, 96, 45, -115]),
  front('eat', [104, 96, -15, -130], undefined, 'yum'),
  front('drink', [104, 96, -15, -130], undefined, 'yum'),
  front('wave', [132, 75, -35, -80]), front('cheer', [-140, -100, -40, -80], undefined, 'proud'),
  front('clap', [48, -60, 132, -120], undefined, 'proud'), front('think', [105, 75, -60, -180], undefined, 'thinking'),
  front('try-again', [145, -110, 35, -70], undefined, 'surprised'),
  front('desk-write', [100, 50, 116, 82], [15, 90, 40, 90], 'focused', 0, true, true),
  front('sit-relaxed', [95, 20, 85, 160], [15, 90, 40, 90], 'happy', 0, true),
  ...Array.from({ length: 4 }, (_, i) => front(`dance-${i}`, [[170, -80, -45, -105], [-135, -75, 20, -110], [145, -70, -10, -110], [-155, -90, 30, -100]][i], [[115, 80, 65, 120], [115, 60, 65, 100], [105, 95, 75, 110], [100, 70, 80, 100]][i], 'proud', i % 2 ? -1 : 0)),
];
/** Same 24 indices as RunnerFrameArt: 0–7 keys, 8–15 actions, 16–23 in-betweens. */
export function backPose(frame: number): Pose {
  if (!Number.isInteger(frame) || frame < 0 || frame > 23) throw new RangeError('Runner frame must be 0–23');
  const compact = frame >= 11 && frame <= 13, base = runnerDrawings[frame >= 16 ? frame - 16 : frame % 8], next = runnerDrawings[((frame >= 16 ? frame - 16 : frame % 8) + 1) % 8];
  const mix = (a: Point, b: Point): Point => frame >= 16 ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : a;
  const bob = compact ? 0 : frame === 8 ? 12 : frame === 9 ? 3 : frame === 10 || frame === 14 ? 9 : frame === 15 ? -2 : frame >= 16 ? (base.bob + next.bob) / 2 : base.bob;
  const sy = compact ? (frame === 12 ? 108 : frame === 11 ? 113 : 111) : 70 + bob, hy = compact ? 116 : Math.max(100, 100 + bob);
  const j = { head: [compact ? (frame === 12 ? 47 : frame === 11 ? 41 : 39) : 40, compact ? (frame === 12 ? 111 : 113) : 40 + bob], neck: [40, compact ? 116 : 67 + bob], leftShoulder: [26, sy], rightShoulder: [54, sy], leftHip: [32, hy], rightHip: [48, hy] } as unknown as Record<Joint, Point>;
  for (const [i, side] of (['left', 'right'] as const).entries()) {
    const flip = (p: Point): Point => i ? [80 - p[0], p[1]] : p;
    const foot: Point = compact ? flip([45, 128]) : frame === 9 ? flip([32, 109]) : frame === 14 ? (i ? [57, 124] : [19, 128]) : [8, 10, 15].includes(frame) ? flip([32, 128]) : mix(base.foot[i], next.foot[i]);
    const knee: Point = compact ? flip([54, 107]) : frame === 9 ? flip([22, 98]) : frame === 8 ? flip([22, 103]) : frame === 10 ? flip([24, 112]) : frame === 15 ? flip([40, 105]) : frame === 14 ? (i ? [55, 110] : [24, 107]) : mix(base.knee[i], next.knee[i]);
    [j[`${side}Knee`], j[`${side}Foot`]] = solve(j[`${side}Hip`], foot, knee, BONES.thigh);
    const hand: Point = compact ? flip([32, 118]) : frame === 15 ? flip([20, 22]) : frame === 8 ? flip([16, sy - 23]) : frame === 9 ? flip([12, sy - 22]) : frame === 10 ? flip([24, 88]) : frame === 14 ? (i ? [72, 59] : [9, 53]) : mix(base.hand[i], next.hand[i]);
    const elbow: Point = compact ? flip([45, 108]) : frame === 8 || frame === 9 ? flip([8, sy - 5]) : mix(base.elbow[i], next.elbow[i]);
    [j[`${side}Elbow`], j[`${side}Hand`]] = solve(j[`${side}Shoulder`], hand, elbow, 16);
  }
  if (frame < 8 || frame >= 16) {
    const phase = (frame >= 16 ? frame - 16 + .5 : frame) * Math.PI / 4;
    for (const [i, side] of (['left', 'right'] as const).entries()) {
      const swing = Math.cos(phase + i * Math.PI);
      // Seen from behind, a lifted leg folds in depth: the knee drives forward
      // (shorter thigh) and the shin folds back towards the camera (much shorter
      // shin), so the sole rises under the knee instead of kicking sideways.
      const lift = Math.max(0, -swing), out = i ? 1 : -1, hip = j[`${side}Hip`];
      const knee: Point = [hip[0] + out * 1.5 * lift, hip[1] + BONES.thigh * (1 - .3 * lift)];
      j[`${side}Knee`] = knee;
      j[`${side}Foot`] = [knee[0] + out * lift, Math.min(128, knee[1] + BONES.shin * (1 - .72 * lift)) - (frame % 4 === 2 ? 2 * lift : 0)];
      // Offset the arm crossover from sampled keys and keep a readable depth
      // difference at every static sample. Forward hands sit inside the shirt;
      // the opposite hand reaches down behind, clear of the waist.
      const armPhase = Math.cos(phase + .2), forward = (i ? -armPhase : armPhase) > 0;
      const reach = Math.max(.45, Math.abs(armPhase));
      const hand: Point = forward ? [i ? 50 : 30, sy + 14 - reach * 2] : [i ? 62 : 18, sy + 25 + reach * 3];
      [j[`${side}Elbow`], j[`${side}Hand`]] = solve(j[`${side}Shoulder`], hand, [i ? 65 : 15, sy + 12], 16);
    }
  }
  return { id: `run-${frame}`, view: 'back', joints: j, expression: 'happy', compact, frame };
}
export const backPoses: readonly Pose[] = Array.from({ length: 24 }, (_, i) => backPose(i));
export const runCycleFrames = [0, 16, 1, 17, 2, 18, 3, 19, 4, 20, 5, 21, 6, 22, 7, 23] as const;
export type FrontPoseId = typeof frontPoses[number]['id'];
export function resolvePose(view: View, pose: string | number | Pose): Pose {
  if (typeof pose === 'object') { if (pose.view !== view) throw new Error('Pose/view mismatch'); return pose; }
  if (view === 'back') return backPose(typeof pose === 'number' ? pose : Number(pose.replace('run-', '')));
  const found = frontPoses.find(p => p.id === pose); if (!found) throw new Error(`Unknown front pose: ${pose}`); return found;
}

/** Lying rotates the complete wardrobe together. Anchor is the pillow/head centre. */
export const isLying = (pose: Pose) => pose.id === 'lie' || pose.id === 'lie-asleep';
export function poseBox(pose: Pose) {
  return isLying(pose)
    ? { width: 144, height: 92, anchor: [44, 46] as Point }
    : { width: 80, height: 132, anchor: (pose.id === 'bathe' ? [40, 74] : pose.seated ? [44, 107] : [40, 132]) as Point };
}
