import React, { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { chamoruWords } from "../src/learn/content/chamoru";
import { literacyTracks } from "../src/learn/growth/literacy";
import type { GrowthQuestion, GrowthStage } from "../src/learn/growth/types";

vi.mock("react-native", () => ({ View: "View", Text: "Text", StyleSheet: { create: (styles: unknown) => styles } }));
const { LiteracyVisual } = await import("../src/learn/growth/LiteracyVisual");
const games = ["sound-boat", "which-one", "turtle-tales", "hafa-adai"] as const;
const stages: GrowthStage[] = ["stretch", "deep"];
const questions = games.flatMap((game) => stages.flatMap((stage) => literacyTracks[game]![stage].questions));
const bank = (game: typeof games[number], stage: GrowthStage) => literacyTracks[game]![stage].questions;

// Inspect the returned static visual tree; this is not device/layout acceptance.
function visibleText(node: React.ReactNode): string[] {
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(visibleText);
  if (isValidElement<{ children?: React.ReactNode }>(node)) return visibleText(node.props.children);
  return [];
}
function visual(question: GrowthQuestion, showHelp: boolean) {
  return LiteracyVisual({ question, showHelp, width: 320, disabled: false, onHelp: vi.fn() });
}

describe("finite literacy growth banks", () => {
  it("provides both named stages only for the assigned games, with distinct stable questions", () => {
    expect(Object.keys(literacyTracks).sort()).toEqual([...games].sort());
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const game of games) {
      expect(Object.keys(literacyTracks[game]!).sort()).toEqual(["deep", "stretch"]);
      expect(literacyTracks[game]!.stretch.label).not.toBe(literacyTracks[game]!.deep.label);
      for (const stage of stages) {
        const track = literacyTracks[game]![stage];
        expect(track.label.length).toBeGreaterThan(10);
        expect(track.description.length).toBeGreaterThan(30);
        expect(track.questions.length).toBeGreaterThanOrEqual(12);
        expect(new Set(track.questions.map((q) => `${q.context}|${q.prompt}`)).size).toBe(track.questions.length);
      }
    }
  });
  it("has exactly one correct offered value and meaningful static coaching for every question", () => {
    for (const q of questions) {
      expect(q.skill, q.id).toMatch(/^(read|ch)\.[a-z0-9-]{1,40}$/);
      expect(q.skillLabel.length, q.id).toBeGreaterThan(10);
      expect(q.context?.length, q.id).toBeGreaterThan(30);
      expect(q.prompt.length, q.id).toBeGreaterThan(15);
      expect(q.explanation.length, q.id).toBeGreaterThan(25);
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.choices.map((c) => c.value)).size, q.id).toBe(q.choices.length);
      expect(new Set(q.choices.map((c) => c.label)).size, q.id).toBe(q.choices.length);
      expect(q.choices.filter((c) => c.value === q.answer), q.id).toHaveLength(1);
      expect(JSON.parse(JSON.stringify(q)), q.id).toEqual(q);
    }
  });
});

describe("Sound Boat construction and meaning", () => {
  it("covers syllables, endings and word families in each stage", () => {
    for (const stage of stages) {
      const qs = bank("sound-boat", stage);
      expect(qs.filter((q) => q.tiles), stage).toHaveLength(8);
      expect(qs.filter((q) => !q.tiles), stage).toHaveLength(4);
      expect(new Set(qs.map((q) => q.skill)).size).toBeGreaterThanOrEqual(3);
    }
  });
  it("can build every answer exactly once from unique tiles, with no hidden or ambiguous piece", () => {
    for (const q of questions.filter((item) => item.tiles)) {
      const tiles = q.tiles!;
      expect(new Set(tiles).size, q.id).toBe(tiles.length);
      const parts = q.answer.split("|");
      expect(parts, q.id).toHaveLength(2);
      expect(`${q.prompt} ${q.context}`.toLowerCase(), q.id).not.toContain(parts.join(""));
      const reachable = tiles.flatMap((first, i) => tiles.filter((_, j) => j !== i).map((second) => `${first}|${second}`));
      expect(reachable.filter((value) => value === q.answer), q.id).toHaveLength(1);
      for (const choice of q.choices) {
        expect(reachable, q.id).toContain(choice.value);
        expect(choice.label, q.id).toBe(choice.value.replaceAll("|", ""));
      }
      // No answer piece is rendered in a solution slot until assistance is enabled.
      const independent = visibleText(visual(q, false));
      expect(independent.filter((text) => text === "?"), q.id).toHaveLength(parts.length);
      for (const part of parts) expect(independent, q.id).not.toContain(part);
      const helped = visibleText(visual(q, true));
      for (const part of parts) expect(helped, q.id).toContain(part);
    }
  });
  it("uses actual changed bases for doubling, dropping silent e, and y to ies", () => {
    const expected = { "sb-d-hopping": "hopp|ing", "sb-d-making": "mak|ing", "sb-d-babies": "bab|ies", "sb-d-stopped": "stopp|ed" };
    for (const [id, answer] of Object.entries(expected)) expect(questions.find((q) => q.id === id)?.answer).toBe(answer);
  });
});

