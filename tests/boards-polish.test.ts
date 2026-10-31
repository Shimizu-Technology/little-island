import { describe, expect, it } from "vitest";
import { WORDS, createWord, customWord, wordPool, wordTiles } from "../src/games/words";
import { defaultOptions } from "../src/games/types";
import {
  createTic,
  ticMove,
  ticTurn,
  ticUndo,
  ticChoice,
  ticOutcome,
  ticResult,
  replayTic,
} from "../src/games/tic";
import {
  createMemory,
  flipCard,
  closeMismatch,
  memoryResult,
  replayMemory,
  memoryUndo,
} from "../src/games/memory";
import {
  createCheckers,
  checkersMove,
  checkersMoves,
  checkersUndo,
  checkersResultSeat,
  replayCheckers,
  position,
} from "../src/games/checkers";
import { newMatch, settle } from "../src/games/match";
import { emptySave, parseSave, validSession } from "../src/state/validation";
const options = { ...defaultOptions, mode: "together" as const };
describe("word length levels and fitting", () => {
  it("has at least thirty big words and preserves earlier short rounds at any level", () => {
    expect(WORDS.filter((w) => w[0].length >= 6 && w[0].length <= 8).length).toBeGreaterThanOrEqual(30);
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const earlier = {
        ...createWord({ ...defaultOptions, difficulty }, "Home"),
        word: "BOOK",
        clue: "Pages with a story inside.",
        category: "Home",
        seen: ["BOOK"],
      };
      expect(validSession(earlier)).toBe(true);
      expect(
        parseSave(JSON.stringify({ ...emptySave(), sessions: { "word-rescue": earlier } })).sessions[
          "word-rescue"
        ]
      ).toEqual(earlier);
    }
  });
  it.each(["easy", "medium", "hard"] as const)(
    "uses the %s range in every pack, falling back only when unavailable",
    (difficulty) => {
      for (const pack of ["All", ...new Set(WORDS.map((w) => w[1]))]) {
        const pool = wordPool(difficulty, pack);
        expect(pool.length).toBeGreaterThan(0);
        if (difficulty === "hard") {
          expect(pool.length).toBeGreaterThanOrEqual(3);
          expect(pool.every((w) => w[0].length >= 6)).toBe(true);
        }
        if (difficulty === "easy") expect(pool.every((w) => w[0].length >= 3 && w[0].length <= 4)).toBe(true);
        if (difficulty === "medium") expect(pool.every((w) => w[0].length === 5)).toBe(true);
        expect(validSession(createWord({ ...defaultOptions, difficulty }, pack))).toBe(true);
      }
      expect(createWord({ ...defaultOptions, difficulty }, "Earlier unknown pack").word).toBeTruthy();
    }
  );
  // 319 and 334 are the real board widths on 375- and 390-point phones (page and panel padding removed).
  it.each([319, 334, 343, 358])("fits eleven and twelve letters on one row in %s points", (width) => {
    for (const length of [11, 12]) {
      const { tile, gap, sizes } = wordTiles(length, width);
      expect(sizes).toEqual([length]);
      expect(tile).toBeGreaterThanOrEqual(22);
      expect(tile * length + gap * (length - 1)).toBeLessThanOrEqual(width + 0.001);
    }
    expect(wordTiles(12, width, 2).sizes).toEqual([6, 6]);
  });
  it("bounds a family clue and preserves default and legacy custom words", () => {
    expect(customWord(defaultOptions, "BUTTERFLIES", " A flying insect. ")?.clue).toBe("A flying insect.");
    expect(customWord(defaultOptions, "STRAWBERRIES", "x".repeat(100))?.clue.length).toBe(80);
    expect(customWord(defaultOptions, "CAT")?.clue).toBe("Someone picked this word just for you.");
    expect(validSession(customWord(defaultOptions, "BUTTERFLIES"))).toBe(true);
  });
});
describe("O-first tic and reversible family tally", () => {
  it("validates each O-first move, undo, reload and carried score", () => {
    let s = {
      ...createTic(options),
      first: "O" as const,
      match: newMatch(["Ada", "Bo"]),
      starter: 1 as const,
      xSeat: 0 as const,
    };
    for (const index of [0, 3, 1, 4, 2]) {
      s = ticMove(s, index) as typeof s;
      expect(validSession(s)).toBe(true);
    }
    expect(ticOutcome(s.board)).toBe("O");
    expect(ticResult(s)).toBe(1);
    expect(settle(s.match, ticResult(s)).wins).toEqual([0, 1]);
    const undone = ticUndo(s);
    expect(validSession(undone)).toBe(true);
    expect(ticResult(undone)).toBeNull();
    expect(undone.match?.wins).toEqual([0, 0]);
    const loaded = parseSave(JSON.stringify({ ...emptySave(), sessions: { "tic-tac-toe": s } })).sessions[
      "tic-tac-toe"
    ];
    expect(loaded).toEqual(s);
    const next = replayTic(s);
    expect(next.match?.wins).toEqual([0, 1]);
    expect(next.starter).toBe(0);
    expect(next.first).toBe("X");
    expect(validSession(next)).toBe(true);
  });
  it("keeps legacy X-first saves valid and rejects false first/count/history", () => {
    let s = createTic(options);
    for (const index of [0, 3, 1]) s = ticMove(s, index);
    expect(s.first).toBeUndefined();
    expect(validSession(s)).toBe(true);
    expect(validSession({ ...s, first: "O" })).toBe(false);
    expect(validSession({ ...s, first: "A" })).toBe(false);
    expect(validSession({ ...s, xSeat: 2 })).toBe(false);
    expect(validSession({ ...s, match: { ...newMatch(), wins: [-1, 0] } })).toBe(false);
  });
  it("uses O-first turn order in perfect hints and complete solo decision undo", () => {
    let s = {
      ...createTic({ ...defaultOptions, difficulty: "hard" as const }),
      human: "O" as const,
      first: "O" as const,
    };
    for (const index of [0, 3, 1, 4]) s = ticMove(s, index) as typeof s;
    expect(ticTurn(s.board, s.first)).toBe("O");
    expect(ticChoice(s, () => 0.5, true)).toBe(2);
    expect(ticUndo(s).board.filter(Boolean)).toHaveLength(2);
    s = ticMove(s, ticChoice(s)!) as typeof s;
    expect(ticOutcome(s.board)).toBe("O");
    expect(validSession(s)).toBe(true);
  });
  it("keeps a legacy computer-first solo O assigned to the child and alternates its rematch", () => {
    let s = createTic({ ...defaultOptions, computerFirst: true });
    for (const index of [3, 0, 4, 1, 6, 2]) s = ticMove(s, index);
    expect(ticOutcome(s.board)).toBe("O");
    expect(ticResult(s)).toBe(0);
    expect(validSession(s)).toBe(true);
    expect(replayTic(s)).toMatchObject({
      human: "O",
      first: "O",
      starter: 0,
      xSeat: 1,
      match: { wins: [1, 0] },
    });
  });
  it("O-first computer response blocks X's line and alternation can stay off", () => {
    let s = {
      ...createTic({ ...defaultOptions, difficulty: "hard" as const }),
      human: "X" as const,
      first: "O" as const,
      match: newMatch(["You", "Island friend"], false),
      starter: 1 as const,
      xSeat: 0 as const,
    };
    for (const index of [0, 3, 8, 4]) s = ticMove(s, index) as typeof s;
    expect(ticChoice(s, () => 0.5, true)).toBe(5);
    expect(ticUndo(s).board.filter(Boolean)).toHaveLength(3);
    expect(replayTic(s).starter).toBe(1);
  });
});
describe("Memory and Checkers family matches", () => {
  it("keeps solo Memory on the same seat and the child's Checkers pieces red on rematch", () => {
    const memory = replayMemory(createMemory(defaultOptions));
    expect(memory.player).toBe(0);
    expect(memory.starter).toBe(0);
    const board = Array(64).fill(0);
    board[17] = 1;
    board[26] = -1;
    let s = { ...createCheckers(defaultOptions), position: position(board) };
    s = checkersMove(s, checkersMoves(s.position)[0]);
    expect(checkersResultSeat(s)).toBe(0);
    const next = replayCheckers(s);
    expect(next.starter).toBe(0);
    expect(next.position.turn).toBe(1);
    expect(next.match?.wins).toEqual([1, 0]);
    expect(validSession(next)).toBe(true);
  });
  it("starts Memory with the chosen seat, switches on mismatch, credits matches and carries a draw", () => {
    let s = { ...createMemory(options, 1), match: newMatch(["Ada", "Bo"]) };
    expect(s.player).toBe(1);
    expect(validSession(s)).toBe(true);
    const other = s.cards.findIndex((c) => c !== s.cards[0]);
    s = flipCard(flipCard(s, 0), other) as typeof s;
    expect(s.player).toBe(1);
    s = closeMismatch(s) as typeof s;
    expect(s.player).toBe(0);
    const mate = s.cards.findIndex((c, i) => i > 0 && c === s.cards[0]);
    s = flipCard(flipCard(s, 0), mate) as typeof s;
    expect(s.scores).toEqual([1, 0]);
    expect(s.player).toBe(0);
    expect(memoryResult(s)).toBeNull();
    const done = { ...s, matched: s.cards.map((_, i) => i), scores: [3, 3] as [number, number], turns: 6 };
    expect(validSession(done)).toBe(true);
    expect(memoryResult(done)).toBe("draw");
    expect(replayMemory(done)).toMatchObject({ player: 0, starter: 0, match: { draws: 1 } });
    expect(done.match.wins).toEqual([0, 0]);
    const undone = memoryUndo(s);
    expect(undone.scores).toEqual([0, 0]);
    expect(undone.player).toBe(0);
    expect(validSession(undone)).toBe(true);
    const lastPairStart = {
      ...createMemory(options),
      match: newMatch(),
      matched: s.cards.map((_, i) => i).filter((i) => ![0, mate].includes(i)),
      cards: s.cards,
      scores: [5, 0] as [number, number],
      turns: 5,
    };
    const finished = flipCard(flipCard(lastPairStart, 0), mate);
    expect(memoryResult(finished)).toBe(0);
    const back = memoryUndo(finished);
    expect(memoryResult(back)).toBeNull();
    expect(settle(back.match!, memoryResult(back)).wins).toEqual([0, 0]);
    expect(validSession(back)).toBe(true);
  });
  it("keeps legacy Memory sessions valid, and carries a win once", () => {
    const { starter: _, ...old } = createMemory(options);
    expect(validSession(old)).toBe(true);
    const done = {
      ...old,
      matched: old.cards.map((_, i) => i),
      scores: [4, 2] as [number, number],
      turns: 6,
    };
    const next = replayMemory(done);
    expect(next.match?.wins).toEqual([1, 0]);
    expect(memoryResult(next)).toBeNull();
    expect(validSession(next)).toBe(true);
  });
  it("swaps family colours on Checkers rematch, retains Red first, and undo removes the live result", () => {
    const board = Array(64).fill(0);
    board[17] = 1;
    board[26] = -1;
    let s = {
      ...createCheckers(options),
      match: newMatch(["Ada", "Bo"]),
      starter: 1 as const,
      position: position(board),
    };
    expect(validSession(s)).toBe(true);
    s = checkersMove(s, checkersMoves(s.position)[0]) as typeof s;
    expect(s.position.outcome).toBe("red");
    expect(checkersResultSeat(s)).toBe(1);
    expect(validSession(s)).toBe(true);
    const undo = checkersUndo(s);
    expect(checkersResultSeat(undo)).toBeNull();
    expect(undo.match?.wins).toEqual([0, 0]);
    expect(validSession(undo)).toBe(true);
    const next = replayCheckers(s);
    expect(next.starter).toBe(0);
    expect(next.position.turn).toBe(1);
    expect(next.match?.wins).toEqual([0, 1]);
    expect(validSession(next)).toBe(true);
    expect(validSession(createCheckers(options))).toBe(true);
    expect(replayCheckers({ ...s, match: newMatch(["Ada", "Bo"], false) }).starter).toBe(1);
    expect(validSession({ ...s, starter: 2 })).toBe(false);
    expect(validSession({ ...createMemory(options), starter: -1 })).toBe(false);
    expect(validSession({ ...createMemory(options), history: [{ game: "checkers" }] })).toBe(false);
  });
});
