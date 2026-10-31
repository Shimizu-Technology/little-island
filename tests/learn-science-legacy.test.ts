import { describe, expect, it } from "vitest";
import { validLearnSession } from "../src/learn/session";
import { engines } from "../src/learn/engines";
import { emptySave, parseSave } from "../src/state/validation";
import { newMatch } from "../src/games/match";
import type { LearnId, LearnOptions } from "../src/learn/types";
import { upgrade, engine as tide } from "../src/learn/games/tide-pool/engine";
import { dock } from "../src/learn/games/float-sink/engine";
import { currentLevel, trail } from "../src/learn/games/crab-commands/engine";

/**
 * Real rounds saved by 1.4.0 (TestFlight build 10), produced by playing the 1.4.0 engines.
 * A rejected round would make parseSave refuse the whole family save, so every one must still load.
 */
const legacyRounds: Record<string, { o: LearnOptions; s: unknown }[]> = {
  "tide-pool": [
    {
      o: {
        mode: "together",
        pace: "medium",
      },
      s: {
        missions: ["rain", "snail", "coral", "light"],
        index: 2,
        pool: {
          light: true,
          warm: true,
          high: true,
          salt: 2,
          heat: 0,
          algae: 0,
          grazed: true,
          creatures: ["snail", "sea-star", "seaweed"],
        },
        action: "crab",
        guesses: [0, 1],
        result: true,
        last: "crab",
        rained: true,
        starter: 0,
      },
    },
    {
      o: {
        mode: "solo",
        pace: "easy",
      },
      s: {
        missions: ["snail", "crab", "coral"],
        index: 3,
        pool: {
          light: true,
          warm: false,
          high: true,
          salt: 2,
          heat: 0,
          algae: 0,
          grazed: true,
          creatures: ["crab", "snail", "fish", "seaweed", "coral"],
        },
        action: null,
        guesses: [],
        result: false,
        last: null,
        rained: false,
        starter: 0,
      },
    },
  ],
  "float-sink": [
    {
      o: {
        mode: "solo",
        pace: "medium",
      },
      s: {
        items: ["coin", "leaf", "rock", "apple"],
        starter: 0,
        events: [
          {
            kind: "predict",
            value: 1,
          },
          {
            kind: "drop",
          },
          {
            kind: "sort",
            value: 1,
          },
          {
            kind: "predict",
            value: 1,
          },
        ],
      },
    },
    {
      o: {
        mode: "versus",
        pace: "easy",
      },
      s: {
        items: ["cork", "key", "shell"],
        starter: 0,
        events: [
          {
            kind: "predict",
            value: 1,
          },
          {
            kind: "drop",
          },
          {
            kind: "sort",
            value: 0,
          },
          {
            kind: "predict",
            value: 0,
          },
          {
            kind: "drop",
          },
          {
            kind: "sort",
            value: 1,
          },
          {
            kind: "predict",
            value: 0,
          },
          {
            kind: "drop",
          },
          {
            kind: "sort",
            value: 1,
          },
          {
            kind: "shape",
            value: "ball",
          },
          {
            kind: "pass",
          },
          {
            kind: "shape",
            value: "foil",
          },
          {
            kind: "load",
          },
        ],
      },
    },
  ],
  "crab-commands": [
    {
      o: {
        mode: "solo",
        pace: "easy",
      },
      s: {
        levels: ["e8", "e4", "e7"],
        completed: [
          [
            "right",
            "right",
            "right",
            "down",
            "down",
            "left",
            "left",
            "left",
            "right",
            "right",
            "right",
            "right",
            "down",
            "down",
          ],
          ["down", "down", "right", "down", "right"],
        ],
        program: ["down", "down", "right", "right", "right", "left", "up", "up", "right", "up"],
        cursor: 10,
        running: false,
        starter: 0,
        cards: 29,
        debugging: true,
      },
    },
    {
      o: {
        mode: "solo",
        pace: "hard",
      },
      s: {
        levels: ["h8", "h7", "h6"],
        completed: [
          [
            "turn-right",
            "forward",
            "forward",
            "turn-left",
            "turn-left",
            "forward",
            "forward",
            "turn-right",
            "forward",
            "forward",
            "repeat",
            "turn-right",
            "forward",
            "forward",
          ],
        ],
        program: [
          "forward",
          "forward",
          "repeat",
          "turn-right",
          "forward",
          "forward",
          "turn-right",
          "forward",
          "forward",
          "repeat",
        ],
        cursor: 10,
        running: false,
        starter: 0,
        cards: 24,
        debugging: false,
      },
    },
  ],
};

function envelope(game: LearnId, o: LearnOptions, state: unknown) {
  const two = o.mode !== "solo";
  return {
    game,
    version: 1 as const,
    id: `${game}-legacy-1`,
    revision: 7,
    options: o,
    ...(two ? { names: ["Mia", "Dad"] as [string, string], starter: 0 as const } : {}),
    ...(o.mode === "versus" ? { match: newMatch(["Mia", "Dad"], true) } : {}),
    state,
  };
}
describe("1.4.0 science and thinking rounds still load", () => {
  for (const [game, rounds] of Object.entries(legacyRounds))
    rounds.forEach(({ o, s }, i) =>
      it(`${game} round ${i + 1} (${o.mode}/${o.pace}) passes validLearnSession and parseSave`, () => {
        const session = envelope(game as LearnId, o, s);
        expect(validLearnSession(session, game)).toBe(true);
        expect(() =>
          parseSave(JSON.stringify({ ...emptySave(), learn: { [game]: session }, recentLearn: game }))
        ).not.toThrow();
        const engine = engines[game as LearnId];
        expect(() => engine.outcome(s as never, o)).not.toThrow();
        // The board can continue or show the finish card.
        if (game === "tide-pool") expect(tide.validate(upgrade(s as never, o), o)).toBe(true);
        if (game === "float-sink") expect(dock(s as never, o)).not.toBeNull();
        if (game === "crab-commands") {
          const l = currentLevel(s as never);
          expect(l).toBeTruthy();
          expect(() => trail(l, (s as { program: never[] }).program)).not.toThrow();
        }
      })
    );
  it("a finished 1.4.0 Tide Pool round shows as finished", () => {
    const { o, s } = legacyRounds["tide-pool"][1];
    expect(tide.outcome(s as never, o)).toBe("done");
  });
});
