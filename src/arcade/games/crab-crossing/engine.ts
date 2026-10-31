import { configureLives, createLives, hitLives, stepLives, validLives, type Lives } from "../../lives";
import {
  allLevelIds,
  levelNumber,
  worldOf,
  type ArcadeEngine,
  type ArcadeLevel,
  type ArcadeResult,
  type LevelId,
} from "../../types";
import { delta, directions, exact, finite, integer, matches, type Direction } from "../grid/rules";
export const CRAB_COLS = 9,
  CRAB_ROWS = 11,
  CRAB_HOP = 0.12,
  CRAB_RESPAWN = 0.3;
/** Body footprint, also drawn by CrabActor and the debug overlay. Claws are decorative. */
export const CRAB_RX = 0.3,
  CRAB_RY = 0.22,
  VEHICLE_RX = 0.46,
  VEHICLE_RY = 0.29;
export type CrabLevel = ArcadeLevel & {
  rank: number;
  speed: number;
  target: number;
  numbers: number[];
  stones: number[];
  par: number;
};
/** Seed-120 moving-lane routes, with 10% room for a different safe landing. */
const crabPars = [
  [30, 30, 30, 30, 30, 30, 29, 29],
  [27, 27, 27, 27, 27, 28, 28, 28],
  [40, 44, 40, 44, 44, 44, 42, 42],
  [43, 44, 43, 43, 41, 41, 46, 46],
  [61, 62, 62, 60, 60, 65, 69, 69],
  [60, 58, 60, 60, 76, 72, 74, 73],
  [11, 18, 18, 18, 18, 18, 18, 18],
];
export const crabLevels: readonly CrabLevel[] = allLevelIds.map((id) => {
  const index = levelNumber(id),
    world = worldOf(id),
    rank = { w1: 0, w2: 1, w3: 2, w4: 3, w5: 4, w6: 5, learn: 0 }[world],
    learn = world === "learn",
    backwards = learn && [2, 5, 8].includes(index),
    skip = index >= 6 ? 5 : index >= 3 ? 2 : 1;
  const numbers = learn ? Array.from({ length: 9 }, (_, i) => (backwards ? 9 - i : i + 1) * skip) : [],
    target = learn ? 1 : 2 + Math.floor(rank / 2) + Number(rank === 5 && index >= 5),
    par = crabPars[learn ? 6 : rank][index - 1];
  return {
    id,
    index,
    world,
    rank,
    speed: [1, 1.4, 1.8, 2.05, 2.3, 2.5][rank] + (index - 1) * 0.045,
    target,
    numbers,
    stones: learn ? Array.from({ length: 9 }, (_, i) => 4 + (index === 1 ? 0 : (Math.floor(i / 2) % 3) - 1)) : [],
    par,
    name: learn
      ? `${backwards ? "Count back" : "Count on"}${skip > 1 ? ` by ${skip}` : ""}`
      : [
          "To the sea!",
          "Look, then hop",
          "Lagoon friends",
          "Two cozy burrows",
          "Coastal explorer",
          "Catch a canoe",
          "Island traffic",
          "Home by the waves",
        ][index - 1],
    goals: [
      learn
        ? `${backwards ? "Count back" : "Count on"}: ${numbers.join(" → ")} · no timer`
        : `Reach ${target} seaside burrows`,
      `At most 1 bump · ${par + target * 10} hops or fewer`,
      `No bumps · ${par} hops or fewer`,
    ],
  };
});
export const crabLevel = (id: LevelId) => crabLevels.find((l) => l.id === id)!;
export type Lane = {
  row: number;
  kind: "bus" | "pickup" | "bike" | "log" | "turtle" | "canoe" | "island";
  speed: number;
  span: number;
  spacing: number;
  offset: number;
};
export type CrabHop = { fromX: number; fromY: number; toX: number; toY: number; age: number };
export type CrabState = {
  level: CrabLevel | "endless";
  seed: number;
  helper: boolean;
  x: number;
  y: number;
  time: number;
  travel: number;
  hops: number;
  crossed: number;
  cursor: number;
  bumps: number;
  score: number;
  shield: number;
  lives: Lives;
  hop: CrabHop | null;
  queue: Direction[];
  respawn: number;
  furthest: number;
  event: number;
  impact: { x: number; y: number; kind: "splat" | "splash" | "score" };
  phase: "play" | "cleared" | "rest" | "stopped";
  message: string;
};
export type CrabInput =
  | { type: "tick" }
  | { type: "hop"; direction: Direction }
  | { type: "helper"; value: boolean }
  | { type: "finish" };
