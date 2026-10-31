import type { Pace } from "../../types";
export type MarketKind = "pack" | "compare" | "add" | "subtract" | "change";
export type MarketOrder = {
  id: string;
  pace: Pace;
  kind: MarketKind;
  /** pack: the amount · compare/add: Auntie's and Kiko's amounts · subtract: had, sold · change: paid, cost. */
  a: number;
  b: number;
  target: number;
  skill: string;
  prompt: string;
  /**
   * Kept so rounds saved before the redesign still load and play, but no longer chosen for new
   * rounds (they were too hard to start Gentle with).
   */
  retired?: true;
};

const promptFor = (kind: MarketKind, a: number, b: number) =>
  kind === "pack"
    ? `${a} mangoes, please!`
    : kind === "compare"
    ? `Auntie wants ${a} mangoes. Kiko wants ${b}. Who wants more?`
    : kind === "add"
    ? `Auntie wants ${a}. Kiko wants ${b}. Put them all in one basket!`
    : kind === "subtract"
    ? `We had ${a} mangoes. We sold ${b}. Put the ones left in the basket!`
    : `It costs ${b} shells. Auntie pays ${a}. Give back the change!`;
const targetFor = (kind: MarketKind, a: number, b: number) =>
  kind === "pack" ? a : kind === "compare" ? Math.max(a, b) : kind === "add" ? a + b : a - b;
const order = (id: string, kind: MarketKind, a: number, b: number, skill: string, retired = false): MarketOrder => ({
  id,
  pace: id.split("-")[0] as Pace,
  kind,
  a,
  b,
  target: targetFor(kind, a, b),
  skill,
  prompt: promptFor(kind, a, b),
  ...(retired ? { retired: true as const } : {}),
});

