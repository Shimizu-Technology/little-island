import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { random } from "../src/games/types";
import { engine, missions } from "../src/learn/games/tide-pool/engine";
import { engine as floatEngine, objects } from "../src/learn/games/float-sink/engine";
import { engine as crabEngine, commands } from "../src/learn/games/crab-commands/engine";
const speech = JSON.parse(readFileSync(new URL("../scripts/learn/science.json", import.meta.url), "utf8")) as Record<
  string,
  string
>;
describe("science content delivery", () => {
  it("bundles every curated speech key with its exact module mapping", () => {
    const module = readFileSync(new URL("../src/content/learnAudio/science.ts", import.meta.url), "utf8");
    expect(Object.keys(speech).length).toBe(108);
    for (const [key, text] of Object.entries(speech)) {
      expect(key).toMatch(/^(tide-pool|float-sink|crab-commands)-/);
      expect(text.trim().length).toBeGreaterThan(0);
      expect(module).toContain(`'${key}': require('../../../assets/audio/${key}.m4a')`);
      expect(statSync(new URL(`../assets/audio/${key}.m4a`, import.meta.url)).size).toBeGreaterThan(1000);
    }
  });
  it("every spoken prompt the boards use exists, and each game says its goal", () => {
    for (const e of [engine, floatEngine, crabEngine]) {
      expect(speech[e.introAudio!], e.id).toBeTruthy();
      expect(speech[e.helpAudio!], e.id).toBeTruthy();
      expect(speech[e.introAudio!].split(" ").length).toBeLessThanOrEqual(12);
    }
    for (const m of missions) {
      expect(speech[`tide-pool-q-${m.id}`], m.id).toBeTruthy();
      if (m.kind === "guess")
        for (const k of ["do", "right", "surprise"])
          expect(speech[`tide-pool-${k}-${m.id}`], `${k} ${m.id}`).toBeTruthy();
    }
    expect(speech["tide-pool-coral-happy"]).toBeTruthy();
    for (const x of objects)
      for (const k of ["object", "right", "surprise"])
        expect(speech[`float-sink-${k}-${x.id}`], `${k} ${x.id}`).toBeTruthy();
    for (let n = 1; n <= 7; n++) expect(speech[`float-sink-count-${n}`]).toBeTruthy();
    for (let n = 1; n <= 6; n++) expect(speech[`float-sink-held-${n}`]).toBeTruthy();
    for (const pace of ["easy", "medium", "hard"] as const)
      for (const c of commands(pace)) expect(speech[`crab-commands-card-${c}`]).toBeTruthy();
  });
  it("on-screen words stay kid-sized: no status lines or lab jargon", () => {
    const shown = [
      ...missions.flatMap((m) => [m.question, m.change, m.why, ...m.answers.map((a) => a.label)]),
      ...objects.map((x) => x.why),
    ];
    for (const text of shown) expect(text).not.toMatch(/predict|neighbor|program|salt|status|experiment/i);
  });
  it("Growing always includes a size surprise, and Challenge always includes a material pair", () => {
    for (let seed = 0; seed < 30; seed++)
      for (const pace of ["medium", "hard"] as const) {
        const s = floatEngine.create(
          { mode: "solo", pace },
          { skills: {}, rng: random(seed), today: 20000, starter: 0 }
        );
        expect(
          pace === "medium"
            ? s.items.some((x) => ["apple", "log", "coin"].includes(x))
            : ["clay", "clay-boat"].every((x) => s.items.includes(x)) ||
                ["empty-bottle", "full-bottle"].every((x) => s.items.includes(x))
        ).toBe(true);
      }
  });
});
