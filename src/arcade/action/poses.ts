import { HIDDEN_POSE, type SpritePose } from "../poses";
import type { ArtPose } from "../ArtPose";
import { palmConfig, type PalmState } from "../games/palm-patrol/engine";
import { beachConfig, paddleWidth, turtleX, type BeachState } from "../games/beach-ball/engine";
import { type Arena, BALL_RADIUS } from "./arena";
function position(a: Arena, x: number, y: number, w: number, h = w): SpritePose {
  "worklet";
  return { x: a.x + (x - w / 2) * a.scale, y: a.y + (y - h / 2) * a.scale, opacity: 1 };
}
/** Fixed-step art only. All arguments and callees are worklet-safe; no React/HUD objects. */
export function palmPoses(s: PalmState, a: Arena, reduced: boolean, entry: number): ArtPose[] {
  "worklet";
  const next: ArtPose[] = Array(88).fill(HIDDEN_POSE), group = `${s.wave}-${s.relay}-${s.fact}`;
  for (const b of s.beetles) {
    const size = b.boss ? 87 : 58,
      p: ArtPose = position(a, b.x, b.y, size);
    p.identity = `${group}:${b.id}:${b.boss}:${b.caught}`;
    p.frame = !reduced && !b.caught && !b.diving ? Math.floor(s.time * 7 + b.id % 2) % 2 : 0;
    // Small, nonblocking entry gesture; never hide a collidable beetle off-screen.
    if (!reduced && palmConfig(s).world !== "learn") {
      p.x += entry * (s.relay % 3 === 0 ? 0 : s.relay % 2 ? -10 : 10) * a.scale;
      p.y -= entry * (s.relay % 3 === 0 ? 12 : 6) * a.scale;
      p.opacity = 1 - entry * 0.35;
    }
    p.angle = reduced
      ? 0
      : b.caught
        ? Math.sin(s.time * 20) * 0.25
        : b.diving
          ? Math.atan2(b.diveX, palmConfig(s).diveSpeed) + Math.sin(s.time * 6 + b.id) * 0.07
          : s.direction * 0.035;
    p.scale = b.caught ? 0.85 : 1;
    next[(b.boss ? 15 : 0) + b.id] = p;
    if (b.caught) next[30 + b.id] = { ...position(a, b.x, b.y, 58), angle: p.angle, identity: p.identity };
    if (b.hp > 1 && !b.boss) next[73 + b.id] = { ...position(a, b.x, b.y - 12, 14, 7), identity: p.identity };
  }
  for (let i = 0; i < s.husks.length; i++)
    next[45 + i] = { snap: true, ...position(a, s.husks[i].x, s.husks[i].y, 20), angle: reduced ? 0 : s.time * 8 };
  next[57] = {
    ...position(a, s.launcher, 552 + (!reduced && s.lives.invulnerable > 1 ? 7 : 0), 78),
    scale: !reduced && s.cooldown > 0.16 ? 0.94 : 1,
    angle: 0,
    frame: reduced ? 0 : s.cooldown > 0.16 ? 1 : s.cooldown > 0.08 ? 2 : 0,
  };
  if (s.pulse > 0 && s.cue !== "fire") {
    const age = 1 - s.pulse / 0.45;
    for (let i = 0; i < 8; i++)
      next[58 + i] = {
        ...position(
          a,
          s.feedbackX + Math.cos((i * Math.PI) / 4) * age * 42,
          s.feedbackY + Math.sin((i * Math.PI) / 4) * age * 42,
          6
        ),
        opacity: reduced ? 0 : 1 - age,
      };
    next[66] = {
      ...position(a, Math.max(55, Math.min(300, s.feedbackX)), Math.max(76, s.feedbackY - 38 - age * 16), 110, 24),
      opacity: s.pulse / 0.45,
    };
  }
  return next;
}
export type WallSpark = { x: number; y: number; at: number };
export function beachPoses(s: BeachState, a: Arena, reduced: boolean, sparks: WallSpark[]): SpritePose[] {
  "worklet";
  const next: SpritePose[] = Array(72).fill(HIDDEN_POSE), config = beachConfig(s), ballSize = (BALL_RADIUS * 2) / 0.95;
  for (let i = 0; i < Math.min(2, sparks.length); i++) {
    const e = sparks[i], age = (s.time - e.at) / 0.1;
    next[66 + i] = { snap: true, identity: `${e.at}:${e.x}:${e.y}`, ...position(a, e.x, e.y, 18), opacity: 1 - age, scale: reduced ? 1 : 0.9 + age * 0.2 };
  }
  for (let i = 0; i < s.balls.length; i++) {
    const b = s.balls[i];
    if (!reduced && !b.wait && Math.hypot(b.vx, b.vy) >= 330) {
      for (let j = 0; j < 2; j++) {
        const tail = (j + 1) * 0.014;
        next[68 + i * 2 + j] = { identity: `${s.points[0]}:${s.points[1]}:${i}:${j}`, ...position(a, Math.max(12, Math.min(348, b.x - b.vx * tail)), b.y - b.vy * tail, 7), opacity: 0.23 - j * 0.08 };
      }
    }
    next[i] = {
      identity: `${s.points[0]}:${s.points[1]}`,
      ...position(a, b.x, b.y, ballSize),
      angle: reduced ? 0 : s.time * (b.vy < 0 ? -3 : 3),
      scale: !reduced && b.squash ? 1 - b.squash * 0.8 : 1,
    };
  }
  for (let i = 0; i < 2; i++) next[2 + i] = position(a, s.paddles[i], i ? 65 : 535, paddleWidth(s, i as 0 | 1), 20);
  if (config.turtle) next[12] = position(a, turtleX(s), 300, 86);
  let pop = 0;
  for (let j = 0; j < s.effects.length; j++) {
    const e = s.effects[j],
      age = 1 - e.remaining / e.duration;
    for (let i = 0; i < 8; i++)
      next[14 + j * 8 + i] = {
        identity: e.id,
        ...position(
          a,
          e.x + Math.cos((i * Math.PI) / 4) * age * 28,
          e.y + Math.sin((i * Math.PI) / 4) * age * 28,
          5
        ),
        opacity: reduced ? 0 : 1 - age,
      };
    if (e.point && pop < 2) next[62 + pop++] = { ...position(a, e.x, e.y - age * 18, 65, 26), opacity: 1 - age };
  }
  return next;
}
