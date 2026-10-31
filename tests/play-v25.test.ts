import { describe, expect, it } from "vitest";
import { nextStarGoal } from "../src/arcade/presentation";
import { createRaceSession, startRace, stepRace, RACE_LIMIT_TICKS, validRaceSession } from "../src/racer/engine";
import { createMysterySession, applyMysteryIntent, tickMystery, BELL, PUMP, validMysterySession } from "../src/mystery/engine";
import { createRail, railLevel, railStep, railTransition } from "../src/arcade/games/rail-parade/engine";
import { createReef, reefLevel, reefTransition } from "../src/arcade/games/reef-builder/engine";
import { createPalm, palmLevel, palmWorkedHint, palmTransition } from "../src/arcade/games/palm-patrol/engine";
import { createCargo, cargoLevel, cargoRowPreview, cargoTransition, COLS, ROWS } from "../src/arcade/games/canoe-cargo/engine";
import { songChunks } from "../src/arcade/games/shell-song/engine";
import * as coconut from "../src/board/coconut-drop/engine";
import * as nets from "../src/board/fishing-nets/engine";
import { createNumbers, numberAdvice, numberChoices } from "../src/games/numbers";
import { goFishAdvice, cardPublicView, createCardSession } from "../src/cards/engine";

describe("2.5 play guidance and comfortable pacing", () => {
  it("Practice survives the old deadline, remains valid, and Race still ends", () => {
    for (const mode of ["practice", "race"] as const) {
      let s = startRace(createRaceSession("training", mode, 1));
      for (let i = 0; i < RACE_LIMIT_TICKS + 120; i++) s = stepRace(s, { direction: 0 });
      expect(s.status).toBe(mode === "practice" ? "running" : "timedout");
      expect(validRaceSession(s)).toBe(true);
    }
  });
  it("nearby waits for every Ready and every vote; pump never loses by time", () => {
    const seats = ["host", "a", "b"].map(id => ({ id, name: id }));
    let s = createMysterySession(seats, 42, "crew", "ready-room");
    s = { ...s, players: s.players.map((p, i) => i ? p : { ...p, ...BELL }) };
    s = applyMysteryIntent(s, "host", { type: "meeting" });
    for (let i = 0; i < 120; i++) s = tickMystery(s);
    expect(s.phase).toBe("discussion");
    for (const id of ["host", "a"]) s = applyMysteryIntent(s, id, { type: "ready" });
    expect(s.phase).toBe("discussion");
    s = applyMysteryIntent(s, "b", { type: "ready" });
    expect(s.phase).toBe("voting");
    s = applyMysteryIntent(s, "host", { type: "vote", target: "skip" });
    for (let i = 0; i < 120; i++) s = tickMystery(s);
    expect(s.phase).toBe("voting"); expect(Object.keys(s.votes)).toEqual(["host"]);
    for (const id of ["a", "b"]) s = applyMysteryIntent(s, id, { type: "vote", target: "skip" });
    expect(s.phase).toBe("explore");
    const mischief = s.players.find(p => p.role === "mischief")!;
    s = { ...s, players: s.players.map(p => p.id === mischief.id ? { ...p, ...PUMP } : p) };
    s = applyMysteryIntent(s, mischief.id, { type: "sabotage" });
    for (let i = 0; i < 100; i++) s = tickMystery(s);
    expect(s.result).toBeNull(); expect(s.sabotage?.left).toBe(60); expect(validMysterySession(s)).toBe(true);
  });
  it("Rail waits indefinitely for a first direction, including straight ahead", () => {
    const s = createRail(railLevel("w1-1"), 1);
    expect(railStep(s, { type: "tick" }, .1)).toBe(s);
    let next = railTransition(s, { type: "turn", direction: "right" });
    for (let i = 0; i < 5; i++) next = railStep(next, { type: "tick" }, .1);
    expect(next.moves).toBeGreaterThan(0);
  });
  it("Reef rejection includes the attempted sum without spending a move", () => {
    const s = createReef(reefLevel("learn-8"), 1, false);
    const fixture = { ...s, board: Array(64).fill(0), pieces: [{ cells: [[0,0]] as [number, number][], value: 8, color: 0 }, null, null] };
    fixture.board[0] = 4;
    const next = reefTransition(fixture, { type: "place", slot: 0, row: 0, col: 1 });
    expect(next.message).toContain("4 + 8 = 12"); expect(next.moves).toBe(s.moves); expect(next.board).toBe(fixture.board);
  });
  it("Palm help derives the worked objects and result from the same fact", () => {
    const s = createPalm(palmLevel("learn-8"), 3, false);
    const hint = palmWorkedHint(s);
    expect(hint.answer).toBe(s.answer); expect(hint.groups.flat().filter(Boolean)).toHaveLength(s.answer);
    expect(palmTransition(s, { type: "help" }).helped).toBe(true);
  });
  it("Cargo preview agrees with the real row bonus", () => {
    const s = createCargo(cargoLevel("learn-1"), 1, false);
    s.board = Array(COLS * ROWS).fill(null);
    for (let c = 0; c < 5; c++) s.board[(ROWS - 1) * COLS + c] = { kind: "crate", value: 1, stuck: false };
    s.piece = { shape: 0, turn: 0, kind: "crate", value: 1 }; s.col = 5;
    const preview = cargoRowPreview(s).find(p => p.row === ROWS - 1)!;
    expect(preview.sum).toBe(9); expect(preview.canoes).toBe(2);
    expect(cargoTransition(s, { type: "drop" }).canoes).toBe(2);
  });
  it("listening chunks preserve every note in order", () => {
    const pattern = Array.from({ length: 15 }, (_, i) => i % 6);
    expect(songChunks(pattern).flat()).toEqual(pattern); expect(songChunks(pattern).every(c => c.length <= 3)).toBe(true);
  });
  it("Coconut explains a win and an immediate block", () => {
    let s = coconut.create();
    for (const c of [0, 6, 1, 6, 2, 5]) s = coconut.move(s, c);
    expect(coconut.hintReason(s, 3)).toContain("four");
    expect(coconut.hintReason({ ...s, turn: 1 }, 3)).toContain("Block");
  });
  it("Nets explains the actual box and third-side risk", () => {
    let s = nets.create(); const edges = nets.boxEdges(3, 0);
    for (const e of edges.slice(0, 2)) s = nets.move(s, e);
    expect(nets.hintReason(s, edges[2])).toContain("third side");
    s = nets.move(s, edges[2]);
    expect(nets.hintReason(s, edges[3])).toContain("A1");
  });
  it("Numbers compares only legal combinations with a modest trade-off", () => {
    const s = { ...createNumbers({ mode: "solo", difficulty: "medium", computerFirst: false }), dice: [2, 3] };
    const advice = numberAdvice(s);
    expect(advice.choices.length).toBe(2);
    expect(advice.choices.every(c => numberChoices(s.available, 5).some(a => a.join() === c.join()))).toBe(true);
    expect(advice.text).toContain("small");
  });
  it("Go Fish advice needs only the child's public view", () => {
    const s = createCardSession("go-fish", { mode: "solo", difficulty: "easy", computerFirst: false }, 1);
    const v = cardPublicView(s), advice = goFishAdvice(v);
    expect(advice).toContain("Ask");
    expect(goFishAdvice({ ...v, opponentCount: 99 })).toBe(advice);
  });
});

it("the next goal uses already-earned stars, even after a harder replay", () => {
  const goals = ["Clear", "One slip", "No slips"] as const;
  expect(nextStarGoal(goals, 2)).toContain("No slips");
  expect(nextStarGoal(goals, 3)).toContain("All three");
});
