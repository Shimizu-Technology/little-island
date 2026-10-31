import type { SharedValue } from "react-native-reanimated";
export type SpritePose = { x: number; y: number; angle?: number; /** Discrete art frame, or painter rank when painterDepth is supplied. */ frame?: number; opacity?: number; scale?: number; /** Optional projected contact depth (1 is the runner), independent of sprite lift. */ painterDepth?: number; /** Stable actor identity, independent of recycled slot order. */ painterKey?: number; /** Change when a slot is recycled or its actor respawns. */ identity?: string | number; /** Discrete previews/ghosts must never tween through occupied space. */ snap?: boolean };
export const HIDDEN_POSE: SpritePose = { x: -2000, y: -2000, opacity: 0 };
export type PoseBuilder<S> = { build: (state: S) => SpritePose[]; target: SharedValue<SpritePose[]>; /** Maximum distance in rendered coordinates, per fixed step. */ snapDistance?: number };
/** Sort only depth actors; hidden slots stay canonical. Shared by fixed poses and
 * interpolated presentation, so rank and rendered contact always cross together. */
export function rankPainterPoses(poses: SpritePose[]): SpritePose[] {
  "worklet";
  let actors: number[] | undefined;
  for (let i = 0; i < poses.length; i++) if (poses[i].painterDepth !== undefined && (poses[i].opacity ?? 1) > 0) (actors ??= []).push(i);
  if (!actors) return poses;
  actors.sort((a, b) => {
    "worklet";
    return poses[a].painterDepth! - poses[b].painterDepth! || poses[a].painterKey! - poses[b].painterKey!;
  });
  for (let rank = 0; rank < actors.length; rank++) {
    const p = poses[actors[rank]];
    const frame = (p.painterDepth! > 1 ? 10001 : 1) + rank;
    if (p.frame !== frame) poses[actors[rank]] = { ...p, frame };
  }
  return poses;
}

/** Rendering only: never feed this pose back into deterministic rules. */
export function interpolatePose(previous: SpritePose | undefined, current: SpritePose, alpha: number, distance = 96): SpritePose {
  "worklet";
  if ((current.opacity ?? 1) <= 0) return HIDDEN_POSE;
  if (!previous || current.snap || previous.identity !== current.identity || (previous.opacity ?? 1) <= 0 || Math.hypot(current.x - previous.x, current.y - previous.y) > distance) return current;
  const t = Math.max(0, Math.min(1, alpha));
  const a = previous.angle ?? 0, b = current.angle ?? 0;
  const painterDepth = current.painterDepth === undefined ? undefined : (previous.painterDepth ?? current.painterDepth) + (current.painterDepth - (previous.painterDepth ?? current.painterDepth)) * t;
  const turn = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const pose: SpritePose = { ...current, x: previous.x + (current.x - previous.x) * t, y: previous.y + (current.y - previous.y) * t, angle: a + turn * t, scale: (previous.scale ?? 1) + ((current.scale ?? 1) - (previous.scale ?? 1)) * t, opacity: (previous.opacity ?? 1) + ((current.opacity ?? 1) - (previous.opacity ?? 1)) * t, identity: current.identity };
  if (painterDepth !== undefined) {
    pose.painterDepth = painterDepth;
    pose.frame = (painterDepth > 1 ? 10000 : 0) + ((current.frame ?? 1) % 10000);
  }
  return pose;
}
export function interpolatePoses(previous: SpritePose[], current: SpritePose[], alpha: number, distance = 96): SpritePose[] {
  "worklet";
  return rankPainterPoses(current.map((p, i) => interpolatePose(previous[i], p, alpha, distance)));
}
/** Compare only the small serializable display payload, never the simulation state. */
export function samePublication(a: unknown, b: unknown): boolean {
  "worklet";
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const key of keys) if (!samePublication((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
  return true;
}
