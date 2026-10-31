import { describe, it, expect } from "vitest";
import { defaultOptions, random } from "../src/games/types";
import { createGame, gameIds } from "../src/games";
import { createTic, ticChoice, ticMove, ticOutcome, ticUndo } from "../src/games/tic";
import { WORDS, createWord, customWord, guessLetter, wordDone, wordHint } from "../src/games/words";
import { createMemory, flipCard, closeMismatch, memoryDone } from "../src/games/memory";
import { createMaze, mazeMove, mazeRoute, mazeDone } from "../src/games/maze";
import {
  createNumbers,
  rollNumbers,
  numberChoices,
  selectNumber,
  closeNumbers,
  undoNumbers,
  numbersStatus,
} from "../src/games/numbers";
import { emptySave, parseSave, validSession } from "../src/state/validation";
const opts = defaultOptions;
describe("Tic-tac-toe", () => {
  it("rejects occupied/out-of-board squares and freezes a completed round", () => {
    let s = createTic(opts);
    for (const i of [0, 3, 1, 4, 2]) s = ticMove(s, i);
    expect(ticOutcome(s.board)).toBe("X");
    expect(ticMove(s, 5)).toBe(s);
    expect(ticMove(createTic(opts), 12).board.every((x) => x === null)).toBe(true);
  });
  it("recognizes a draw", () => {
    let s = createTic(opts);
    for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8]) s = ticMove(s, i);
    expect(ticOutcome(s.board)).toBe("draw");
  });
  it("hard opponent takes an immediate win and blocks an immediate threat", () => {
    let s = createTic({ ...opts, difficulty: "hard" });
    for (const i of [0, 3, 1]) s = ticMove(s, i);
    expect(ticChoice(s)).toBe(2);
    s = { ...s, board: ["X", "O", "X", null, "O", null, "X", null, null] };
    expect(ticChoice(s)).toBe(7);
  });
  it("undo returns a full solo decision including the reply", () => {
    const s = ticMove(ticMove(createTic(opts), 0), 4);
    expect(ticUndo(s).board.every((x) => x === null)).toBe(true);
  });
  it("unbeatable opponent never loses to any legal human sequence", () => {
    function explore(s: ReturnType<typeof createTic>) {
      const result = ticOutcome(s.board);
      expect(result).not.toBe("X");
      if (result) return;
      if (s.board.filter(Boolean).length % 2 === 1) {
        explore(ticMove(s, ticChoice(s, () => 0.5, true)!));
        return;
      }
      for (let i = 0; i < 9; i++) if (!s.board[i]) explore(ticMove(s, i));
    }
    explore(createTic({ ...opts, difficulty: "hard" }));
  });
});
describe("Word Rescue", () => {
  it("has unique curated words and no unreachable letters", () => {
    expect(new Set(WORDS.map((w) => w[0])).size).toBe(WORDS.length);
    expect(WORDS.every((w) => /^[A-Z]{2,12}$/.test(w[0]) && w[2].length > 10)).toBe(true);
  });
  it("gives unlimited attempts and free hints until solved", () => {
    let s = customWord({ ...opts, wordRules: "practice" }, "mama")!;
    s = guessLetter(s, "Z");
    expect(s.guessed).toEqual(["Z"]);
    expect(guessLetter(s, "Z")).toBe(s);
    s = wordHint(s);
    expect(s.guessed).toContain("M");
    s = wordHint(s);
    expect(wordDone(s)).toBe(true);
    expect(guessLetter(s, "B")).toBe(s);
  });
  it("rejects unsupported or multiword secrets", () => {
    for (const word of ["a", "hello world", "<script>", "abc123", "å"]) expect(customWord(opts, word)).toBeNull();
  });
  it("filters pack and difficulty and avoids recent words", () => {
    const s = createWord(opts, "Animals");
    expect(s.category).toBe("Animals");
    expect(s.word.length).toBeLessThanOrEqual(4);
    const next = createWord(opts, "Animals", [s.word]);
    expect(next.word).not.toBe(s.word);
  });
});
describe("Memory", () => {
  it("creates exactly two of every picture at each difficulty", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const s = createMemory({ ...opts, difficulty });
      for (const c of s.cards) expect(s.cards.filter((x) => x === c)).toHaveLength(2);
    }
  });
  it("locks a mismatch until the player decides to turn it over", () => {
    let s = createMemory({ ...opts, mode: "together" });
    const other = s.cards.findIndex((c) => c !== s.cards[0]);
    s = flipCard(flipCard(s, 0), other);
    expect(s.open).toHaveLength(2);
    expect(flipCard(s, 2)).toBe(s);
    s = closeMismatch(s);
    expect(s.player).toBe(1);
    expect(s.open).toHaveLength(0);
  });
  it("keeps the turn for a pair and can finish a whole game", () => {
    let s = createMemory(opts);
    for (const symbol of new Set(s.cards)) {
      const indices = s.cards.flatMap((c, i) => (c === symbol ? [i] : []));
      s = flipCard(flipCard(s, indices[0]), indices[1]);
    }
    expect(memoryDone(s)).toBe(true);
    expect(s.scores[0]).toBe(s.cards.length / 2);
    expect(s.turns).toBe(s.cards.length / 2);
  });
});
describe("Mazes", () => {
  it("generates connected reciprocal walls and solves every difficulty across seeds", () => {
    for (const difficulty of ["easy", "medium", "hard"] as const)
      for (let seed = 0; seed < 30; seed++) {
        let s = createMaze({ ...opts, difficulty }, seed);
        expect(validSession(s)).toBe(true);
        const route = mazeRoute(s);
        expect(route[0]).toBe(0);
        expect(route.at(-1)).toBe(s.size * s.size - 1);
        for (const cell of route.slice(1)) s = mazeMove(s, cell);
        expect(mazeDone(s)).toBe(true);
      }
  });
  it("rejects nonneighbor and outside moves", () => {
    const s = createMaze(opts, 2);
    expect(mazeMove(s, -1)).toBe(s);
    expect(mazeMove(s, 24)).toBe(s);
  });
  it("has repeatable seed generation", () => expect(createMaze(opts, 42).walls).toEqual(createMaze(opts, 42).walls));
});
describe("Number Island", () => {
  it("finds all distinct subsets for a target", () =>
    expect(numberChoices([1, 2, 3, 4, 5, 6], 5)).toEqual([[2, 3], [1, 4], [5]]));
  it("cannot reroll, double-select, or close an invalid sum", () => {
    let s = rollNumbers(createNumbers(opts));
    expect(rollNumbers(s)).toBe(s);
    s = selectNumber(selectNumber(s, 1), 1);
    expect(s.selected).toEqual([]);
    expect(closeNumbers(s)).toBe(s);
  });
  it("closes a legal combination and undo restores the original roll", () => {
    let s = rollNumbers(createNumbers(opts));
    const before = s;
    s = { ...s, selected: numberChoices(s.available, s.dice[0])[0] };
    const next = closeNumbers(s);
    expect(next.dice).toEqual([]);
    expect(next.available.length).toBeLessThan(before.available.length);
    expect(undoNumbers(next).dice).toEqual(before.dice);
    expect(undoNumbers(next).available).toEqual(before.available);
  });
  it("recognizes both cleared and stuck rounds", () => {
    const s = createNumbers(opts);
    expect(numbersStatus({ ...s, available: [] })).toBe("won");
    expect(numbersStatus({ ...s, available: [6], dice: [2] })).toBe("playing");
    const { gentlePractice: _practice, ...legacy } = s;
    expect(numbersStatus({ ...legacy, available: [6], dice: [2] })).toBe("stuck");
  });
  it("seed RNG stays bounded and repeatable", () => {
    const a = random(91),
      b = random(91);
    for (let i = 0; i < 50; i++) {
      const n = a();
      expect(n).toBe(b());
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
describe("Save boundaries", () => {
  it("round trips every game and its options", () => {
    const save = emptySave();
    for (const game of gameIds) save.sessions[game] = createGame(game, opts);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
  });
  it("rejects corrupt, future, mismatched, and oversized data", () => {
    expect(() => parseSave("oops")).toThrow();
    expect(() => parseSave('{"version":2}')).toThrow(/unsupported/);
    const save = emptySave();
    save.sessions.maze = createTic(opts) as never;
    expect(() => parseSave(JSON.stringify(save))).toThrow(/invalid/);
    expect(() => parseSave("a".repeat(2_000_001))).toThrow(/large/);
  });
  it("rejects invalid memory indexes, broken maze walls, and numbers", () => {
    expect(validSession({ ...createMemory(opts), open: [-1] })).toBe(false);
    const maze = createMaze(opts, 7);
    maze.walls[0] = 0;
    expect(validSession(maze)).toBe(false);
    expect(validSession({ ...createNumbers(opts), dice: [19] })).toBe(false);
  });
  it("rejects semantically broken imported game states", () => {
    expect(validSession({ ...createTic(opts), board: ["X", "X", "X", "O", "O", "O", null, null, null] })).toBe(false);
    const memory = createMemory(opts),
      other = memory.cards.findIndex((c) => c !== memory.cards[0]);
    expect(validSession({ ...memory, matched: [0, other], scores: [1, 0], turns: 1 })).toBe(false);
    expect(validSession({ ...createMaze(opts, 2), walls: Array(25).fill(15) })).toBe(false);
    expect(validSession({ ...createNumbers(opts), available: [7] })).toBe(false);
  });
});
