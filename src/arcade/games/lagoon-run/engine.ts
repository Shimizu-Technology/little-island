import { CANOE_DEPTH, DUCK_MAX_ELEVATION, isCanoe } from "./geometry";
import { HAZARDS, POWER_SECONDS, RUN_CHUNKS, courseBeat, type HazardKind, type PowerKind, type Surface } from "./course";
import { nextRandom, type ArcadeEngine, type ArcadeResult } from "../../types";
import { configureLives, createLives, hitLives, stepLives, validLives, type Lives } from "../../lives";
import { canonicalLevel, finite, mathGate, record, runLevels, uint, validFact, type MathGate, type ScrollLevel } from "../scrolling/content";
import { RAMP_DEPTH, surfaceProfile } from "./surface";
export { runLevels, runLevel } from "../scrolling/content";
export type RunInput = { type: "left" | "right" | "jump" | "duck" | "idle" | "finish" } | { type: "lane"; lane: number } | { type: "helper"; value: boolean };
export type { HazardKind } from "./course";
export type TrailRow = { z: number; lane: number; second: number; shellLane: number; kind: HazardKind; secondKind: HazardKind; moving: boolean; crossing: boolean; third: boolean; phase: number; passed: boolean; shellDone: number; shellTaken: number; bursts: number[]; fact: MathGate; serial: number; chunk: string; surface: Surface; power: PowerKind; powerDone: boolean; sky: boolean; action: "idle" | "jump" | "duck"; length: number };
export type RunState = { level: ScrollLevel | "endless"; seed: number; helper: boolean; lane: number; poseLane: number; laneFrom: number; laneTime: number; jump: number; duck: number; landing: number; time: number; travel: number; cooldown: number; rows: TrailRow[]; passed: number; shells: number; score: number; lastGain: number; bumps: number; status: "playing" | "cleared" | "stumbled" | "rest"; event: number; cue: "ready" | "step" | "jump" | "duck" | "shell" | "bump" | "answer" | "try"; feedback: number; helped: boolean; lives: Lives; command: number; serial: number; chunkRandom: number; elevation: number; jumpBase: number; jumpDuration: number; fastDrop: boolean; magnet: number; kite: number; sandals: number; shield: boolean; protection: number; powerEvent: number; lastPower: PowerKind; learned: number };
export const JUMP_SECONDS = .55, SLIDE_SECONDS = .6, LANE_SECONDS = .12;
export function runLearning(s: RunState) { "worklet"; return s.level !== "endless" && s.level.world === "learn"; }
export function jumpHeight(s: RunState) { "worklet"; return s.kite > 0 ? 2.7 : s.jump > 0 ? Math.sin((1 - s.jump / s.jumpDuration) * Math.PI) * (s.jumpDuration > JUMP_SECONDS ? 2 : 1) : 0; }
export function runnerHeight(s: RunState) { "worklet"; return s.elevation + jumpHeight(s); }
export function surfaceHeight(row: TrailRow, z = row.z) {
  "worklet";
  return surfaceProfile(row, z - 1);
}
export function runSupport(s: RunState) {
  "worklet";
  return runLearning(s) ? 0 : Math.max(0,...s.rows.filter(r=>Math.abs(s.poseLane-r.shellLane)<.4).map(r=>surfaceHeight(r)));
}
function approachRate(kind: HazardKind) { "worklet"; return kind === "moving-canoe" || kind === "coconut" ? 1.12 : 1; }
/** Faster moving hazards spawn farther away, so their contact beat remains at the authored
 * course distance. Recycling uses that same distance: mixed speeds cannot bunch into
 * an unvalidated, shorter reaction window. */
