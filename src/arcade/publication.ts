import type { Lives } from "./lives";
import { flightLearning, type FlightState } from "./games/fruit-bat-flight/engine";
import { runLearning, runSpeed, type RunState } from "./games/lagoon-run/engine";
import { palmConfig, type PalmState } from "./games/palm-patrol/engine";
import { beachConfig, type BeachState } from "./games/beach-ball/engine";
function hearts(lives: Lives): Lives { "worklet"; return { ...lives, invulnerable: 0 }; }
export function flightHud(s: FlightState) {
  "worklet";
  const learn = flightLearning(s);
  const next = learn ? s.gates.filter(g => !g.passed).sort((a, b) => a.x - b.x)[0]?.fact : undefined;
  return { level: s.level === "endless" ? "endless" as const : { target: s.level.target }, passed: s.passed, score: s.score, lives: hearts(s.lives), helped: s.helped, status: s.status, waiting: s.waiting, event: s.event, cue: s.cue, y: s.lives.hearts ? 0 : s.y, facts: learn ? s.gates.map(g => g.fact.choices) : [], next };
}
export function runHud(s: RunState) {
  "worklet";
  const learn = runLearning(s);
  const approaching = s.rows.filter(r => !r.passed).sort((a, b) => b.z-a.z)[0];
  const next = learn ? approaching?.fact : undefined;
  return { level: s.level === "endless" ? "endless" as const : { target: s.level.target }, passed: s.passed, score: s.score, lives: hearts(s.lives), helped: s.helped, status: s.status, event: s.event, cue: s.cue, poseLane: s.lives.hearts ? 0 : s.poseLane, next,
    learned:s.learned, teaching:approaching?.action === "idle" ? approaching.shellLane < s.lane ? "left" : "right" : approaching?.action??"idle", powers:{magnet:Math.ceil(s.magnet*10)/10,kite:Math.ceil(s.kite*10)/10,sandals:Math.ceil(s.sandals*10)/10,shield:s.shield?1:0}, powerEvent:s.powerEvent,lastPower:s.lastPower, warning:!learn&&approaching&&(1-approaching.z)/runSpeed(s)<1.1?approaching.kind:"none",
    spec: s.rows.map(r => ({ kind: r.kind, secondKind: r.secondKind, third: r.third, surface:r.surface, power:r.power, choices: learn ? r.fact.choices : [] })) };
}
export function palmHud(s: PalmState) {
  "worklet";
  const config = palmConfig(s);
  return { level: s.level === "endless" ? "endless" as const : { waves: s.level.waves }, world: config.world, helped: s.helped, wave: s.wave, waves: config.waves, relay: s.relay, relays: config.relays, caught: s.caught, score: s.score, lives: hearts(s.lives), shields: s.shields, prompt: s.prompt, answer: s.answer, feedback: s.feedback, shots: s.shots, event: s.event, cue: s.cue, tip: s.time < 4,
    answers: config.world === "learn" ? s.beetles.map(b => ({ id: b.id, value: b.value })) : [] };
}
export function beachHud(s: BeachState) {
  "worklet";
  const c = beachConfig(s);
  return { level: s.level === "endless" ? "endless" as const : "level" as const, config: { world: c.world, turtle: c.turtle, balls: c.balls, countBy: c.countBy, target: c.target }, helper: s.helper, mode: s.mode, winner: s.winner, points: s.points, bestRally: s.bestRally, score: s.score, event: s.event, cue: s.cue, tip: s.time < 4 };
}
export type ScrollHud = ReturnType<typeof flightHud> | ReturnType<typeof runHud>;
