import { wordEntry } from "../../../learn/kit/reading";
import { songWords } from "../shell-song/engine";
import { configureLives, createLives, hitLives, stepLives, validLives, type Lives } from "../../lives";
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
import {
  cell,
  delta,
  directions,
  exact,
  finite,
  inside,
  integer,
  matches,
  opposite,
  same,
  type Cell,
  type Direction,
} from "../grid/rules";
export const RAIL_COLS = 10,
  RAIL_ROWS = 10,
  RAIL_RESPAWN = 0.3,
  RAIL_LEARN_MOVE = 0.12;
export type RailLevel = ArcadeLevel & {
  target: number;
  tick: number;
  hedges: Cell[];
  snakeRow: number;
  snakeSpan: number;
  sequence: string[];
  word?: string;
  par: number;
};
/** Open outer ring and two bottom rows remain connected in every authored garden. */
const garden = (rank: number): Cell[] => {
  const pairs =
    rank === 0
      ? []
      : rank === 1
        ? [
            [4, 4],
            [5, 4],
          ]
        : rank === 2
          ? [
              [4, 4],
              [5, 4],
              [7, 5],
              [7, 6],
              [2, 2],
            ]
          : rank === 3
            ? [
                [3, 3],
                [3, 4],
                [3, 5],
                [6, 3],
                [6, 4],
                [6, 5],
              ]
            : rank === 4
              ? [
                  [2, 3],
                  [3, 3],
                  [6, 3],
                  [7, 3],
                  [2, 6],
                  [3, 6],
                  [6, 6],
                  [7, 6],
                ]
              : [
                  [2, 3],
                  [3, 3],
                  [3, 4],
                  [6, 4],
                  [6, 5],
                  [7, 5],
                  [3, 6],
                  [4, 6],
                ];
  return pairs.map(([x, y]) => ({ x, y }));
};
/** Seed-120 legal route fixtures, rounded up with 8% route-choice margin. */
const railPars = [
  [65, 75, 85, 85, 90, 90, 105, 105],
  [85, 85, 95, 95, 105, 105, 110, 110],
  [130, 130, 145, 145, 160, 160, 165, 165],
  [185, 185, 215, 215, 230, 230, 235, 235],
  [230, 230, 240, 240, 250, 250, 310, 310],
  [275, 275, 295, 295, 295, 295, 300, 300],
  [40, 40, 45, 45, 35, 35, 35, 35],
];
export const railLevels: readonly RailLevel[] = allLevelIds.map((id) => {
  const index = levelNumber(id),
    world = worldOf(id),
    rank = { w1: 0, w2: 1, w3: 2, w4: 3, w5: 4, w6: 5, learn: 0 }[world],
    learn = world === "learn";
  const word = learn && index > 4 ? songWords[index - 5] : undefined;
  const sequence = word
    ? [...wordEntry(word)!.tiles]
    : learn
      ? Array.from({ length: 4 + Math.floor(index / 3) }, (_, n) =>
          String((n + 1) * (index === 3 ? 2 : index === 4 ? 5 : 1))
        )
      : [];
  const target = learn ? sequence.length : [6, 9, 12, 15, 18, 21][rank] + Math.floor((index - 1) / 2);
  const par = railPars[learn ? 6 : rank][index - 1];
  return {
    id,
    index,
    world,
    target,
    tick: learn
      ? RAIL_LEARN_MOVE
      : [0.24, 0.19, 0.145, 0.135, 0.128, 0.12][rank] - (index - 1) * [0.003, 0.004, 0.003, 0.002, 0.0015, 0.001][rank],
    hedges: garden(rank),
    snakeRow: learn ? -1 : rank < 2 ? 1 : 2,
    snakeSpan: 3 + Math.min(3, rank),
    sequence,
    ...(word ? { word } : {}),
    par,
    name: learn
      ? word
        ? `Spell ${word}`
        : index === 3
          ? "Two by two"
          : index === 4
            ? "Fives in the garden"
            : "Counting chicks"
      : [
          "First little chick",
          "Garden party",
          "Follow Mama",
          "Around the flowers",
          "Little explorers",
          "Parade day",
          "A growing family",
          "Home together",
        ][index - 1],
    goals: [
      learn
        ? word
          ? `Collect ${wordEntry(word)!.tiles.join(" → ")} · no timer`
          : `Collect ${sequence.join(" → ")} · no timer`
        : `Bring ${target} chicks together`,
      `At most 1 bump · ${par + target * 5} steps or fewer`,
      `No bumps · ${par} steps or fewer`,
    ],
  };
});
export const railLevel = (id: LevelId) => railLevels.find((l) => l.id === id)!;
export type RailState = {
  level: RailLevel | "endless";
  seed: number;
  helper: boolean;
  body: Cell[];
  previous: Cell[];
  direction: Direction;
  queue: Direction[];
  food: Cell;
  decoy: Cell;
  collected: number;
  bumps: number;
  moves: number;
  score: number;
  elapsed: number;
  patrol: number;
  respawn: number;
  lives: Lives;
  event: number;
  impact: Cell;
  impactKind: "splat" | "score";
  phase: "play" | "cleared" | "rest" | "stopped";
  message: string;
};
export type RailInput =
  | { type: "tick" }
  | { type: "turn"; direction: Direction }
  | { type: "helper"; value: boolean }
  | { type: "finish" };
