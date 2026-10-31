import type { Seat } from "../../../games/match";
import type { LearnEngine, LearnOptions, Outcome } from "../../types";
import { integer, keys, object } from "../../kit/numbers";
import { focusSkill } from "../../skills";

export type ReefAction = "roll" | "skip" | number;
export type ReefState = { version: 1; starter: Seat; rolls: number[][]; history: ReefAction[]; focus: string };
export type ReefRound = {
  positions: [number, number];
  turn: Seat;
  phase: "roll" | "move" | "current" | "bonus" | "done";
  remaining: number;
  direction: 1 | -1;
  rollIndex: number;
  dice: number[];
  currents: string[];
  winner: Seat | null;
  bonus: [number, number] | null;
};
export const boardEnd = (o: LearnOptions) => (o.pace === "easy" ? 30 : o.pace === "medium" ? 60 : 100);
export const currents: Record<number, number> = { 8: 2, 17: -1, 28: 2, 47: -1, 68: 2, 87: -1 };
export const shells = [5, 14, 24, 35, 54, 75];
const SKILLS = {
  "num.count-on": "Counting on from a number",
  "num.number-line": "Following a numbered path",
  "num.compare": "Comparing numbers",
  "num.add-within-10": "Adding small moves",
  "num.add-within-20": "Adding two dice",
};
export const shellStops = (s: ReefState) =>
  s.focus === "num.compare" ? [...shells, 10, 20, 30, 40, 50, 60, 70, 80, 90] : shells;
