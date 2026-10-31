import {
  allLevelIds,
  levelNumber,
  nextRandom,
  worldOf,
  type ArcadeEngine,
  type ArcadeLevel,
  type ArcadeResult,
  type LevelId,
} from "../../types";
import { canonicalLevel, clamp, exact, finite, integer } from "../../action/validation";
import { BALL_RADIUS, PADDLE_CONTACT, paddleContact } from "../../action/arena";
export type Strength = "gentle" | "steady" | "zippy";
export const BEACH_CAP = 450,
  SERVE_SECONDS = 0.65;
export const computer = {
  gentle: { reach: 80, error: 50, reaction: 0.16, predict: 0.1 },
  steady: { reach: 150, error: 35, reaction: 0.11, predict: 0.65 },
  zippy: { reach: 230, error: 32, reaction: 0.07, predict: 0.95 },
} as const;
export type BeachLevel = ArcadeLevel & {
  target: number;
  speed: number;
  wind: number;
  turtle: boolean;
  balls: number;
  countBy: 1 | 2 | 5;
  spin: number;
  gust: boolean;
  tide: boolean;
  ramp: number;
};
export const beachLevels: readonly BeachLevel[] = allLevelIds.map((id) => {
  const index = levelNumber(id),
    world = worldOf(id),
    rank = world === "learn" ? 0 : Number(world[1]) - 1,
    learning = world === "learn",
    target = rank >= 3 ? 7 : 5;
  return {
    id,
    index,
    world,
    name: learning
      ? index <= 4
        ? "Two by two"
        : "High fives"
      : [
          "First splash",
          "Beach buddies",
          "Back & forth",
          "A sunny rally",
          "Sea breeze",
          "Turtle time",
          "Double splash",
          "Sunset final",
        ][index - 1],
    target,
    speed: learning ? 210 + (index - 1) * 3 : 250 + rank * 13 + (index - 1) * 3,
    wind: rank > 0 ? 10 + rank * 2 + index : 0,
    turtle: rank >= 1,
    balls: rank >= 2 ? 2 : 1,
    spin: rank >= 3 ? 32 + index * 2 : 0,
    gust: rank >= 4,
    tide: rank >= 5,
    ramp: 0.1 + rank * 0.015,
    countBy: learning ? (index <= 4 ? 2 : 5) : 1,
    goals: [
      `First to ${target * (learning ? (index <= 4 ? 2 : 5) : 1)} points${learning ? (index <= 4 ? " · count by 2s" : " · count by 5s") : ""}`,
      "Concede at most 1 point",
      "Win without conceding a point",
    ],
  };
});
export function beachLevel(id: LevelId) {
  "worklet";
  return beachLevels.find((l) => l.id === id)!;
}
export type Ball = { x: number; y: number; vx: number; vy: number; wait: number; spin: number; squash: number };
export type BeachEffect = { id: number; x: number; y: number; remaining: number; duration: number; point: boolean };
export type BeachState = {
  level: BeachLevel | "endless";
  seed: number;
  helper: boolean;
  mode: "solo" | "together";
  strength: Strength;
  phase: "play" | "cleared" | "rest";
  time: number;
  paddles: [number, number];
  balls: Ball[];
  points: [number, number];
  hits: number;
  rally: number;
  bestRally: number;
  event: number;
  effects: BeachEffect[];
  feedback: string;
  feedbackX: number;
  feedbackY: number;
  cue: "none" | "paddle" | "turtle" | "point";
  pulse: number;
  winner: 0 | 1 | null;
  score: number;
  aiClock: number;
  aiTarget: number;
};
export type BeachInput =
  | { type: "tick" }
  | { type: "paddle"; seat: 0 | 1; x: number }
  | { type: "helper"; value: boolean }
  | { type: "finish" };
