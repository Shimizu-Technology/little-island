import { describe, expect, it } from "vitest";
import {
  CardEvent,
  CardSession,
  cardAction,
  cardEventText,
  cardRanks,
  cardRound,
  computerCardTurn,
  createCardSession,
  newCardIds,
  rank,
  validCardSession,
  setCardPace,
} from "../src/cards/engine";
import { defaultOptions } from "../src/games/types";
describe("quick/full card rounds and readable private events", () => {
  it("finishes quick and full rounds with exact deck/book conservation after every decision", () => {
    for (const game of ["go-fish", "crazy-eights"] as const)
      for (const round of ["quick", "full"] as const)
        for (let seed = 0; seed < 45; seed++) {
          let s = createCardSession(game, defaultOptions, seed, `quality-${game}-${round}-${seed}`, {
            round,
            pace: "step",
          });
          expect(s.hands[0].length).toBe(round === "quick" ? 5 : 7);
          for (let n = 0; n < 3000 && !s.result; n++) {
            expect(validCardSession(s)).toBe(true);
            const next = computerCardTurn(s);
            expect(next).not.toBe(s);
            s = next;
            expect(s.events!.length).toBeLessThanOrEqual(4);
            expect(s.events!.at(-1)!.revision).toBe(s.revision);
          }
          expect(s.result).not.toBeNull();
          expect(validCardSession(s)).toBe(true);
          if (game === "go-fish") expect(s.books.flat()).toHaveLength(round === "quick" ? 8 : 13);
          if (round === "quick")
            expect([...s.hands.flat(), ...s.stock, ...s.discard].every((c) => rank(c) <= 8)).toBe(true);
        }
  }, 30000);
  it("accepts legacy full saves without optional quality fields and resumes exact next rule action", () => {
    const modern = createCardSession("crazy-eights", defaultOptions, 42, "old");
    const old = { ...modern };
    delete old.round;
    delete old.pace;
    delete old.events;
    expect(cardRound(old)).toBe("full");
    expect(cardRanks(old)).toBe(13);
    expect(validCardSession(old)).toBe(true);
    expect(computerCardTurn(old).hands).toEqual(computerCardTurn(modern).hands);
  });
  it("only projects new draws to the actor, including hidden pass-device and CPU stories", () => {
    const event: CardEvent = {
      revision: 1,
      actor: 1,
      action: "draw",
      newCards: [12],
      received: 0,
      continues: false,
      books: [[], []],
    };
    expect(cardEventText(event, 1, "together")).toContain("King of shells");
    for (const viewer of [0, null] as const) expect(cardEventText(event, viewer, "together")).not.toContain("King");
    expect(cardEventText(event, 0, "solo")).toBe("Computer drew one card.");
    const s = createCardSession("crazy-eights", defaultOptions, 2, "highlight");
    const highlight = { ...event, actor: 0 as const, newCards: [s.hands[0][0], s.stock[0]] };
    expect(newCardIds({ ...s, events: [highlight] }, 0)).toEqual([s.hands[0][0]]);
    expect(newCardIds({ ...s, events: [event] }, 0)).toEqual([]);
  });
  it("keeps drawn card/turn stories stable through JSON and rejects oversized/forged envelope metadata", () => {
    let s = createCardSession("go-fish", defaultOptions, 27, "events", { round: "quick" });
    for (let i = 0; i < 12 && !s.result; i++) s = computerCardTurn(s);
    const restored = JSON.parse(JSON.stringify(s)) as CardSession;
    expect(validCardSession(restored)).toBe(true);
    expect(computerCardTurn(restored)).toEqual(computerCardTurn(s));
    expect(validCardSession({ ...s, round: "tiny" })).toBe(false);
    expect(validCardSession({ ...s, pace: "fast" })).toBe(false);
    expect(validCardSession({ ...s, events: new Array(5).fill(s.events![0]) })).toBe(false);
    expect(validCardSession({ ...s, events: [{ ...s.events!.at(-1), revision: s.revision + 1 }] })).toBe(false);
    expect(validCardSession({ ...s, events: [{ ...s.events!.at(-1), newCards: [99] }] })).toBe(false);
    expect(validCardSession({ ...s, events: [{ ...s.events!.at(-1), books: [[1, 1], []] }] })).toBe(false);
    expect(validCardSession({ ...s, round: undefined })).toBe(false); // 32 cards cannot masquerade as an old 52-card save.
  });
  it("persists pace without rerolling and invalidates old intents", () => {
    const s = createCardSession("go-fish", defaultOptions, 9, "same-hand");
    const next = setCardPace(s, "steady");
    expect(next.hands).toBe(s.hands);
    expect(next.stock).toBe(s.stock);
    expect(next.id).toBe(s.id);
    expect(next.revision).toBe(s.revision + 1);
    expect(validCardSession(next)).toBe(true);
    expect(cardAction(next, { type: "ask", rank: rank(s.hands[0][0]) }, 0, s.revision)).toBe(next);
  });
  it("rejects stale repeated intents even when event feedback is retained", () => {
    const s = createCardSession("go-fish", defaultOptions, 9, "rapid");
    const action = { type: "ask" as const, rank: rank(s.hands[0][0]) };
    const next = cardAction(s, action, 0, 0);
    expect(cardAction(next, action, 0, 0)).toBe(next);
    expect(next.events).toHaveLength(1);
    expect(next.events![0].rank).toBe(action.rank);
  });
});
