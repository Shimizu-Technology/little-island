import React from "react";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import * as tide from "../src/learn/games/tide-logic/view";
import * as lab from "../src/learn/games/code-lab/view";
import { engines } from "../src/learn/engines";
import { roundProgress } from "../src/learn/LearnChrome";
import { optionsAtLevel, type LearningLevel } from "../src/learn/levelOptions";
import type { BoardProps, LearnId } from "../src/learn/types";
const { renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server");
vi.mock("react-native", () => ({ View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, Platform: { select: (o: Record<string, unknown>) => o.ios } }));
vi.mock("../src/components/ui", () => ({
  C: { ink: "#123", paper: "#fff" },
  Copy: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Heading: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Button: ({ children, label }: { children: React.ReactNode; label?: string }) => <button aria-label={label}>{children}</button>,
}));
vi.mock("../src/components/GameIcon", () => ({ GameIcon: ({ id }: { id: string }) => <svg data-game={id}/> }));
vi.mock("react-native-svg", () => ({
  default: "svg", Circle: "circle", Ellipse: "ellipse", Path: "path", Rect: "rect", Text: "text", G: "g",
}));
describe("Coding boards and shared journey", () => {
  for (const [id, view] of [["tide-logic", tide], ["code-lab", lab]] as const)
    for (const level of [1, 2, 3, 4, 5] as LearningLevel[])
      it(`${id} Level ${level} renders construction, art, and progress`, () => {
        const options = optionsAtLevel({ pace: "easy", mode: "solo" }, level);
        const state = engines[id].create(options, { skills: {}, rng: () => .2, today: 0, starter: 0 });
        const session = { game: id as LearnId, version: 1 as const, id: "test", revision: 0, options, state };
        const props = { session, skills: {}, active: true, width: 334, height: 700, soundOn: false,
          update: vi.fn(), practice: vi.fn(), sound: vi.fn(), stopSound: vi.fn(), cheer: vi.fn(),
          coach: { active: false, done: vi.fn() } } as BoardProps<unknown>;
        expect(roundProgress(session)).toEqual({ current: 0, total: 4 });
        const Board = view.Board as unknown as React.ComponentType<BoardProps<unknown>>;
        const html = renderToStaticMarkup(<Board {...props}/>);
        expect(html).toContain(id === "code-lab" ? "PYTHON-LIKE CODE" : "BUILD THE RULE");
        expect(html).not.toMatch(/NaN|undefined|Coming soon/);
        expect(renderToStaticMarkup(<view.Art size={80}/>)).toContain(`data-game="${id}"`);
      });
});
