import { describe, expect, it } from "vitest";
import { newMatch } from "../src/games/match";
import { defaultOptions } from "../src/games/types";
import { cardMatch, cardMatchPoints, cardMatchResult, cardStarter, computerCardTurn, createCardSession, rematchCards, validCardSession, CardSession, cardEventText } from "../src/cards/engine";
function finish(s: CardSession) {
  for (let i = 0; i < 10000 && !s.result; i++) s = computerCardTurn(s);
  expect(s.result).not.toBeNull();
  return s;
}
describe("card family matches", () => {
  for (const game of ["go-fish", "crazy-eights"] as const)
    for (const mode of ["solo", "together"] as const)
      it(`${game} ${mode}: names, chosen starter, result and rematch survive JSON`, () => {
        const match = newMatch(["Mia", "Dad"]);
        let s = createCardSession(game, { ...defaultOptions, mode }, 42, "first", { match, starter: 1, round: "quick" });
        expect(s.turn).toBe(1);
        const previous = JSON.stringify(s);
        s = finish(s);
        expect(cardMatch(s).wins).toEqual([0, 0]);
        expect(validCardSession(JSON.parse(JSON.stringify(s)))).toBe(true);
        const next = rematchCards(s, 43, "second");
        expect(cardStarter(next)).toBe(0);
        expect(next.turn).toBe(0);
        expect(next.match?.names).toEqual(["Mia", "Dad"]);
        expect(next.match!.wins.reduce((a, b) => a + b, 0) + next.match!.draws).toBe(1);
        expect(next.matchPoints).toEqual(game === "crazy-eights" ? s.result!.scores : [0, 0]);
        expect(validCardSession(next)).toBe(true);
        expect(JSON.parse(previous).revision).toBe(0);
        const again = finish(next);
        const third = rematchCards(again, 44, "third");
        expect(third.turn).toBe(1);
        expect(third.match!.wins.reduce((a, b) => a + b, 0) + third.match!.draws).toBe(2);
        expect(third.matchPoints).toEqual(cardMatchPoints(again));
      });
  it("supports every legacy session without introducing a new required field", () => {
    const s = createCardSession("crazy-eights", { ...defaultOptions, computerFirst: true });
    delete s.match; delete s.starter; delete s.matchPoints;
    expect(validCardSession(s)).toBe(true);
    expect(cardStarter(s)).toBe(1);
    const end = finish(s);
    expect(validCardSession(end)).toBe(true);
    expect(validCardSession(rematchCards(end))).toBe(true);
  });
  it("keeps the chosen starter when alternation is off and counts ties", () => {
    const s = createCardSession("go-fish", defaultOptions, 1, "tie", { match: newMatch(["A", "B"], false), starter: 1 });
    s.result = { winner: "tie", scores: [4, 4], reason: "books" };
    expect(cardMatchResult(s)).toBe("draw");
    const next = rematchCards(s);
    expect(next.turn).toBe(1);
    expect(next.match?.draws).toBe(1);
  });
  it("rejects malformed new match metadata while legacy validation stays strict", () => {
    const s = createCardSession("go-fish", defaultOptions);
    for (const match of [null, {}, { ...s.match, wins: [-1, 0] }, { ...s.match, names: ["x".repeat(17), "Dad"] }])
      expect(validCardSession({ ...s, match })).toBe(false);
    for (const starter of [null, 2, "0", -1]) expect(validCardSession({ ...s, starter })).toBe(false);
    for (const matchPoints of [null, [1], [1, 2, 3], [-1, 2], [Infinity, 0], [0.5, 0]])
      expect(validCardSession({ ...s, matchPoints })).toBe(false);
  });
  it("names public event actors and books without revealing private draws", () => {
    const event = { revision: 1, actor: 1 as const, action: "ask" as const, rank: 2, received: 0, continues: false, newCards: [39], books: [[], [2]] as [number[], number[]] };
    const text = cardEventText(event, null, "together", ["Mia", "Dad"]);
    expect(text).toContain("Dad asked");
    expect(text).toContain("Dad made a book");
    expect(text).not.toContain("Ace of");
    expect(text).not.toContain("Player 2");
  });
});
