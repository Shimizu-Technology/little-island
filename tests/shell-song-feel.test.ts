import { describe, expect, it } from "vitest";
import { createSong, glowingShell, noteDuration, songLevel, songLevels, songResult, songStep, songTransition, validSong, type SongState } from "../src/arcade/games/shell-song/engine";
const hear = (initial: SongState) => { let s = initial; for (let i = 0; i < 5000 && s.phase === "watch"; i++) s = songStep(s, { type: "tick" }, 1 / 60); return s; };
function phrase(initial: SongState) { let s = hear(initial); for (const index of s.pattern) s = songTransition(s, { type: "shell", index }); return s; }
function clear(initial: SongState) { let s = initial; for (let i = 0; i < 8 && !songResult(s); i++) { s = phrase(s); if (s.phase === "picture" && s.level !== "endless") s = songTransition(s, { type: "picture", word: s.level.word! }); expect(validSong(s)).toBe(true); } return s; }
function slip(s: SongState) { s = hear(s); return songTransition(s, { type: "shell", index: (s.pattern[0] + 1) % s.shells }); }
describe("Shell Song feel curve", () => {
  it.each(songLevels.map(l => [l.id] as const))("validates, deterministically clears %s with either Helper setting", id => {
    for (const helper of [false, true]) {
      const a = createSong(songLevel(id), 42, helper), b = createSong(songLevel(id), 42, helper);
      expect(a).toEqual(b); expect(validSong(a)).toBe(true);
      const result = clear(a); expect(songResult(result)).toMatchObject({ cleared: true, stars: 3 });
      expect(result).toEqual(clear(b));
    }
  });
  it("ramps within every arcade level and across worlds, without timing recall", () => {
    for (const level of songLevels.filter(l => !l.word)) {
      const a = createSong(level, 42), b = phrase(a);
      expect(noteDuration(b)).toBeLessThan(noteDuration(a));
      const ready = hear(b); expect(songStep(ready, { type: "tick" }, 99).phase).toBe("repeat");
      expect(noteDuration({ ...a, helper: true }) - noteDuration(a)).toBe(120);
    }
    expect(["w1-1", "w3-8", "w6-8"].map(id => songLevel(id as "w1-1").noteMs)).toEqual([650, 418, 318]);
    expect([0, 1, 2].map(rounds => noteDuration({ ...createSong(songLevel("w1-1"), 1), rounds }))).toEqual([650, 600, 550]);
  });
  it("publishes every onset including repeated shells at fixed-clock precision", () => {
    let s = { ...createSong(songLevel("w3-8"), 1), pattern: [2, 2, 0] };
    const onsets: { at: number; note: number | null }[] = [];
    for (let i = 0; i < 200 && s.phase === "watch"; i++) { const old = s; s = songStep(s, { type: "tick" }, 1 / 60); if (s.onset !== old.onset) { expect(s.event).toBeGreaterThan(old.event); onsets.push({ at: s.elapsed, note: glowingShell(s) }); } }
    expect(onsets.map(o => o.note)).toEqual([2, 2, 0]);
    onsets.forEach((o, i) => expect(Math.abs(o.at - (450 + i * 418))).toBeLessThanOrEqual(1000 / 60 + .001));
  });
  it("does not reveal arcade answers through show, even with Helper", () => {
    const s = hear(createSong(songLevel("w1-1"), 1, true)); expect(songTransition(s, { type: "show" })).toBe(s);
    expect(songTransition(hear(createSong(songLevel("learn-1"), 1, true)), { type: "show" }).helped).toBe(true);
  });
  it.each([false, true])("loses exactly 3/5 hearts, preserves damage on Helper toggle (%s)", helper => {
    let s = createSong(songLevel("w1-1"), 42, helper);
    for (let i = 0; i < (helper ? 5 : 3); i++) { s = slip(s); expect(s.lives.hearts).toBe((helper ? 5 : 3) - i - 1); }
    expect(songResult(s)).toMatchObject({ outcome: "game-over", stars: 0 }); expect(validSong(s)).toBe(true);
    expect(songTransition(s, { type: "replay" })).toBe(s);
    const damaged = slip(createSong(songLevel("w1-1"), 42));
    expect(songTransition(damaged, { type: "helper", value: true }).lives.hearts).toBe(4);
  });
  it.each([[0, 3], [1, 2], [2, 1]])("awards %s-slip clears %s stars", (slips, stars) => {
    let s = createSong(songLevel("w1-1"), 42); for (let i = 0; i < slips; i++) s = slip(s);
    expect(songResult(clear(s))?.stars).toBe(stars);
  });
  it("restarts the same phrase on a tempo toggle without refilling damage or skipping notes", () => {
    let s = createSong(songLevel("w3-8"), 42);
    for (let i = 0; i < 60; i++) s = songStep(s, { type: "tick" }, 1 / 60);
    const changed = songTransition(s, { type: "helper", value: true });
    expect(changed).toMatchObject({ phase: "watch", elapsed: 0, cursor: 0 }); expect(changed.pattern).toEqual(s.pattern); expect(validSong(changed)).toBe(true);
    const done = clear(s); expect(songTransition(done, { type: "helper", value: true })).toBe(done);
  });
  it("keeps learning unlimited, with an unchanged slow cadence", () => {
    let s = createSong(songLevel("learn-1"), 42); for (let i = 0; i < 8; i++) s = slip(s);
    expect(s.lives.hearts).toBe(3); expect(noteDuration(s)).toBe(3200); expect(songResult(clear(s))?.cleared).toBe(true);
  });
  it("authors distinct later-world phrase rules", () => {
    const call = createSong(songLevel("w4-1"), 42), response = phrase(call);
    expect(response.pattern.slice(0, call.pattern.length)).not.toEqual(call.pattern); expect(response.pattern).toHaveLength(call.pattern.length + 1);
    const twins = createSong(songLevel("w5-1"), 42);
    for (let i = 0; i < twins.pattern.length; i += 2) expect(twins.pattern[i]).toBe(twins.pattern[i + 1]);
    const finale = createSong(songLevel("w6-1"), 42); expect(phrase(finale).pattern).toHaveLength(finale.pattern.length + 2);
  });
  it("rejects malformed runtime states and authored-level tampering", () => {
    const s = createSong(songLevel("w1-1"), 42);
    for (const bad of [{ ...s, onset: -1 }, { ...s, extra: true }, { ...s, shells: 6 }, { ...s, level: { ...songLevel("w1-1"), noteMs: 1 } }, { ...s, phase: "over" }, { ...s, lives: { ...s.lives, maxHearts: 5 } }, { ...s, elapsed: NaN }, { ...s, pattern: [9] }, { ...s, cursor: 99 }, { ...s, phase: "picture" }]) expect(validSong(bad)).toBe(false);
  });
});