export function paddleWidth(s: BeachState, seat: 0 | 1 = 0) {
  "worklet";
  return s.helper && (seat === 0 || s.mode === "together") ? 116 : 86;
}
export function beachConfig(s: BeachState): BeachLevel {
  "worklet";
  return s.level === "endless" ? { ...beachLevel("w6-8"), target: 99999999 } : s.level;
}
export function turtleX(s: BeachState) {
  "worklet";
  return beachConfig(s).tide ? 180 + Math.sin(s.time * 0.65) * 64 : 180;
}
export function beachStartSpeed(s: BeachState) {
  "worklet";
  const c = beachConfig(s);
  return c.speed * (s.helper ? 0.84 : 1) * (1 + c.ramp * Math.min(1, (s.points[0] + s.points[1]) / (c.target * 1.4)));
}
function serve(s: BeachState, i: number, toward: number): [Ball, number] {
  "worklet";
  const [seed, r] = nextRandom(s.seed),
    speed = beachStartSpeed(s),
    vx = (r - 0.5) * speed * 1.05;
  const config = beachConfig(s),
    slot = (s.points[0] + s.points[1] + i) % 2;
  // A marked centre serve; two-ball courts alternate lanes and stagger the second ball.
  return [
    {
      x: config.turtle || config.balls === 2 ? (slot ? 228 : 132) : 180,
      y: config.turtle ? (slot ? 350 : 250) : 300,
      vx,
      vy: toward * Math.sqrt(speed * speed - vx * vx),
      wait: SERVE_SECONDS + (i ? 0.45 : 0),
      spin: 0,
      squash: 0,
    },
    seed,
  ];
}
export function createBeach(
  level: BeachState["level"],
  seed: number,
  helper = false,
  mode: BeachState["mode"] = "solo",
  strength: Strength = "gentle"
): BeachState {
  let s: BeachState = {
    level,
    seed: seed >>> 0,
    helper,
    mode,
    strength,
    phase: "play",
    time: 0,
    paddles: [180, 180],
    balls: [],
    points: [0, 0],
    hits: 0,
    rally: 0,
    bestRally: 0,
    event: 0,
    effects: [],
    feedback: "",
    feedbackX: 180,
    feedbackY: 300,
    cue: "none",
    pulse: 0,
    winner: null,
    score: 0,
    aiClock: 0,
    aiTarget: 180,
  };
  for (let i = 0; i < beachConfig(s).balls; i++) {
    const [ball, next] = serve(s, i, i ? 1 : -1);
    s = { ...s, seed: next, balls: [...s.balls, ball] };
  }
  return s;
}
function capBall(b: Ball) {
  "worklet";
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > BEACH_CAP) {
    b.vx *= BEACH_CAP / speed;
    b.vy *= BEACH_CAP / speed;
  }
}
export function beachTransition(s: BeachState, input: BeachInput): BeachState {
  "worklet";
  if (s.phase !== "play") return s;
  if (input.type === "helper" && typeof input.value === "boolean") {
    if (input.value === s.helper) return s;
    const next = { ...s, helper: input.value };
    const paddles = s.paddles.map((x, i) =>
      clamp(x, paddleWidth(next, i as 0 | 1) / 2, 360 - paddleWidth(next, i as 0 | 1) / 2)
    ) as [number, number];
    return {
      ...next,
      paddles,
      balls: s.balls.map((b) => {
        const ball = { ...b, vx: b.vx * (input.value ? 0.84 : 1 / 0.84), vy: b.vy * (input.value ? 0.84 : 1 / 0.84) };
        capBall(ball);
        return ball;
      }),
    };
  }
  if (
    input.type === "paddle" &&
    (input.seat === 0 || input.seat === 1) &&
    finite(input.x, -10000, 10000) &&
    (s.mode === "together" || input.seat === 0)
  ) {
    const paddles: [number, number] = [...s.paddles];
    paddles[input.seat] = clamp(input.x, paddleWidth(s, input.seat) / 2, 360 - paddleWidth(s, input.seat) / 2);
    return { ...s, paddles };
  }
  return input.type === "finish" && s.level === "endless" ? { ...s, phase: "rest" } : s;
}
export function reflectedX(x: number) {
  "worklet";
  const span = 360 - BALL_RADIUS * 2,
    folded = (((x - BALL_RADIUS) % (span * 2)) + span * 2) % (span * 2);
  return BALL_RADIUS + (folded <= span ? folded : span * 2 - folded);
}
function cue(s: BeachState, kind: BeachState["cue"], x: number, y: number, text: string, duration: number) {
  "worklet";
  s.event++;
  s.cue = kind;
  s.feedbackX = x;
  s.feedbackY = y;
  s.feedback = text;
  s.pulse = duration;
  s.effects = [...s.effects, { id: s.event, x, y, remaining: duration, duration, point: kind === "point" }].slice(-6);
}
export function beachStep(before: BeachState, input: BeachInput, dt: number): BeachState {
  "worklet";
  if (input.type !== "tick") return beachTransition(before, input);
  if (before.phase !== "play" || !finite(dt, 0, 0.1) || !dt) return before;
  const config = beachConfig(before),
    s: BeachState = {
      ...before,
      time: before.time + dt,
      pulse: Math.max(0, before.pulse - dt),
      effects: before.effects.map((e) => ({ ...e, remaining: e.remaining - dt })).filter((e) => e.remaining > 0),
      paddles: [...before.paddles],
      points: [...before.points],
      balls: before.balls.map((b) => ({ ...b })),
    };
  if (s.mode === "solo") {
    const policy = computer[s.strength],
      width = paddleWidth(s, 1);
    s.aiClock -= dt;
    if (s.aiClock <= 0) {
      s.aiClock = policy.reaction;
      const ball =
        s.balls
          .filter((b) => b.vy < 0 && !b.wait)
          .sort((a, b) => (a.y - PADDLE_CONTACT[1]) / -a.vy - (b.y - PADDLE_CONTACT[1]) / -b.vy)[0] ?? s.balls[0];
      const future = reflectedX(ball.x + ball.vx * Math.max(0, (ball.y - PADDLE_CONTACT[1]) / Math.max(1, -ball.vy)));
      const goal = s.paddles[0] < 180 ? 325 : 35,
        slope = (goal - future) / 426;
      const attack =
        (-(slope / Math.sqrt(1 + slope * slope)) / 0.82) *
        (width / 2) *
        (s.strength === "gentle" ? 0 : s.strength === "steady" ? 0.7 : 1);
      s.aiTarget = clamp(
        ball.x +
          (future - ball.x) * policy.predict +
          attack +
          Math.sin(s.time * 2.1 + (s.seed % 11)) * policy.error * (s.helper ? 1.12 : 1),
        width / 2,
        360 - width / 2
      );
    }
    const reach = policy.reach * (s.helper ? 0.85 : 1);
    s.paddles[1] = clamp(
      s.paddles[1] + clamp(s.aiTarget - s.paddles[1], -reach * dt, reach * dt),
      width / 2,
      360 - width / 2
    );
  }
  for (let i = 0; i < s.balls.length; i++) {
    const b = s.balls[i];
    b.squash = Math.max(0, b.squash - dt);
    if (b.wait > 0) {
      b.wait = Math.max(0, b.wait - dt);
      continue;
    }
    const oldX = b.x,
      oldY = b.y;
    const gust = config.gust ? Math.sin(s.time * 1.3) : Math.sin(s.time * 0.8 + i);
    b.vx += (gust * config.wind + b.spin) * dt;
    b.spin *= Math.max(0, 1 - 1.8 * dt);
    capBall(b);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < BALL_RADIUS || b.x > 360 - BALL_RADIUS) {
      b.x = reflectedX(b.x);
      b.vx *= -1;
    }
    const seat = b.vy > 0 ? 0 : 1,
      width = paddleWidth(s, seat);
    const contact = paddleContact(oldX, oldY, b.x, b.y, s.paddles[seat], seat, width);
    if (contact !== null) {
      const contactX = oldX + (b.x - oldX) * contact,
        contactY = oldY + (b.y - oldY) * contact;
      const offset = clamp((contactX - s.paddles[seat]) / (width / 2), -1, 1),
        speed = Math.min(BEACH_CAP, Math.hypot(b.vx, b.vy) * 1.04);
      b.vx = offset * speed * 0.82;
      b.vy = (seat === 0 ? -1 : 1) * Math.sqrt(speed * speed - b.vx * b.vx);
      b.x = reflectedX(contactX + b.vx * dt * (1 - contact));
      b.y = contactY + b.vy * dt * (1 - contact);
      b.spin = offset * config.spin;
      b.squash = 0.18;
      s.hits++;
      s.rally++;
      s.bestRally = Math.max(s.bestRally, s.rally);
      s.score = Math.min(99999999, s.score + 10);
      cue(s, "paddle", contactX, contactY + (seat === 0 ? BALL_RADIUS : -BALL_RADIUS), "", 0.2);
    }
    if (config.turtle) {
      const centreX = turtleX(s),
        dx = b.x - centreX,
        dy = b.y - 300,
        distance = Math.hypot(dx, dy),
        radius = 30 + BALL_RADIUS;
      if (distance < radius && distance > 0.001) {
        const nx = dx / distance,
          ny = dy / distance,
          dot = b.vx * nx + b.vy * ny;
        b.x = centreX + nx * radius;
        b.y = 300 + ny * radius;
        if (dot < 0) {
          b.vx -= 2 * dot * nx;
          b.vy -= 2 * dot * ny;
          if (Math.abs(b.vy) < 90) b.vy = (b.vy < 0 ? -1 : 1) * 90;
          capBall(b);
          b.squash = 0.18;
          cue(s, "turtle", centreX + nx * 30, 300 + ny * 30, "", 0.2);
        }
      }
    }
    if (b.y < -BALL_RADIUS || b.y > 600 + BALL_RADIUS) {
      const scorer = b.y < 0 ? 0 : 1;
      s.points[scorer]++;
      s.rally = 0;
      s.score = Math.min(99999999, s.score + (scorer === 0 || s.mode === "together" ? 100 : 0));
      cue(s, "point", clamp(s.paddles[scorer] + 60, 40, 310), scorer === 0 ? 555 : 45, `+${config.countBy}`, 0.45);
      const [next, seed] = serve(s, i, scorer === 0 ? 1 : -1);
      s.balls[i] = next;
      s.seed = seed;
    }
  }
  // Resolve every ball before judging. Simultaneous match points continue at a tie.
  const target = s.mode === "together" && s.level === "endless" ? 7 : config.target;
  if (Math.max(...s.points) >= target && s.points[0] !== s.points[1]) {
    s.winner = s.points[0] > s.points[1] ? 0 : 1;
    s.phase = s.mode === "together" || s.winner === 0 ? "cleared" : "rest";
  }
  return s;
}
export function beachResult(s: BeachState): ArcadeResult | null {
  "worklet";
  if (s.phase === "play") return null;
  const cleared = s.phase === "cleared",
    losing = Math.min(...s.points),
    count = beachConfig(s).countBy;
  return {
    cleared,
    outcome: cleared ? "cleared" : s.winner === null ? "stopped" : "game-over",
    stars: !cleared ? 0 : losing === 0 ? 3 : losing <= 1 ? 2 : 1,
    score: s.score,
    detail: `${s.points[0] * count} : ${s.points[1] * count} · best rally ${s.bestRally}`,
  };
}
export function validBeach(v: unknown): v is BeachState {
  if (
    !exact(
      v,
      "level seed helper mode strength phase time paddles balls points hits rally bestRally event effects feedback feedbackX feedbackY cue pulse winner score aiClock aiTarget"
    ) ||
    !(v.level === "endless" || canonicalLevel(v.level, beachLevels)) ||
    !integer(v.seed, 0xffffffff) ||
    typeof v.helper !== "boolean" ||
    !["solo", "together"].includes(v.mode as string) ||
    !["gentle", "steady", "zippy"].includes(v.strength as string) ||
    !["play", "cleared", "rest"].includes(v.phase as string)
  )
    return false;
  return (
    Array.isArray(v.effects) &&
    v.effects.length <= 6 &&
    v.effects.every(
      (e) =>
        exact(e, "id x y remaining duration point") &&
        integer(e.id) &&
        finite(e.x, 0, 360) &&
        finite(e.y, 0, 600) &&
        finite(e.remaining, 0, 0.45) &&
        finite(e.duration, 0.2, 0.45) &&
        typeof e.point === "boolean"
    ) &&
    finite(v.time) &&
    finite(v.aiClock, 0, 0.16) &&
    finite(v.aiTarget, 0, 360) &&
    Array.isArray(v.paddles) &&
    v.paddles.length === 2 &&
    v.paddles.every((n) => finite(n, 0, 360)) &&
    Array.isArray(v.balls) &&
    v.balls.length >= 1 &&
    v.balls.length <= 2 &&
    v.balls.every(
      (b) =>
        exact(b, "x y vx vy wait spin squash") &&
        finite(b.x, 0, 360) &&
        finite(b.y, -BALL_RADIUS, 600 + BALL_RADIUS) &&
        finite(b.vx, -450.001, 450.001) &&
        finite(b.vy, -450.001, 450.001) &&
        Math.hypot(b.vx, b.vy) <= 450.001 &&
        finite(b.wait, 0, 1.1) &&
        finite(b.spin, -60, 60) &&
        finite(b.squash, 0, 0.18)
    ) &&
    Array.isArray(v.points) &&
    v.points.length === 2 &&
    v.points.every((n) => integer(n)) &&
    [v.hits, v.rally, v.bestRally, v.event, v.score].every((n) => integer(n)) &&
    (v.bestRally as number) >= (v.rally as number) &&
    typeof v.feedback === "string" &&
    v.feedback.length <= 30 &&
    finite(v.pulse, 0, 0.45) &&
    finite(v.feedbackX, 0, 360) &&
    finite(v.feedbackY, 0, 600) &&
    ["none", "paddle", "turtle", "point"].includes(v.cue as string) &&
    (v.winner === null || v.winner === 0 || v.winner === 1) &&
    (v.phase !== "play" || v.winner === null)
  );
}
export const beachEngine: ArcadeEngine<BeachState, BeachInput, BeachLevel> = {
  create: createBeach,
  reduce: beachTransition,
  step: beachStep,
  result: beachResult,
  validate: validBeach,
};