const initial = (s: ReefState): ReefRound => ({
  positions: [0, 0],
  turn: s.starter,
  phase: "roll",
  remaining: 0,
  direction: 1,
  rollIndex: 0,
  dice: [],
  currents: [],
  winner: null,
  bonus: null,
});
const mover = (r: ReefRound, o: LearnOptions) => (o.mode === "together" ? 0 : r.turn);
export const nextStone = (r: ReefRound, o: LearnOptions) => r.positions[mover(r, o)] + r.direction;
export function bonusPair(n: number, end: number): [number, number] {
  const other = Number(String(n).padStart(2, "0").split("").reverse().join(""));
  return other > 0 && other <= end && other !== n ? [n, other] : [Math.max(1, n - 2), Math.min(end, n + 3)];
}
function finishTurn(r: ReefRound, o: LearnOptions) {
  r.bonus = null;
  if (o.mode === "together") {
    r.positions[1] = Math.min(boardEnd(o), r.positions[1] + 2);
    if (r.positions[1] === boardEnd(o)) {
      r.phase = "done";
      r.winner = 1;
      return;
    }
  }
  r.turn = r.turn === 0 ? 1 : 0;
  r.phase = "roll";
}
/** Mutates only a fresh replay snapshot; returns false for an impossible action. */
function step(r: ReefRound, action: ReefAction, s: ReefState, o: LearnOptions): boolean {
  const end = boardEnd(o),
    seat = mover(r, o);
  if (r.phase === "done") return false;
  if (r.phase === "roll") {
    if (action !== "roll" || r.rollIndex >= s.rolls.length) return false;
    r.dice = s.rolls[r.rollIndex++];
    r.remaining = Math.min(
      end - r.positions[seat],
      r.dice.reduce((a, b) => a + b, 0)
    );
    r.direction = 1;
    r.phase = "move";
    return true;
  }
  if (r.phase === "bonus") {
    if (action !== "skip" && action !== Math.max(...r.bonus!)) return false;
    finishTurn(r, o);
    return true;
  }
  if (action !== nextStone(r, o)) return false;
  r.positions[seat] = action;
  r.remaining--;
  if (r.positions[seat] === end) {
    r.phase = "done";
    r.winner = seat;
    return true;
  }
  if (r.remaining > 0) return true;
  const marker = `${seat}:${action}`;
  if (r.phase === "move" && currents[action] && !r.currents.includes(marker)) {
    r.currents.push(marker);
    r.direction = currents[action] > 0 ? 1 : -1;
    r.remaining = Math.min(Math.abs(currents[action]), r.direction > 0 ? end - action : action);
    r.phase = "current";
    return true;
  }
  if (shellStops(s).includes(action)) {
    r.phase = "bonus";
    r.bonus = bonusPair(action, end);
    return true;
  }
  finishTurn(r, o);
  return true;
}
export function reefRound(s: ReefState, o: LearnOptions): ReefRound {
  const r = initial(s);
  for (const action of s.history) step(r, action, s, o);
  return r;
}
export function reefMove(s: ReefState, o: LearnOptions, action: ReefAction): ReefState {
  if (s.history.length >= 1200 || !step(reefRound(s, o), action, s, o)) return s;
  return { ...s, history: [...s.history, action] };
}
export function reefOutcome(s: ReefState, o: LearnOptions): Outcome {
  const r = reefRound(s, o);
  return r.phase !== "done" ? null : o.mode === "versus" ? r.winner : "done";
}
/** Solo and together rounds end "done" either way; seat 1 (island friend or tide) reaching the island first isn't a win. */
export function reefNotWon(s: ReefState, o: LearnOptions): string | null {
  if (o.mode === "versus") return null;
  const r = reefRound(s, o);
  if (r.phase !== "done" || r.winner !== 1) return null;
  return o.mode === "together" ? "The tide won this time. Race again?" : "Island friend won this time. Race again?";
}
export const engine: LearnEngine<ReefState> = {
  id: "reef-race",
  name: "Reef Race",
  island: "numbers",
  tagline: "Spin and hop your turtle to the island.",
  description:
    "A board-game race along numbered stones. Spin, then tap each stone as your turtle hops and counts on. Race the island friend, the tide, or each other.",
  help: "Tap the spinner (or the die). Then tap each next stone to hop your turtle, saying the numbers as you go. A wave pushes you 2 more stones. A crab pulls you back 1. A shell asks which number is bigger. First to the island wins. With a grown-up, share one turtle and race the tide, which moves 2 stones after each turn. There is no clock. For grown-ups: this practises counting on from any number, the number path, adding small amounts and comparing two-digit numbers.",
  helpAudio: "reef-race-help",
  introAudio: "reef-race-intro",
  color: "#2F737C",
  surface: "#DDF0EE",
  modes: ["solo", "together", "versus"],
  paceHelp: {
    easy: "Stones 1–30 · a spinner with 1, 2 and 3",
    medium: "Stones 1–60 · one die",
    hard: "Stones 1–100 · two dice",
  },
  skills: SKILLS,
  notWon: reefNotWon,
  create(o, ctx) {
    return {
      version: 1,
      starter: ctx.starter,
      focus: focusSkill(Object.keys(SKILLS), ctx.skills, ctx.rng, ctx.today),
      rolls: Array.from({ length: 256 }, () =>
        Array.from({ length: o.pace === "hard" ? 2 : 1 }, () => 1 + Math.floor(ctx.rng() * (o.pace === "easy" ? 3 : 6)))
      ),
      history: [],
    };
  },
  validate(v, o): v is ReefState {
    if (
      !object(v) ||
      !keys(v, ["version", "starter", "focus", "rolls", "history"]) ||
      v.version !== 1 ||
      !integer(v.starter, 0, 1) ||
      typeof v.focus !== "string" ||
      !Object.hasOwn(SKILLS, v.focus) ||
      !Array.isArray(v.rolls) ||
      v.rolls.length !== 256 ||
      !v.rolls.every(
        (d) =>
          Array.isArray(d) &&
          d.length === (o.pace === "hard" ? 2 : 1) &&
          d.every((n) => integer(n, 1, o.pace === "easy" ? 3 : 6))
      ) ||
      !Array.isArray(v.history) ||
      v.history.length > 1200 ||
      !v.history.every((a) => a === "roll" || a === "skip" || integer(a, 1, boardEnd(o)))
    )
      return false;
    const s = v as ReefState,
      r = initial(s);
    return s.history.every((a) => step(r, a, s, o));
  },
  outcome: reefOutcome,
  turn: (s, o) => {
    const r = reefRound(s, o);
    return r.phase === "done" ? null : r.turn;
  },
};
