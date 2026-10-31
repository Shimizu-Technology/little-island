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
import { BUG_RADIUS_X, BUG_RADIUS_Y, HUSK_RADIUS } from "../../action/arena";
import { configureLives, createLives, hitLives, stepLives, validLives, type Lives } from "../../lives";
export const FIRE_SECONDS = 0.22,
  HUSK_SPEED = 560;
export type PalmLevel = ArcadeLevel & {
  count: number;
  waves: number;
  relays: number;
  speed: number;
  descent: number;
  diveEvery: number;
  diveSpeed: number;
  armored: boolean;
  aimed: boolean;
  shieldGap: number;
  divers: boolean;
  boss: boolean;
  facts: number;
  par: number;
  accuracy: number;
};
export const palmLevels: readonly PalmLevel[] = allLevelIds.map((id) => {
  const index = levelNumber(id),
    world = worldOf(id),
    rank = world === "learn" ? 0 : Number(world[1]) - 1,
    learning = world === "learn";
  const waves = learning || rank === 0 ? 1 : 2 + Number(rank >= 2) + Number(rank >= 5);
  const par = rank === 0 && !learning ? 15 + index * 3 : waves * (22 + rank * 2 + index * 0.5);
  return {
    id,
    index,
    world,
    name: learning
      ? ["Little sums", "One more", "Make five", "Take away", "Make ten", "Double up", "Ten and more", "Math grove"][
          index - 1
        ]
      : [
          "Marching visitors",
          "Husk toss",
          "Leafy shelter",
          "Quick nets",
          "Grove keepers",
          "Swoop & scoop",
          "Palm party",
          "The crowned visitor",
        ][index - 1],
    count: learning ? 3 : rank === 0 ? (index <= 3 ? 5 : 10) : 10 + 5 * Number(rank >= 2),
    waves,
    relays: learning || rank === 0 && index <= 3 ? 1 : rank === 0 ? 2 : rank < 2 ? 4 : 3,
    speed: learning ? 0 : 40 + rank * 6 + (index - 1) * 1.1,
    descent: 16 + rank,
    diveEvery: rank === 0 ? 0 : Math.max(1.2, 4.2 - rank * 0.4 - index * 0.05),
    diveSpeed: 115 + rank * 20 + index * 2,
    armored: rank >= 2,
    aimed: rank >= 3,
    shieldGap: rank >= 4 ? (index - 1) % 3 : -1,
    divers: rank > 0,
    boss: index === 8 && !learning,
    facts: learning ? 3 + Math.floor(index / 3) : 0,
    par,
    accuracy: 0.55 + rank * 0.025,
    goals: learning
      ? [`Match ${3 + Math.floor(index / 3)} math facts`, "At most 1 wrong answer", "Every answer right first time"]
      : [
          `Net every wave · ${waves} ${waves === 1 ? "wave" : "waves"}`,
          "Lose at most 1 heart",
          `No hearts lost · ${Math.round((0.55 + rank * 0.025) * 100)}% aim · under ${Math.ceil(par)}s`,
        ],
  };
});
export function palmLevel(id: LevelId) {
  "worklet";
  return palmLevels.find((l) => l.id === id)!;
}
export type Beetle = {
  id: number;
  x: number;
  y: number;
  base: number;
  hp: number;
  value: number;
  diver: boolean;
  boss: boolean;
  caught: number;
  diving: boolean;
  diveX: number;
};
export type Husk = { x: number; y: number; bounced: boolean };
export type PalmState = {
  level: PalmLevel | "endless";
  seed: number;
  helper: boolean;
  helped: boolean;
  phase: "play" | "cleared" | "rest";
  time: number;
  waveTime: number;
  launcher: number;
  beetles: Beetle[];
  husks: Husk[];
  shields: number[];
  lives: Lives;
  wave: number;
  relay: number;
  caught: number;
  score: number;
  cooldown: number;
  fact: number;
  prompt: string;
  answer: number;
  event: number;
  cue: "none" | "fire" | "net" | "bonk" | "shield" | "hit" | "wrong" | "wave";
  feedback: string;
  feedbackX: number;
  feedbackY: number;
  pulse: number;
  shots: number;
  inputTap: number;
  fireHeld: boolean;
  landed: number;
  misses: number;
  direction: number;
  marchX: number;
  marchY: number;
  diveClock: number;
  waveWait: number;
};
export type PalmInput =
  | { type: "tick" }
  | { type: "move"; x: number }
  | { type: "toss" }
  | { type: "help" }
  | { type: "helper"; value: boolean }
  | { type: "finish" };
