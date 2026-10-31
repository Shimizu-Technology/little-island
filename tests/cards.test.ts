import { describe, expect, it } from "vitest";
import {
  CardSession,
  SUITS,
  cardAction,
  cardPublicView,
  chooseCardAction,
  computerCardTurn,
  createCardSession,
  legalCardPlays,
  points,
  rank,
  suit,
  validCardSession,
} from "../src/cards/engine";
import { defaultOptions } from "../src/games/types";

const fresh = (game: CardSession["game"], seed = 42) =>
  createCardSession(game, defaultOptions, seed, `fixture-${game}`);
function fixture(game: CardSession["game"], h0: number[], h1: number[], extra: Partial<CardSession> = {}): CardSession {
  const s = fresh(game);
  const discard = game === "crazy-eights" ? [39] : [];
  const used = [...h0, ...h1, ...discard];
  return {
    ...s,
    hands: [h0, h1],
    stock: Array.from({ length: 52 }, (_, i) => i).filter((c) => !used.includes(c)),
    discard,
    activeSuit: "wave",
    books: [[], []],
    ...extra,
  };
}
function finish(s: CardSession, bound = 10000) {
  let next = s;
  for (let i = 0; i < bound && !next.result; i++) {
    expect(validCardSession(next)).toBe(true);
    const previous = next;
    next = computerCardTurn(next);
    expect(next, `stuck at ${JSON.stringify(previous)}`).not.toBe(previous);
  }
  expect(next.result, `no result: ${JSON.stringify(next)}`).not.toBeNull();
  expect(validCardSession(next)).toBe(true);
  return next;
}

