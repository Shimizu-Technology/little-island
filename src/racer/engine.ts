import { Course, CourseId, Obstacle, raceCourse } from "./courses";
export const RACE_HZ = 60;
const landingOrder = new WeakMap<Course, Course["platforms"]>();
export const formatRaceTime = (ticks: number) => {
  const tenths = Math.round(ticks / 6);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, "0")}`;
};
export const RACE_LIMIT_TICKS = 180 * RACE_HZ;
export const JUMP_BUFFER_TICKS = 9;
export const COYOTE_TICKS = 7;
export const MAX_FRAME_SECONDS = 0.5;
export const RACER_RADIUS = 0.24;
const HEIGHT = 0.8,
  GRAVITY = 22,
  JUMP = 8.7,
  SPEED = 4.8;
export type RivalStrength = "easy" | "steady" | "fast";
export type RaceMode = "practice" | "race";
export type RaceInput = { direction: -1 | 0 | 1; jump?: boolean; directionTicks?: number };
export type Runner = {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  checkpoint: number;
  falls: number;
  recovery: number;
  finishTick: number | null;
  speed: number;
  /** Optional for old saves; absent counters resume as zero. */
  jumpBuffer?: number;
  coyote?: number;
  landedAt?: number;
};
export type RaceSession = {
  schema: 1;
  helper?: boolean;
  rivalStrength?: RivalStrength;
  /** Absent means frozen original courses. New geometry never reinterprets an old save. */
  edition?: 2;
  game: "racer";
  id: string;
  course: CourseId;
  mode: RaceMode;
  seed: number;
  tick: number;
  status: "ready" | "running" | "paused" | "finished" | "timedout";
  runners: Runner[];
};
export type RaceRecord = {
  edition?: 2;
  sessionId: string;
  course: CourseId;
  mode: RaceMode;
  ticks: number;
  falls: number;
  placement: number;
  entrants: number;
};
export type RaceRecords = Partial<Record<`${CourseId}:${RaceMode}`, RaceRecord>>;
export function createRaceSession(
  course: CourseId = "training",
  mode: RaceMode = "practice",
  seed = 1,
  id = `race-${Date.now()}-${Math.floor(Math.random() * 1e7)}`,
  settings?: { helper: boolean; rivalStrength: RivalStrength }
): RaceSession {
  const normalizedSeed = seed >>> 0;
  const names = mode === "race" && course !== "training" ? ["You", "Mango", "Pebble", "Coco"] : ["You"];
  return {
    schema: 1,
    ...(settings ?? {}),
    edition: 2,
    game: "racer",
    id,
    course,
    mode,
    seed: normalizedSeed,
    tick: 0,
    status: "ready",
    runners: names.map((name, i) => ({
      id: i === 0 ? "you" : `cpu-${i}`,
      name,
      x: 1,
      y: 0,
      vx: 0,
      vy: 0,
      grounded: true,
      checkpoint: 0,
      falls: 0,
      recovery: 0,
      finishTick: null,
      // Every edition-2 opponent is beatable by a clean human run. Variation is
      // physical speed, not a scripted finish or hidden catch-up advantage.
      speed: i === 0 ? SPEED : (settings?.rivalStrength === "easy" ? 2.8 : settings?.rivalStrength === "fast" ? 4.4 : 4.05) + ((normalizedSeed + i * 17) % 9) * (settings?.rivalStrength === "fast" ? 0.04 : 0.07),
    })),
  };
}
export function obstaclePosition(obstacle: Obstacle, tick: number): { x: number; height: number } {
  const phase = ((tick / RACE_HZ) * Math.PI * 2) / (obstacle.period ?? 3) + (obstacle.phase ?? 0);
  return {
    x: obstacle.x + (obstacle.kind === "roller" ? Math.sin(phase) * (obstacle.travel ?? 0) : 0),
    height: obstacle.kind === "gate" ? 0.2 + obstacle.height * (0.5 + 0.5 * Math.sin(phase)) : obstacle.height,
  };
}
export function racePlacement(session: RaceSession): number {
  const you = session.runners[0];
  return (
    1 +
    session.runners
      .slice(1)
      .filter((r) =>
        you.finishTick !== null
          ? r.finishTick !== null && r.finishTick < you.finishTick
          : r.finishTick !== null || r.x > you.x
      ).length
  );
}
export function raceRecord(session: RaceSession): RaceRecord | null {
  const player = session.runners[0];
  return session.status !== "finished" || player.finishTick === null
    ? null
    : {
        ...(session.edition === 2 ? { edition: 2 as const } : {}),
        sessionId: session.id,
        course: session.course,
        mode: session.mode,
        ticks: player.finishTick,
        falls: player.falls,
        placement: racePlacement(session),
        entrants: session.runners.length,
      };
}
/** Idempotent local best merge. Race and Practice results never compete. */
export function mergeRaceRecord(records: RaceRecords, record: RaceRecord | null): RaceRecords {
  if (!record) return records;
  const key = `${record.course}:${record.mode}` as const,
    old = records[key];
  // A new-course best supersedes a legacy best; an old restored round cannot
  // overwrite a newer edition's record. Different courses are never compared.
  if (old && (old.edition ?? 1) > (record.edition ?? 1)) return records;
  return !old || old.edition !== record.edition || record.ticks < old.ticks ? { ...records, [key]: record } : records;
}
export function pauseRace(session: RaceSession): RaceSession {
  return session.status === "running"
    ? {
        ...session,
        status: "paused",
        runners: session.runners.map((r) => (r.jumpBuffer ? { ...r, jumpBuffer: 0 } : r)),
      }
    : session;
}
export function startRace(session: RaceSession): RaceSession {
  return session.status === "ready" || session.status === "paused" ? { ...session, status: "running" } : session;
}
function resetRunner(r: Runner, course: Course): Runner {
  const x = course.checkpoints[r.checkpoint],
    platform = course.platforms.find((p) => x >= p.from && x <= p.to)!;
  return {
    ...r,
    x,
    y: platform.y,
    vx: 0,
    vy: 0,
    grounded: true,
    falls: r.falls + 1,
    recovery: 42,
    jumpBuffer: 0,
    coyote: 0,
  };
}
/** Same physical controls available to a player; no teleporting or scripted finish times. */
export function raceBotInput(r: Runner, course: Course, tick: number): RaceInput {
  if (r.finishTick !== null || r.recovery > 0) return { direction: 0 };
  const platform = course.platforms.find(
    (p) => r.x >= p.from - 0.02 && r.x <= p.to + 0.02 && Math.abs(r.y - p.y) < 0.08
  );
  // Step down from an optional bridge when a lower trail continues underneath.
  // Jumping blindly from every raised edge can overshoot the next safe landing.
  const lowerLanding =
    platform?.oneWay &&
    course.platforms.some((p) => p.y < platform.y && p.from <= platform.to && p.to >= platform.to + 1);
  const gapAhead =
    platform && !lowerLanding && platform.to < course.length && platform.to - r.x < (1.25 * r.speed) / SPEED;
  const obstacleAhead = course.obstacles.some((o) => {
    const p = obstaclePosition(o, tick);
    return p.x - r.x > -0.1 && p.x - r.x < 1.65 && Math.abs(o.y - r.y) < 0.2;
  });
  return { direction: 1, jump: r.grounded && !!(gapAhead || obstacleAhead) };
}
function moveRunner(r: Runner, input: RaceInput, course: Course, tick: number, helper = false): Runner {
  if (r.finishTick !== null) return r;
  if (r.recovery > 0)
    return {
      ...r,
      recovery: r.recovery - 1,
      // The final recovery moments accept the same short jump buffer as a landing.
      jumpBuffer: input.jump ? JUMP_BUFFER_TICKS : Math.max(0, (r.jumpBuffer ?? 0) - 1),
    };
  const dt = 1 / RACE_HZ;
  const support = course.platforms.find(
    (p) => r.x + RACER_RADIUS > p.from && r.x - RACER_RADIUS < p.to && Math.abs(r.y - p.y) < 0.03
  );
  const grounded = r.grounded && !!support;
  const buffer = input.jump ? JUMP_BUFFER_TICKS : Math.max(0, (r.jumpBuffer ?? 0) - 1);
  const coyote = grounded ? COYOTE_TICKS : Math.max(0, (r.coyote ?? 0) - 1);
  const jumping = buffer > 0 && coyote > 0;
  const target = input.direction * r.speed;
  const vx = r.vx + Math.max(-30 * dt, Math.min(30 * dt, target - r.vx));
  let vy = jumping ? JUMP : r.vy;
  vy -= GRAVITY * dt;
  let x = Math.min(course.length, Math.max(-1, r.x + (vx + (grounded && !jumping ? (support?.belt ?? 0) : 0)) * dt)),
    y = r.y + vy * dt,
    landed = false;
  // A platform can be landed on only from above; its solid side cannot be walked through.
  let platforms = landingOrder.get(course);
  if (!platforms) {
    platforms = [...course.platforms].sort((a, b) => a.y - b.y);
    landingOrder.set(course, platforms);
  }
  for (const p of platforms) {
    if (x + RACER_RADIUS > p.from && x - RACER_RADIUS < p.to && vy <= 0 && r.y >= p.y - 0.015 && y <= p.y) {
      y = p.y;
      vy = 0;
      landed = true;
    } else if (
      !p.oneWay &&
      y < p.y - 0.03 &&
      y + HEIGHT > p.y &&
      x + RACER_RADIUS > p.from &&
      x - RACER_RADIUS < p.to &&
      r.x + RACER_RADIUS <= p.from
    )
      x = p.from - RACER_RADIUS;
  }
  let next = {
    ...r,
    x,
    y,
    vx,
    vy,
    grounded: landed,
    jumpBuffer: jumping ? 0 : buffer,
    coyote: jumping ? 0 : coyote,
    ...(landed && !r.grounded ? { landedAt: tick } : {}),
  };
  const recover = () => {
    const reset = resetRunner(next, course);
    return helper ? { ...reset, recovery: 12 } : reset;
  };
  if (y < -3) return recover();
  for (const o of course.obstacles) {
    const p = obstaclePosition(o, tick);
    if (Math.abs(x - p.x) < (RACER_RADIUS + o.width / 2) * (helper ? 0.6 : 1) && y < o.y + p.height * (helper ? 0.55 : 1) && y + HEIGHT > o.y)
      return recover();
  }
  if (landed) {
    const checkpoint = course.checkpoints.findLastIndex((cx) => x >= cx);
    if (checkpoint > next.checkpoint) next = { ...next, checkpoint };
    if (x >= course.length) next = { ...next, x: course.length, vx: 0, finishTick: tick };
  }
  return next;
}
/** Exactly one fixed 1/60-second step. Paused/terminal sessions are identity no-ops. */
export function stepRace(session: RaceSession, input: RaceInput): RaceSession {
  if (session.status !== "running") return session;
  const tick = session.tick + 1,
    course = raceCourse(session.course, session.edition ?? 1);
  const runners = session.runners.map((r, i) =>
    moveRunner(r, i === 0 ? input : raceBotInput(r, course, tick), course, tick, i === 0 && !!session.helper)
  );
  const status = runners[0].finishTick !== null ? "finished" : session.mode === "race" && tick >= RACE_LIMIT_TICKS ? "timedout" : "running";
  return { ...session, tick, runners, status };
}
/** Finishers still traverse the course physically after the human's recorded finish.
 * The player's result is immutable; remaining runners get the same 3-minute deadline. */
export function stepFinishers(session: RaceSession): RaceSession {
  if (
    session.status !== "finished" ||
    session.tick >= RACE_LIMIT_TICKS ||
    session.runners.every((r) => r.finishTick !== null)
  )
    return session;
  const tick = session.tick + 1,
    course = raceCourse(session.course, session.edition ?? 1);
  return {
    ...session,
    tick,
    runners: session.runners.map((r, i) => (i === 0 ? r : moveRunner(r, raceBotInput(r, course, tick), course, tick))),
  };
}
/** Catch up ALL elapsed gameplay time in fixed collision-safe substeps (at most 30).
 * A longer interruption pauses explicitly instead of silently slowing the record clock. */
export function advanceRace(
  session: RaceSession,
  input: RaceInput,
  seconds: number,
  remainder = 0
): { session: RaceSession; remainder: number; interrupted: boolean } {
  if (!Number.isFinite(seconds) || seconds < 0) return { session, remainder: 0, interrupted: false };
  if (seconds > MAX_FRAME_SECONDS) return { session: pauseRace(session), remainder: 0, interrupted: true };
  if (session.status !== "running" && session.status !== "finished")
    return { session, remainder: 0, interrupted: false };
  const total = seconds + (Number.isFinite(remainder) ? Math.max(0, Math.min(remainder, 1 / RACE_HZ)) : 0);
  const steps = Math.floor(total * RACE_HZ + 1e-8);
  let next = session;
  const directionTicks = input.directionTicks === undefined ? Infinity : Math.max(0, Math.floor(input.directionTicks));
  for (let i = 0; i < steps; i++)
    next = next.status === "finished" ? stepFinishers(next) : stepRace(next, {
      direction: i < directionTicks ? input.direction : 0,
      jump: i === 0 && input.jump,
    });
  return { session: next, remainder: Math.max(0, total - steps / RACE_HZ), interrupted: false };
}
export function validRaceSession(value: unknown): value is RaceSession {
  if (!value || typeof value !== "object") return false;
  const s = value as RaceSession;
  if (
    s.schema !== 1 ||
    (s.helper !== undefined && typeof s.helper !== "boolean") ||
    (s.rivalStrength !== undefined && !["easy", "steady", "fast"].includes(s.rivalStrength)) ||
    ((s.helper !== undefined || s.rivalStrength !== undefined) && (s.edition !== 2 || s.helper === undefined || s.rivalStrength === undefined)) ||
    (s.edition !== undefined && s.edition !== 2) ||
    s.game !== "racer" ||
    typeof s.id !== "string" ||
    s.id.length < 1 ||
    s.id.length > 120 ||
    !["training", "lagoon", "canopy", "sunset"].includes(s.course) ||
    !["practice", "race"].includes(s.mode) ||
    !Number.isInteger(s.seed) ||
    s.seed < 0 ||
    s.seed > 0xffffffff ||
    !Number.isInteger(s.tick) ||
    s.tick < 0 ||
    s.tick > (s.mode === "practice" ? Number.MAX_SAFE_INTEGER : RACE_LIMIT_TICKS) ||
    !["ready", "running", "paused", "finished", "timedout"].includes(s.status)
  )
    return false;
  const expected = createRaceSession(s.course, s.mode, s.seed, s.id, s.rivalStrength ? { helper: s.helper!, rivalStrength: s.rivalStrength } : undefined),
    course = raceCourse(s.course, s.edition ?? 1);
  if (s.edition === undefined)
    expected.runners.forEach((r, i) => {
      if (i > 0) r.speed = 4.25 + ((s.seed + i * 17) % 9) * 0.09;
    });
  if (!Array.isArray(s.runners) || s.runners.length !== expected.runners.length) return false;
  for (const [i, r] of s.runners.entries()) {
    const e = expected.runners[i];
    if (
      !r ||
      (r.jumpBuffer !== undefined &&
        (!Number.isInteger(r.jumpBuffer) || r.jumpBuffer < 0 || r.jumpBuffer > JUMP_BUFFER_TICKS)) ||
      (r.coyote !== undefined && (!Number.isInteger(r.coyote) || r.coyote < 0 || r.coyote > COYOTE_TICKS)) ||
      (r.landedAt !== undefined && (!Number.isInteger(r.landedAt) || r.landedAt < 0 || r.landedAt > s.tick)) ||
      r.id !== e.id ||
      r.name !== e.name ||
      r.speed !== e.speed ||
      typeof r.grounded !== "boolean" ||
      ![r.x, r.y, r.vx, r.vy].every(Number.isFinite) ||
      r.x < -1 ||
      r.x > course.length + 0.1 ||
      r.y < -3.5 ||
      r.y > 4 ||
      Math.abs(r.vx) > r.speed + 0.01 ||
      Math.abs(r.vy) > 20 ||
      !Number.isInteger(r.checkpoint) ||
      r.checkpoint < 0 ||
      r.checkpoint >= course.checkpoints.length ||
      !Number.isInteger(r.falls) ||
      r.falls < 0 ||
      r.falls > s.tick ||
      !Number.isInteger(r.recovery) ||
      r.recovery < 0 ||
      r.recovery > 42 ||
      !(
        r.finishTick === null ||
        (Number.isInteger(r.finishTick) && r.finishTick > 0 && r.finishTick <= s.tick && r.x === course.length)
      )
    )
      return false;
  }
  if (
    s.status === "ready" &&
    (s.tick !== 0 ||
      s.runners.some((r, i) =>
        Object.keys(expected.runners[i]).some(
          (key) => r[key as keyof Runner] !== expected.runners[i][key as keyof Runner]
        )
      ))
  )
    return false;
  if ((s.status === "finished") !== (s.runners[0].finishTick !== null)) return false;
  if (s.status === "timedout" && (s.tick !== RACE_LIMIT_TICKS || s.runners[0].finishTick !== null)) return false;
  if (s.mode === "race" && s.tick === RACE_LIMIT_TICKS && s.runners[0].finishTick === null && s.status !== "timedout") return false;
  return true;
}
export function validRaceRecord(value: unknown): value is RaceRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as RaceRecord;
  return (
    (r.edition === undefined || r.edition === 2) &&
    typeof r.sessionId === "string" &&
    r.sessionId.length > 0 &&
    r.sessionId.length <= 120 &&
    ["training", "lagoon", "canopy", "sunset"].includes(r.course) &&
    ["race", "practice"].includes(r.mode) &&
    Number.isInteger(r.ticks) &&
    r.ticks > 0 &&
    r.ticks <= (r.mode === "practice" ? Number.MAX_SAFE_INTEGER : RACE_LIMIT_TICKS) &&
    Number.isInteger(r.falls) &&
    r.falls >= 0 &&
    r.falls <= r.ticks &&
    r.entrants === (r.mode === "race" && r.course !== "training" ? 4 : 1) &&
    Number.isInteger(r.placement) &&
    r.placement >= 1 &&
    r.placement <= r.entrants
  );
}

export function validRaceRecords(value: unknown): value is RaceRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 8 &&
    entries.every(([key, record]) => validRaceRecord(record) && key === `${record.course}:${record.mode}`)
  );
}