export const railLearning = (s: RailState) => s.level !== "endless" && s.level.world === "learn";
export const railTarget = (s: RailState) => (s.level === "endless" ? Infinity : s.level.target);
export const railTick = (s: RailState) =>
  (s.level === "endless"
    ? Math.max(0.105, 0.17 - s.collected * 0.0015)
    : s.level.tick * (1 - 0.13 * Math.min(1, s.collected / s.level.target))) * (s.helper ? 1.2 : 1);
export const railHedges = (s: RailState) => (s.level === "endless" ? railLevel("w3-8") : s.level).hedges;
export function railSnake(s: RailState, fraction = 0): Cell[] {
  const l = s.level === "endless" ? railLevel("w3-8") : s.level;
  if (l.snakeRow < 0) return [];
  const span = l.snakeSpan,
    travel = 8 - span,
    t = (s.patrol + fraction) % (travel * 2),
    x = 1 + (t <= travel ? t : travel * 2 - t);
  return Array.from({ length: span }, (_, i) => ({ x: x + i, y: l.snakeRow }));
}
/** All moving art uses this one cell-space projection; rules stay discrete at arrival. */
export function railBodyPose(s: RailState, learningClearAge?: number): Cell[] {
  const learn = railLearning(s),
    a =
      learn && s.phase === "cleared"
        ? Math.min(1, Math.max(0, learningClearAge ?? RAIL_LEARN_MOVE) / RAIL_LEARN_MOVE)
        : s.phase !== "play" || s.respawn > 0
          ? 0
          : Math.min(1, s.elapsed / (learn ? RAIL_LEARN_MOVE : railTick(s)));
  return s.body.map((p, i) => {
    const from = learn ? (s.previous[i] ?? p) : p,
      to = learn ? p : i === 0 ? { x: p.x + delta[s.direction].x, y: p.y + delta[s.direction].y } : s.body[i - 1];
    return { x: from.x + (to.x - from.x) * a, y: from.y + (to.y - from.y) * a };
  });
}
function scatter(s: RailState): RailState {
  const free = Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) })).filter(
    (p) =>
      !s.body.some((b) => same(b, p)) &&
      !railHedges(s).some((b) => same(b, p)) &&
      p.y !== (s.level === "endless" ? railLevel("w3-8").snakeRow : s.level.snakeRow)
  );
  if (free.length < 2) return s;
  const [seed, n] = nextRandom(s.seed),
    food = free[Math.floor(n * free.length)],
    other = free.filter((p) => !same(p, food)),
    [next, m] = nextRandom(seed);
  return { ...s, seed: next, food, decoy: other[Math.floor(m * other.length)] };
}
/** Search actual hazards rather than assuming an old head cell is safe after a hit. */
export function railSafeStart(s: RailState): { body: Cell[]; direction: Direction } {
  const blocked = [...railHedges(s), ...railSnake(s)];
  for (const y of [8, 9, 7, 0, 6, 5, 4, 3, 2, 1])
    for (const direction of ["right", "left"] as const)
      for (let x = 2; x < 8; x++) {
        const dx = delta[direction].x,
          body = Array.from({ length: 3 }, (_, i) => ({ x: x - i * dx, y }));
        const runway = Array.from({ length: 4 }, (_, i) => ({ x: x + (i + 1) * dx, y }));
        if ([...body, ...runway].every((p) => inside(p, 10, 10) && !blocked.some((b) => same(p, b))))
          return { body, direction };
      }
  // Authored levels always have a clear bottom runway; content tests assert this.
  return {
    body: [
      { x: 2, y: 9 },
      { x: 1, y: 9 },
      { x: 0, y: 9 },
    ],
    direction: "right",
  };
}
export function createRail(level: RailState["level"], seed: number, helper = false): RailState {
  const body = [
    { x: 2, y: 7 },
    { x: 1, y: 7 },
    { x: 0, y: 7 },
  ];
  const s: RailState = {
    level,
    seed: seed >>> 0,
    helper,
    body,
    previous: body,
    direction: "right",
    queue: [],
    food: { x: 5, y: 7 },
    decoy: { x: 8, y: 8 },
    collected: 0,
    bumps: 0,
    moves: 0,
    score: 0,
    elapsed: 0,
    patrol: 0,
    respawn: 0,
    lives: createLives(helper),
    event: 0,
    impact: { x: 2, y: 7 },
    impactKind: "score",
    phase: "play",
    message: "Follow the chick!",
  };
  return level !== "endless" && level.id === "w1-1" ? s : scatter(s);
}
function bump(s: RailState, impact: Cell): RailState {
  const learning = railLearning(s),
    lives = learning ? s.lives : hitLives(s.lives),
    spent = lives.hit !== s.lives.hit;
  if (!learning && !spent) return { ...s, ...railSafeStart(s), elapsed: 0, queue: [], respawn: RAIL_RESPAWN };
  const start = railSafeStart(s);
  return {
    ...s,
    ...start,
    previous: start.body,
    lives,
    impactKind: "splat",
    impact: { x: Math.max(0, Math.min(9, impact.x)), y: Math.max(0, Math.min(9, impact.y)) },
    bumps: Math.min(99999999, s.bumps + 1),
    event: s.event + 1,
    queue: [],
    elapsed: 0,
    respawn: RAIL_RESPAWN,
    phase: lives.hearts === 0 ? "rest" : "play",
    message: "Mind the garden path",
  };
}
export function railMove(s: RailState, direction: Direction): RailState {
  if (s.phase !== "play" || s.respawn > 0) return s;
  const d = delta[direction],
    head = { x: s.body[0].x + d.x, y: s.body[0].y + d.y },
    eat = same(head, s.food);
  if (
    !inside(head, 10, 10) ||
    railHedges(s).some((p) => same(p, head)) ||
    s.body.slice(0, eat ? undefined : -1).some((p) => same(p, head)) ||
    railSnake(s).some((p) => same(p, head))
  )
    return bump(s, head);
  if (railLearning(s) && same(head, s.decoy))
    return {
      ...s,
      bumps: s.bumps + 1,
      event: s.event + 1,
      message: `Find ${s.level !== "endless" ? s.level.sequence[s.collected] : "the next tile"} first`,
    };
  const collected = s.collected + Number(eat),
    body = [head, ...s.body];
  if (!eat || body.length > 40) body.pop();
  let next: RailState = {
    ...s,
    previous: s.body,
    body,
    direction,
    collected,
    moves: Math.min(99999999, s.moves + 1),
    score: Math.min(99999999, s.score + (eat ? 40 : 0)),
    elapsed: 0,
    event: s.event + Number(eat),
    impact: head,
    impactKind: "score",
    message: eat ? "+40" : "",
  };
  if (collected >= railTarget(s)) return { ...next, phase: "cleared", message: "Everyone is together!" };
  if (eat) next = scatter(next);
  return next;
}
export function railTransition(s: RailState, input: RailInput): RailState {
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
  if (input.type !== "turn" || !directions.includes(input.direction)) return s;
  const previous = s.queue.at(-1) ?? s.direction;
  if (railWaiting(s) && !opposite(previous, input.direction) && !railLearning(s)) return { ...s, queue: [input.direction], direction: input.direction };
  if (opposite(previous, input.direction) && s.body.length > 1) return s;
  if (railLearning(s)) return railMove(s, input.direction);
  return s.queue.length < 2 && previous !== input.direction ? { ...s, queue: [...s.queue, input.direction] } : s;
}
export function railStep(s: RailState, input: RailInput, dt: number): RailState {
  if (input.type !== "tick") return railTransition(s, input);
  if (s.phase !== "play" || railWaiting(s) || !Number.isFinite(dt) || dt <= 0) return s;
  const step = Math.min(dt, 0.1),
    lives = stepLives(s.lives, step);
  if (s.respawn > 0) return { ...s, lives, respawn: Math.max(0, s.respawn - step) };
  if (railLearning(s))
    return s.elapsed >= RAIL_LEARN_MOVE ? s : { ...s, elapsed: Math.min(RAIL_LEARN_MOVE, s.elapsed + step) };
  const elapsed = s.elapsed + step;
  if (elapsed < railTick(s)) return { ...s, lives, elapsed };
  let next = railMove({ ...s, lives, elapsed: 0 }, s.direction);
  if (next.phase !== "play" || next.respawn > 0) return next;
  next = { ...next, patrol: (s.patrol + 1) % 10000 };
  if (railSnake(next).some((p) => same(p, next.body[0]))) return bump(next, next.body[0]);
  return {
    ...next,
    direction: next.queue[0] ?? next.direction,
    queue: next.queue.slice(1),
    elapsed: elapsed - railTick(s),
  };
}
export function railStars(s: RailState): 0 | 1 | 2 | 3 {
  if (s.phase !== "cleared") return 0;
  const par = s.level === "endless" ? Infinity : s.level.par;
  return s.bumps === 0 && s.moves <= par ? 3 : s.bumps <= 1 && s.moves <= par + railTarget(s) * 5 ? 2 : 1;
}
export function railResult(s: RailState): ArcadeResult | null {
  return s.phase === "play"
    ? null
    : {
        cleared: s.phase === "cleared",
        outcome: s.phase === "cleared" ? "cleared" : s.phase === "stopped" ? "stopped" : "game-over",
        stars: railStars(s),
        score: s.score,
        detail: `${s.collected} chicks · ${s.moves} steps · ${s.bumps} bumps`,
      };
}
export function validRail(v: unknown): v is RailState {
  if (
    !exact(v, [
      "level",
      "seed",
      "helper",
      "body",
      "previous",
      "direction",
      "queue",
      "food",
      "decoy",
      "collected",
      "bumps",
      "moves",
      "score",
      "elapsed",
      "patrol",
      "respawn",
      "lives",
      "event",
      "impact",
      "impactKind",
      "phase",
      "message",
    ]) ||
    !(v.level === "endless" || railLevels.some((l) => matches(l, v.level)))
  )
    return false;
  if (
    !integer(v.seed, 0xffffffff) ||
    typeof v.helper !== "boolean" ||
    !Array.isArray(v.body) ||
    !v.body.length ||
    v.body.length > 40 ||
    !v.body.every((p) => cell(p, 10, 10)) ||
    new Set(v.body.map((p) => `${p.x},${p.y}`)).size !== v.body.length ||
    !Array.isArray(v.previous) ||
    !v.previous.length ||
    v.previous.length > 40 ||
    !v.previous.every((p) => cell(p, 10, 10)) ||
    !directions.includes(v.direction as Direction) ||
    !Array.isArray(v.queue) ||
    v.queue.length > 2 ||
    !v.queue.every((d) => directions.includes(d)) ||
    !cell(v.food, 10, 10) ||
    !cell(v.decoy, 10, 10) ||
    same(v.food, v.decoy) ||
    ![v.collected, v.bumps, v.moves, v.score, v.event].every((n) => integer(n)) ||
    !integer(v.patrol, 9999) ||
    !finite(v.elapsed, 2) ||
    !finite(v.respawn, RAIL_RESPAWN) ||
    !validLives(v.lives) ||
    !cell(v.impact, 10, 10) ||
    !["splat", "score"].includes(v.impactKind as string) ||
    !["play", "cleared", "rest", "stopped"].includes(v.phase as string) ||
    typeof v.message !== "string" ||
    v.message.length >= 150
  )
    return false;
  const s = v as unknown as RailState;
  let queued = s.direction;
  for (const d of s.queue) {
    if (d === queued || opposite(queued, d)) return false;
    queued = d;
  }
  if (s.body.some((p, i) => i > 0 && Math.abs(p.x - s.body[i - 1].x) + Math.abs(p.y - s.body[i - 1].y) !== 1))
    return false;
  if (
    s.score !== Math.min(99999999, s.collected * 40) ||
    s.moves < s.collected ||
    s.body.length > 3 + s.collected ||
    s.lives.maxHearts !== (s.helper ? 5 : 3) ||
    (s.phase === "rest") !== (s.lives.hearts === 0) ||
    s.lives.hit > s.bumps
  )
    return false;
  if (s.level === "endless") return s.phase !== "cleared";
  return (
    s.collected <= s.level.target &&
    (s.phase === "cleared" ? s.collected === s.level.target : s.collected < s.level.target) &&
    !(railLearning(s) && s.phase === "rest")
  );
}
export const railEngine: ArcadeEngine<RailState, RailInput, RailLevel> = {
  create: createRail,
  reduce: railTransition,
  step: railStep,
  result: railResult,
  validate: validRail,
};

/** Initial state is already serializable; no new save field is needed. */
export const railWaiting = (s: RailState) => s.phase === "play" && s.moves === 0 && s.bumps === 0 && s.elapsed === 0 && s.queue.length === 0;