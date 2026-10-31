import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { GameIcon } from "../src/components/GameIcon";
import { RoundProgress, roundProgress } from "../src/learn/LearnChrome";
import { engine as beep } from "../src/learn/games/beep-bot/engine";
import { engine as turtle } from "../src/learn/games/turtle-draw/engine";
import { optionsAtLevel, type LearningLevel } from "../src/learn/levels";

vi.mock("react-native", () => ({ View: ({ children, accessibilityLabel }: { children: React.ReactNode; accessibilityLabel?: string }) => <div aria-label={accessibilityLabel}>{children}</div> }));
vi.mock("react-native-svg", () => ({ default: "svg", Circle: "circle", Ellipse: "ellipse", G: "g", Path: "path", Rect: "rect", Text: "text" }));
vi.mock("../src/components/ui", () => ({ C: { paper: "#fff" }, Copy: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));

for (const engine of [beep, turtle]) {
  it(`${engine.id} has an illustrated shelf icon`, () => {
    const html = renderToStaticMarkup(<GameIcon id={engine.id} size={72} />);
    expect(html).toContain("<svg");
    expect(html).not.toContain(">?</text>");
  });

  for (const level of [1, 2, 3, 4, 5] as LearningLevel[])
    it(`${engine.id} L${level} renders its own four-part journey`, () => {
      const options = optionsAtLevel({ mode: "solo", pace: "easy" }, level);
      const state = engine.create(options, { skills: {}, rng: () => .25, starter: 0, today: 0 });
      for (const done of [0, 1, 3]) {
        const session = { game: engine.id, version: 1 as const, id: "progress", revision: 0, options, state: { ...state, done } };
        expect(roundProgress(session)).toEqual({ current: done, total: 4 });
        const html = renderToStaticMarkup(<RoundProgress session={session} island="coding" finished={false} />);
        expect(html).toContain("YOUR JOURNEY");
        expect(html).toContain(`${done}/4`);
        expect(html).toContain(`${done} of 4 parts complete`);
      }
    });
}