/** Gentle single amounts (3–9) are counted out one mango at a time. */
export const SINGLE = "num.count-out";
/** Curated bounded orders; each has its own bundled spoken prompt. Ids never change (saved rounds use them). */
export const ORDERS: MarketOrder[] = [
  // Gentle: single amounts, then teens (one crate and some loose), comparisons, and two friends adding small amounts.
  order("easy-pack-0", "pack", 7, 0, SINGLE),
  order("easy-pack-1", "pack", 12, 0, "num.tens-ones"),
  order("easy-pack-2", "pack", 16, 0, "num.tens-ones"),
  order("easy-pack-3", "pack", 20, 0, "num.tens-ones", true),
  order("easy-pack-4", "pack", 14, 0, "num.tens-ones"),
  order("easy-pack-5", "pack", 9, 0, SINGLE),
  order("easy-pack-6", "pack", 3, 0, SINGLE),
  order("easy-pack-7", "pack", 4, 0, SINGLE),
  order("easy-pack-8", "pack", 5, 0, SINGLE),
  order("easy-pack-9", "pack", 6, 0, SINGLE),
  order("easy-pack-10", "pack", 8, 0, SINGLE),
  order("easy-pack-11", "pack", 11, 0, "num.tens-ones"),
  order("easy-pack-12", "pack", 13, 0, "num.tens-ones"),
  order("easy-pack-13", "pack", 15, 0, "num.tens-ones"),
  order("easy-pack-14", "pack", 17, 0, "num.tens-ones"),
  order("easy-pack-15", "pack", 18, 0, "num.tens-ones"),
  order("easy-pack-16", "pack", 19, 0, "num.tens-ones"),
  order("easy-compare-0", "compare", 7, 5, "num.compare"),
  order("easy-compare-1", "compare", 12, 15, "num.compare"),
  order("easy-compare-2", "compare", 16, 14, "num.compare"),
  order("easy-compare-3", "compare", 12, 20, "num.compare"),
  order("easy-compare-4", "compare", 14, 12, "num.compare"),
  order("easy-compare-5", "compare", 9, 12, "num.compare"),
  order("easy-compare-6", "compare", 4, 8, "num.compare"),
  order("easy-compare-7", "compare", 9, 6, "num.compare"),
  order("easy-add-0", "add", 3, 4, "num.add-within-10"),
  order("easy-add-1", "add", 8, 5, "num.add-within-20", true),
  order("easy-add-2", "add", 10, 6, "num.add-within-20", true),
  order("easy-add-3", "add", 7, 7, "num.add-within-20", true),
  order("easy-add-4", "add", 9, 8, "num.add-within-20", true),
  order("easy-add-5", "add", 6, 5, "num.add-within-20", true),
  order("easy-add-6", "add", 2, 3, "num.add-within-10"),
  order("easy-add-7", "add", 4, 2, "num.add-within-10"),
  order("easy-add-8", "add", 5, 3, "num.add-within-10"),
  order("easy-add-9", "add", 4, 4, "num.add-within-10"),
  order("easy-add-10", "add", 6, 3, "num.add-within-10"),
  order("easy-add-11", "add", 5, 4, "num.add-within-10"),
  // Growing: crates and loose mangoes to 100, comparing, and adding tens.
  order("medium-pack-0", "pack", 34, 0, "num.tens-ones"),
  order("medium-pack-1", "pack", 62, 0, "num.tens-ones"),
  order("medium-pack-2", "pack", 47, 0, "num.tens-ones"),
  order("medium-pack-3", "pack", 80, 0, "num.tens-ones"),
  order("medium-pack-4", "pack", 53, 0, "num.tens-ones"),
  order("medium-pack-5", "pack", 96, 0, "num.tens-ones"),
  order("medium-compare-0", "compare", 34, 32, "num.compare"),
  order("medium-compare-1", "compare", 62, 65, "num.compare"),
  order("medium-compare-2", "compare", 47, 45, "num.compare"),
  order("medium-compare-3", "compare", 80, 83, "num.compare"),
  order("medium-compare-4", "compare", 53, 51, "num.compare"),
  order("medium-compare-5", "compare", 96, 99, "num.compare"),
  order("medium-add-0", "add", 20, 15, "num.add-tens"),
  order("medium-add-1", "add", 40, 23, "num.add-tens"),
  order("medium-add-2", "add", 30, 34, "num.add-tens"),
  order("medium-add-3", "add", 50, 17, "num.add-tens"),
  order("medium-add-4", "add", 10, 68, "num.add-tens"),
  order("medium-add-5", "add", 60, 29, "num.add-tens"),
  // Challenge: two-digit adding, taking away and giving change with pretend shell coins.
  order("hard-pack-0", "pack", 46, 0, "num.tens-ones"),
  order("hard-pack-1", "pack", 73, 0, "num.tens-ones"),
  order("hard-pack-2", "pack", 58, 0, "num.tens-ones"),
  order("hard-pack-3", "pack", 91, 0, "num.tens-ones"),
  order("hard-pack-4", "pack", 65, 0, "num.tens-ones"),
  order("hard-pack-5", "pack", 39, 0, "num.tens-ones"),
  order("hard-compare-0", "compare", 46, 44, "num.compare"),
  order("hard-compare-1", "compare", 73, 76, "num.compare"),
  order("hard-compare-2", "compare", 58, 56, "num.compare"),
  order("hard-compare-3", "compare", 91, 94, "num.compare"),
  order("hard-compare-4", "compare", 65, 63, "num.compare"),
  order("hard-compare-5", "compare", 39, 42, "num.compare"),
  order("hard-add-0", "add", 34, 27, "num.add-within-100"),
  order("hard-add-1", "add", 46, 18, "num.add-within-100"),
  order("hard-add-2", "add", 28, 35, "num.add-within-100"),
  order("hard-add-3", "add", 57, 24, "num.add-within-100"),
  order("hard-add-4", "add", 39, 42, "num.add-within-100"),
  order("hard-add-5", "add", 26, 48, "num.add-within-100"),
  order("hard-subtract-0", "subtract", 50, 23, "num.subtract-within-100"),
  order("hard-subtract-1", "subtract", 64, 27, "num.subtract-within-100"),
  order("hard-subtract-2", "subtract", 72, 35, "num.subtract-within-100"),
  order("hard-subtract-3", "subtract", 81, 46, "num.subtract-within-100"),
  order("hard-subtract-4", "subtract", 43, 18, "num.subtract-within-100"),
  order("hard-subtract-5", "subtract", 96, 58, "num.subtract-within-100"),
  order("hard-change-0", "change", 50, 23, "num.make-change"),
  order("hard-change-1", "change", 25, 16, "num.make-change"),
  order("hard-change-2", "change", 50, 32, "num.make-change"),
  order("hard-change-3", "change", 100, 64, "num.make-change"),
  order("hard-change-4", "change", 25, 8, "num.make-change"),
  order("hard-change-5", "change", 50, 19, "num.make-change"),
];

/** An order's step on the round's ramp. Gentle single amounts split into small (3–5) and 6–9. */
export const planStep = (o: MarketOrder) =>
  o.kind === "pack" && o.target < 10 ? (o.target < 6 ? "small" : "single") : o.kind;
/**
 * The shape of each round, easiest first. Gentle starts with a small amount (3–5), then 6–9,
 * then teens (one crate and some loose), a comparison and two friends adding small amounts.
 */
export const ROUND_PLAN: Record<Pace, string[]> = {
  easy: ["small", "single", "pack", "compare", "pack", "add"],
  medium: ["pack", "pack", "compare", "add", "pack", "compare", "add", "add"],
  hard: ["pack", "compare", "add", "subtract", "change", "add", "subtract", "change"],
};
