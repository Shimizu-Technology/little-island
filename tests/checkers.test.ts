import { describe, it, expect } from "vitest";
import { defaultOptions, random } from "../src/games/types";
import {
  applyCheckers,
  checkersChoice,
  checkersMoves,
  checkersMove,
  checkersResult,
  checkersUndo,
  createCheckers,
  checkersLesson,
  finishCheckersLessons,
  position,
} from "../src/games/checkers";
import { emptySave, parseSave, validSession } from "../src/state/validation";
const at = (r: number, c: number) => r * 8 + c;
function fixture(red: number[][], blue: number[][], redKings: number[][] = [], blueKings: number[][] = []) {
  const board = Array<number>(64).fill(0);
  for (const [pieces, n] of [
    [red, 1],
    [blue, -1],
    [redKings, 2],
    [blueKings, -2],
  ] as const)
    for (const [r, c] of pieces) board[at(r, c)] = n;
  return position(board);
}
describe("English/American checkers independent WCDF fixtures", () => {
  it("opens with 12 pieces each and seven legal red moves", () => {
    const s = createCheckers(defaultOptions);
    expect(s.position.board.filter((p) => p === 1)).toHaveLength(12);
    expect(s.position.board.filter((p) => p === -1)).toHaveLength(12);
    expect(checkersMoves(s.position)).toHaveLength(7);
  });
  it("forces capture but permits shorter alternate chains", () => {
    const p = fixture(
        [
          [2, 1],
          [2, 5],
        ],
        [
          [3, 2],
          [5, 4],
          [3, 6],
        ]
      ),
      moves = checkersMoves(p);
    expect(moves).toHaveLength(2);
    expect(moves.map((m) => m.path)).toEqual([[at(4, 3), at(6, 5)], [at(4, 7)]]);
    expect(moves.map((m) => m.captured.length)).toEqual([2, 1]);
  });
  it("cannot accept an incomplete jump chain", () => {
    const s = {
      ...createCheckers(defaultOptions),
      position: fixture(
        [[2, 1]],
        [
          [3, 2],
          [5, 4],
        ]
      ),
    };
    expect(checkersMove(s, { from: at(2, 1), path: [at(4, 3)], captured: [at(3, 2)] })).toBe(s);
  });
  it("crowning ends a jump even when a backward jump would exist", () => {
    const p = fixture(
        [[5, 0]],
        [
          [6, 1],
          [6, 3],
        ]
      ),
      moves = checkersMoves(p);
    expect(moves).toHaveLength(1);
    expect(moves[0].path).toEqual([at(7, 2)]);
    const next = applyCheckers(p, moves[0]);
    expect(next.board[at(7, 2)]).toBe(2);
    expect(next.turn).toBe(-1);
    expect(next.board[at(6, 3)]).toBe(-1);
  });
  it("men cannot capture backward but kings must", () => {
    const p = fixture([[4, 3]], [[3, 2]]);
    expect(checkersMoves(p).map((m) => m.path)).toEqual([[at(5, 2)], [at(5, 4)]]);
    p.board[at(4, 3)] = 2;
    expect(checkersMoves(p)).toEqual([{ from: at(4, 3), path: [at(2, 1)], captured: [at(3, 2)] }]);
  });
  it("blocked player loses even with a remaining piece", () => {
    const p = fixture(
      [[6, 1]],
      [],
      [],
      [
        [7, 0],
        [7, 2],
      ]
    );
    expect(checkersMoves(p)).toHaveLength(0);
    expect(checkersResult(p)).toBe("blue");
  });
  it("allows a king capture loop back to its starting square", () => {
    const p = fixture(
        [],
        [
          [3, 4],
          [1, 4],
          [1, 2],
          [3, 2],
        ],
        [[4, 3]]
      ),
      moves = checkersMoves(p);
    expect(moves).toHaveLength(2);
    for (const move of moves) {
      expect(move.path.at(-1)).toBe(at(4, 3));
      expect(move.captured).toHaveLength(4);
      expect(applyCheckers(p, move).outcome).toBe("red");
    }
  });
  it("counts initial position in automatic threefold repetition", () => {
    let p = fixture([], [], [[0, 1]], [[7, 6]]);
    const cycle = [
      [at(0, 1), at(1, 0)],
      [at(7, 6), at(6, 7)],
      [at(1, 0), at(0, 1)],
      [at(6, 7), at(7, 6)],
    ];
    for (let round = 0; round < 2; round++)
      for (const [from, to] of cycle) {
        const move = checkersMoves(p).find((m) => m.from === from && m.path[0] === to)!;
        p = applyCheckers(p, move);
      }
    expect(p.outcome).toBe("draw");
  });
  it("draws after 80 quiet plies; ordinary-piece moves reset the count", () => {
    let p = fixture([], [], [[0, 1]], [[7, 6]]);
    p.quiet = 78;
    p = applyCheckers(p, checkersMoves(p)[0]);
    expect(p.outcome).toBeNull();
    p = applyCheckers(p, checkersMoves(p)[0]);
    expect(p.outcome).toBe("draw");
    let man = fixture([[2, 1]], [[6, 7]]);
    man.quiet = 79;
    man = applyCheckers(man, checkersMoves(man)[0]);
    expect(man.quiet).toBe(0);
  });
  it("gives capture-all wins precedence over quiet draw", () => {
    const p = fixture([], [[3, 2]], [[4, 3]]);
    p.quiet = 79;
    expect(applyCheckers(p, checkersMoves(p)[0]).outcome).toBe("red");
  });
  it("undo restores a solo decision and all counters/history", () => {
    let s = createCheckers(defaultOptions);
    const original = s.position;
    s = checkersMove(s, checkersMoves(s.position)[0]);
    s = checkersMove(s, checkersMoves(s.position)[0]);
    expect(checkersUndo(s).position).toEqual(original);
    expect(checkersUndo(s).history).toEqual([]);
  });
  it("AI returns a legal move, respects cancellation, and leaves terminal boards alone", async () => {
    const s = createCheckers({ ...defaultOptions, difficulty: "hard" });
    const move = await checkersChoice(s);
    expect(checkersMoves(s.position)).toContainEqual(move);
    expect(await checkersChoice(s, () => true)).toBeNull();
    s.position = { ...s.position, outcome: "red" };
    expect(await checkersChoice(s)).toBeNull();
  });
  it("keeps played states round-trip valid", () => {
    let s = createCheckers(defaultOptions);
    for (let i = 0; i < 60 && !s.position.outcome; i++) {
      const moves = checkersMoves(s.position);
      s = checkersMove(s, moves[i % moves.length]);
      expect(validSession(s)).toBe(true);
    }
  });
  it("keeps long legal rounds below the backup limit", () => {
    const rng = random(134721);
    for (let game = 0; game < 7; game++) {
      let s = createCheckers({ ...defaultOptions, mode: "together" });
      for (let ply = 0; ply < 500 && !s.position.outcome; ply++) {
        const moves = checkersMoves(s.position);
        s = checkersMove(s, moves[Math.floor(rng() * moves.length)]);
      }
      const save = emptySave();
      save.sessions.checkers = s;
      const raw = JSON.stringify(save);
      expect(raw.length).toBeLessThan(2_000_000);
      expect(() => parseSave(raw)).not.toThrow();
    }
  });
});

