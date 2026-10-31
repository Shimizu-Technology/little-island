import { describe, expect, it } from "vitest";
import {
  MysterySession,
  MysteryView,
  TASKS,
  applyMysteryIntent,
  createMysterySession,
  mysteryView,
  pathStep,
  playSoloIntent,
  validMysterySession,
} from "../src/mystery/engine";
import { firstJobGuide } from "../src/mystery/firstJobGuide";

const fresh = () => createMysterySession(undefined, 7, "crew", "first-job");
const view = (s: MysterySession) => mysteryView(s, s.players[0].id);
const garden = TASKS.find((t) => t.id === "garden")!;
function walkToGarden(s: MysterySession) {
  let step;
  while ((step = pathStep(s.players[0], garden))) {
    const p = s.players[0];
    s = playSoloIntent(s, { type: "step", fromX: p.x, fromY: p.y, dx: step.x, dy: step.y });
  }
  return s;
}

describe("optional first-job guidance", () => {
  it("follows actual walking and unordered unique watering across crew seeds", () => {
    for (let seed = 0; seed < 24; seed++) {
      let s = createMysterySession(undefined, seed, "crew");
      expect(firstJobGuide(view(s))).toEqual({ stage: "walk", growing: 0 });
      s = walkToGarden(s);
      expect(firstJobGuide(view(s))).toEqual({ stage: "water", growing: 0 });
      for (const [index, choice] of [2, 0, 1].entries()) {
        s = playSoloIntent(s, { type: "task", task: "garden", choice });
        expect(validMysterySession(s)).toBe(true);
        expect(firstJobGuide(view(s))).toEqual({ stage: index === 2 ? "explore" : "water", growing: index + 1 });
        // Repeated presses do not earn progress, beats, or recognition.
        expect(playSoloIntent(s, { type: "task", task: "garden", choice })).toBe(s);
      }
    }
  });

  it("reading and deriving the guide never mutate or advance the session", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    for (let read = 0; read < 100; read++) firstJobGuide(view(s));
    expect(JSON.stringify(s)).toBe(before);
    expect(s.tick).toBe(0);
  });

  it("resumes saved partial watering and never sends completed Garden back to walking", () => {
    let s = walkToGarden(fresh());
    s = playSoloIntent(s, { type: "task", task: "garden", choice: 1 });
    const restored = JSON.parse(JSON.stringify(s)) as MysterySession;
    expect(validMysterySession(restored)).toBe(true);
    expect(firstJobGuide(view(restored))).toEqual({ stage: "water", growing: 1 });
    for (const choice of [0, 2]) s = playSoloIntent(s, { type: "task", task: "garden", choice });
    s = playSoloIntent(s, { type: "move", dx: 1, dy: 0 });
    expect(firstJobGuide(view(JSON.parse(JSON.stringify(s))))).toBeNull();
  });

  it("recognizes shared completion without requiring or inventing a personal finished-job clue", () => {
    let s = walkToGarden(fresh());
    const helper = s.players.find((p) => p.bot && p.role === "crew")!;
    s = { ...s, players: s.players.map((p) => p.id === helper.id ? { ...p, x: garden.x, y: garden.y } : p) };
    for (const choice of [0, 1, 2])
      s = applyMysteryIntent(s, helper.id, { type: "task", task: "garden", choice });
    expect(s.players[0].clues.some((c) => c.startsWith("You finished"))).toBe(false);
    expect(firstJobGuide(view(s))).toEqual({ stage: "explore", growing: 3 });
  });

  it.each([
    ["mischief", { ownRole: "mischief" }],
    ["nearby", { solo: false }],
    ["legacy", { adventure: undefined }],
    ["paused", { paused: true }],
    ["discussion", { phase: "discussion" }],
    ["voting", { phase: "voting" }],
    ["finished", { phase: "finished", result: { winner: "crew", reason: "caught" } }],
    ["water off", { sabotage: { left: 60, progress: 0 } }],
    ["later opening", { tick: 19 }],
    ["another job begun", { tasks: { garden: 0, stars: 1, picnic: 0, dock: 0 } }],
  ] satisfies [string, Partial<MysteryView>][])("does not prompt during %s", (_, patch) => {
    expect(firstJobGuide({ ...view(fresh()), ...patch })).toBeNull();
  });

  it("does not restart after meeting, helper status, or choosing another station", () => {
    const start = view(fresh());
    for (const patch of [{ meetings: 1 }, { out: true }, { x: TASKS[1].x, y: TASKS[1].y }]) {
      const changed = { ...start, players: start.players.map((p, i) => i === 0 ? { ...p, ...patch } : p) };
      expect(firstJobGuide(changed)).toBeNull();
    }
    // The cutoff is saved play progress, so remounting/reloading cannot reset it.
    const later = { ...fresh(), tick: 19 };
    expect(firstJobGuide(view(JSON.parse(JSON.stringify(later))))).toBeNull();
  });

  it("never recognizes completion from mismatched task and bed data", () => {
    const start = view(walkToGarden(fresh()));
    expect(firstJobGuide({ ...start, tasks: { ...start.tasks, garden: 3 } })).toBeNull();
    expect(firstJobGuide({ ...start, adventure: {
      ...start.adventure!, taskData: { ...start.adventure!.taskData, garden: 7 },
    } })).toBeNull();
  });

  it("keeps the same watering step across a pause and resume without consuming beats", () => {
    let s = walkToGarden(fresh());
    s = playSoloIntent(s, { type: "task", task: "garden", choice: 0 });
    const before = view(s);
    expect(firstJobGuide({ ...before, paused: true })).toBeNull();
    const resumed = JSON.parse(JSON.stringify(before)) as MysteryView;
    expect(firstJobGuide(resumed)).toEqual({ stage: "water", growing: 1 });
    expect(resumed.tick).toBe(before.tick);
  });
});
