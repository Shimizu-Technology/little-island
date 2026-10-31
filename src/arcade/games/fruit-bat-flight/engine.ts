import { FLAP_DURATION, GLIDE_WING, stepWing } from "./animation";
import { nextRandom, type ArcadeEngine, type ArcadeResult } from "../../types";
import { configureLives, createLives, hitLives, stepLives, validLives, type Lives } from "../../lives";
import { canonicalLevel, finite, flightLevels, mathGate, record, uint, validFact, type MathGate, type ScrollLevel } from "../scrolling/content";
import { batAngle, batExtentX, batExtentY, batTouchesGate, CEILING, GROUND, FLIGHT_H, FLIGHT_W, TRUNK_HALF } from "./hull";
export { flightLevels, flightLevel } from "../scrolling/content";
export type FlightInput = { type: "flap" | "idle" | "finish" } | { type: "helper"; value: boolean };
export type PalmGate = { x: number; center: number; base: number; phase: number; fruit: boolean; passed: boolean; fact: MathGate };
export type FlightState = { level: ScrollLevel | "endless"; seed: number; helper: boolean; y: number; vy: number; time: number; travel: number; cooldown: number; flap: number; wing: number; gates: PalmGate[]; passed: number; fruit: number; score: number; lastGain: number; bumps: number; status: "playing" | "cleared" | "bumped" | "rest"; event: number; cue: "ready" | "flap" | "fruit" | "bump" | "answer" | "try"; feedback: number; helped: boolean; lives: Lives; command: number; /** Hovering until the next tap: at the start and after a lost heart. */ waiting: boolean; /** Animation-only clock for the hover bob; gameplay time stays frozen while waiting. */ hover: number };
export const PLAYER_X = .24, FLIGHT_GRAVITY = 1.9, FLAP_VELOCITY = -.65, TERMINAL_VELOCITY = 1.2;
export function flightLearning(s: FlightState) { "worklet"; return s.level !== "endless" && s.level.world === "learn"; }
function newGate(s: FlightState, x: number): { seed: number; gate: PalmGate } {
  "worklet";
  const [seed, n] = nextRandom(s.seed), rank = s.level === "endless" ? 2 : s.level.rank;
  // Bounded centre changes leave enough travel time for both ascent and descent.
  const previous = s.gates.length ? s.gates.reduce((a, b) => a.x > b.x ? a : b).base : .5;
  const center = rank === 1 ? .5 + (Math.round(x / .49) % 2 ? .075 : -.075) : Math.max(.28, Math.min(.72, previous + (n - .5) * (.12 + rank * .01)));
  const fact = mathGate(seed, s.level === "endless" ? 8 : s.level.index);
  return { seed: fact.seed, gate: { x, center, base: center, phase: n * Math.PI * 2, fruit: true, passed: false, fact: fact.fact } };
}
export function createFlight(level: FlightState["level"], seed: number, helper = false): FlightState {
  let s: FlightState = { level, seed: seed >>> 0, helper, y: .5, vy: 0, time: 0, travel: 0, cooldown: 0, flap: 0, wing: GLIDE_WING, gates: [], passed: 0, fruit: 0, score: 0, lastGain: 0, bumps: 0, status: "playing", event: 0, cue: "ready", feedback: 0, helped: helper, lives: createLives(helper, level === "endless"), command: 0, waiting: true, hover: 0 };
  const spacing = level === "endless" ? .48 : level.spacing;
  for (let i = 0; i < 4; i++) { const next = newGate(s, .82 + i * spacing); s = { ...s, seed: next.seed, gates: [...s.gates, next.gate] }; }
  return s;
}
export function flightGap(s: FlightState) { "worklet"; return (s.level === "endless" ? .29 : s.level.gap) + (s.helper ? .06 : 0) + (s.level !== "endless" && s.level.rank >= 4 ? Math.sin(s.time * 2) * .01 : 0); }
export function flightSpeed(s: FlightState) {
  "worklet";
  const base = s.level === "endless" ? Math.min(.65, .43 + s.passed * .0015) : s.level.speed;
  return base * (s.level !== "endless" && s.level.rank >= 5 ? 1 + Math.sin(s.time * 2.4) * .035 : 1) * (s.helper ? .88 : 1) * (s.level === "endless" || flightLearning(s) ? 1 : 1 + .12 * Math.min(1, s.passed / s.level.target));
}
export function flightTransition(s: FlightState, input: FlightInput): FlightState {
  "worklet";
  if (s.status !== "playing" || !record(input)) return s;
  if (input.type === "helper" && typeof input.value === "boolean") {
    const lives = configureLives(s.lives, input.value, s.level === "endless");
    // Turning Helper off after enough hits can leave no hearts: that is a game over, never a free run.
    return { ...s, helper: input.value, helped: s.helped || input.value, lives, ...(lives.hearts === 0 && !flightLearning(s) ? { status: "bumped" as const, waiting: false } : {}) };
  }
  if (input.type === "finish" && s.level === "endless") return { ...s, status: "rest" };
  if (input.type !== "flap") return s;
  // One callback per down event. No debounce: even taps faster than a physics tick survive.
  return { ...s, waiting: false, vy: FLAP_VELOCITY * (s.helper ? .96 : 1), flap: FLAP_DURATION, event: s.event + 1, cue: "flap" };
}
function bump(s: FlightState, center: number, wrong = false): FlightState {
  "worklet";
  if (flightLearning(s)) return { ...s, y: center, vy: 0, bumps: s.bumps + 1, helped: true, cooldown: .3, event: s.event + 1, cue: wrong ? "try" : "bump", feedback: .45 };
  const lives = hitLives(s.lives);
  if (lives === s.lives) return s;
  // A lost heart (not the last) hovers the bat in the next opening until the player taps again.
  return { ...s, waiting: lives.hearts > 0 && s.level !== "endless", y: lives.hearts ? Math.max(.12, Math.min(.88, center)) : Math.max(.035, Math.min(.965, s.y)), vy: lives.hearts ? 0 : s.vy, cooldown: .3, lastGain: 0, lives, bumps: s.bumps + 1, status: lives.hearts ? "playing" : "bumped", event: s.event + 1, cue: "bump", feedback: .45 };
}
export function flightStep(before: FlightState, _input: FlightInput, dt: number): FlightState {
  "worklet";
  if (before.status !== "playing" || !finite(dt, .000001, .1)) return before;
  // Waiting: the world is frozen and protection does not tick down; only animation clocks move.
  if (before.waiting) return { ...before, hover: (before.hover + dt) % 1000, cooldown: Math.max(0, before.cooldown - dt), flap: Math.max(0, before.flap - dt), wing: stepWing(before.wing, before.flap, dt), feedback: Math.max(0, before.feedback - dt) };
  let s: FlightState = { ...before, lives: stepLives(before.lives, dt), time: before.time + dt, cooldown: Math.max(0, before.cooldown - dt), flap: Math.max(0, before.flap - dt), wing: stepWing(before.wing, before.flap, dt), feedback: Math.max(0, before.feedback - dt) };
  const learn = flightLearning(s), rank = s.level === "endless" ? 3 : s.level.rank;
  const gust = !learn && rank >= 3 ? Math.sin(s.time * 2.1) * (.12 + (rank - 3) * .035) : 0;
  s.vy = Math.min(TERMINAL_VELOCITY, s.vy + ((s.helper ? 1.75 : FLIGHT_GRAVITY) + gust) * dt);
  s.y += s.vy * dt;
  const distance = flightSpeed(s) * dt; s.travel += distance;
  s.gates = s.gates.map(g => ({ ...g, x: g.x - distance, center: g.base + (!learn && rank >= 2 ? Math.sin(s.time * (rank >= 4 ? 1.8 : 1.2) + g.phase) * (rank >= 4 ? .035 : .025) : 0) }));
  const next = s.gates.filter(g => !g.passed && g.x >= PLAYER_X - .06).sort((a, b) => a.x - b.x)[0];
  const extent = batExtentY(batAngle(s.vy));
  if (s.y * FLIGHT_H - extent <= CEILING || s.y * FLIGHT_H + extent >= GROUND) {
    if (!s.lives.invulnerable && !s.cooldown) s = bump(s, next?.center ?? .5);
    else { s.y = Math.max((CEILING + extent) / FLIGHT_H, Math.min((GROUND - extent) / FLIGHT_H, s.y)); s.vy = -.18; }
    if (s.status !== "playing") return s;
  }
  for (let i = 0; i < s.gates.length; i++) {
    let g = s.gates[i]; if (g.passed) continue;
    // One torso ellipse for palms, gap edges and both arena boundaries.
    if (!learn && batTouchesGate(s.y, s.vy, g.x, g.center, flightGap(s)) && !s.lives.invulnerable) {
      s = bump(s, g.center); g = { ...g, passed: true, fruit: false }; s.gates[i] = g;
      if (s.status !== "playing") return s;
    }
    if (g.x <= PLAYER_X - (learn ? .065 : (TRUNK_HALF + batExtentX(batAngle(s.vy))) / FLIGHT_W) && !g.passed) {
      const choice = Math.min(2, Math.max(0, Math.round((s.y - .24) / .26)));
      if (learn && g.fact.choices[choice] !== g.fact.answer) {
        s = bump(s, .5, true); const spacing = s.level === "endless" ? .6 : s.level.spacing;
        s.gates = s.gates.map(gate => ({ ...gate, x: gate.x + spacing })); break;
      }
      const fruit = learn || Math.abs(s.y - g.center) < flightGap(s) * .32;
      s = { ...s, passed: s.passed + 1, fruit: s.fruit + (fruit ? 1 : 0), score: Math.min(99999999, s.score + 1), lastGain: 1, event: s.event + 1, cue: learn ? "answer" : "fruit", feedback: .45 };
      s.gates[i] = { ...g, passed: true, fruit: false };
    }
  }
  const spacing = s.level === "endless" ? .48 : s.level.spacing;
  for (let i = 0; i < s.gates.length; i++) if (s.gates[i].x < -.15) {
    const next = newGate(s, Math.max(...s.gates.map(g => g.x)) + spacing);
    s.seed = next.seed; s.gates[i] = next.gate; s.event++; s.cue = "ready";
  }
  if (s.level !== "endless" && s.passed >= s.level.target) s.status = "cleared";
  return s;
}
export function flightResult(s: FlightState): ArcadeResult | null {
  "worklet";
  if (s.status === "playing") return null;
  const cleared = s.status === "cleared", target = s.level === "endless" ? Infinity : s.level.target;
  return { cleared, outcome: cleared ? "cleared" : s.status === "rest" ? "stopped" : "game-over", stars: cleared ? s.bumps === 0 && s.fruit >= Math.ceil(target * .85) ? 3 : s.bumps <= 1 ? 2 : 1 : 0, score: s.score, detail: `${s.passed} ${flightLearning(s) ? "answers" : "palms passed"} · ${s.fruit} fruit · ${s.bumps} hits` };
}
export function validFlight(v: unknown): v is FlightState {
  if (!record(v) || !canonicalLevel(v.level, flightLevels) || !uint(v.seed, 0xffffffff) || typeof v.helper !== "boolean" || typeof v.helped !== "boolean" || !validLives(v.lives) || !uint(v.command) || !finite(v.y, 0, 1) || !finite(v.vy, -.7, 1.2) || !Array.isArray(v.gates) || v.gates.length !== 4) return false;
  const keys = "level,seed,helper,y,vy,time,travel,cooldown,flap,wing,gates,passed,fruit,score,lastGain,bumps,status,event,cue,feedback,helped,lives,command,waiting,hover".split(",");
  return typeof v.waiting === "boolean" && finite(v.hover, 0, 1000) && finite(v.wing, -.95, GLIDE_WING) && Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k)) && [v.time, v.travel].every(n => finite(n, 0, 1e10)) && [v.cooldown, v.flap, v.feedback].every(n => finite(n, 0, 1.2)) && [v.passed, v.fruit, v.score, v.lastGain, v.bumps, v.event].every(n => uint(n)) && (v.fruit as number) <= (v.passed as number) && (flightLearning(v as FlightState) || v.bumps === v.lives.hit) && (v.status === "bumped" ? v.lives.hearts === 0 : v.lives.hearts > 0) && ["playing", "cleared", "bumped", "rest"].includes(v.status as string) && ["ready", "flap", "fruit", "bump", "answer", "try"].includes(v.cue as string) && v.gates.every(g => record(g) && Object.keys(g).length === 7 && finite(g.x, -.3, 4) && finite(g.center, .2, .8) && finite(g.base, .28, .72) && finite(g.phase, 0, Math.PI * 2) && typeof g.fruit === "boolean" && typeof g.passed === "boolean" && validFact(g.fact));
}
export const flightEngine: ArcadeEngine<FlightState, FlightInput, ScrollLevel> = { create: createFlight, reduce: flightTransition, step: flightStep, result: flightResult, validate: validFlight };
