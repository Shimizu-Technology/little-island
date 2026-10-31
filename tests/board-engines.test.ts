import { describe, expect, it } from "vitest";
import * as coconut from "../src/board/coconut-drop/engine";
import * as nets from "../src/board/fishing-nets/engine";
import * as canoes from "../src/board/hidden-canoes/engine";
import * as pits from "../src/board/shell-pits/engine";
import * as reef from "../src/board/reef-sweep/engine";
import { boardIds, catalog, engines, Position, strengths } from "../src/board";
import { other } from "../src/games/match";
const apply = (engine: typeof coconut, moves: number[]) => moves.reduce(engine.move, engine.create(12));
describe("Coconut Drop", () => {
  it("drops under gravity, rejects full columns and finishes across/up/diagonally", () => {
    for (const moves of [
      [0, 6, 1, 6, 2, 5, 3],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3],
    ]) {
      const s = apply(coconut, moves);
      expect(s.outcome).toBe(0);
      expect(coconut.validate(s)).toBe(true);
      expect(coconut.move(s, 4)).toBe(s);
    }
    const s = apply(coconut, [2, 2, 2, 2, 2, 2]);
    expect(coconut.move(s, 2)).toBe(s);
    expect(s.board.filter((v) => v >= 0)).toHaveLength(6);
  });
  it("plans a win and a block at both planning strengths", () => {
    for (const strength of ["growing", "challenge"] as const) {
      expect(coconut.choose(apply(coconut, [0, 6, 1, 6, 2, 5]), strength)).toBe(3);
      expect(coconut.choose(apply(coconut, [0, 6, 1, 6, 2]), strength)).toBe(3);
    }
  });
});
describe("Fishing Nets", () => {
  it("closes boxes, keeps a scoring turn and can close two at once", () => {
    let s = nets.create(12);
    for (const e of [0, 3, 12]) s = nets.move(s, e);
    expect(nets.scoring(s)).toContain(13);
    const seat = s.turn;
    s = nets.move(s, 13);
    expect(s.scores[seat]).toBe(1);
    expect(s.turn).toBe(seat);
    expect(nets.validate(s)).toBe(true);
    s = nets.create();
    for (const e of [0, 1, 3, 4, 12, 14]) s = nets.move(s, e);
    const next = nets.move(s, 13);
    expect(next.scores[s.turn] - s.scores[s.turn]).toBe(2);
  });
  it("avoids third sides and measures complete chains", () => {
    let s = nets.create();
    for (const e of [0, 3]) s = nets.move(s, e);
    expect(nets.safe(s)).not.toContain(12);
    expect(nets.safe(s)).toContain(nets.choose(s, "growing"));
    expect(nets.giveaway(s, 12)).toBeGreaterThanOrEqual(1);
  });
  it("dot pairs round-trip every horizontal and vertical edge", () => {
    for (const n of [3, 4, 5])
      for (let e = 0; e < nets.edgeCount(n); e++) {
        const [a, b] = nets.edgeDots(n, e);
        expect(nets.edgeFromDots(n, a, b)).toBe(e);
        expect(nets.edgeFromDots(n, b, a)).toBe(e);
      }
    expect(nets.edgeFromDots(3, 0, 5)).toBe(null);
  });
});
describe("Hidden Canoes", () => {
  it("generates three straight nonoverlapping canoes per player deterministically", () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = canoes.create(seed);
      expect(canoes.create(seed)).toEqual(s);
      for (const seat of [0, 1])
        for (const [id, length] of canoes.fleet.entries()) {
          const cells = s.board.slice(seat * 36, (seat + 1) * 36).flatMap((v, i) => (v === id + 1 ? [i] : []));
          expect(cells).toHaveLength(length);
          const delta = cells[1] - cells[0];
          expect([1, 6]).toContain(delta);
          expect(cells.every((v, i) => i === 0 || v - cells[i - 1] === delta)).toBe(true);
        }
    }
    expect(canoes.coordinate(14)).toBe("C3");
  });
  it("alternates after a find, rejects repeated searches and stops after seven finds", () => {
    let s = canoes.create(1);
    const find = s.board.slice(36).findIndex((v) => v > 0);
    const first = canoes.move(s, find);
    expect(first.turn).toBe(1);
    expect(first.scores[0]).toBe(1);
    s = canoes.move(first, 0);
    expect(canoes.move(s, find)).toBe(s);
    while (s.outcome === null) {
      const target = canoes.legal(s).find((i) => s.board[other(s.turn) * 36 + i] > 0)!;
      s = canoes.move(s, target);
    }
    expect(s.scores).toContain(7);
    expect(canoes.validate(s)).toBe(true);
    expect(canoes.legal(s)).toEqual([]);
  });
  it("AI cannot see the private charts and Challenge follows aligned finds", () => {
    const s = canoes.create(9);
    s.marks[7] = 2;
    s.marks[8] = 2;
    const changed = { ...s, board: [...s.board].reverse() };
    for (const level of strengths) expect(canoes.choose(s, level)).toBe(canoes.choose(changed, level));
    expect([6, 9]).toContain(canoes.choose(s, "challenge"));
  });
});
describe("Shell Pits (Kalah)", () => {
  it("sows counterclockwise, skips the other store, and repeats on own store", () => {
    const s = pits.create();
    expect(pits.sowPath(s, 2)).toEqual([3, 4, 5, 6]);
    const next = pits.move(s, 2);
    expect(next.turn).toBe(0);
    expect(next.board[6]).toBe(1);
    const long = { ...s, board: [...s.board] };
    long.board[5] = 15;
    expect(pits.sowPath(long, 5)).not.toContain(13);
    expect(pits.sowPath(long, 5)).toHaveLength(15);
  });
  it("captures only when the final own pit was empty and the opposite pit has shells", () => {
    const s = pits.create();
    s.board = [1, 0, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
    const next = pits.move(s, 0);
    expect(next.board[6]).toBe(5);
    expect(next.board[1]).toBe(0);
    expect(next.board[11]).toBe(0);
  });
  it("sweeps both sides at the end and conserves 48 shells during complete games", () => {
    const s = pits.create();
    s.board = [0, 0, 0, 0, 0, 1, 20, 1, 2, 3, 4, 5, 6, 6];
    const next = pits.move(s, 5);
    expect(next.board[6]).toBe(21);
    expect(next.board[13]).toBe(27);
    expect(next.outcome).toBe(1);
    expect(next.board.reduce((a, b) => a + b, 0)).toBe(48);
    for (let seed = 0; seed < 5; seed++) {
      let p = pits.create(seed);
      for (let turn = 0; turn < 300 && p.outcome === null; turn++) {
        p = pits.move(p, pits.choose(p, "gentle")!);
        expect(p.board.reduce((a, b) => a + b, 0)).toBe(48);
      }
      expect(p.outcome).not.toBe(null);
      expect(pits.validate(p)).toBe(true);
    }
  });
});
describe("Reef Sweep", () => {
  it("guarantees a safe first opening and neighborhood at every size, even after flagging", () => {
    for (const size of [5, 6, 7])
      for (let seed = 0; seed < 20; seed++)
        for (const first of [0, Math.floor((size * size) / 2), size * size - 1]) {
          let s = reef.create(seed, size);
          s = reef.move(s, size * size + 1);
          s = reef.move(s, first);
          expect(s.board[first]).toBe(0);
          expect(reef.neighbors(size, first).every((i) => s.board[i] >= 0)).toBe(true);
          expect(s.board.filter((v) => v === -1)).toHaveLength(reef.urchins(size));
          expect(reef.validate(s)).toBe(true);
        }
  });
  it("wins on every pearl, loses on an urchin, and flags do not falsely win", () => {
    const opened = reef.move(reef.create(1), 12),
      mine = opened.board.findIndex((v) => v === -1);
    expect(reef.move(opened, mine).outcome).toBe(1);
    let s = opened;
    for (let i = 0; i < s.board.length; i++) if (s.board[i] >= 0 && s.marks[i] !== 1) s = reef.move(s, i);
    expect(s.outcome).toBe(0);
    expect(reef.validate(s)).toBe(true);
    let flags = reef.create();
    for (let i = 0; i < 25; i++) flags = reef.move(flags, 25 + i);
    expect(flags.outcome).toBe(null);
  });
  it("hints only use visible counts and never reveal hidden mine locations", () => {
    const s = reef.move(reef.create(12), 12),
      next = reef.choose(s, "challenge");
    const changed = { ...s, board: s.board.map((v, i) => (s.marks[i] === 1 ? v : 99)) };
    expect(reef.choose(changed, "challenge")).toBe(next);
    if (next !== null && next < 25) expect(s.board[next]).not.toBe(-1);
  });
});
describe("all board engines", () => {
  for (const game of boardIds)
    for (const size of catalog[game].sizes)
      for (const level of game === "reef-sweep" ? ["gentle"] : strengths)
        it(`${game} ${size} ${level}: complete deterministic legal game and validate every turn`, () => {
          const engine = engines[game];
          let s = engine.create(123, size);
          let turns = 0;
          while (s.outcome === null && turns++ < 300) {
            let choice = engine.choose(s, level as (typeof strengths)[number]);
            if (choice === null) choice = engine.legal(s)[0];
            expect(engine.legal(s)).toContain(choice);
            const next = engine.move(s, choice);
            expect(next).not.toBe(s);
            s = next;
            expect(engine.validate(s)).toBe(true);
          }
          expect(s.outcome).not.toBe(null);
          expect(engine.choose(s, "challenge")).toBe(null);
          expect(engine.create(123, size)).toEqual(engine.create(123, size));
          const malformed: Position = { ...s, turn: other(s.turn) };
          expect(engine.validate(malformed)).toBe(false);
          expect(engine.validate({ ...s, board: s.board.slice(1) })).toBe(false);
          expect(engine.validate({ ...s, moves: [...s.moves, 1000] })).toBe(false);
          expect(engine.validate({ ...s, secret: "extra" })).toBe(false);
        });
});

describe("bounded saves and pure transitions", () => {
  it("keeps Reef Sweep completable after the flag-change budget is exhausted", () => {
    let s = reef.create(1);
    for (let i = 0; i < 400; i++) s = reef.move(s, 25);
    expect(s.moves).toHaveLength(400);
    expect(reef.legal(s)).not.toContain(25);
    expect(reef.legal(s)).toContain(0);
    s = reef.move(s, 0);
    for (let i = 0; i < 25; i++) if (s.board[i] >= 0 && s.marks[i] !== 1) s = reef.move(s, i);
    expect(s.outcome).toBe(0);
    expect(reef.validate(s)).toBe(true);
  });
  it("never mutates an input position while applying a legal move", () => {
    for (const game of boardIds) {
      const e = engines[game],
        before = e.create(19),
        encoded = JSON.stringify(before);
      const next = e.move(before, e.legal(before)[0]);
      expect(next).not.toBe(before);
      expect(JSON.stringify(before)).toBe(encoded);
    }
  });
});

describe("Reef first-opening hints", () => {
  it("never suggests opening a flagged tile, including a completely flagged reef", () => {
    let s = reef.move(reef.create(1), 25 + 12);
    const hint = reef.choose(s, "challenge");
    expect(hint).not.toBe(12);
    expect(reef.legal(s)).toContain(hint);
    for (let i = 0; i < 25; i++) if (s.marks[i] !== 2) s = reef.move(s, 25 + i);
    expect(reef.choose(s, "challenge")).toBe(null);
  });
});
