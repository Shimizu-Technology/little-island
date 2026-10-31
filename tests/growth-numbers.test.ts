import React from "react";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import { numberTracks } from "../src/learn/growth/numbers";
import type { GrowthQuestion, GrowthStage } from "../src/learn/growth/types";
import type { LearnId } from "../src/learn/types";
import { NumbersVisual } from "../src/learn/growth/NumbersVisual";

// The app already ships react-dom; keep this focused test independent of adding
// @types/react-dom to the parent's dependency/configuration files.
const { renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server") as {
  renderToStaticMarkup: (node: React.ReactElement) => string;
};

// Pure markup checks, with no native runtime, DOM, device, server or timers.
vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    StyleSheet: { create: (styles: unknown) => styles },
    View: ({ children, accessibilityLabel, style }: { children?: React.ReactNode; accessibilityLabel?: string; style?: Record<string, unknown> }) =>
      createElement("div", { "data-label": accessibilityLabel,
        "data-dot": style?.width === 12 && style?.height === 12 ? "yes" : undefined,
        "data-ten": style?.backgroundColor === "teal" ? "yes" : undefined,
        "data-unit": style?.width === 7 && style?.height === 16 ? "yes" : undefined }, children),
  };
});
vi.mock("../src/components/Text", async () => {
  const { createElement } = await import("react");
  return { Text: ({ children }: { children?: React.ReactNode }) => createElement("span", null, children) };
});
vi.mock("../src/components/ui", () => ({ C: { soft: "soft", cream: "cream", ink: "ink", line: "line", teal: "teal", paper: "paper", coral: "coral" } }));

const games = ["shell-math", "number-hop", "quick-practice", "reef-race", "island-market"] as const;
const stages = ["stretch", "deep"] as const;
const bank = (game: LearnId, stage: GrowthStage) => numberTracks[game]![stage].questions;
const all = games.flatMap(game => stages.flatMap(stage => bank(game, stage)));
const nums = (q: GrowthQuestion) => [...q.prompt.matchAll(/\d+/g)].map(m => Number(m[0]));
const model = (q: GrowthQuestion, showHelp = false, width = 280) => renderToStaticMarkup(React.createElement(NumbersVisual,
  { question: q, showHelp, width, disabled: false, onHelp: () => { throw new Error("Static model must not trigger help"); } }));
const count = (html: string, attribute: string) => (html.match(new RegExp(`${attribute}="yes"`, "g")) ?? []).length;

// Independently worked answer key, ordered by authored row and interleaved skill.
const keys: Record<typeof games[number], Record<GrowthStage, readonly number[]>> = {
  "shell-math": {
    stretch: [13, 6, 24, 12, 15, 8, 36, 20, 15, 5, 42, 18, 13, 9, 58, 16],
    deep: [35, 35, 44, 27, 54, 45, 57, 39, 63, 55, 72, 50, 74, 65, 85, 41],
  },
  "number-hop": {
    stretch: [24, 26, 24, 4, 33, 28, 26, 4, 57, 38, 33, 3, 39, 19, 23, 6],
    deep: [67, 48, 46, 5, 88, 36, 38, 9, 85, 53, 74, 12, 91, 54, 37, 5],
  },
  "quick-practice": {
    stretch: [16, 8, 5, 14, 25, 13, 4, 17, 23, 8, 3, 22, 34, 17, 7, 19],
    deep: [45, 27, 25, 54, 73, 27, 14, 49, 45, 24, 23, 46, 92, 26, 23, 53],
  },
  "reef-race": {
    stretch: [27, 28, 2, 4, 38, 37, 2, 10, 44, 42, 6, 7, 38, 42, 2, 5],
    deep: [83, 75, 12, 20, 93, 87, 4, 20, 85, 92, 25, 14, 86, 90, 15, 5],
  },
  "island-market": {
    stretch: [13, 17, 14, 3, 14, 19, 13, 12, 16, 24, 16, 3, 12, 17, 12, 13],
    deep: [23, 49, 33, 5, 26, 55, 34, 13, 22, 63, 32, 5, 28, 50, 33, 12],
  },
};