export function palmConfig(s: PalmState): PalmLevel {
  "worklet";
  return s.level === "endless" ? palmLevel(`w${Math.min(6, 1 + Math.floor((s.wave - 1) / 3))}-8` as LevelId) : s.level;
}
function fact(s: PalmState): PalmState {
  "worklet";
  const index = palmConfig(s).index,
    limit = index < 4 ? 5 : index < 7 ? 10 : 20;
  let [seed, r] = nextRandom(s.seed);
  const a = 1 + Math.floor((r * limit) / 2);
  [seed, r] = nextRandom(seed);
  const b = 1 + Math.floor((r * limit) / 2),
    subtract = index === 4 || (index >= 7 && s.fact % 2 === 1),
    double = index === 6;
  const answer = subtract ? a : double ? a * 2 : a + b,
    prompt = subtract ? `${a + b} − ${b} = ?` : `${a} + ${double ? a : b} = ?`;
  [seed, r] = nextRandom(seed);
  const slot = Math.floor(r * 3),
    values = [answer + 1, Math.max(0, answer - 1)];
  return {
    ...s,
    seed,
    prompt,
    answer,
    husks: [],
    beetles: [0, 1, 2].map((i) => ({
      id: i,
      x: 72 + i * 108,
      base: 72 + i * 108,
      y: 150,
      hp: 1,
      value: i === slot ? answer : values[i > slot ? i - 1 : i],
      diver: false,
      boss: false,
      caught: 0,
      diving: false,
      diveX: 0,
    })),
  };
}
function formation(s: PalmState): PalmState {
  "worklet";
  if (s.level !== "endless" && s.level.world === "learn") return fact(s);
  const config = palmConfig(s),
    boss = config.boss && s.wave === config.waves && s.relay === config.relays;
  // The final world crown marches with escorts; earlier crowns are a separate final wave.
  const count = boss && config.world !== "w6" ? 1 : config.count;
  return {
    ...s,
    waveTime: s.relay === 1 ? 0 : s.waveTime,
    direction: s.wave % 2 ? 1 : -1,
    marchX: 0,
    marchY: 0,
    diveClock: 0,
    waveWait: 0,
    husks: [],
    beetles: Array.from({ length: count }, (_, i) => ({
      id: i,
      x: count === 1 ? 180 : 76 + (i % 5) * 52,
      base: count === 1 ? 180 : 76 + (i % 5) * 52,
      y: 105 + Math.floor(i / 5) * 58,
      hp: boss && i === 0 ? 5 : config.armored && i % 4 === 2 ? 2 : 1,
      value: -1,
      diver: config.divers && i % 3 === 1,
      boss: boss && i === 0,
      caught: 0,
      diving: false,
      diveX: 0,
    })),
  };
}
export function createPalm(level: PalmState["level"], seed: number, helper = false): PalmState {
  return formation({
    level,
    seed: seed >>> 0,
    helper,
    helped: helper,
    phase: "play",
    time: 0,
    waveTime: 0,
    launcher: 180,
    beetles: [],
    husks: [],
    shields: [3, 3, 3].map((v, i) => (level !== "endless" && level.shieldGap === i ? 0 : v)),
    lives: createLives(helper),
    wave: 1,
    relay: 1,
    caught: 0,
    score: 0,
    cooldown: 0,
    fact: 0,
    prompt: "",
    answer: 0,
    event: 0,
    cue: "none",
    feedback: "",
    feedbackX: 180,
    feedbackY: 240,
    pulse: 0,
    shots: 0,
    inputTap: 0,
    fireHeld: false,
    landed: 0,
    misses: 0,
    direction: 1,
    marchX: 0,
    marchY: 0,
    diveClock: 0,
    waveWait: 0,
  });
}
function feedback(s: PalmState, cue: PalmState["cue"], text: string, x: number, y: number): PalmState {
  "worklet";
  return { ...s, event: s.event + 1, cue, feedback: text, feedbackX: x, feedbackY: y, pulse: 0.45 };
}
export function palmTransition(s: PalmState, input: PalmInput): PalmState {
  "worklet";
  if (s.phase !== "play") return s;
  if (input.type === "helper" && typeof input.value === "boolean")
    return input.value === s.helper
      ? s
      : { ...s, helper: input.value, helped: s.helped || input.value, lives: configureLives(s.lives, input.value) };
  if (input.type === "help" && palmConfig(s).world === "learn") return { ...s, helped: true };
  if (input.type === "move" && finite(input.x, -10000, 10000)) {
    const launcher = clamp(input.x, 24, 336);
    return launcher === s.launcher ? s : { ...s, launcher };
  }
  if (input.type === "finish") return s.level === "endless" ? { ...s, phase: "rest" } : s;
  if (input.type === "toss" && s.cooldown <= 0.000001 && s.waveWait <= 0 && s.husks.length < 12)
    return {
      ...s,
      husks: [...s.husks, { x: s.launcher, y: 532, bounced: false }],
      cooldown: FIRE_SECONDS,
      shots: s.shots + 1,
      event: s.event + 1,
    };
  return s;
}
export function palmMarchSpeed(s: PalmState) {
  "worklet";
  const config = palmConfig(s),
    alive = s.beetles.filter((b) => !b.caught).length;
  return (
    config.speed *
    (s.helper ? 0.82 : 1) *
    (1 + 0.8 * (1 - alive / config.count)) *
    (1 + 0.2 * Math.min(1, s.waveTime / 22))
  );
}
export function palmStep(before: PalmState, input: PalmInput, dt: number): PalmState {
  "worklet";
  if (input.type !== "tick") return palmTransition(before, input);
  if (before.phase !== "play" || !finite(dt, 0, 0.1) || !dt) return before;
  let s: PalmState = {
    ...before,
    time: before.time + dt,
    waveTime: before.waveTime + dt,
    cooldown: Math.max(0, before.cooldown - dt),
    pulse: Math.max(0, before.pulse - dt),
    lives: stepLives(before.lives, dt),
    shields: before.shields,
    beetles: before.beetles.map((b) => ({ ...b })),
    husks: before.husks.map((h) => ({ ...h })),
  };
  const config = palmConfig(s),
    learning = config.world === "learn";
  if (s.waveWait > 0) {
    s.waveWait = Math.max(0, s.waveWait - dt);
    return s.waveWait ? s : formation({ ...s, wave: s.wave + 1, relay: 1 });
  }
  if (!learning) {
    const march = s.beetles.filter((b) => !b.caught && !b.diving);
    const dx = s.direction * palmMarchSpeed(s) * dt;
    let edge = false;
    for (const b of march) if (b.x + dx < (b.boss ? 35 : 25) || b.x + dx > (b.boss ? 325 : 335)) edge = true;
    if (edge) {
      s.direction *= -1;
      s.marchY += config.descent;
      for (const b of march) b.y += config.descent;
    } else {
      s.marchX += dx;
      for (const b of march) b.x += dx;
    }
    if (config.diveEvery) s.diveClock += dt;
    if (config.diveEvery && s.diveClock >= config.diveEvery / (1 + 0.3 * Math.min(1, s.waveTime / 22))) {
      s.diveClock = 0;
      const divers = march.filter((b) => b.diver && !b.boss);
      if (divers.length) {
        const [seed, r] = nextRandom(s.seed);
        s.seed = seed;
        const diver = divers[Math.floor(r * divers.length)];
        diver.diving = true;
        diver.diveX = config.aimed
          ? clamp((s.launcher - diver.x) / Math.max(0.7, (520 - diver.y) / config.diveSpeed), -90, 90)
          : 0;
      }
    }
  }
  for (const b of s.beetles) {
    if (b.caught) {
      b.caught = Math.max(0.001, b.caught - dt);
      b.y -= 170 * dt;
    } else if (b.diving) {
      b.y += config.diveSpeed * (s.helper ? 0.82 : 1) * dt;
      b.x = clamp(b.x + (config.aimed ? b.diveX : Math.sin(s.waveTime * 5 + b.id) * 60) * dt, 25, 335);
    }
  }
  for (const h of s.husks) {
    const oldY = h.y;
    h.y += (h.bounced ? 290 : -HUSK_SPEED) * dt;
    if (h.bounced) continue;
    // Swept vertical contact, ordered nearest the launcher. Sprite body + husk radii share logical units.
    const b = s.beetles
      .filter(
        (b) =>
          !b.caught &&
          Math.abs(b.x - h.x) <= BUG_RADIUS_X * (b.boss ? 1.5 : 1) + HUSK_RADIUS &&
          b.y + BUG_RADIUS_Y * (b.boss ? 1.5 : 1) >= h.y &&
          b.y - BUG_RADIUS_Y * (b.boss ? 1.5 : 1) <= oldY
      )
      .sort((a, b) => b.y - a.y)[0];
    if (!b) continue;
    if (learning && b.value !== s.answer) {
      h.bounced = true;
      s.misses++;
      s.helped = true;
      s = feedback(s, "wrong", "Try another", b.x, b.y);
      continue;
    }
    h.y = -50;
    s.landed++;
    b.hp--;
    if (!b.hp) {
      b.caught = 0.45;
      s.caught++;
      s.score = Math.min(99999999, s.score + (learning ? 100 : 40));
      s = feedback(s, "net", learning ? "+100 ✓" : "+40 Net!", b.x, b.y);
      if (learning) s.fact++;
    } else s = feedback(s, "bonk", "Bonk!", b.x, b.y);
  }
  s.husks = s.husks.filter((h) => h.y >= -20 && h.y <= 620);
  if (learning && s.fact > before.fact) return s.fact >= config.facts ? { ...s, phase: "cleared" } : fact(s);
  for (const b of s.beetles) {
    if (learning || b.caught || b.y + BUG_RADIUS_Y < 475) continue;
    const shield = [72, 180, 288].findIndex((x) => Math.abs(x - b.x) <= 38 + BUG_RADIUS_X);
    if (shield >= 0 && s.shields[shield] > 0) {
      s.shields = [...s.shields];
      s.shields[shield]--;
      b.y = 300;
      b.diving = false;
      s = feedback(s, "shield", "Leaf save", b.x, 475);
    } else if (b.y >= 520) {
      const lives = hitLives(s.lives);
      if (lives !== s.lives) {
        s.lives = lives;
        s = feedback(s, "hit", "−1 ♥", b.x, 510);
      }
      // Reset the whole threatening row during grace, never drain all hearts in one frame.
      b.y = 140 + Math.floor(b.id / 5) * 58;
      b.diving = false;
    }
  }
  s.beetles = s.beetles.filter((b) => !b.caught || (b.caught > 0.002 && b.y > -60));
  if (!s.lives.hearts) return { ...s, phase: "rest" };
  if (!s.beetles.length) {
    if (s.relay < config.relays) return formation({ ...s, relay: s.relay + 1 });
    if (s.level !== "endless" && s.wave >= config.waves) return { ...s, phase: "cleared" };
    return feedback({ ...s, waveWait: 0.65 }, "wave", "Next wave", 180, 72);
  }
  return s;
}
export function palmResult(s: PalmState): ArcadeResult | null {
  "worklet";
  if (s.phase === "play") return null;
  const config = palmConfig(s),
    learning = config.world === "learn",
    accuracy = s.shots ? s.landed / s.shots : 0;
  return {
    cleared: s.phase === "cleared",
    outcome: s.phase === "cleared" ? "cleared" : !s.lives.hearts ? "game-over" : "stopped",
    stars:
      s.phase !== "cleared"
        ? 0
        : learning
          ? s.misses === 0
            ? 3
            : s.misses <= 1
              ? 2
              : 1
          : s.lives.hit === 0 && accuracy >= config.accuracy && s.time <= config.par
            ? 3
            : s.lives.hit <= 1
              ? 2
              : 1,
    score: s.score,
    detail: learning
      ? `${s.fact} facts matched · ${s.misses} retries`
      : `${s.caught} netted · ${Math.round(accuracy * 100)}% aim · ${s.lives.hit} hearts lost · ${Math.round(s.time)}s`,
  };
}
export function validPalm(v: unknown): v is PalmState {
  if (
    !exact(
      v,
      "level seed helper helped phase time waveTime launcher beetles husks shields lives wave relay caught score cooldown fact prompt answer event cue feedback feedbackX feedbackY pulse shots inputTap fireHeld landed misses direction marchX marchY diveClock waveWait"
    ) ||
    !(v.level === "endless" || canonicalLevel(v.level, palmLevels)) ||
    !integer(v.seed, 0xffffffff) ||
    typeof v.fireHeld !== "boolean" ||
    typeof v.helper !== "boolean" ||
    typeof v.helped !== "boolean" ||
    !["play", "cleared", "rest"].includes(v.phase as string) ||
    !validLives(v.lives)
  )
    return false;
  return (
    finite(v.time) &&
    finite(v.waveTime) &&
    finite(v.launcher, 24, 336) &&
    [v.caught, v.score, v.fact, v.event, v.shots, v.inputTap, v.landed, v.misses].every((n) => integer(n)) &&
    (v.landed as number) <= (v.shots as number) &&
    integer(v.relay, 4) &&
    (v.relay as number) >= 1 &&
    integer(v.wave) &&
    (v.wave as number) > 0 &&
    finite(v.cooldown, 0, FIRE_SECONDS) &&
    finite(v.pulse, 0, 0.45) &&
    finite(v.waveWait, 0, 0.65) &&
    finite(v.diveClock, 0, 10) &&
    [-1, 1].includes(v.direction as number) &&
    finite(v.marchX, -360, 360) &&
    finite(v.marchY, 0, 99999999) &&
    integer(v.answer, 40) &&
    typeof v.prompt === "string" &&
    v.prompt.length <= 30 &&
    typeof v.feedback === "string" &&
    v.feedback.length <= 30 &&
    ["none", "fire", "net", "bonk", "shield", "hit", "wrong", "wave"].includes(v.cue as string) &&
    finite(v.feedbackX, -60, 420) &&
    finite(v.feedbackY, -60, 620) &&
    Array.isArray(v.shields) &&
    v.shields.length === 3 &&
    v.shields.every((n) => integer(n, 3)) &&
    Array.isArray(v.beetles) &&
    v.beetles.length <= 15 &&
    new Set(v.beetles.map((b) => b.id)).size === v.beetles.length &&
    v.beetles.every(
      (b) =>
        exact(b, "id x y base hp value diver boss caught diving diveX") &&
        integer(b.id, 14) &&
        finite(b.x, 0, 360) &&
        finite(b.y, -70, 540) &&
        finite(b.base, 0, 360) &&
        integer(b.hp, 5) &&
        (b.hp > 0 || (typeof b.caught === "number" && b.caught > 0)) &&
        finite(b.value, -1, 40) &&
        Number.isInteger(b.value) &&
        typeof b.diver === "boolean" &&
        typeof b.diving === "boolean" &&
        finite(b.diveX, -90, 90) &&
        typeof b.boss === "boolean" &&
        finite(b.caught, 0, 0.45)
    ) &&
    Array.isArray(v.husks) &&
    v.husks.length <= 12 &&
    v.husks.every(
      (h) => exact(h, "x y bounced") && finite(h.x, 24, 336) && finite(h.y, -20, 620) && typeof h.bounced === "boolean"
    ) &&
    (v.phase !== "play" || v.lives.hearts > 0) &&
    v.lives.maxHearts === (v.helper ? 5 : 3)
  );
}
export const palmEngine: ArcadeEngine<PalmState, PalmInput, PalmLevel> = {
  create: createPalm,
  reduce: palmTransition,
  step: palmStep,
  result: palmResult,
  validate: validPalm,
};

/** Countable groups use the exact operands that generated the answer targets. */
export function palmWorkedHint(s: Pick<PalmState, "prompt" | "answer">) {
  "worklet";
  const [a, b] = s.prompt.match(/\d+/g)!.map(Number), subtract = s.prompt.includes("−");
  return { answer: s.answer, text: subtract ? `${a} take away ${b} leaves ${s.answer}. Aim for ${s.answer}.` : `${a} and ${b} together make ${s.answer}. Aim for ${s.answer}.`, groups: subtract ? [Array.from({ length: a }, (_, i) => i >= b)] : [Array(a).fill(true) as boolean[], Array(b).fill(true) as boolean[]] };
}