export const crabLearning = (s: CrabState) => s.level !== "endless" && s.level.world === "learn";
export const crabConfig = (s: CrabState) => (s.level === "endless" ? crabLevel("w3-8") : s.level);
export const waterLane = (l: Lane) => ["log", "turtle", "canoe", "island"].includes(l.kind);
/** Integrate this multiplier into travel; never multiply absolute time by a changed speed. */
export const crabPace = (s: CrabState) =>
  (s.helper ? 0.8 : 1) *
  (1 + 0.15 * Math.min(1, (s.crossed + (10 - s.furthest) / 10) / crabConfig(s).target)) *
  (s.level === "endless" ? Math.min(1.6, 1 + s.crossed * 0.025) : 1);
export function crabLanes(s: CrabState): Lane[] {
  if (crabLearning(s)) return [];
  const l = crabConfig(s),
    speed = l.speed,
    offset = (s.seed % 100) / 25,
    log = 0.6 + (l.speed - 1) * 0.45,
    reverse = l.rank >= 3 ? -1 : 1;
  return [
    ...(l.rank >= 4
      ? [{ row: 9, kind: "bike" as const, speed: -speed * 0.85, span: 0.85, spacing: 4.3, offset: offset + 2 }]
      : []),
    { row: 8, kind: "pickup", speed, span: 1.3, spacing: 4.5 - Math.min(0.4, l.rank * 0.08), offset },
    { row: 7, kind: "bus", speed: -speed * 0.8, span: 1.9, spacing: 5.6, offset: offset + 2.5 },
    ...(l.rank > 0
      ? [{ row: 6, kind: "bike" as const, speed: speed * 1.2, span: 0.85, spacing: 4.5, offset: offset + 1 }]
      : []),
    { row: 4, kind: "log", speed: log * reverse, span: 3.5 - Math.min(0.5, l.rank * 0.1), spacing: 4.8, offset: 0 },
    { row: 3, kind: "turtle", speed: -log * 0.82, span: 3.2, spacing: 4.5, offset: 1 },
    ...(l.rank > 0
      ? [
          l.rank === 5
            ? { row: 2, kind: "island" as const, speed: 0, span: 1.9, spacing: 3, offset: 1 }
            : { row: 2, kind: "canoe" as const, speed: log * 0.95 * reverse, span: 3.1, spacing: 4.4, offset: 0 },
        ]
      : []),
    ...(l.rank > 1 ? [{ row: 1, kind: "canoe" as const, speed: log * 0.9, span: 3.2, spacing: 4.5, offset: 1 }] : []),
  ];
}
export function laneObjects(l: Lane, travel: number): number[] {
  const shift = (((l.offset + travel * l.speed) % l.spacing) + l.spacing) % l.spacing;
  return Array.from({ length: 6 }, (_, i) => shift + (i - 1) * l.spacing).filter((x) => x > -l.span && x < 9 + l.span);
}
/** The whole body must fit on the visible deck, including at clipped screen edges. */
export const supported = (l: Lane, x: number, travel: number) =>
  laneObjects(l, travel).some((p) => Math.abs(x - p) <= l.span / 2 - CRAB_RX);
