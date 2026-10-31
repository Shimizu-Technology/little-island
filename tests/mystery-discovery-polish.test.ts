import { describe, expect, it } from "vitest";
import { applyMysteryIntent, BELL, createMysterySession, mysteryView, tickMystery, validMysterySession, validMysteryView } from "../src/mystery/engine";
function voting() {
  let s = createMysterySession(["A", "B", "C", "D"].map((name, i) => ({ id: `p${i}`, name })), 42, "crew", "vote-test");
  s = { ...s, players: s.players.map((p, i) => i ? p : { ...p, ...BELL }) };
  s = applyMysteryIntent(s, "p0", { type: "meeting" });
  for (const p of s.players) s = applyMysteryIntent(s, p.id, { type: "ready" });
  return s;
}
describe("discovery polish durable results", () => {
  it("records a caught role and aggregate tally while retaining the exact redacted wire shape", () => {
    let s = voting();
    const originalViewKeys = Object.keys(mysteryView(s, "p0")).sort();
    const culprit = s.players.find((p) => p.role === "mischief")!;
    for (const p of s.players) s = applyMysteryIntent(s, p.id, { type: "vote", target: culprit.id });
    expect(s.voteSummary).toEqual({ accusedId: culprit.id, role: "mischief", tally: { [culprit.id]: 4 } });
    expect(validMysterySession(s)).toBe(true);
    const restored = JSON.parse(JSON.stringify(s));
    expect(validMysterySession(restored)).toBe(true);
    const view = mysteryView(restored, "p0");
    expect(Object.keys(view).sort()).toEqual(originalViewKeys);
    expect(validMysteryView(view)).toBe(true);
    expect(view.events).toContain(`Vote result: ${culprit.name} was accused: mischief maker caught!`);
    expect(view.events).toContain(`Vote tally: ${culprit.name}: 4`);
    expect(view.players.every((p) => !("role" in p))).toBe(true);
    expect("voteSummary" in view).toBe(false);
    restored.events = Array.from({ length: 12 }, (_, i) => `New public event ${i}`);
    const laterView = mysteryView(restored, "p0");
    expect(laterView.events).toHaveLength(12);
    expect(laterView.events.at(-1)).toBe("New public event 11");
    expect(laterView.events).toContain(`Vote tally: ${culprit.name}: 4`);
    expect(validMysteryView(laterView)).toBe(true);
  });
  it("keeps original saves valid and rejects forged, inconsistent, or oversized result fields", () => {
    const s = voting();
    expect(validMysterySession(s)).toBe(true);
    for (const voteSummary of [null, {}, { accusedId: null, role: "crew", tally: { skip: 4 } }, { accusedId: null, role: null, tally: { unknown: 1 } }, { accusedId: null, role: null, tally: { skip: 9 } }])
      expect(validMysterySession({ ...s, voteSummary })).toBe(false);
  });
  it("records ties and explicit skip ballots without inventing an accused role", () => {
    let s = voting();
    s = applyMysteryIntent(s, "p0", { type: "vote", target: "p1" });
    s = applyMysteryIntent(s, "p1", { type: "vote", target: "p0" });
    for (let i = 0; i < 25; i++) s = tickMystery(s);
    expect(s.phase).toBe("voting");
    for (const id of ["p2", "p3"]) s = applyMysteryIntent(s, id, { type: "vote", target: "skip" });
    expect(s.voteSummary).toEqual({ accusedId: null, role: null, tally: { p1: 1, p0: 1, skip: 2 } });
    expect(validMysterySession(s)).toBe(true);
  });
});