describe("reading comprehension and passage evidence", () => {
  it("practices conditions, references, negation and cause/effect in both direction banks", () => {
    for (const stage of stages) {
      const qs = bank("which-one", stage);
      for (const topic of ["conditions", "reference", "negation", "cause-effect"])
        expect(qs.filter((q) => q.skill.startsWith(`read.${topic}`)), `${stage}/${topic}`).toHaveLength(3);
    }
  });
  it("uses four substantive original passages per stage with sequence, inference, motive and evidence", () => {
    const allPassages = new Set<string>();
    for (const stage of stages) {
      const qs = bank("turtle-tales", stage);
      const passages = new Set(qs.map((q) => q.context!));
      expect(passages.size).toBeGreaterThanOrEqual(4);
      for (const passage of passages) {
        expect(passage.split(/\s+/).length).toBeGreaterThanOrEqual(stage === "deep" ? 65 : 50);
        allPassages.add(passage);
      }
      for (const topic of ["sequence", "inference", "motive", "evidence"])
        expect(qs.some((q) => q.skill === `read.tale-${topic}`), `${stage}/${topic}`).toBe(true);
    }
    expect(allPassages.size).toBe(8);
  });
  it("backs every story answer with an exact passage quote and an explanation of the link", () => {
    for (const stage of stages) for (const q of bank("turtle-tales", stage)) {
      const quote = q.explanation.match(/^The passage says, "([^"]+)" (.+)$/);
      expect(quote, q.id).not.toBeNull();
      expect(q.context, q.id).toContain(quote![1]);
      expect(quote![2].length, q.id).toBeGreaterThan(30);
      expect(q.scene?.kind, q.id).toBe("passage");
      expect(q.scene?.labels?.[0], q.id).toBeTruthy();
      expect(visibleText(visual(q, false)), q.id).toContain(q.context);
    }
  });
});

describe("reviewed CHamoru choices only", () => {
  it("retains the 51-entry source and resolves every answer and distractor to a verbatim source term", () => {
    expect(chamoruWords).toHaveLength(51);
    const source = new Map(chamoruWords.map((word) => [word.id, word]));
    for (const stage of stages) {
      const qs = bank("hafa-adai", stage);
      expect(new Set(qs.map((q) => q.skill)).size).toBe(6);
      for (const q of qs) {
        expect(source.has(q.answer), q.id).toBe(true);
        expect(q.tiles, q.id).toBeUndefined();
        for (const choice of q.choices) {
          expect(source.get(choice.value)?.term, `${q.id}/${choice.value}`).toBe(choice.label);
          // The visual presents only English context; CHamoru remains in answer labels.
          expect(visibleText(visual(q, false)), q.id).not.toContain(choice.label);
          expect(q.prompt.includes(choice.label), q.id).toBe(false);
          expect(q.context?.includes(choice.label), q.id).toBe(false);
        }
        expect(q.explanation, q.id).toContain(source.get(q.answer)!.english.toLowerCase());
        // No CHamoru is inserted into the coaching text handed to English narration.
        for (const word of chamoruWords) expect(q.explanation.includes(word.term), `${q.id}/${word.id}`).toBe(false);
      }
    }
  });
});