export function crabPosition(s: CrabState): { x: number; y: number; arc: number } {
  if (!s.hop) return { x: s.x, y: s.y, arc: 0 };
  const a = Math.min(1, s.hop.age / CRAB_HOP);
  return {
    x: s.hop.fromX + (s.hop.toX - s.hop.fromX) * a,
    y: s.hop.fromY + (s.hop.toY - s.hop.fromY) * a,
    arc: Math.sin(a * Math.PI) * 0.18,
  };
}
export function createCrab(level: CrabState["level"], seed: number, helper = false): CrabState {
  return {
    level,
    seed: seed >>> 0,
    helper,
    x: 4,
    y: 10,
    time: 0,
    travel: 0,
    hops: 0,
    crossed: 0,
    cursor: 0,
    bumps: 0,
    score: 0,
    shield: 0,
    lives: createLives(helper),
    hop: null,
    queue: [],
    respawn: 0,
    furthest: 10,
    event: 0,
    impact: { x: 4, y: 10, kind: "splat" },
    phase: "play",
    message: "Look, then hop!",
  };
}
function bump(s: CrabState, kind: "splat" | "splash"): CrabState {
  const lives = hitLives(s.lives);
  if (lives === s.lives) return s;
  const p = crabPosition(s),
    y = p.y <= 5 ? 5 : 10;
  return {
    ...s,
    lives,
    shield: lives.invulnerable,
    bumps: Math.min(99999999, s.bumps + 1),
    x: 4,
    y,
    hop: null,
    queue: [],
    respawn: CRAB_RESPAWN,
    event: s.event + 1,
    impact: { x: p.x, y: p.y, kind },
    phase: lives.hearts === 0 ? "rest" : "play",
    message: kind === "splash" ? "Splash! Back to the island" : "Splat! Look for a gap",
  };
}
function collision(s: CrabState): CrabState {
  if (crabLearning(s)) return s;
  const p = crabPosition(s);
  if (s.shield > 0)
    return p.x < 0 || p.x > 8 ? { ...s, x: 4, y: p.y <= 5 ? 5 : 10, hop: null, queue: [], respawn: CRAB_RESPAWN } : s;
  if (p.x < 0 || p.x > 8) return bump(s, "splash");
  for (const lane of crabLanes(s)) {
    if (waterLane(lane)) {
      if (!s.hop && lane.row === s.y && !supported(lane, s.x, s.travel)) return bump(s, "splash");
    } else if (
      Math.abs(p.y - p.arc + 0.6 - (lane.row + 0.55)) < CRAB_RY + VEHICLE_RY &&
      laneObjects(lane, s.travel).some((x) => Math.abs(x - p.x) < lane.span * VEHICLE_RX + CRAB_RX)
    )
      return bump(s, "splat");
  }
  return s;
}
function startHop(s: CrabState, direction: Direction): CrabState {
  const d = delta[direction],
    x = s.x + d.x,
    y = s.y + d.y;
  if (x < 0 || x > 8 || y < 0 || y > 10) return s;
  if (y === 0 && ![1, 4, 7].some((home) => Math.abs(x - home) <= 0.48))
    return { ...s, message: "Find a burrow at the shore" };
  if (
    crabLearning(s) &&
    direction === "up" &&
    y > 0 &&
    (Math.abs(x - crabConfig(s).stones[s.cursor]) > 0.01 || y !== 9 - s.cursor)
  )
    return {
      ...s,
      bumps: s.bumps + 1,
      event: s.event + 1,
      message: `Find ${crabConfig(s).numbers[s.cursor]} on the next stone`,
    };
  if (crabLearning(s) && direction === "down") return s;
  return {
    ...s,
    hop: { fromX: s.x, fromY: s.y, toX: x, toY: y, age: 0 },
    hops: Math.min(99999999, s.hops + 1),
    event: s.event + 1,
    message: "",
  };
}
export function crabTransition(s: CrabState, input: CrabInput): CrabState {
  if (s.phase !== "play") return s;
  if (input.type === "helper")
    return typeof input.value === "boolean"
      ? {
          ...s,
          helper: input.value,
          lives: configureLives(s.lives, input.value),
          phase: configureLives(s.lives, input.value).hearts ? "play" : "rest",
        }
      : s;
  if (input.type === "finish") return s.level === "endless" ? { ...s, phase: "stopped" } : s;
  if (input.type !== "hop" || !directions.includes(input.direction)) return s;
  if (s.hop || s.respawn > 0) return s.queue.length < 2 ? { ...s, queue: [...s.queue, input.direction] } : s;
  return startHop(s, input.direction);
}
function landed(s: CrabState): CrabState {
  const hop = s.hop!,
    cursor = s.cursor + Number(crabLearning(s) && hop.toY < hop.fromY && hop.toY > 0);
  let next = collision({
    ...s,
    x: hop.toX,
    y: hop.toY,
    hop: null,
    cursor,
    furthest: Math.min(s.furthest, hop.toY),
    event: s.event + 1,
    message: cursor > s.cursor ? `${crabConfig(s).numbers[s.cursor]} · Great!` : "",
  });
  if (next.phase !== "play" || next.respawn > 0 || next.y !== 0) return next;
  const crossed = next.crossed + 1,
    score = Math.min(99999999, crossed * 100);
  next = { ...next, crossed, score, event: next.event + 1, impact: { x: hop.toX, y: 0, kind: "score" } };
  return crossed >= (s.level === "endless" ? Infinity : s.level.target)
    ? { ...next, phase: "cleared", queue: [], message: "Home by the sea!" }
    : { ...next, x: 4, y: 10, furthest: 10, respawn: 0.18, queue: [], message: "+100" };
}
export function crabStep(s: CrabState, input: CrabInput, dt: number): CrabState {
  if (input.type !== "tick") return crabTransition(s, input);
  if (s.phase !== "play" || !Number.isFinite(dt) || dt <= 0) return s;
  const step = Math.min(0.1, dt),
    lives = stepLives(s.lives, step),
    travel = crabLearning(s) ? s.travel : s.travel + step * crabPace(s);
  let next = { ...s, time: Math.min(1000000, s.time + step), travel, lives, shield: lives.invulnerable };
  if (s.respawn > 0) return { ...next, respawn: Math.max(0, s.respawn - step) };
  const lane = crabLanes(s).find((l) => l.row === s.y && waterLane(l)),
    drift = (lane?.speed ?? 0) * (travel - s.travel);
  if (s.hop) {
    // A horizontal hop on a deck keeps the same fractional drift as the deck.
    const carry = s.hop.fromY === s.hop.toY ? drift : 0;
    next = {
      ...next,
      hop: { ...s.hop, fromX: s.hop.fromX + carry, toX: s.hop.toX + carry, age: Math.min(CRAB_HOP, s.hop.age + step) },
    };
    next = collision(next);
    if (next.hop && next.hop.age >= CRAB_HOP) next = landed(next);
  } else next = collision({ ...next, x: s.shield > 0 ? Math.max(0, Math.min(8, s.x + drift)) : s.x + drift });
  if (next.phase === "play" && !next.hop && next.respawn === 0 && next.queue.length)
    next = startHop({ ...next, queue: next.queue.slice(1) }, next.queue[0]);
  return next;
}
export function crabStars(s: CrabState): 0 | 1 | 2 | 3 {
  if (s.phase !== "cleared") return 0;
  const l = crabConfig(s);
  return s.bumps === 0 && s.hops <= l.par ? 3 : s.bumps <= 1 && s.hops <= l.par + l.target * 10 ? 2 : 1;
}
export function crabResult(s: CrabState): ArcadeResult | null {
  return s.phase === "play"
    ? null
    : {
        cleared: s.phase === "cleared",
        outcome: s.phase === "cleared" ? "cleared" : s.phase === "stopped" ? "stopped" : "game-over",
        stars: crabStars(s),
        score: s.score,
        detail: `${s.crossed} burrows · ${s.hops} hops · ${s.bumps} bumps`,
      };
}
export function validCrab(v: unknown): v is CrabState {
  if (
    !exact(v, [
      "level",
      "seed",
      "helper",
      "x",
      "y",
      "time",
      "travel",
      "hops",
      "crossed",
      "cursor",
      "bumps",
      "score",
      "shield",
      "lives",
      "hop",
      "queue",
      "respawn",
      "furthest",
      "event",
      "impact",
      "phase",
      "message",
    ]) ||
    !(v.level === "endless" || crabLevels.some((l) => matches(l, v.level)))
  )
    return false;
  if (
    !integer(v.seed, 0xffffffff) ||
    typeof v.helper !== "boolean" ||
    typeof v.x !== "number" ||
    !Number.isFinite(v.x) ||
    v.x < 0 ||
    v.x > 8 ||
    !integer(v.y, 10) ||
    !finite(v.time, 1000000) ||
    !finite(v.travel, 3000000) ||
    ![v.hops, v.crossed, v.bumps, v.score, v.event].every((n) => integer(n)) ||
    !integer(v.cursor, 9) ||
    !finite(v.shield, 1.2) ||
    !validLives(v.lives) ||
    !Array.isArray(v.queue) ||
    v.queue.length > 2 ||
    !v.queue.every((d) => directions.includes(d)) ||
    !finite(v.respawn, CRAB_RESPAWN) ||
    !integer(v.furthest, 10) ||
    !exact(v.impact, ["x", "y", "kind"]) ||
    typeof v.impact.x !== "number" ||
    !Number.isFinite(v.impact.x) ||
    v.impact.x < -1 ||
    v.impact.x > 9 ||
    !finite(v.impact.y, 10) ||
    !["splat", "splash", "score"].includes(v.impact.kind as string) ||
    !["play", "cleared", "rest", "stopped"].includes(v.phase as string) ||
    typeof v.message !== "string" ||
    v.message.length >= 150
  )
    return false;
  if (
    v.hop !== null &&
    (!exact(v.hop, ["fromX", "fromY", "toX", "toY", "age"]) ||
      ![v.hop.fromX, v.hop.toX].every((x) => typeof x === "number" && Number.isFinite(x) && x >= -1 && x <= 9) ||
      !integer(v.hop.fromY, 10) ||
      !integer(v.hop.toY, 10) ||
      !finite(v.hop.age, CRAB_HOP) ||
      Math.abs((v.hop.fromX as number) - (v.hop.toX as number)) +
        Math.abs((v.hop.fromY as number) - (v.hop.toY as number)) >
        1.001)
  )
    return false;
  const s = v as unknown as CrabState;
  if (s.hop && Math.abs(Math.abs(s.hop.fromX - s.hop.toX) + Math.abs(s.hop.fromY - s.hop.toY) - 1) > 0.001)
    return false;
  if (
    s.score !== Math.min(99999999, s.crossed * 100) ||
    s.hops < s.crossed * 10 ||
    s.lives.maxHearts !== (s.helper ? 5 : 3) ||
    s.shield !== s.lives.invulnerable ||
    (s.phase === "rest") !== (s.lives.hearts === 0) ||
    s.lives.hit > s.bumps
  )
    return false;
  if (
    s.level === "endless"
      ? s.phase === "cleared"
      : s.crossed > s.level.target ||
        (s.phase === "cleared" ? s.crossed !== s.level.target || s.y !== 0 : s.crossed >= s.level.target)
  )
    return false;
  return (
    !(!crabLearning(s) && s.cursor !== 0) &&
    !(crabLearning(s) && (s.phase === "rest" || (s.phase === "cleared" && s.cursor !== 9)))
  );
}
export const crabEngine: ArcadeEngine<CrabState, CrabInput, CrabLevel> = {
  create: createCrab,
  reduce: crabTransition,
  step: crabStep,
  result: crabResult,
  validate: validCrab,
};