function courseDepth(row: TrailRow) { "worklet"; return 1 - (1-row.z)/approachRate(row.kind); }
function newRow(s: RunState, z: number, serial: number): { seed: number; row: TrailRow } {
  "worklet";
  let [seed, n] = nextRandom(s.seed);
  const rank = s.level === "endless" ? 5 : s.level.rank;
  const ordinal = s.level === "endless" ? 56 : rank * 8 + s.level.index;
  if (serial % 4 === 0) s.chunkRandom = n;
  const authored = courseBeat(ordinal, rank, serial, s.chunkRandom, (s.level === "endless" ? .8 : s.level.speed*1.18)*1.12, s.level === "endless" ? .64 : s.level.spacing);
  const fact = mathGate(seed, s.level === "endless" ? 8 : s.level.index);
  seed = fact.seed;
  return { seed, row: { ...authored.beat, z: 1-(1-z)*approachRate(authored.beat.kind), serial, chunk: authored.chunk, moving: authored.beat.kind === "crab" || authored.beat.kind === "moving-canoe", crossing: authored.beat.kind === "crab", phase: n * Math.PI * 2, passed: false, shellDone: 0, shellTaken: 0, bursts: [0,0,0], fact: fact.fact, powerDone: false, length: (s.level === "endless" ? .64 : s.level.spacing) * (authored.short ? .5 : 1) } };
}
export function createRun(level: RunState["level"], seed: number, helper = false): RunState {
  let s: RunState = { level, seed: seed >>> 0, helper, lane: 1, poseLane: 1, laneFrom: 1, laneTime: 0, jump: 0, duck: 0, landing: 0, time: 0, travel: 0, cooldown: 0, rows: [], passed: 0, shells: 0, score: 0, lastGain: 0, bumps: 0, status: "playing", event: 0, cue: "ready", feedback: 0, helped: helper, lives: createLives(helper), command: 0, serial: 5, chunkRandom: 0, elevation: 0, jumpBase: 0, jumpDuration: JUMP_SECONDS, fastDrop: false, magnet: 0, kite: 0, sandals: 0, shield: false, protection: 0, powerEvent: 0, lastPower: "none", learned: 0 };
  const spacing = level === "endless" ? .64 : level.spacing;
  for (let i = 0; i < 5; i++) { const next = newRow(s, .16 - i * spacing, i); s = { ...s, seed: next.seed, rows: [...s.rows, next.row] }; }
  return s;
}
export function runTransition(s: RunState, input: RunInput): RunState {
  "worklet";
  if (s.status !== "playing" || !record(input)) return s;
  if (input.type === "helper" && typeof input.value === "boolean") {
    const lives = configureLives(s.lives, input.value);
    // Turning Helper off after enough hits can leave no hearts: that is a game over, never a free run.
    return { ...s, helper: input.value, helped: s.helped || input.value, lives, ...(lives.hearts === 0 && !runLearning(s) ? { status: "stumbled" as const } : {}) };
  }
  if (input.type === "finish" && s.level === "endless") return { ...s, status: "rest" };
  if (input.type === "lane" && (!Number.isInteger(input.lane) || input.lane < 0 || input.lane > 2)) return s;
  const lane = input.type === "lane" ? input.lane : Math.max(0, Math.min(2, s.lane + (input.type === "left" ? -1 : input.type === "right" ? 1 : 0)));
  if (["left", "right", "lane"].includes(input.type)) return lane === s.lane ? s : { ...s, lane, laneFrom: s.poseLane, laneTime: LANE_SECONDS, event: s.event + 1, cue: "step", learned: s.learned | 4 };
  if (input.type === "jump" && s.jump <= 0 && s.kite <= 0 && s.elevation <= runSupport(s) + .05) return { ...s, jump: s.sandals > 0 ? .8 : JUMP_SECONDS, jumpDuration: s.sandals > 0 ? .8 : JUMP_SECONDS, jumpBase: s.elevation, fastDrop: false, learned: s.learned | 1, duck: 0, event: s.event + 1, cue: "jump" };
  if (input.type === "duck" && s.duck <= 0) return { ...s, duck: SLIDE_SECONDS, elevation: runnerHeight(s), jump: 0, fastDrop: s.jump > 0 || s.elevation > 0, learned: s.learned | 2, event: s.event + 1, cue: "duck" };
  return s;
}
/** Crabs scuttle across lanes; every crab contact uses the same jump-height rule. */
export function obstacleLane(row: TrailRow, time: number) { "worklet"; return row.moving && row.crossing ? row.lane + (row.second-row.lane) * (.5 + Math.sin(time*2.3+row.phase)*.5) : row.lane; }
export function rowSafe(s: RunState, row: TrailRow, contactOnly = false): boolean {
  "worklet";
  if (runLearning(s)) return row.fact.choices[Math.round(s.poseLane)] === row.fact.answer;
  if (s.kite > 0 || s.protection > 0) return true;
  const avoids = (lane: number, kind: HazardKind) => {
    "worklet";
    // Long hulls remain solid until the stern clears. Point hazards keep their
    // original once-per-row contact. Filter each kind independently in mixed rows.
    if (contactOnly && (isCanoe(kind) ? row.z < 1 || row.z > 1 + CANOE_DEPTH : row.passed || row.z < 1)) return true;
    const base = surfaceProfile(row, row.surface === "gap" ? RAMP_DEPTH : 0, lane);
    if (lane < 0 || Math.abs(s.poseLane - lane) > .46 || runnerHeight(s) > base + 1.65 || (base > 0 && runnerHeight(s) < base - .3)) return true;
    return HAZARDS[kind] === "jump" ? runnerHeight(s) > base + .42 : HAZARDS[kind] === "duck" ? s.duck > .08 && runnerHeight(s) < base + DUCK_MAX_ELEVATION : false;
  };
  return avoids(obstacleLane(row,s.time), row.kind) && avoids(row.second,row.secondKind) && (!row.third || avoids(row.shellLane,row.kind));
}
export function shellHeight(row: TrailRow, c: number) { "worklet"; return row.sky ? 2.7 : surfaceProfile(row, row.surface === "ramp" ? -c * .07 : row.surface === "gap" ? RAMP_DEPTH : 0) + (row.action === "jump" ? (row.surface === "gap" ? [.3,.65,.35] : [.65,.9,.55])[c] : 0); }
export function collectPower(s: RunState, kind: PowerKind): RunState {
  "worklet";
  if (kind === "none") return s;
  return { ...s, ...(kind === "shield" ? { shield: true } : { [kind]: POWER_SECONDS[kind] }), lastPower: kind, powerEvent: s.powerEvent + 1, event: s.event + 1 };
}
export function runSpeed(s: RunState) {
  "worklet";
  return (s.level === "endless" ? Math.min(.8, .5 + s.passed * .002) : s.level.speed) * (s.helper ? .88 : 1) * (s.level === "endless" || runLearning(s) ? 1 : 1 + .18 * Math.min(1, s.passed / s.level.target));
}
export function runStep(before: RunState, _input: RunInput, dt: number): RunState {
  "worklet";
  if (before.status !== "playing" || !finite(dt, .000001, .1)) return before;
  const laneTime = Math.max(0, before.laneTime - dt), t = 1 - laneTime / LANE_SECONDS;
  let s: RunState = { ...before, lives: stepLives(before.lives, dt), magnet: Math.max(0,before.magnet-dt), kite: Math.max(0,before.kite-dt), sandals: Math.max(0,before.sandals-dt), protection: before.kite > 0 && before.kite <= dt ? 1.2 : Math.max(0,before.protection-dt), time: before.time + dt, laneTime, poseLane: before.laneFrom + (before.lane - before.laneFrom) * (1 - (1 - t) ** 3), jump: Math.max(0, before.jump - dt), duck: Math.max(0, before.duck - dt), landing: before.jump > 0 && before.jump <= dt ? .13 : Math.max(0, before.landing - dt), cooldown: Math.max(0, before.cooldown - dt), feedback: Math.max(0, before.feedback - dt) };
  const distance = runSpeed(s) * dt; s.travel += distance;
  s.rows = s.rows.map(row => ({ ...row, z: row.z + distance * approachRate(row.kind), bursts: row.bursts.map(t => Math.max(0, t - dt)) }));
  if (before.kite > 0 && !s.kite) s.elevation = 2.7;
  const support = runSupport(s);
  if (!s.jump && !s.kite) s.elevation = support <= s.elevation || support <= s.elevation + .15 ? Math.max(support, s.elevation - dt * (s.fastDrop ? 9 : 3.5)) : s.elevation;
  else if (s.jump > 0 && s.jump < s.jumpDuration / 2 && support > s.elevation && runnerHeight(before) >= support && runnerHeight(s) <= support) { s.elevation = support; s.jump = 0; s.landing = .13; }
  if (s.kite > 0) s.elevation = 0;
  if (!s.jump && s.elevation <= support + .01) s.fastDrop = false;
  if (before.jump > 0 && !s.jump && support > 0 && s.elevation >= support - .15) s.elevation = support;
  for (let i = 0; i < s.rows.length; i++) {
    let row = s.rows[i];
    if (!runLearning(s) && !row.powerDone && row.z + .23 >= 1) {
      const take = row.power !== "none" && Math.abs(s.poseLane-row.shellLane) < .4;
      row = { ...row, powerDone: true };
      if (take) s = collectPower(s,row.power);
    }
    if (!runLearning(s)) for (let c = 0; c < 3; c++) {
      const bit = 1 << c;
      if (!(row.shellDone & bit) && row.z + c * .07 >= 1) {
        const collected = (s.magnet > 0 && Math.abs(s.poseLane - row.shellLane) <= 2 || Math.abs(s.poseLane - row.shellLane) < .35) && (s.magnet > 0 || s.kite > 0 || Math.abs(runnerHeight(s)-shellHeight(row,c)) < (s.sandals > 0 ? 1.5 : .7));
        row = { ...row, shellDone: row.shellDone | bit, shellTaken: row.shellTaken | (collected ? bit : 0), bursts: row.bursts.map((t, j) => j === c && collected ? .26 : t) };
        if (collected) s = { ...s, shells: s.shells + 1, score: Math.min(99999999, s.score + 10), lastGain: 10, event: s.event + 1, cue: "shell", feedback: .45 };
      }
    }
    s.rows[i] = row;
    const hullContact = !runLearning(s) && row.z >= 1 && row.z <= 1 + CANOE_DEPTH && (isCanoe(row.kind) || row.second >= 0 && isCanoe(row.secondKind));
    if (row.z < 1 || row.passed && !hullContact) continue;
    const learn = runLearning(s), safe = rowSafe(s, row, !learn);
    if (!safe && learn) {
      s = { ...s, bumps: s.bumps + 1, helped: true, event: s.event + 1, cue: "try", feedback: .45 };
      const spacing = s.level === "endless" ? .6 : s.level.spacing;
      s.rows = s.rows.map(r => ({ ...r, z: r.z - spacing })); break;
    }
    if (!safe && s.shield && !s.lives.invulnerable) {
      s = { ...s, shield: false, protection: 1.2, powerEvent: s.powerEvent+1, lastPower: "shield", event: s.event+1 };
    } else if (!safe && !s.lives.invulnerable) {
      const lives = hitLives(s.lives);
      s = { ...s, lives, lastGain: 0, bumps: s.bumps + 1, cooldown: .3, jump: 0, duck: 0, status: lives.hearts ? "playing" : "stumbled", event: s.event + 1, cue: "bump", feedback: .45 };
    } else if (safe && !row.passed) {
      const shell = learn;
      s = { ...s, passed: s.passed + 1, shells: s.shells + (shell ? 3 : 0), score: Math.min(99999999, s.score + 10 + (shell ? 30 : 0)), lastGain: shell ? 40 : 10, event: s.event + 1, cue: learn ? "answer" : "step", feedback: .45 };
    }
    s.rows[i] = { ...row, passed: true };
    if (s.status !== "playing") return s;
  }
  const spacing = s.level === "endless" ? .64 : s.level.spacing;
  for (let i = 0; i < s.rows.length; i++) if (s.rows[i].z > (s.rows[i].surface === "sand" ? 1.25 + (isCanoe(s.rows[i].kind) || isCanoe(s.rows[i].secondKind) ? CANOE_DEPTH : 0) : 1 + s.rows[i].length + .04)) {
    const next = newRow(s, Math.min(...s.rows.map(r => courseDepth(r))) - spacing, s.serial++);
    s.seed = next.seed; s.rows[i] = next.row; s.event++; s.cue = "ready";
  }
  if (s.level !== "endless" && s.passed >= s.level.target) s.status = "cleared";
  return s;
}
export function runResult(s: RunState): ArcadeResult | null {
  "worklet";
  if (s.status === "playing") return null;
  const cleared = s.status === "cleared", target = s.level === "endless" ? Infinity : s.level.target;
  return { cleared, outcome: cleared ? "cleared" : s.status === "rest" ? "stopped" : "game-over", stars: cleared ? s.bumps === 0 && s.shells >= Math.ceil(target * 3 * .85) ? 3 : s.bumps <= 1 ? 2 : 1 : 0, score: s.score, detail: `${s.passed} ${runLearning(s) ? "answers" : "trail markers"} · ${s.shells} shells · ${s.bumps} hits` };
}
export function validRun(v: unknown): v is RunState {
  if (!record(v) || !canonicalLevel(v.level, runLevels) || !uint(v.seed, 0xffffffff) || typeof v.helper !== "boolean" || typeof v.helped !== "boolean" || !validLives(v.lives) || !uint(v.command) || !uint(v.lane, 2) || !finite(v.poseLane, 0, 2) || !finite(v.laneFrom, 0, 2) || !finite(v.laneTime, 0, LANE_SECONDS) || !finite(v.landing, 0, .13) || !Array.isArray(v.rows) || v.rows.length !== 5) return false;
  const keys = "level,seed,helper,lane,poseLane,laneFrom,laneTime,jump,duck,landing,time,travel,cooldown,rows,passed,shells,score,lastGain,bumps,status,event,cue,feedback,helped,lives,command,serial,chunkRandom,elevation,jumpBase,jumpDuration,fastDrop,magnet,kite,sandals,shield,protection,powerEvent,lastPower,learned".split(",");
  return Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k)) && [v.time, v.travel].every(n => finite(n, 0, 1e10)) && finite(v.jump, 0, .8) && finite(v.jumpDuration, JUMP_SECONDS, .8) && finite(v.elevation,0,3) && finite(v.jumpBase,0,3) && finite(v.chunkRandom,0,1) && uint(v.serial) && uint(v.powerEvent) && uint(v.learned,7) && typeof v.fastDrop === "boolean" && typeof v.shield === "boolean" && finite(v.magnet,0,8) && finite(v.kite,0,6) && finite(v.sandals,0,10) && finite(v.protection,0,1.2) && ["none","magnet","kite","sandals","shield"].includes(v.lastPower as string) && finite(v.duck, 0, SLIDE_SECONDS) && [v.cooldown, v.feedback].every(n => finite(n, 0, 1.2)) && [v.passed, v.shells, v.score, v.lastGain, v.bumps, v.event].every(n => uint(n)) && (v.shells as number) <= (v.serial as number) * 3 && (runLearning(v as RunState) || v.bumps === v.lives.hit) && (v.status === "stumbled" ? v.lives.hearts === 0 : v.lives.hearts > 0) && ["playing", "cleared", "stumbled", "rest"].includes(v.status as string) && ["ready", "step", "jump", "duck", "shell", "bump", "answer", "try"].includes(v.cue as string) && v.rows.every(row => record(row) && Object.keys(row).length === 23 && finite(row.length,.25,.8) && uint(row.serial) && row.serial < (v.serial as number) && RUN_CHUNKS.some(c=>c.id===row.chunk) && ["sand","ramp","boardwalk","canoe-roof","gap"].includes(row.surface as string) && ["none","magnet","kite","sandals","shield"].includes(row.power as string) && typeof row.powerDone === "boolean" && typeof row.sky === "boolean" && ["idle","jump","duck"].includes(row.action as string) && uint(row.shellDone, 7) && uint(row.shellTaken, 7) && ((row.shellTaken as number) & ~(row.shellDone as number)) === 0 && Array.isArray(row.bursts) && row.bursts.length === 3 && row.bursts.every(t => finite(t, 0, .26)) && finite(row.z, -5, 1.9) && uint(row.lane, 2) && uint(row.shellLane, 2) && Number.isInteger(row.second) && finite(row.second, -1, 2) && row.second !== row.lane && typeof row.passed === "boolean" && typeof row.moving === "boolean" && typeof row.crossing === "boolean" && typeof row.third === "boolean" && finite(row.phase, 0, Math.PI * 2) && typeof row.kind === "string" && Object.hasOwn(HAZARDS,row.kind) && typeof row.secondKind === "string" && Object.hasOwn(HAZARDS,row.secondKind) && validFact(row.fact));
}
export const runEngine: ArcadeEngine<RunState, RunInput, ScrollLevel> = { create: createRun, reduce: runTransition, step: runStep, result: runResult, validate: validRun };
