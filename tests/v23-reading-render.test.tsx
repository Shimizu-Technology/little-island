import React from "react";
import { createRequire } from "node:module";
import { describe, it, expect, vi } from "vitest";
import * as letters from "../src/learn/games/letter-lagoon/view";
import * as words from "../src/learn/games/word-workshop/view";
import * as stories from "../src/learn/games/story-studio/view";
import { engines } from "../src/learn/engines";
import { optionsAtLevel, type LearningLevel } from "../src/learn/levels";
import { roundProgress } from "../src/learn/LearnChrome";
import type { State } from "../src/learn/games/letter-lagoon/puzzle";
import type { BoardProps } from "../src/learn/types";
const { renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server");
vi.mock("react-native", () => ({ View: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../src/components/ui", () => ({
  C: { paper: "#fff" },
  Copy: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Heading: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Button: ({ children, label }: { children: React.ReactNode; label: string }) => (
    <button aria-label={label}>{children}</button>
  ),
  PressableScale: ({ children, accessibilityLabel }: { children: React.ReactNode; accessibilityLabel: string }) => (
    <button aria-label={accessibilityLabel}>{children}</button>
  ),
}));
vi.mock("../src/learn/Coach", () => ({ CoachSpot: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("react-native-svg", () => ({
  default: "svg",
  Circle: "circle",
  Ellipse: "ellipse",
  Path: "path",
  Polyline: "polyline",
  Text: "text",
  G: "g",
  Rect: "rect",
  Polygon: "polygon",
  Line: "line",
}));
describe("Reading boards and stage chrome", () => {
  for (const [id, view] of [
    ["letter-lagoon", letters],
    ["word-workshop", words],
    ["story-studio", stories],
  ] as const)
    for (const level of [1, 2, 3, 4, 5] as LearningLevel[])
      it(`${id} L${level} renders its own construction and progress`, () => {
        const options = optionsAtLevel({ pace: "easy", mode: "solo" }, level),
          state = engines[id].create(options, { skills: {}, rng: () => 0.2, today: 0, starter: 0 }) as State;
        const session = { game: id, version: 1 as const, id: "test", revision: 0, options, state };
        const p = {
          session,
          skills: {},
          active: true,
          width: 334,
          height: 700,
          soundOn: false,
          update: vi.fn(),
          practice: vi.fn(),
          sound: vi.fn(),
          stopSound: vi.fn(),
          cheer: vi.fn(),
          coach: { active: false, done: vi.fn() },
        } as BoardProps<State>;
        expect(roundProgress(session)).toEqual({ current: 0, total: 4 });
        const html = renderToStaticMarkup(React.createElement(view.Board, p));
        expect(html).toContain("CREATION");
        expect(html).toContain("Help");
        expect(html).not.toMatch(/NaN|undefined|Coming soon/);
        expect(renderToStaticMarkup(<view.Art size={80} />)).toContain("<svg");
      });
});
