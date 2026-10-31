import { describe, expect, it } from "vitest";
import { PARTY_PACKS, partyPack } from "../src/party/content";
import {
  createPartySession,
  partyAction,
  partyActor,
  PartyIntent,
  PartySession,
  rematchParty,
  topPartyVotes,
  validPartyNames,
  validPartySession,
} from "../src/party/engine";
const names = ["Mia", "Mum", "Dad", "Sam"];
function action(s: PartySession, type: PartyIntent["type"], target?: number) {
  return partyAction(s, { sessionId: s.id, revision: s.revision, player: partyActor(s)!, type, target });
}
function voting(s = createPartySession({ players: names, seed: 4, id: "fixture" })) {
  while (s.phase === "roles") s = action(s, "role-done");
  while (s.phase === "clues") s = action(s, "clue-done");
  return s;
}
function voteAll(s: PartySession, votes: number[]) {
  for (const target of votes) s = action(s, "vote", target);
  return s;
}
function majority(n: number, target: number) {
  return Array.from({ length: n }, (_, i) => (i === target ? (target + 1) % n : target));
}
describe("Secret-word Imposter complete private party rules", () => {
  it("starts with one hidden Imposter and a reviewed word/picture from every pack", () => {
    for (const pack of PARTY_PACKS)
      for (let seed = 0; seed < 60; seed++) {
        const s = createPartySession({ players: names, pack: pack.id, seed });
        expect(s.imposter).toBeGreaterThanOrEqual(0);
        expect(s.imposter).toBeLessThan(names.length);
        expect(pack.words.some((w) => w.id === s.wordId)).toBe(true);
        expect(s.phase).toBe("roles");
        expect(s.roleCursor).toBe(0);
        expect(validPartySession(s)).toBe(true);
        expect("visible" in s).toBe(false);
        expect("revealed" in s).toBe(false);
      }
  });
  it("rejects empty, duplicate/normalized duplicate, oversized and control-character names", () => {
    for (const players of [
      [],
      ["A", "B"],
      ["A", "B", ""],
      ["A", "a", "B"],
      ["Ａ", "A", "B"],
      ["A\n", "B", "C"],
      ["x".repeat(25), "B", "C"],
      Array.from({ length: 9 }, (_, i) => String(i)),
    ])
      expect(validPartyNames(players)).toBe(false);
    expect(validPartyNames(["Mia", "Mamá", "お父さん"])).toBe(true);
    expect(() => createPartySession({ players: ["A", "a", "B"] })).toThrow();
  });
  it("trims setup names and deals all 3–8 players before one or two complete clue circles", () => {
    for (let n = 3; n <= 8; n++)
      for (const clueRounds of [1, 2] as const) {
        let s = createPartySession({ players: Array.from({ length: n }, (_, i) => ` P${i} `), clueRounds, seed: n });
        for (let i = 0; i < n; i++) {
          expect(partyActor(s)).toBe(i);
          s = action(s, "role-done");
          expect(validPartySession(s)).toBe(true);
        }
        for (let i = 0; i < n * clueRounds; i++) {
          expect(s.phase).toBe("clues");
          expect(partyActor(s)).toBe(((s.firstClue ?? 0) + i) % n);
          s = action(s, "clue-done");
          expect(validPartySession(s)).toBe(true);
        }
        expect(s.phase).toBe("voting");
        expect(s.players[0]).toBe("P0");
      }
  });
  it("rejects stale, duplicate, wrong-round, out-of-order and wrong-phase intents", () => {
    const s = createPartySession({ players: names, seed: 1 });
    const intent: PartyIntent = { sessionId: s.id, revision: s.revision, player: 0, type: "role-done" };
    const next = partyAction(s, intent);
    expect(partyAction(next, intent)).toBe(next);
    for (const patch of [
      { sessionId: "old" },
      { revision: 99 },
      { player: 1 },
      { type: "vote" as const, target: 1 },
      { type: "clue-done" as const },
    ])
      expect(partyAction(s, { ...intent, ...patch })).toBe(s);
  });
  it("does not allow self-votes, out-of-range targets or voting out of turn", () => {
    const s = voting();
    for (const target of [0, -1, 4, Infinity, 1.5]) expect(action(s, "vote", target)).toBe(s);
    expect(partyAction(s, { sessionId: s.id, revision: s.revision, player: 2, type: "vote", target: 1 })).toBe(s);
    const next = action(s, "vote", 1);
    expect(next.ballots).toEqual([1]);
    expect(partyActor(next)).toBe(1);
  });
  it("family wins by catching the real Imposter and no terminal actions change it", () => {
    let s = voting();
    s = voteAll(s, majority(s.players.length, s.imposter));
    expect(s.result).toEqual({ winner: "family", reason: "caught", suspect: s.imposter });
    expect(validPartySession(s)).toBe(true);
    expect(action(s, "vote", 0)).toBe(s);
    expect(action(s, "role-done")).toBe(s);
  });
  it("Imposter wins when an innocent player receives the most votes", () => {
    let s = voting();
    const innocent = (s.imposter + 1) % s.players.length;
    s = voteAll(s, majority(s.players.length, innocent));
    expect(s.result).toEqual({ winner: "imposter", reason: "wrong-suspect", suspect: innocent });
    expect(validPartySession(s)).toBe(true);
  });
  it("ties get exactly one private runoff among tied leaders", () => {
    let s = voting();
    s = voteAll(s, [1, 0, 1, 0]);
    expect(s.phase).toBe("runoff");
    expect(topPartyVotes(s.ballots)).toEqual([0, 1]);
    expect(validPartySession(s)).toBe(true);
    expect(action(s, "vote", 2)).toBe(s);
    expect(action(s, "vote", 0)).toBe(s);
    s = voteAll(s, [1, 0, 0, 0]);
    expect(s.phase).toBe("result");
    expect(s.result?.suspect).toBe(0);
    expect(validPartySession(s)).toBe(true);
  });
  it("a second tie is a real Imposter escape result", () => {
    let s = voting();
    s = voteAll(s, [1, 0, 3, 2]);
    expect(s.phase).toBe("runoff");
    s = voteAll(s, [1, 0, 3, 2]);
    expect(s.result).toEqual({ winner: "imposter", reason: "tied", suspect: null });
    expect(validPartySession(s)).toBe(true);
  });
  it("round-trips every intermediate state without a persisted reveal or unfinished vote", () => {
    let s = createPartySession({ players: names, clueRounds: 2 });
    while (s.phase !== "result") {
      const restored = JSON.parse(JSON.stringify(s));
      expect(validPartySession(restored)).toBe(true);
      expect(restored).toEqual(s);
      expect(Object.keys(restored)).not.toContain("selection");
      s =
        s.phase === "roles"
          ? action(s, "role-done")
          : s.phase === "clues"
            ? action(s, "clue-done")
            : action(s, "vote", (partyActor(s)! + 1) % names.length);
    }
    expect(validPartySession(s)).toBe(true);
  });
  it("rematch preserves people/pack/rules and refreshes word, role and round identity", () => {
    const s = createPartySession({ players: names, pack: "food", clueRounds: 2, seed: 2 });
    const next = rematchParty(s);
    expect(next.players).toEqual(s.players);
    expect(next.pack).toBe(s.pack);
    expect(next.clueRounds).toBe(2);
    expect(next.wordId).not.toBe(s.wordId);
    expect(next.firstClue).toBe(((s.firstClue ?? 0) + 1) % names.length);
    expect(next.id).not.toBe(s.id);
    expect(next.revision).toBe(0);
    expect(partyPack(next.pack).words.some((w) => w.id === next.wordId)).toBe(true);
  });
  it("rejects forged phases, results, ballots, progress, revision, roles and word packs", () => {
    const s = voting();
    for (const patch of [
      { version: 2 },
      { game: "other" },
      { id: "x".repeat(121) },
      { revision: 0 },
      { roleCursor: 0 },
      { clueCursor: 0 },
      { ballots: [0] },
      { runoffBallots: [1] },
      { phase: "result" },
      { result: { winner: "family", reason: "caught", suspect: 0 } },
      { imposter: 4 },
      { wordId: "pizza" },
      { pack: "unknown" },
      { clueRounds: 3 },
    ])
      expect(validPartySession({ ...s, ...patch })).toBe(false);
    const won = voteAll(s, majority(names.length, s.imposter));
    expect(validPartySession({ ...won, result: { ...won.result, winner: "wrong" } })).toBe(false);
    expect(
      partyAction({ ...s, imposter: 99 }, { sessionId: s.id, revision: s.revision, player: 0, type: "vote", target: 1 })
    ).toEqual({ ...s, imposter: 99 });
  });
});
