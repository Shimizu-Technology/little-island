import React from "react";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import { random } from "../src/games/types";
import { optionsAtLevel } from "../src/learn/levelOptions";
import { advance, engine as turtle, type TurtleState } from "../src/learn/games/turtle-draw/engine";
import { engine as patterns, taskAt } from "../src/learn/games/pattern-path/engine";
import { engine as algebra, type AlgebraState } from "../src/learn/games/treasure-algebra/engine";
import { engine as feast } from "../src/learn/games/fraction-feast/engine";
import * as algebraView from "../src/learn/games/treasure-algebra/view";
import * as feastView from "../src/learn/games/fraction-feast/view";
const { renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server");
const { div } = vi.hoisted(() => ({ div: ({ children }: { children?: unknown }) => children as never }));
vi.mock("react-native", () => ({
  View: div, ScrollView: div, Platform: { OS: "ios", select: (o: Record<string, unknown>) => o.ios },
  Animated: { View: div, Value: class { setValue() {} stopAnimation() {} }, timing: () => ({ start() {}, stop() {} }) },
}));
vi.mock("../src/components/motion", () => ({ useReducedMotion: () => false }));
vi.mock("../src/components/ui", () => ({
  C: { ink: "#123", paper: "#fff", error: "#f00" },
  Copy: div, Heading: div, PressableScale: div,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
vi.mock("react-native-svg", () => ({ default: "svg", Circle: "circle", Ellipse: "ellipse", G: "g", Line: "line", Path: "path", Rect: "rect", Text: "text" }));

const ctx = (seed: number) => ({ rng: random(seed), skills: {}, starter: 0 as const, today: 21000 });
const props = (game: string, options: ReturnType<typeof optionsAtLevel>, state: unknown) => ({
  session: { game, version: 1, id: "t", revision: 0, options, state }, skills: {}, active: true, width: 334, height: 700, soundOn: false,
  update: vi.fn(), practice: vi.fn(), sound: vi.fn(), stopSound: vi.fn(), cheer: vi.fn(), coach: { active: false, done: vi.fn() },
}) as Record<string, unknown>;
const board = (view: { Board: unknown }) => view.Board as React.ComponentType<Record<string, unknown>>;

describe("2.3 review fixes", () => {
  it("M1: redrawing a solved Turtle shape replaces its record and stays valid", () => {
    const o = optionsAtLevel({ mode: "solo", pace: "easy" }, 1);
    let s = turtle.create(o, ctx(3)) as TurtleState;
    const run = (state: TurtleState) => { let x: TurtleState = { ...state, running: true, cursor: 0 }; while (x.running) x = advance(x); return x; };
    s = run({ ...s, program: s.tasks[0].target });
    expect(s.completed).toHaveLength(1);
    expect(turtle.validate(s, o)).toBe(true);
    s = run({ ...s, program: s.tasks[0].target });
    expect(s.completed).toHaveLength(1);
    expect(turtle.validate(s, o)).toBe(true);
  });

  it("m2: Pattern Path Level 2 varies its four trails and across rounds", () => {
    const o = optionsAtLevel({ mode: "solo", pace: "easy" }, 2);
    const round = (seed: number) => { const s = patterns.create(o, ctx(seed)) as Parameters<typeof taskAt>[0]; return [0, 1, 2, 3].map(index => JSON.stringify(taskAt({ ...s, index }))); };
    expect(new Set(round(1)).size).toBe(4);
    const seen = new Set([1, 2, 3, 4, 5, 6].flatMap(round));
    expect(seen.size).toBeGreaterThan(8);
  });

  it("M2: dividing the balance shows x on the left and the quotient on the right", () => {
    const o = optionsAtLevel({ mode: "solo", pace: "easy" }, 5);
    for (let seed = 1; seed < 60; seed++) {
      const s = algebra.create(o, ctx(seed)) as AlgebraState;
      const index = s.tasks.findIndex(t => ["balance", "two-step"].includes(t.kind) && t.extra > 1);
      if (index < 0) continue;
      const t = s.tasks[index];
      const full = renderToStaticMarkup(React.createElement(board(algebraView), props("treasure-algebra", o, { ...s, index, offset: -t.a, divided: true })));
      const html = full.slice(full.indexOf("BALANCE BOTH PANS"));
      expect(html.length).toBeLessThan(full.length);
      expect(html).not.toContain(`${t.extra}x`);
      expect(html).toContain(`PANSx ${(t.b - t.a) / t.extra}`);
      expect(html).not.toContain(`÷${t.extra} both`);
      return;
    }
    throw new Error("no two-step balance task generated");
  });

  it("m1: a full hundred grid reads 1.00", () => {
    const o = optionsAtLevel({ mode: "solo", pace: "easy" }, 5);
    const s = feast.create(o, ctx(4)) as { tasks: { kind: string }[]; index: number };
    const index = s.tasks.findIndex(t => t.kind === "decimal" || t.kind === "percent" || t.kind === "hundred");
    const html = renderToStaticMarkup(React.createElement(board(feastView), props("fraction-feast", o, { ...s, index: Math.max(0, index), pieces: 100 })));
    if (html.includes("/100 =")) expect(html).toContain("100/100 = 1.00 = 100%");
    expect(html).not.toContain("0.100");
  });
});
