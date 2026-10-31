import { describe, expect, it } from "vitest";
import {
  applyBoardSave,
  boardIds,
  catalog,
  createSession,
  engines,
  playAgain,
  undo,
  validBoardSession,
  validBoardSessions,
} from "../src/board";
import { emptySave, parseSave, Save } from "../src/state/validation";
import { homeContinue, shelfGames, toggleShelfFavorite } from "../src/learn/home";
describe("board sessions and integration", () => {
  it("old saves load unchanged; all five games save/restore exact partial sessions and favorites", () => {
    expect(parseSave(JSON.stringify(emptySave()))).toEqual(emptySave());
    let save: Save = emptySave();
    for (const game of boardIds) {
      let s = createSession(game, {
        seed: 91,
        size: catalog[game].sizes[0],
        mode: "together",
        names: ["Mia", "Kai"],
      });
      s = { ...s, position: engines[game].move(s.position, engines[game].legal(s.position)[0]) };
      save = applyBoardSave(save, game, s, undefined, 0, 0);
      save = toggleShelfFavorite(save, game);
      expect(homeContinue(save)).toBe(game);
      expect(shelfGames.find((g) => g.id === game)?.island).toBe("classic");
      expect(parseSave(JSON.stringify(save))).toEqual(save);
    }
    expect(save.favoriteGames).toHaveLength(5);
  });
  it("rejects stale rounds, restore generations, wrong games and malformed state without mutating the save", () => {
    const s = createSession("coconut-drop", { seed: 9 });
    const save = applyBoardSave(emptySave(), s.game, s, undefined, 0, 0);
    const moved = { ...s, position: engines[s.game].move(s.position, 0) };
    expect(applyBoardSave(save, s.game, moved, undefined, 0, 0)).toBe(save);
    expect(applyBoardSave(save, s.game, moved, s, 0, 1)).toBe(save);
    expect(applyBoardSave(save, "shell-pits", moved, s, 0, 0)).toBe(save);
    const bad = { ...s, position: { ...s.position, board: Array(42).fill(0) } };
    expect(applyBoardSave(save, s.game, bad, s, 0, 0)).toBe(save);
    expect(() => parseSave(JSON.stringify({ ...save, board: { [s.game]: bad } }))).toThrow(/original has been kept/);
    expect(validBoardSessions({ other: s })).toBe(false);
    for (const patch of [
      { version: 2 },
      { strength: "impossible" },
      { mode: "anything" },
      { match: { ...s.match, wins: [-1, 0] } },
      { taught: "yes" },
      { id: "" },
    ])
      expect(validBoardSession({ ...s, ...patch })).toBe(false);
    expect(validBoardSession({ ...createSession("reef-sweep"), mode: "together" })).toBe(false);
  });
  it("undoes a complete human/computer decision, and scores settled rounds exactly once", () => {
    let s = createSession("coconut-drop", { seed: 8, mode: "solo" });
    const engine = engines[s.game];
    s = { ...s, position: engine.move(engine.move(s.position, 0), 1) };
    expect(undo(s).position.moves).toEqual([]);
    let win = createSession("coconut-drop", { seed: 8, mode: "together", alternate: true, names: ["Mia", "Kai"] });
    for (const m of [0, 6, 1, 6, 2, 5, 3]) win = { ...win, position: engine.move(win.position, m) };
    expect(win.position.outcome).toBe(0);
    const next = playAgain(win, 42);
    expect(next.match.wins).toEqual([1, 0]);
    expect(next.position.starter).toBe(1);
    expect(next.position.moves).toEqual([]);
    expect(validBoardSession(next)).toBe(true);
    expect(playAgain(next, 43).match.wins).toEqual([1, 0]);
    expect(homeContinue({ ...emptySave(), board: { [win.game]: win }, recentBoard: win.game })).toBe(null);
  });
  it("never serializes private visibility; Hidden Canoes has no undo", () => {
    const s = createSession("hidden-canoes", { seed: 99, mode: "together" });
    expect(undo(s)).toBe(s);
    expect(validBoardSession({ ...s, visible: true })).toBe(false);
    expect(Object.keys(s).sort()).toEqual(
      ["version", "id", "game", "mode", "strength", "position", "match", "taught"].sort()
    );
  });
  it("Reef Sweep undo restores its exact generated board and can undo an urchin", () => {
    let s = createSession("reef-sweep", { seed: 1 });
    s = { ...s, position: engines[s.game].move(s.position, 12) };
    const first = s,
      mine = s.position.board.findIndex((v) => v === -1);
    s = { ...s, position: engines[s.game].move(s.position, mine) };
    expect(s.position.outcome).toBe(1);
    expect(undo(s)).toEqual(first);
  });
});