it("keeps a full checkers round safe while lessons are played and resumed", () => {
  let s = createCheckers(defaultOptions);
  s = checkersMove(s, checkersMoves(s.position)[0]);
  const original = s;
  s = checkersLesson(s, 0);
  s = checkersMove(s, checkersMoves(s.position)[0]);
  s = checkersLesson(s, 1);
  expect(validSession(s)).toBe(true);
  const save = emptySave();
  save.sessions.checkers = s;
  s = parseSave(JSON.stringify(save)).sessions.checkers as typeof s;
  const restored = finishCheckersLessons(s);
  expect(restored.position).toEqual(original.position);
  expect(restored.history).toEqual(original.history);
  expect(restored.lesson).toBeNull();
});

describe("Friendly checkers rules and saved-game compatibility", () => {
  const options = { ...defaultOptions, checkersRules: "friendly" as const };
  it("allows another piece to walk past an available jump only in Friendly", () => {
    const p = fixture(
      [
        [2, 1],
        [2, 5],
      ],
      [
        [3, 2],
        [6, 7],
      ]
    );
    const quiet = { from: at(2, 5), path: [at(3, 4)], captured: [] };
    const classic = { ...createCheckers(defaultOptions), position: p };
    const friendly = { ...createCheckers(options), position: p };
    expect(checkersMoves(p).every((m) => m.captured.length > 0)).toBe(true);
    expect(checkersMoves(p, "friendly")).toContainEqual(quiet);
    expect(checkersMove(classic, quiet)).toBe(classic);
    const moved = checkersMove(friendly, quiet);
    expect(moved.position.board[at(3, 4)]).toBe(1);
    expect(moved.position.board[at(3, 2)]).toBe(-1);
    expect(moved.position.turn).toBe(-1);
    expect(checkersUndo(moved)).toEqual(friendly);
  });
  it("still requires a whole chosen jump chain and ends a crowning turn", () => {
    const s = {
      ...createCheckers(options),
      position: fixture(
        [[2, 1]],
        [
          [3, 2],
          [5, 4],
        ]
      ),
    };
    expect(checkersMove(s, { from: at(2, 1), path: [at(4, 3)], captured: [at(3, 2)] })).toBe(s);
    const chain = checkersMoves(s.position, "friendly").find((m) => m.captured.length === 2)!;
    const moved = checkersMove(s, chain);
    expect(moved.position.board[at(6, 5)]).toBe(1);
    expect(moved.position.outcome).toBe("red");
    const crowned = {
      ...createCheckers(options),
      position: fixture(
        [[5, 0]],
        [
          [6, 1],
          [6, 3],
        ]
      ),
    };
    const jump = checkersMoves(crowned.position, "friendly").find((m) => m.captured.length)!;
    expect(jump.path).toEqual([at(7, 2)]);
    expect(checkersMove(crowned, jump).position.board[at(7, 2)]).toBe(2);
    expect(checkersMove(crowned, jump).position.turn).toBe(-1);
  });
  it.each(["easy", "medium", "hard"] as const)(
    "uses the same Friendly legal moves for %s computer play",
    async (difficulty) => {
      let s = {
        ...createCheckers({ ...options, difficulty }),
        position: fixture(
          [
            [2, 1],
            [2, 5],
          ],
          [
            [3, 2],
            [6, 7],
          ]
        ),
      };
      for (let n = 0; n < 8 && !s.position.outcome; n++) {
        const move = await checkersChoice(s);
        expect(checkersMoves(s.position, "friendly")).toContainEqual(move);
        const next = checkersMove(s, move!);
        expect(next).not.toBe(s);
        expect(validSession(next)).toBe(true);
        s = next;
      }
    }
  );
  it("preserves new rules and legacy Classic behavior through backups and lessons", () => {
    const save = emptySave();
    save.sessions.checkers = createCheckers(defaultOptions);
    const legacy = parseSave(JSON.stringify(save)).sessions.checkers!;
    expect(legacy.options.checkersRules).toBeUndefined();
    let s = createCheckers(options);
    s = checkersMove(s, checkersMoves(s.position, "friendly")[0]);
    const original = s;
    s = checkersLesson(s, 1);
    // The Classic capture lesson has no optional walk, even for a Friendly saved round.
    expect(checkersMove(s, { from: at(2, 1), path: [at(3, 0)], captured: [] })).toBe(s);
    save.sessions.checkers = s;
    s = parseSave(JSON.stringify(save)).sessions.checkers as typeof s;
    const restored = finishCheckersLessons(s);
    expect(restored.options.checkersRules).toBe("friendly");
    expect(restored.position).toEqual(original.position);
    expect(restored.history).toEqual(original.history);
    expect(validSession({ ...restored, options: { ...restored.options, checkersRules: "unknown" } })).toBe(false);
    expect(validSession({ ...restored, options: { ...restored.options, checkersRules: null } })).toBe(false);
  });
});
