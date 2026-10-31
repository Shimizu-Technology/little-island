import { describe, expect, it } from "vitest";
import { allLevelIds, nextRandom, worldIds } from "../src/arcade";
import { reefLevels } from "../src/arcade/games/reef-builder/engine";
import { createSong, glowingShell, noteDuration, songEngine, songLevel, songLevels, songResult, songStep, songTiles, songTransition, songWords, type SongState } from "../src/arcade/games/shell-song/engine";
import { advanceClock, FIXED_DT, snapDrop, swipeDirection } from "../src/arcade/clock";
import { wordEntry } from "../src/learn/kit/reading";
function hear(s: SongState) { for (let n = 0; n < 2000 && s.phase === "watch"; n++) s = songStep(s, { type: "tick" }, FIXED_DT); return s; }
function solveSong(initial: SongState): SongState {
  let s = initial;
  for (let round = 0; round < 20; round++) {
    s = hear(s);
    for (const index of [...s.pattern]) s = songTransition(s, { type: "shell", index });
    if (s.phase === "picture" && s.level !== "endless") s = songTransition(s, { type: "picture", word: s.level.word! });
    if (songResult(s)) return s;
  }
  throw new Error("Song did not end");
}
describe("arcade content and fixed input contract", () => {
  it("has six eight-level worlds and a complete learning world in both games", () => {
    for (const levels of [reefLevels, songLevels]) { expect(levels.map(l => l.id)).toEqual(allLevelIds); for (const world of worldIds) expect(levels.filter(l => l.world === world)).toHaveLength(8); expect(levels.every(l => l.goals.length === 3 && l.goals.every(Boolean))).toBe(true); }
    expect(songWords).toHaveLength(8); expect(songWords.every(w => wordEntry(w)?.tiles.length === 3)).toBe(true);
  });
  it("clamps long frames, preserves fixed steps, and ignores invalid time", () => {
    let clock = { remainder: 0, ticks: 0, dropped: 0 };
    for (let n = 0; n < 120; n++) clock = advanceClock(clock, 1 / 120).clock;
    expect(clock.ticks).toBe(60); expect(clock.remainder).toBeCloseTo(0);
    const long = advanceClock(clock, 4); expect(long.steps).toBe(6); expect(long.clock.dropped).toBeCloseTo(3.9);
    for (const dt of [NaN, Infinity, -1, 0]) expect(advanceClock(clock, dt).clock).toBe(clock);
  });
  it("uses stable RNG and snaps touch coordinates without placing outside the board", () => {
    expect(nextRandom(1)).toEqual(nextRandom(1)); expect(nextRandom(1)).not.toEqual(nextRandom(2));
    const rect = { x: 10, y: 100, width: 320, height: 320 };
    expect(snapDrop(329, 419, rect, 8, 8)).toEqual({ row: 7, col: 7 }); expect(snapDrop(330, 420, rect, 8, 8)).toBeNull(); expect(snapDrop(9, 100, rect, 8, 8)).toBeNull();
    expect(swipeDirection(6, 8)).toBeNull(); expect(swipeDirection(-40, 5)).toBe("left"); expect(swipeDirection(4, -60)).toBe("up");
  });
});
describe("Shell Song", () => {
  it.each(allLevelIds)("completes %s by the actual reducer, including word/picture learning", id => {
    const s = solveSong(createSong(songLevel(id), 18, false)); expect(songResult(s)?.stars).toBe(3); expect(s.slips).toBe(0); expect(songEngine.result(s)?.cleared).toBe(true);
  });
  it("ignores early taps, allows untimed input and replays exactly the same song", () => {
    const s = createSong(songLevel("w1-1"), 21, false); expect(songTransition(s, { type: "shell", index: s.pattern[0] })).toBe(s);
    let ready = hear(s); ready = songStep(ready, { type: "tick" }, 500); expect(ready.phase).toBe("repeat");
    expect(songTransition(ready, { type: "replay" }).pattern).toEqual(s.pattern); expect(noteDuration({ ...s, helper: true })).toBeGreaterThan(noteDuration(s));
    expect(glowingShell({ ...s, elapsed: 460 })).toBe(s.pattern[0]);
  });
  it("retries wrong patterns, ends after three slips without Helper, and keeps Helper stars", () => {
    let s = createSong(songLevel("w1-1"), 31, false);
    for (let n = 0; n < 3; n++) { s = hear(s); s = songTransition(s, { type: "shell", index: (s.pattern[0] + 1) % s.shells }); }
    expect(s.phase).toBe("over"); expect(songResult(s)?.stars).toBe(0);
    let helped = createSong(songLevel("w1-1"), 31, true);
    for (let n = 0; n < 4; n++) { helped = hear(helped); helped = songTransition(helped, { type: "shell", index: (helped.pattern[0] + 1) % helped.shells }); }
    expect(helped.phase).toBe("watch"); expect(songResult(solveSong(helped))?.stars).toBe(1);
    expect(songResult(solveSong(createSong(songLevel("w1-1"), 31, true)))?.stars).toBe(3);
  });
  it("marks reading help/wrong pictures as helped, without a deadline or forced loss", () => {
    let s = hear(createSong(songLevel("learn-1"), 5, false)); for (const index of s.pattern) s = songTransition(s, { type: "shell", index });
    expect(s.phase).toBe("picture"); expect(songTiles(s)).toEqual(wordEntry(songLevel("learn-1").word!)!.tiles);
    for (let i = 0; i < 6; i++) s = songTransition(s, { type: "picture", word: s.choices.find(w => w !== songLevel("learn-1").word)! });
    expect(s.phase).toBe("picture"); expect(s.helped).toBe(true); expect(songTransition(s, { type: "picture", word: songLevel("learn-1").word! }).phase).toBe("cleared");
  });
  it("does not mutate previous state or accept invalid input", () => {
    const s = hear(createSong(songLevel("w2-1"), 4)), copy = JSON.stringify(s);
    for (const index of [-1, NaN, 7, .5]) expect(songTransition(s, { type: "shell", index })).toBe(s);
    songTransition(s, { type: "shell", index: s.pattern[0] }); expect(JSON.stringify(s)).toBe(copy);
    expect(songResult(songTransition(createSong("endless", 1), { type: "finish" }))?.stars).toBe(0);
  });
});

it("break reminders add only active play, across game segments, and stay off by default", async () => {
  const { changeBreakClock, breakDue } = await import("../src/arcade/breakClock");
  let clock = { played: 0, since: null } as import("../src/arcade/breakClock").BreakClock;
  clock = changeBreakClock(clock, true, 1000); clock = changeBreakClock(clock, false, 601000);
  expect(clock.played).toBe(600000); expect(breakDue(clock, 15, 99999999)).toBe(false);
  clock = changeBreakClock(clock, true, 2000000); expect(breakDue(clock, 15, 2300000)).toBe(true); expect(breakDue(clock, 0, 2300000)).toBe(false);
  expect(changeBreakClock(clock, true, 2300000)).toBe(clock);
});
