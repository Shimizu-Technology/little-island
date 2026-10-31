import { describe, expect, it } from "vitest";
import { cleanName, newMatch, nextStarter, rememberNames, settle, validMatch, validPlayers } from "../src/games/match";
import { emptySave, parseSave } from "../src/state/validation";

describe("family match", () => {
  it("counts a finished round once and leaves unfinished rounds alone", () => {
    const m = newMatch(["Mia", "Dad"]);
    expect(settle(m, null)).toBe(m);
    const won = settle(m, 0);
    expect(won.wins).toEqual([1, 0]);
    expect(m.wins).toEqual([0, 0]);
    expect(settle(settle(won, "draw"), 1)).toMatchObject({ wins: [1, 1], draws: 1 });
  });

  it("alternates or keeps the starter", () => {
    expect(nextStarter(newMatch(undefined, true), 0)).toBe(1);
    expect(nextStarter(newMatch(undefined, false), 1)).toBe(1);
  });

  it("cleans names and falls back to defaults", () => {
    expect(cleanName("  Mia   Sage ", "x")).toBe("Mia Sage");
    expect(cleanName("   ", "Player 2")).toBe("Player 2");
    expect([...cleanName("🌺".repeat(30), "x")].length).toBe(16);
    expect(newMatch(["", "Mom"]).names).toEqual(["Player 1", "Mom"]);
  });

  it("validates stored matches strictly", () => {
    expect(validMatch(newMatch(["A", "B"]))).toBe(true);
    expect(validMatch({ ...newMatch(), wins: [1] })).toBe(false);
    expect(validMatch({ ...newMatch(), names: ["", "B"] })).toBe(false);
    expect(validMatch({ ...newMatch(), draws: -1 })).toBe(false);
    expect(validMatch({ ...newMatch(), names: ["x".repeat(17), "B"] })).toBe(false);
  });

  it("remembers recent family names without defaults or duplicates", () => {
    expect(rememberNames(["Dad", "Mom"], ["Mia", "dad"])).toEqual(["Mia", "dad", "Mom"]);
    expect(rememberNames(undefined, ["Player 1", "Player 2"])).toEqual([]);
    expect(rememberNames([], ["a", "b", "c", "d", "e", "f", "g", "h", "i"]).length).toBe(8);
  });

  it("accepts remembered players in saves and rejects bad ones", () => {
    const save = { ...emptySave(), players: ["Mia", "Dad"] };
    expect(parseSave(JSON.stringify(save)).players).toEqual(["Mia", "Dad"]);
    expect(validPlayers(["A", "a"])).toBe(false);
    expect(() => parseSave(JSON.stringify({ ...emptySave(), players: [""] }))).toThrow();
  });
});
