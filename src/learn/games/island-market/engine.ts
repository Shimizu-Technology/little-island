import type { Seat } from "../../../games/match";
import type { LearnEngine, LearnOptions } from "../../types";
import { pickItems } from "../../skills";
import {
  adjustPieces,
  emptyPieces,
  integer,
  keys,
  object,
  pieceTotal,
  validPieces,
  type Pieces,
} from "../../kit/numbers";
import { ORDERS, ROUND_PLAN, planStep, type MarketOrder } from "./orders";
export { ORDERS, ROUND_PLAN } from "./orders";
export type MarketState = {
  version: 1;
  starter: Seat;
  orders: string[];
  index: number;
  phase: "order" | "pack" | "served" | "done";
  pieces: Pieces;
  served: number[];
};
export const marketOrder = (s: MarketState): MarketOrder | undefined => ORDERS.find((o) => o.id === s.orders[s.index]);
export const marketMax = (o: LearnOptions) => (o.pace === "easy" ? 20 : 100);
/** Together: players take turns serving customers; whoever starts serves the first one. */
export const server = (s: MarketState): Seat => ((s.starter + s.index) % 2) as Seat;
export const marketTurn = (s: MarketState): Seat | null => (s.phase === "done" ? null : server(s));
/** Rounds saved before the redesign may still wait at "order"; it now behaves exactly like "pack". */
const packing = (s: MarketState) => s.phase === "pack" || s.phase === "order";
export function chooseOrder(s: MarketState): MarketState {
  if (s.phase !== "order" || s.index + 1 >= s.orders.length) return s;
  const orders = [...s.orders];
  [orders[s.index], orders[s.index + 1]] = [orders[s.index + 1], orders[s.index]];
  return { ...s, orders };
}
export const openOrder = (s: MarketState): MarketState => (s.phase === "order" ? { ...s, phase: "pack" } : s);
export function packPiece(
  s: MarketState,
  o: LearnOptions,
  part: "tens" | "ones" | 0 | 1 | 2 | 3,
  delta: 1 | -1
): MarketState {
  const order = marketOrder(s);
  if (!packing(s) || !order || order.kind === "compare") return s;
  let pieces = adjustPieces(s.pieces, part, delta, marketMax(o), order.kind === "change");
  // Ten loose mangoes hop into a crate while she is still counting up to the order. Past the
  // order they stay loose, so "too many" can always be fixed by taking one mango back.
  if (pieces !== s.pieces && part === "ones" && delta > 0 && pieces.ones === 10 && pieceTotal(pieces) <= order.target)
    pieces = { ...pieces, tens: pieces.tens + 1, ones: 0 };
  return pieces === s.pieces ? s : { ...s, phase: "pack", pieces };
}
export function serve(s: MarketState, choice?: number): MarketState {
  const order = marketOrder(s);
  if (
    !packing(s) ||
    !order ||
    (order.kind === "compare"
      ? choice !== order.target
      : pieceTotal(s.pieces, order.kind === "change") !== order.target)
  )
    return s;
  return { ...s, phase: "served", served: [...s.served, order.target] };
}
export function nextCustomer(s: MarketState): MarketState {
  if (s.phase !== "served") return s;
  const index = s.index + 1;
  return { ...s, index, phase: index === s.orders.length ? "done" : "pack", pieces: emptyPieces() };
}
const labels = {
  "num.count-out": "Counting out an amount",
  "num.add-within-10": "Adding two small amounts",
  "num.tens-ones": "Packing tens and ones",
  "num.compare": "Comparing two amounts",
  "num.add-within-20": "Adding within twenty",
  "num.add-tens": "Adding tens and ones",
  "num.add-within-100": "Adding within one hundred",
  "num.subtract-within-100": "Taking away within one hundred",
  "num.make-change": "Making change with shell coins",
};
export const engine: LearnEngine<MarketState> = {
  id: "island-market",
  name: "Island Market",
  island: "numbers",
  tagline: "Fill each customer's basket with mangoes.",
  description:
    "Customers come to the mango stall. Tap mangoes and crates of ten into the basket until it matches the order, then give it to them.",
  help: "Each customer shows how many mangoes they want. Tap the mango pile to add one mango. Tap the crate pile to add a crate of ten. Tap anything in the basket to take it back. When the basket matches, tap Give it! Two customers? Tap the one who wants more. In Challenge you also take away and give change with pretend shell coins worth 1, 5, 10 and 25. They are never earned or kept. With a grown-up, take turns serving customers. There is no clock. For grown-ups: Gentle goes from counting 3–9 to teens as one ten and some ones, then adding two small amounts.",
  helpAudio: "island-market-help",
  introAudio: "island-market-intro",
  color: "#9A6A1F",
  surface: "#FBEFD3",
  modes: ["solo", "together"],
  modeLabels: { together: "Take turns with a grown-up" },
  skills: labels,
  paceHelp: {
    easy: "Six customers · 3 to 9, then teens, then two friends",
    medium: "Eight customers · crates of ten to 100 and adding tens",
    hard: "Eight customers · adding, taking away and giving change",
  },
  create(o, ctx) {
    // Follow the round's ramp (easiest first); spacing picks which orders fill each step.
    const plan = ROUND_PLAN[o.pace],
      fresh = ORDERS.filter((q) => q.pace === o.pace && !q.retired);
    const chosen: Record<string, MarketOrder[]> = {};
    for (const step of new Set(plan)) {
      const need = plan.filter((k) => k === step).length;
      chosen[step] = pickItems(
        fresh.filter((q) => planStep(q) === step),
        ctx.skills,
        need,
        ctx.rng,
        ctx.today
      ).sort((a, b) => a.target - b.target);
    }
    return {
      version: 1,
      starter: ctx.starter,
      orders: plan.map((step) => chosen[step].shift()!.id),
      index: 0,
      phase: "pack",
      pieces: emptyPieces(),
      served: [],
    };
  },
  validate(v, o): v is MarketState {
    if (
      !object(v) ||
      !keys(v, ["version", "starter", "orders", "index", "phase", "pieces", "served"]) ||
      v.version !== 1 ||
      !integer(v.starter, 0, 1) ||
      !Array.isArray(v.orders) ||
      v.orders.length !== (o.pace === "easy" ? 6 : 8) ||
      !v.orders.every((id) => typeof id === "string" && ORDERS.some((q) => q.id === id && q.pace === o.pace)) ||
      new Set(v.orders).size !== v.orders.length ||
      !integer(v.index, 0, v.orders.length) ||
      !["order", "pack", "served", "done"].includes(v.phase as string) ||
      !Array.isArray(v.served)
    )
      return false;
    const s = v as MarketState,
      order = marketOrder(s);
    if (
      [...new Set(ORDERS.filter((q) => q.pace === o.pace).map((q) => q.kind))].some(
        (kind) => !s.orders.some((id) => ORDERS.find((q) => q.id === id)!.kind === kind)
      )
    )
      return false;
    if (
      (s.phase === "done") !== (s.index === s.orders.length) ||
      s.served.length !== s.index + (s.phase === "served" ? 1 : 0) ||
      !s.served.every((n, i) => n === ORDERS.find((q) => q.id === s.orders[i])!.target) ||
      !validPieces(s.pieces, marketMax(o), order?.kind === "change")
    )
      return false;
    if (s.phase === "order" || s.phase === "done" || order?.kind === "compare")
      return pieceTotal(s.pieces) === 0 && s.pieces.coins.every((n) => n === 0);
    return s.phase !== "served" || pieceTotal(s.pieces, order?.kind === "change") === order?.target;
  },
  outcome: (s) => (s.phase === "done" ? "done" : null),
  turn: marketTurn,
};
