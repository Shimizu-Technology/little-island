import { describe, expect, it, vi } from "vitest";
import speech from "../scripts/arcade-speech.json";
import { arcadeGames } from "../src/arcade/registry";
import { arcadePlays } from "../src/arcade/plays";
import { allLevelIds, arcadeIds } from "../src/arcade/types";
import { validPracticeSettings } from "../src/practice/types";
// Exercise the actual declarative table without loading native renderers in Node.
vi.mock("react-native", () => ({ View: () => null }));
vi.mock("../src/arcade/games/reef-builder/View", () => ({ ReefBoard: () => null }));
vi.mock("../src/arcade/games/shell-song/View", () => ({ SongBoard: () => null }));
vi.mock("../src/arcade/games/canoe-cargo/Art", () => ({ CargoScene: () => null }));
vi.mock("../src/arcade/games/canoe-cargo/View", () => ({ CargoBoard: () => null }));
vi.mock("../src/arcade/games/scrolling/Art", () => ({ Scenery: () => null }));
vi.mock("../src/arcade/games/scrolling/Teaching", () => ({ Rehearsal: () => null }));
vi.mock("../src/arcade/games/scrolling/Board", () => ({ ScrollBoard: () => null }));
vi.mock("../src/arcade/games/rail-parade/View", () => ({ RailBoard: () => null }));
vi.mock("../src/arcade/games/crab-crossing/View", () => ({ CrabBoard: () => null }));
vi.mock("../src/arcade/games/grid/Art", () => ({ GridBackdrop: () => null }));
vi.mock("../src/arcade/games/grid/Teaching", () => ({ GridTeaching: () => null }));
vi.mock("../src/arcade/action/Art", () => ({ Scene: () => null }));
vi.mock("../src/arcade/action/Teaching", () => ({ Demo: () => null, actionInstruction: () => "Goal" }));
vi.mock("../src/arcade/action/Playfield", () => ({ BeachBoard: () => null, PalmBoard: () => null }));

describe("one play table for the arcade", () => {
  it("covers every registered game with all 56 level identities and registered speech", () => {
    expect(Object.keys(arcadePlays).sort()).toEqual([...arcadeIds].sort());
    for (const game of arcadeGames) {
      const play = arcadePlays[game.id];
      expect(play.clearedTitle.length).toBeGreaterThan(0);
      expect(play.fullBleed).toBe(true);
      expect(play.levels.map(l => l.id)).toEqual(allLevelIds);
      for (const level of play.levels) {
        expect(play.level(level.id)).toEqual(level);
        expect(game.worlds.some(w => w.id === level.world)).toBe(true);
        expect(level.goals).toHaveLength(3);
        expect(play.goal?.(level, false)?.length).toBeGreaterThan(0);
        for (const together of [false, true]) {
          expect(speech).toHaveProperty(play.speech(level.world === "learn", together));
          expect(speech).toHaveProperty((play.startSpeech ?? play.speech)(level.world === "learn", together));
        }
      }
    }
  });
  it("preserves every learning skill, subject, and practice range", () => {
    for (const [id, play] of Object.entries(arcadePlays)) {
      for (const level of play.levels.filter(l => l.world === "learn")) {
        const credit = play.learningSkill(level);
        if (id === "beach-ball") { expect(credit).toBeNull(); continue; }
        expect(credit).not.toBeNull();
        expect(validPracticeSettings(credit!.config)).toBe(true);
        expect(credit!.skill).toMatch(/^(num|read)\./);
        if (id === "fruit-bat-flight" || id === "lagoon-run") {
          expect(credit).toEqual({ skill: `num.${level.index >= 5 && level.index % 2 === 0 ? "subtract" : "add"}-within-${level.index < 5 ? 10 : 20}`, config: { enabled: true, subject: "math", operation: "mixed", limit: level.index < 5 ? 10 : 20 } });
        } else {
          expect(credit!.config.limit).toBe(10);
        }
        if (id === "palm-patrol") expect(credit!.skill).toBe(level.index === 4 || level.index >= 7 ? "num.subtract-within-20" : "num.add-within-20");
        if (id === "crab-crossing") expect(credit!.skill).toBe("num.number-line");
        if (id === "reef-builder") expect(credit!.skill).toBe("num.make-ten");
        if (id === "shell-song") expect(credit!.config.subject).toBe("reading");
      }
    }
  });
});