describe("number growth content contract", () => {
  it("has only the assigned five games, both described stages and sixteen stable questions each", () => {
    expect(Object.keys(numberTracks).sort()).toEqual([...games].sort());
    expect(all).toHaveLength(160);
    expect(new Set(all.map(q => q.id)).size).toBe(all.length);
    for (const game of games) {
      expect(numberTracks[game]!.stretch.label).not.toBe(numberTracks[game]!.deep.label);
      for (const stage of stages) {
        const track = numberTracks[game]![stage];
        expect(track.label.length).toBeGreaterThan(10);
        expect(track.description.length).toBeGreaterThan(40);
        expect(track.questions).toHaveLength(16);
        expect(new Set(track.questions.map(q => q.prompt)).size).toBe(16);
        expect(new Set(track.questions.map(q => q.skill)).size).toBeGreaterThanOrEqual(4);
        expect(track.questions.map(q => Number(q.answer))).toEqual(keys[game][stage]);
        expect(track.questions.filter(q => nums(q).some(n => n > 20) || Number(q.answer) > 20).length).toBeGreaterThanOrEqual(stage === "deep" ? 8 : 4);
        for (const q of track.questions) {
          expect(q.id).toMatch(new RegExp(`^${game}-${stage}-[a-z-]+-[1-4]$`));
          expect(q.skill).toMatch(/^num\.[a-z-]+$/);
          expect(q.skill.length).toBeLessThanOrEqual(40);
          expect(q.skillLabel.length).toBeGreaterThan(8);
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices.map(c => c.value)).size).toBe(4);
          expect(new Set(q.choices.map(c => c.label)).size).toBe(4);
          expect(q.choices.filter(c => c.value === q.answer)).toHaveLength(1);
          for (const choice of q.choices) {
            expect(choice.label).toBe(choice.value);
            expect(Number.isInteger(Number(choice.value))).toBe(true);
            expect(Number(choice.value)).toBeGreaterThanOrEqual(0);
            expect(Number(choice.value)).toBeLessThanOrEqual(100);
          }
          expect(q.explanation.length).toBeGreaterThan(40);
          expect(q.explanation).toContain(q.answer);
          expect(q.scene).toBeDefined();
        }
      }
    }
  });

  it("independently solves every prompt, including unknown-first subtraction and two-step orders", () => {
    for (const q of all) {
      const [a, b, c, d, e] = nums(q), answer = Number(q.answer);
      switch (q.skill) {
        case "num.make-ten": case "num.bridge-ten": expect(answer, q.id).toBe(a + b); break;
        case "num.decompose": case "num.exchange-subtract": case "num.market-change": case "num.unknown-taken":
          expect(answer, q.id).toBe(a - b); expect(a).toBeGreaterThanOrEqual(b); break;
        case "num.place-value": case "num.regroup-ones": expect(answer, q.id).toBe(a * 10 + b); break;
        case "num.equal-groups": case "num.groups-extra": expect(answer, q.id).toBe(a * b + (c ?? 0)); break;
        case "num.hop-forward": case "num.reef-landing": expect(answer, q.id).toBe(a + b * c); break;
        case "num.hop-back": expect(answer, q.id).toBe(a - b * c); break;
        case "num.hop-start": expect(answer + a * b, q.id).toBe(c); break;
        case "num.hop-count": expect(a + answer * c, q.id).toBe(b); break;
        case "num.reef-mixed": expect(answer, q.id).toBe(a + b * c + d * e); break;
        case "num.reef-routes": expect(answer * c, q.id).toBe(a * b); break;
        case "num.reef-gap": expect(a).toBe(0); expect(answer, q.id).toBe(d * e - b * c); break;
        case "num.market-exchange":
          expect(answer, q.id).toBe(b + c * 10);
          expect(a - c).toBeGreaterThanOrEqual(0);
          expect((a - c) * 10 + answer).toBe(a * 10 + b); break;
        case "num.market-order": case "num.two-step":
          expect(a + b).toBeLessThanOrEqual(100); expect(a + b).toBeGreaterThanOrEqual(c);
          expect(answer, q.id).toBe(a + b - c); break;
        case "num.market-payment": expect(b * 10 + answer * (q.prompt.includes("five-shell") ? 5 : 1), q.id).toBe(a); break;
        case "num.unknown-first-add": expect(answer + a, q.id).toBe(b); break;
        case "num.unknown-first-sub": expect(answer - a, q.id).toBe(b); expect(answer).toBeGreaterThanOrEqual(a); break;
        case "num.equivalent": expect(a + b, q.id).toBe(c + answer); break;
        default: throw new Error(`Untested math skill ${q.skill}`);
      }
      for (const m of q.explanation.matchAll(/(\d+) ([+-]) (\d+) = (\d+)/g)) {
        const left = Number(m[1]), right = Number(m[3]), result = Number(m[4]);
        expect(m[2] === "+" ? left + right : left - right, `${q.id}: ${m[0]}`).toBe(result);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    }
  });

  it("checks the actual regrouping, bridge and payment strategies, beyond an answer key", () => {
    for (const q of all) {
      const [a, b] = nums(q);
      if (q.skill === "num.exchange-subtract") {
        expect(a % 10).toBeLessThan(b);
        const m = q.explanation.match(/becomes (\d+) tens and (\d+) ones.*leaving (\d+) ones/)!;
        expect(m).not.toBeNull();
        expect(Number(m[1]) * 10 + Number(m[2])).toBe(a);
        expect(Number(m[2]) - b).toBe(Number(m[3]));
        expect(Number(m[1]) * 10 + Number(m[3])).toBe(Number(q.answer));
      }
      if (["num.make-ten", "num.bridge-ten"].includes(q.skill)) {
        const m = q.explanation.match(/Move (\d+) .* make (\d+).*There are (\d+) left/)!;
        expect(a + Number(m[1])).toBe(Number(m[2]));
        expect(Number(m[2]) % 10).toBe(0);
        expect(Number(m[1]) + Number(m[3])).toBe(b);
        expect(Number(m[3])).toBeGreaterThan(0);
      }
      if (q.skill === "num.regroup-ones") {
        expect(b).toBeGreaterThanOrEqual(10);
        expect(b).toBeLessThan(20);
        expect((a + 1) * 10 + b - 10).toBe(Number(q.answer));
      }
    }
    for (const stage of stages) {
      const payments = bank("island-market", stage).filter(q => q.skill === "num.market-payment");
      expect(payments.some(q => q.prompt.includes("five-shell"))).toBe(true);
      expect(payments.some(q => q.prompt.includes("one-shell"))).toBe(true);
      const forward = bank("number-hop", stage).filter(q => q.skill === "num.hop-forward");
      expect(new Set(forward.map(q => nums(q)[2]))).toEqual(new Set([2, 5, 10]));
      expect(forward.every(q => Math.floor(nums(q)[0] / 10) < Math.floor(Number(q.answer) / 10))).toBe(true);
    }
  });

  it("is a finite speech-enumerable bank, deterministic and free of network or audio dependencies", async () => {
    const { numberTracks: again } = await import("../src/learn/growth/numbers");
    expect(JSON.parse(JSON.stringify(again))).toEqual(numberTracks);
    for (const q of all) {
      expect([q.prompt, q.context ?? "", q.explanation, q.scene?.text ?? ""].join(" ")).not.toMatch(/undefined|NaN|https?:|TODO/);
      expect(q.tiles).toBeUndefined(); // Numeric choices are intentional for every task in this slice.
    }
  });
});