describe("Island card rules", () => {
  it("deals deterministic, complete standard decks with nonwild initial Eights discard", () => {
    for (const game of ["go-fish", "crazy-eights"] as const) {
      const a = fresh(game),
        b = fresh(game);
      expect(a).toEqual(b);
      expect(validCardSession(a)).toBe(true);
      expect(a.hands.map((h) => h.length)).toEqual([7, 7]);
      if (game === "crazy-eights") expect(rank(a.discard[0])).not.toBe(8);
    }
  });
  it("Go Fish transfers every matching card, collects books and retains turn", () => {
    const s = fixture("go-fish", [0, 13, 1], [26, 39, 2]);
    const next = cardAction(s, { type: "ask", rank: 1 });
    expect(next.books[0]).toEqual([1]);
    expect(next.hands).toEqual([[1], [2]]);
    expect(next.turn).toBe(0);
    expect(s.books[0]).toEqual([]);
    expect(validCardSession(next)).toBe(true);
  });
  it("Go Fish draws a matching rank for an extra turn, misses switch turn", () => {
    const s = fixture("go-fish", [0, 1], [2]);
    s.stock = [13, ...s.stock.filter((c) => c !== 13)];
    const match = cardAction(s, { type: "ask", rank: 1 });
    expect(match.turn).toBe(0);
    expect(match.hands[0]).toContain(13);
    const missed = cardAction(match, { type: "ask", rank: 2 });
    expect(missed.turn).toBe(1);
    expect(validCardSession(missed)).toBe(true);
  });
  it("Go Fish refills an emptied hand and conserves every card", () => {
    const s = fixture("go-fish", [0], [13, 1]);
    const next = cardAction(s, { type: "ask", rank: 1 });
    expect(next.hands[1]).toEqual([1]);
    expect(validCardSession(next)).toBe(true);
    const empty = fixture("go-fish", [0], [13]);
    const refilled = cardAction(empty, { type: "ask", rank: 1 });
    expect(refilled.hands[1]).toHaveLength(7);
    expect(validCardSession(refilled)).toBe(true);
  });
  it("rejects unavailable ranks, stale revisions, wrong players, invalid play and terminal input", () => {
    const s = fresh("go-fish");
    expect(cardAction(s, { type: "ask", rank: 99 })).toBe(s);
    expect(cardAction(s, { type: "ask", rank: rank(s.hands[0][0]) }, 1)).toBe(s);
    expect(cardAction(s, { type: "ask", rank: rank(s.hands[0][0]) }, 0, 123)).toBe(s);
    const finished = finish(fresh("go-fish"));
    expect(cardAction(finished, { type: "ask", rank: 1 })).toBe(finished);
    const e = fresh("crazy-eights");
    expect(cardAction(e, { type: "play", card: 100 })).toBe(e);
  });
  it("Eights allows rank, suit and wild matches; a wild requires explicit suit", () => {
    const s = fixture("crazy-eights", [0, 7, 40, 14], [2]);
    expect(legalCardPlays(s)).toEqual([0, 7, 40]);
    expect(cardAction(s, { type: "play", card: 7 })).toBe(s);
    const next = cardAction(s, { type: "play", card: 7, suit: "leaf" });
    expect(next.activeSuit).toBe("leaf");
    expect(next.turn).toBe(1);
    expect(validCardSession(next)).toBe(true);
    expect(cardAction(s, { type: "draw" })).toBe(s);
  });
  it("Eights draws once, permits only the new card, and can finish instead", () => {
    const s = fixture("crazy-eights", [1, 2], [4]);
    s.stock = [40, ...s.stock.filter((c) => c !== 40)];
    const drawn = cardAction(s, { type: "draw" });
    expect(drawn.drawn).toBe(40);
    expect(legalCardPlays(drawn)).toEqual([40]);
    expect(cardAction(drawn, { type: "draw" })).toBe(drawn);
    const pass = cardAction(drawn, { type: "pass" });
    expect(pass.turn).toBe(1);
    expect(pass.drawn).toBeNull();
    expect(validCardSession(pass)).toBe(true);
    expect(cardAction(drawn, { type: "play", card: 40 }).discard.at(-1)).toBe(40);
  });
  it("Eights last-card win scores remaining hand and wild can end a round", () => {
    const s = fixture("crazy-eights", [7], [12, 20, 1]);
    const end = cardAction(s, { type: "play", card: 7, suit: "sun" });
    expect(end.result).toEqual({ winner: 0, scores: [62, 0], reason: "empty-hand" });
    expect(validCardSession(end)).toBe(true);
  });
  it("recycles all but the visible top card deterministically", () => {
    const s = fixture("crazy-eights", [1, 2], [4]);
    s.discard.push(...s.stock);
    s.stock = [];
    s.discard.push(s.discard.shift()!);
    const a = cardAction(s, { type: "draw" }),
      b = cardAction(s, { type: "draw" });
    expect(a).toEqual(b);
    expect(a.discard).toEqual([39]);
    expect(a.stock.length).toBe(47);
    expect(validCardSession(a)).toBe(true);
  });
  it("resolves two empty-stock blocked turns by hand points, including ties", () => {
    // Direct transition fixtures exercise house-rule scoring; import validation below rejects incomplete decks.
    const tie = fixture("crazy-eights", [1], [14], { stock: [] });
    const once = cardAction(tie, { type: "pass" });
    const twice = cardAction(once, { type: "pass" });
    expect(twice.result).toEqual({ winner: "tie", scores: [0, 0], reason: "blocked" });
    const lower = fixture("crazy-eights", [1], [15], { stock: [] });
    expect(cardAction(cardAction(lower, { type: "pass" }), { type: "pass" }).result).toEqual({
      winner: 0,
      scores: [1, 0],
      reason: "blocked",
    });
    const all = Array.from({ length: 52 }, (_, i) => i).filter((c) => c !== 39);
    // Wilds make a real blocked state impossible with a full 52-card deck and only two hands:
    // at least one player holds an eight, so a synthetic no-wild state must be rejected.
    const impossible = fixture("crazy-eights", [1], [14], {
      stock: [],
      passes: 2,
      result: { winner: "tie", scores: [0, 0], reason: "blocked" },
    });
    expect(validCardSession(impossible)).toBe(false);
    expect(all).toHaveLength(51);
    expect([0, 7, 12, 8].map(points)).toEqual([1, 50, 10, 9]);
  });
  it("CPU policy has no hidden-hand or stock-order input", () => {
    const s = fresh("crazy-eights");
    const view = cardPublicView(s);
    expect(Object.keys(view).sort()).toEqual(
      ["activeSuit", "canDraw", "drawn", "game", "hand", "opponentCount", "requests", "top"].sort()
    );
    const changed = {
      ...s,
      hands: [s.hands[0], s.hands[1].slice().reverse()] as [number[], number[]],
      stock: s.stock.slice().reverse(),
    };
    expect(chooseCardAction(cardPublicView(changed))).toEqual(chooseCardAction(view));
    view.hand.length = 0;
    expect(s.hands[0]).toHaveLength(7);
  });
  it("finishes 100 complete deterministic rounds per game with conservation checked each turn", () => {
    for (let seed = 0; seed < 100; seed++)
      for (const game of ["go-fish", "crazy-eights"] as const) finish(fresh(game, seed));
  }, 30000);
  it("roundtrips every saved decision through JSON without changing the next action", () => {
    for (const game of ["go-fish", "crazy-eights"] as const) {
      let s = fresh(game);
      for (let i = 0; i < 35 && !s.result; i++) {
        const saved: unknown = JSON.parse(JSON.stringify(s));
        expect(validCardSession(saved)).toBe(true);
        if (validCardSession(saved)) expect(computerCardTurn(saved)).toEqual(computerCardTurn(s));
        s = computerCardTurn(s);
      }
    }
  });
  it("rejects duplicate cards, incomplete decks, duplicate books, invalid suit/drawn/result and oversized imports", () => {
    const s = fresh("crazy-eights");
    expect(validCardSession({ ...s, hands: [[...s.hands[0], s.hands[0][0]], s.hands[1]] })).toBe(false);
    expect(validCardSession({ ...s, stock: s.stock.slice(1) })).toBe(false);
    expect(validCardSession({ ...s, activeSuit: "bad" })).toBe(false);
    expect(validCardSession({ ...s, drawn: s.hands[1][0] })).toBe(false);
    expect(validCardSession({ ...s, result: undefined })).toBe(false);
    expect(validCardSession({ ...s, message: "x".repeat(401) })).toBe(false);
    expect(validCardSession({ ...s, result: { winner: 0, scores: [0, 0], reason: "empty-hand" } })).toBe(false);
    for (const bad of [null, [], {}, { ...s, hands: null }, { ...s, options: null }])
      expect(validCardSession(bad)).toBe(false);
    expect(SUITS.map((_, i) => suit(i * 13))).toEqual(SUITS);
  });
});
