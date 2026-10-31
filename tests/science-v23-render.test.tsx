import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ScienceBoard } from "../src/learn/games/weather-watch/ScienceBoard";
import { engine as weather } from "../src/learn/games/weather-watch/engine";
import { engine as food } from "../src/learn/games/food-web/engine";
import { engine as space } from "../src/learn/games/space-station/engine";
import { optionsAtLevel, levelNumbers } from "../src/learn/levels";
import { random } from "../src/games/types";
import type { Game } from "../src/learn/games/weather-watch/model";
vi.mock("../src/islander/active", async () => {
  const { defaultLook } = await import("../src/islander/look");
  return { useActiveIslanderLook: () => defaultLook };
});
vi.mock("react-native", () => ({
  TextInput: "input",
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("react-native-svg", () => ({
  default: "svg",
  G: "g",
  Path: "path",
  Circle: "circle",
  Ellipse: "ellipse",
  Rect: "rect",
  Line: "line",
  Text: "text",
  Defs: "defs",
  RadialGradient: "radialGradient",
  Stop: "stop",
}));
vi.mock("../src/learn/Coach", () => ({
  CoachSpot: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../src/components/ui", () => ({
  font: "Arial",
  Copy: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  PressableScale: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
for (const engine of [weather, food, space])
  for (const level of levelNumbers)
    it(`${engine.id} ${level} renders its simulation with labelled controls`, () => {
      const options = optionsAtLevel({ mode: "solo", pace: "easy" }, level),
        state = engine.create(options, { skills: {}, rng: random(1), starter: 0, today: 0 });
      const html = renderToStaticMarkup(
        <ScienceBoard
          game={engine.id as Game}
          session={{ game: engine.id, version: 1, id: "test", revision: 0, options, state }}
          update={() => {}}
          practice={() => {}}
          skills={{}}
          sound={() => {}}
          stopSound={() => {}}
          soundOn={false}
          width={350}
          height={750}
          active
          coach={{ active: false, done: () => {} }}
          cheer={() => {}}
        />
      );
      expect(html).toContain("Test model");
      expect(html).toContain("<svg");
      expect(html).not.toContain("NaN");
    });

it("upper-level progress reads the owned Science journal, not a growth quiz", async () => {
  const { roundProgress } = await import("../src/learn/LearnChrome");
  for (const engine of [weather, food, space])
    for (const level of [4, 5] as const) {
      const options = optionsAtLevel({ mode: "solo", pace: "easy" }, level);
      const state = engine.create(options, { skills: {}, rng: random(1), starter: 0, today: 0 });
      expect(roundProgress({ game: engine.id, version: 1, id: "progress", revision: 0, options, state })).toEqual({
        current: 0,
        total: state.items.length,
      });
    }
});