describe("number models match their givens without answering for the learner", () => {
  it("matches every scene to prompt inputs, including hidden starts, exchanges and return quantities", () => {
    for (const q of all) {
      const [a, b, c, d, e] = nums(q), scene = q.scene!;
      let values: readonly number[] | undefined;
      switch (q.skill) {
        case "num.make-ten": case "num.bridge-ten": case "num.exchange-subtract": case "num.market-change": values = [a, b]; break;
        case "num.place-value": case "num.regroup-ones": case "num.market-exchange": values = [a * 10, b]; break;
        case "num.equal-groups": case "num.groups-extra": values = [a, b, c ?? 0]; break;
        case "num.hop-forward": case "num.hop-back": case "num.reef-landing": values = [a, c, b]; break;
        case "num.hop-start": values = [c, b, a]; break;
        case "num.hop-count": values = [a, c, b]; break;
        case "num.reef-mixed": values = [a, c, b, e, d]; break;
        case "num.reef-routes": values = [a, b, c]; break;
        case "num.reef-gap": values = [b, c, d, e]; break;
        case "num.market-order": case "num.two-step": values = [a, b, c]; break;
      }
      if (values) expect(scene.values, q.id).toEqual(values);
      else {
        expect(scene.kind).toBe("word");
        expect(scene.text).toBeTruthy();
        if (q.skill !== "num.market-payment") expect(scene.text).toContain("?");
      }
    }
  });

  it("renders the exact tens/ones and basket counts, leaving loose ones unbundled", () => {
    for (const q of all) {
      const scene = q.scene!, values = scene.values ?? [], html = model(q);
      if (scene.kind === "tens") {
        const bundles = values.reduce((sum, n, i) => sum + (scene.cells?.[i] === "ones" ? 0 : Math.floor(n / 10)), 0);
        const dots = values.reduce((sum, n, i) => sum + (scene.cells?.[i] === "ones" ? n : n % 10), 0);
        expect(count(html, "data-ten"), q.id).toBe(bundles);
        expect(count(html, "data-unit"), q.id).toBe(bundles * 10);
        expect(count(html, "data-dot"), q.id).toBe(dots);
        scene.labels?.forEach(label => expect(html).toContain(label));
      }
      if (scene.kind === "groups") {
        expect(count(html, "data-dot"), q.id).toBe(values[0] * values[1] + values[2]);
        expect((html.match(/data-label="Basket /g) ?? []).length).toBe(values[0]);
      }
    }
  });

  it("hides calculated hop landings and unknown starts/counts until help", () => {
    for (const q of all.filter(q => q.scene?.kind === "hops")) {
      const plain = model(q), helped = model(q, true);
      const mode = q.scene!.cells![0];
      expect(plain).toContain("?");
      expect(helped).not.toBe(plain);
      // HTML numeric stone labels can only be the explicit start/end givens.
      const shown = [...plain.matchAll(/<span>(?:Start |End )?(\d+)<\/span>/g)].map(m => Number(m[1]));
      const helpedStones = [...helped.matchAll(/<span>(?:Start |End )?(\d+)<\/span>/g)].map(m => Number(m[1]));
      expect(helpedStones.every(n => Number.isInteger(n) && n >= 0 && n <= 100), q.id).toBe(true);
      const [a, b, c] = q.scene!.values!;
      const allowed = mode === "missing-start" ? [a] : mode === "missing-count" ? [a, c] : mode === "equal-route" || mode === "compare" ? [0] : [a];
      expect(shown.every(n => allowed.includes(n)), q.id).toBe(true);
      if (mode === "missing-start") expect(plain).toContain("Start ?");
      if (mode === "missing-count") expect(plain).toContain("? jumps");
      if (["forward", "back", "mixed"].includes(mode)) expect(helpedStones.at(-1), q.id).toBe(Number(q.answer));
      if (mode === "missing-start") expect(helpedStones[0], q.id).toBe(Number(q.answer));
      if (mode === "forward" || mode === "back" || mode === "missing-start") {
        expect((plain.match(new RegExp(mode === "back" ? `← −${b}` : `\\+${b} →`, "g")) ?? []).length, q.id).toBe(c);
      }
    }
  });

  it("renders every model at compact and tablet widths without answer controls or answer-key coupling", () => {
    for (const q of all) for (const width of [240, 680]) {
      const html = model(q, false, width);
      expect(html).not.toMatch(/button|<input|<select/);
      expect(model({ ...q, answer: "DO NOT REVEAL", explanation: "DO NOT REVEAL" }, false, width)).toBe(html);
      expect(model(q, true, width)).not.toContain("NaN");
    }
  });
});
