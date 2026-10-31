import { describe, it, expect } from "vitest";
import { random } from "../src/games/types";
import type { LearnOptions, Pace } from "../src/learn/types";
import {
  engine as reef,
  boardEnd,
  nextStone,
  reefMove,
  reefRound,
  reefNotWon,
  type ReefState,
} from "../src/learn/games/reef-race/engine";
import {
  engine as market,
  marketOrder,
  openOrder,
  packPiece,
  serve,
  nextCustomer,
  chooseOrder,
  marketTurn,
  ORDERS,
  type MarketState,
} from "../src/learn/games/island-market/engine";
import {
  COINS,
  adjustPieces,
  coinTotal,
  emptyPieces,
  pathRows,
  sectionOf,
  sectionRange,
  validPieces,
  winding,
} from "../src/learn/kit/numbers";

const ctx = (seed = 7, starter: 0 | 1 = 1) => ({ rng: random(seed), skills: {}, starter, today: 20000 });
const paces: Pace[] = ["easy", "medium", "hard"];
describe("Reef Race counting-on engine", () => {
  for (const mode of reef.modes)
    for (const pace of paces)
      it(`completes ${mode}/${pace} through each numbered step`, () => {
        const o: LearnOptions = { mode, pace };
        let s = reef.create(o, ctx());
        expect(reef.turn!(s, o)).toBe(1);
        let moves = 0;
        while (reef.outcome(s, o) === null && moves++ < 1200) {
          const r = reefRound(s, o);
          const action = r.phase === "roll" ? "roll" : r.phase === "bonus" ? Math.max(...r.bonus!) : nextStone(r, o);
          const next = reefMove(s, o, action);
          expect(next).not.toBe(s);
          expect(reef.validate(next, o)).toBe(true);
          s = next;
        }
        expect(moves).toBeLessThan(1200);
        expect(reef.outcome(s, o)).not.toBeNull();
        expect(reefMove(s, o, "roll")).toBe(s);
        expect(reef.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
        expect(reefRound(s, o).positions.every((n) => n >= 0 && n <= boardEnd(o))).toBe(true);
      });
  it("names who got there first when the island friend or the tide wins, so the finish card doesn't cheer a loss", () => {
    for (const mode of ["solo", "together", "versus"] as const) {
      const o: LearnOptions = { mode, pace: "easy" };
      const seen = new Set<string>();
      for (let seed = 1; seed <= 40; seed++) {
        let s = reef.create(o, ctx(seed));
        for (let n = 0; reef.outcome(s, o) === null && n < 1200; n++) {
          const r = reefRound(s, o);
          s = reefMove(s, o, r.phase === "roll" ? "roll" : r.phase === "bonus" ? Math.max(...r.bonus!) : nextStone(r, o));
        }
        const winner = reefRound(s, o).winner;
        const line = reefNotWon(s, o);
        if (mode === "versus") expect(line).toBeNull();
        else expect(line === null).toBe(winner === 0);
        if (line) expect(line).toMatch(mode === "together" ? /^The tide won/ : /^Island friend won/);
        seen.add(String(winner));
      }
      expect(seen).toEqual(new Set(["0", "1"]));
    }
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    expect(reefNotWon(reef.create(o, ctx()), o)).toBeNull();
  });
  it("rejects skipped stones and preserves the round after a miss", () => {
    const o: LearnOptions = { mode: "versus", pace: "easy" };
    const s = reefMove(reef.create(o, ctx()), o, "roll");
    expect(reefMove(s, o, 2)).toBe(s);
    expect(reefRound(reefMove(s, o, 1), o).positions[1]).toBe(1);
    expect(reef.validate({ ...s, history: ["roll", 2] }, o)).toBe(false);
  });
  it("counts current steps and uses each current only once per turtle", () => {
    const o: LearnOptions = { mode: "together", pace: "medium" };
    let s: ReefState = {
      ...reef.create(o, ctx()),
      focus: "num.count-on",
      rolls: Array.from({ length: 256 }, () => [4]),
    };
    for (let i = 0; i < 10; i++) {
      const r = reefRound(s, o);
      s = reefMove(s, o, r.phase === "roll" ? "roll" : nextStone(r, o));
    }
    const r = reefRound(s, o);
    expect(r.phase).toBe("current");
    expect(r.positions[0]).toBe(8);
    expect(r.positions[1]).toBe(2);
    expect(reefMove(s, o, 10)).toBe(s);
    s = reefMove(reefMove(s, o, 9), o, 10);
    expect(reefRound(s, o).positions).toEqual([10, 4]);
  });
  it("rejects malformed, oversized or impossible saves", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" },
      s = reef.create(o, ctx());
    for (const bad of [
      { ...s, starter: 2 },
      { ...s, positions: [999, 0] },
      { ...s, rolls: [[4], ...s.rolls.slice(1)] },
      { ...s, rolls: s.rolls.slice(1) },
      { ...s, history: Array(1201).fill("roll") },
      { ...s, history: ["skip"] },
      { ...s, history: [1] },
      { ...s, focus: "num.nope" },
    ])
      expect(reef.validate(bad, o)).toBe(false);
  });
  it("is deterministic and bounds even minimum rolls", () => {
    const o: LearnOptions = { mode: "versus", pace: "hard" };
    expect(reef.create(o, ctx())).toEqual(reef.create(o, ctx()));
    let s = { ...reef.create(o, ctx()), rolls: Array.from({ length: 256 }, () => [1, 1]) };
    for (let n = 0; reef.outcome(s, o) === null && n < 1200; n++) {
      const r = reefRound(s, o);
      s = reefMove(s, o, r.phase === "roll" ? "roll" : r.phase === "bonus" ? "skip" : nextStone(r, o));
    }
    expect(reef.outcome(s, o)).not.toBeNull();
  });
});
describe("Island Market engines and content", () => {
  for (const mode of market.modes)
    for (const pace of paces)
      it(`completes and resumes ${mode}/${pace}`, () => {
        const o: LearnOptions = { mode, pace };
        let s = market.create(o, ctx());
        const allKinds = new Set(ORDERS.filter((q) => q.pace === pace).map((q) => q.kind));
        expect(new Set(s.orders.map((id) => ORDERS.find((q) => q.id === id)!.kind))).toEqual(allKinds);
        expect(s.phase).toBe("pack");
        for (let i = 0; i < s.orders.length; i++) {
          // Together: players take turns serving; whoever starts (seat 1 here) serves first.
          expect(marketTurn(s)).toBe((1 + i) % 2);
          const q = marketOrder(s)!;
          if (q.kind === "compare") s = serve(s, q.target);
          else if (q.kind === "change") {
            let left = q.target;
            for (const coin of [3, 2, 1, 0] as const)
              while (left >= COINS[coin]) {
                s = packPiece(s, o, coin, 1);
                left -= COINS[coin];
              }
            s = serve(s);
          } else {
            for (let t = 0; t < Math.floor(q.target / 10); t++) s = packPiece(s, o, "tens", 1);
            for (let u = 0; u < q.target % 10; u++) s = packPiece(s, o, "ones", 1);
            expect(market.validate(s, o)).toBe(true);
            s = serve(s);
          }
          expect(s.phase).toBe("served");
          expect(market.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
          s = nextCustomer(s);
          expect(market.validate(s, o)).toBe(true);
        }
        expect(market.outcome(s, o)).toBe("done");
        expect(nextCustomer(s)).toBe(s);
      });
  it("keeps errors reversible and packs ten loose mangoes into a crate", () => {
    const o: LearnOptions = { mode: "together", pace: "easy" };
    let s = market.create(o, ctx());
    expect(serve(s)).toBe(s);
    s = packPiece(s, o, "tens", 1);
    expect(packPiece(s, o, "tens", -1).pieces).toEqual(emptyPieces());
    // Put the teen order first: counting up past ten packs a crate.
    s = { ...s, pieces: emptyPieces(), orders: [s.orders[2], s.orders[0], s.orders[1], ...s.orders.slice(3)] };
    const teen = marketOrder(s)!.target;
    expect(teen).toBeGreaterThan(10);
    for (let i = 0; i < 10; i++) s = packPiece(s, o, "ones", 1);
    expect(s.pieces).toEqual({ tens: 1, ones: 0, coins: [0, 0, 0, 0] });
    expect(market.validate(s, o)).toBe(true);
    expect(packPiece(s, o, "ones", -1)).toBe(s);
    // Past the order, the tenth loose mango stays loose so one can be taken back.
    for (let i = 0; i < 10; i++) s = packPiece(s, o, "ones", 1);
    expect(s.pieces.tens).toBe(1);
    expect(s.pieces.ones).toBe(10);
    expect(packPiece(s, o, "ones", -1).pieces.ones).toBe(9);
  });
  it("starts Gentle small and ramps: 3–5, then 6–9, then teens; never a retired order", () => {
    for (let seed = 1; seed < 60; seed++)
      for (const pace of paces) {
        const o: LearnOptions = { mode: "solo", pace };
        const s = market.create(o, ctx(seed));
        expect(market.validate(s, o)).toBe(true);
        const qs = s.orders.map((id) => ORDERS.find((q) => q.id === id)!);
        expect(qs.some((q) => q.retired)).toBe(false);
        if (pace === "easy") {
          expect(qs.map((q) => q.kind)).toEqual(["pack", "pack", "pack", "compare", "pack", "add"]);
          expect(qs[0].target).toBeGreaterThanOrEqual(3);
          expect(qs[0].target).toBeLessThanOrEqual(5);
          expect(qs[1].target).toBeGreaterThanOrEqual(6);
          expect(qs[1].target).toBeLessThanOrEqual(9);
          expect(qs[2].target).toBeGreaterThan(10);
          expect(qs[2].target).toBeLessThan(20);
          expect(qs[4].target).toBeGreaterThanOrEqual(qs[2].target);
          expect(qs[5].target).toBeLessThanOrEqual(10);
        }
      }
  });
  it("still loads and finishes rounds saved before the redesign", () => {
    // An old Gentle round: retired two-friend orders and waiting behind the old "order" step.
    const o: LearnOptions = { mode: "together", pace: "easy" };
    let s: MarketState = {
      version: 1,
      starter: 0,
      orders: ["easy-add-1", "easy-pack-0", "easy-compare-1", "easy-pack-3", "easy-add-4", "easy-pack-2"],
      index: 0,
      phase: "order",
      pieces: emptyPieces(),
      served: [],
    };
    expect(market.validate(s, o)).toBe(true);
    expect(chooseOrder(s).orders[0]).toBe("easy-pack-0");
    expect(market.validate(openOrder(s), o)).toBe(true);
    for (let i = 0; i < 6; i++) {
      const q = marketOrder(s)!;
      if (q.kind === "compare") s = serve(s, q.target);
      else {
        for (let t = 0; t < Math.floor(q.target / 10); t++) s = packPiece(s, o, "tens", 1);
        for (let u = 0; u < q.target % 10; u++) s = packPiece(s, o, "ones", 1);
        s = serve(s);
      }
      expect(s.phase).toBe("served");
      expect(market.validate(s, o)).toBe(true);
      s = nextCustomer(s);
      expect(market.validate(s, o)).toBe(true);
    }
    expect(market.outcome(s, o)).toBe("done");
    // Old loose-mango counts above nine are still valid saves.
    expect(market.validate({ ...s, index: 1, phase: "pack", served: [13], pieces: { tens: 0, ones: 12, coins: [0, 0, 0, 0] } }, o)).toBe(true);
  });
  it("rejects forged quantities, completed answers, phases and coin counts", () => {
    const o: LearnOptions = { mode: "solo", pace: "hard" },
      s = market.create(o, ctx());
    for (const bad of [
      { ...s, index: 99 },
      { ...s, phase: "done" },
      { ...s, orders: Array(8).fill(s.orders[0]) },
      { ...s, served: [999] },
      { ...s, pieces: { tens: 0, ones: 101, coins: [0, 0, 0, 0] } },
      { ...s, pieces: { tens: 0, ones: 0, coins: [-1, 0, 0, 0] } },
      { ...s, pieces: { tens: 0, ones: 0, coins: [0, 0, 0, 5] } },
      {
        ...s,
        orders: ORDERS.filter((q) => q.pace === "easy")
          .slice(0, 8)
          .map((q) => q.id),
      },
      { ...s, extra: true },
    ])
      expect(market.validate(bad, o)).toBe(false);
  });
  it("keeps all curated numbers in pace and arithmetic bounds", () => {
    expect(ORDERS.length).toBeGreaterThanOrEqual(66);
    expect(new Set(ORDERS.map((q) => q.id)).size).toBe(ORDERS.length);
    for (const q of ORDERS) {
      expect(q.target).toBeGreaterThan(0);
      expect(q.target).toBeLessThanOrEqual(q.pace === "easy" ? 20 : 100);
      if (q.kind === "add") expect(q.target).toBe(q.a + q.b);
      if (q.kind === "subtract" || q.kind === "change") expect(q.target).toBe(q.a - q.b);
      if (q.kind === "compare") expect(q.target).toBe(Math.max(q.a, q.b));
    }
  });
});
describe("reef board layout", () => {
  it("splits long paths into sections that cover every stone in order", () => {
    for (const end of [30, 60, 100]) {
      const seen = new Set<number>();
      for (let n = 0; n <= end; n++) {
        const [a, b] = sectionRange(sectionOf(n, end), end);
        expect(n).toBeGreaterThanOrEqual(a);
        expect(n).toBeLessThanOrEqual(b);
        if (n > 0) expect(n).toBeGreaterThan(a);
        seen.add(n);
      }
      expect(seen.size).toBe(end + 1);
      expect(sectionRange(sectionOf(end, end), end)[1]).toBe(end);
    }
    expect(sectionRange(0, 30)).toEqual([0, 30]);
  });
  it("lays out big, separate stones inside the board at phone and tablet sizes", () => {
    for (const [w, h, count] of [
      [334, 450, 31],
      [319, 290, 31],
      [334, 420, 26],
      [712, 440, 31],
      [900, 400, 26],
    ]) {
      const { points, r, d } = winding(w, h, count);
      expect(points).toHaveLength(count);
      expect(r).toBeGreaterThanOrEqual(19);
      expect(r).toBeLessThanOrEqual(30);
      expect(d.startsWith("M")).toBe(true);
      for (const p of points) {
        expect(p.x - r).toBeGreaterThanOrEqual(0);
        expect(p.x + r).toBeLessThanOrEqual(w);
        expect(p.y - r).toBeGreaterThanOrEqual(0);
        expect(p.y + r).toBeLessThanOrEqual(h);
      }
      for (let i = 0; i < points.length; i++)
        for (let j = i + 1; j < points.length; j++)
          expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThanOrEqual(2 * r);
      // Starts at the bottom (the dock) and ends higher up (the island).
      expect(points[0].y).toBeGreaterThan(points[count - 1].y);
    }
  });
  it("keeps old saved races valid, including a sailed-past shell", () => {
    const o: LearnOptions = { mode: "solo", pace: "easy" };
    let s: ReefState = { ...reef.create(o, ctx()), focus: "num.count-on", rolls: Array.from({ length: 256 }, () => [1]) };
    for (let i = 0; i < 40 && reefRound(s, o).phase !== "bonus"; i++) {
      const r = reefRound(s, o);
      s = reefMove(s, o, r.phase === "roll" ? "roll" : nextStone(r, o));
    }
    expect(reefRound(s, o).phase).toBe("bonus");
    s = reefMove(s, o, "skip");
    expect(reef.validate(JSON.parse(JSON.stringify(s)), o)).toBe(true);
  });
});
describe("pure number manipulatives", () => {
  it("draws every path number once in connected serpentine order", () => {
    const rows = pathRows(1, 20, 5);
    expect(rows[1]).toEqual([10, 9, 8, 7, 6]);
    expect(rows.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
  it("uses bounded, reversible pieces and simple shell denominations", () => {
    expect(coinTotal([2, 1, 1, 1])).toBe(42);
    expect(validPieces({ tens: 1, ones: 12, coins: [0, 0, 0, 0] }, 20, false)).toBe(false);
    expect(adjustPieces(emptyPieces(), "ones", -1, 20, false)).toEqual(emptyPieces());
    expect(adjustPieces(emptyPieces(), 3, 1, 100, true).coins).toEqual([0, 0, 0, 1]);
    expect(validPieces({ tens: 0, ones: 0, coins: [0, 0, 0, 4] }, 100, true)).toBe(true);
  });
});
