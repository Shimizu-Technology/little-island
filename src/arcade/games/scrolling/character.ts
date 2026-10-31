import type { RunState } from "../lagoon-run/engine";
import { SLIDE_SECONDS } from "../lagoon-run/engine";
/** Sixteen running poses at 16 poses/s (eight keys plus in-betweens), and eight action poses. */
export const RUN_POSES = 24, RUN_EXTRA = 243;
export function runnerFrame(s: RunState, reduced = false) {
  "worklet";
  if (s.status === "cleared") return 15;
  if (s.status === "stumbled") return 14;
  if (s.kite > 0) return 9;
  if (s.duck > 0) { const t = 1 - s.duck / SLIDE_SECONDS; return t < .18 ? 11 : t < .82 ? 12 : 13; }
  if (s.cooldown > 0) return 14;
  if (s.landing > 0) return 10;
  if (s.jump > 0) { const t = 1 - s.jump / s.jumpDuration; return t < .2 ? 8 : t < .78 ? 9 : 10; }
  const tick=Math.floor(s.time*16)%16;
  return reduced?0:tick%2?16+Math.floor(tick/2):Math.floor(tick/2);
}
export type Point = readonly [number, number];
export type RunnerDrawing = { bob: number; knee: Point[]; foot: Point[]; elbow: Point[]; hand: Point[] };
// Contact, down, passing, up, then the opposite foot. A planted shoe stays at y=128.
const steps: RunnerDrawing[] = [
  { bob: 0, knee: [[28,105],[49,99]], foot: [[24,128],[51,114]], elbow: [[20,67],[61,60]], hand: [[25,78],[58,51]] },
  { bob: 3, knee: [[27,108],[49,101]], foot: [[25,128],[50,115]], elbow: [[20,70],[60,62]], hand: [[24,78],[57,56]] },
  { bob: 1, knee: [[31,105],[47,100]], foot: [[29,126],[44,111]], elbow: [[20,66],[59,66]], hand: [[23,76],[56,72]] },
  { bob: -1, knee: [[32,100],[50,104]], foot: [[34,115],[54,128]], elbow: [[20,60],[60,68]], hand: [[23,53],[57,80]] },
];
export const runnerDrawings: RunnerDrawing[] = [...steps, ...steps.map(p => ({ bob: p.bob, knee: p.knee.slice().reverse().map(([x,y]) => [80-x,y] as Point), foot: p.foot.slice().reverse().map(([x,y]) => [80-x,y] as Point), elbow: p.elbow.slice().reverse().map(([x,y]) => [80-x,y] as Point), hand: p.hand.slice().reverse().map(([x,y]) => [80-x,y] as Point) }))];
