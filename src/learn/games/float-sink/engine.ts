/** Model review reference: https://www.acs.org/content/dam/acsorg/education/k-8/inquiry-in-action/fifth-grade/g5-l2.4-bkgd.pdf (reviewed 2026-10-25). */
import type { LearnEngine, LearnOptions } from "../../types";
import { pickItems } from "../../skills";
import { exact, prediction, same, scienceSkills, type Prediction } from "../../kit/science";
export const objects = [
  {
    id: "leaf",
    name: "Leaf",
    floats: true,
    why: "A dry leaf is light for its size, so it floats.",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "coconut",
    name: "Coconut",
    floats: true,
    why: "Its hairy husk is full of air, so it floats.",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "rock",
    name: "Rock",
    floats: false,
    why: "A rock is heavy for its size, so it sinks.",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "shell",
    name: "Shell",
    floats: false,
    why: "Water fills the open shell, so it sinks.",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "key",
    name: "Key",
    floats: false,
    why: "Metal is heavy for its size. The key sinks.",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "cork",
    name: "Cork",
    floats: true,
    why: "Cork is full of tiny air pockets. It floats!",
    skill: "sci.float-sink",
    pace: 0,
  },
  {
    id: "apple",
    name: "Apple",
    floats: true,
    why: "An apple has air inside, so it floats!",
    skill: "sci.float-sink",
    pace: 1,
  },
  {
    id: "log",
    name: "Big log",
    floats: true,
    why: "Wood is light for its size. Even a big log floats!",
    skill: "sci.float-sink",
    pace: 1,
  },
  {
    id: "coin",
    name: "Coin",
    floats: false,
    why: "A tiny coin sinks! Metal is heavy for its size.",
    skill: "sci.float-sink",
    pace: 1,
  },
  {
    id: "sponge",
    name: "Wet sponge",
    floats: false,
    why: "This soaked sponge is full of water, not air, so it sinks.",
    skill: "sci.cause-effect",
    pace: 1,
  },
  {
    id: "toy-boat",
    name: "Toy boat",
    floats: true,
    why: "Its hollow shape keeps water out, so it floats.",
    skill: "sci.shape-buoyancy",
    pace: 1,
  },
  {
    id: "spoon",
    name: "Spoon",
    floats: false,
    why: "A metal spoon is heavy for its size, so it sinks.",
    skill: "sci.shape-buoyancy",
    pace: 1,
  },
  {
    id: "clay",
    name: "Clay ball",
    floats: false,
    why: "A squished clay ball has no room for air. It sinks.",
    skill: "sci.shape-buoyancy",
    pace: 2,
  },
  {
    id: "clay-boat",
    name: "Clay bowl",
    floats: true,
    why: "Same clay, bowl shape! It holds air, so it floats.",
    skill: "sci.shape-buoyancy",
    pace: 2,
  },
  {
    id: "empty-bottle",
    name: "Empty bottle",
    floats: true,
    why: "Air sealed inside makes the bottle float.",
    skill: "sci.shape-buoyancy",
    pace: 2,
  },
  {
    id: "full-bottle",
    name: "Full bottle",
    floats: false,
    why: "Full of water with no air inside, it sinks.",
    skill: "sci.shape-buoyancy",
    pace: 2,
  },
] as const;
export const shapes = ["ball", "bowl", "wide", "foil"] as const;
export type Shape = (typeof shapes)[number];
export const capacity = (s: Shape, hard: boolean) => ({ ball: 0, bowl: 3, wide: hard ? 4 : 6, foil: hard ? 4 : 5 })[s];
export type Event =
  | { kind: "predict"; value: Prediction }
  /** Older saves (1.4.0) also stored a separate drop and sort; they replay as no-ops. */
  | { kind: "drop" }
  | { kind: "sort"; value: Prediction }
  | { kind: "shape"; value: Shape }
  | { kind: "load" }
  | { kind: "pass" };
export type FloatState = { items: string[]; starter: 0 | 1; events: Event[] };
export type Dock = {
  index: number;
  phase: "predict" | "shape" | "load" | "pass" | "done";
  shape: Shape | null;
  pebbles: number;
  held: [number, number];
  boat: number;
  /** Tested objects in order, each with the guess that was made. */
  shelf: string[];
  guesses: Prediction[];
};
export const truth = (id: string): Prediction => (objects.find((x) => x.id === id)?.floats ? 0 : 1);
/** Tapping Float or Sink is the guess and the test: the object drops and goes onto its shelf by itself. */
export function dock(s: FloatState, o: LearnOptions): Dock | null {
  const d: Dock = { index: 0, phase: "predict", shape: null, pebbles: 0, held: [0, 0], boat: 0, shelf: [], guesses: [] };
  let legacy: "predict" | "drop" | null = null;
  for (const e of s.events) {
    const was = legacy;
    legacy = null;
    if (was === "predict" && exact(e, ["kind"]) && e.kind === "drop") legacy = "drop";
    else if (was === "drop" && exact(e, ["kind", "value"]) && e.kind === "sort" && e.value === truth(d.shelf[d.shelf.length - 1])) continue;
    else if (d.phase === "predict" && exact(e, ["kind", "value"]) && e.kind === "predict" && prediction(e.value)) {
      d.shelf.push(s.items[d.index]);
      d.guesses.push(e.value);
      d.index++;
      d.phase = d.index === s.items.length ? "shape" : "predict";
      legacy = "predict";
    } else if (d.phase === "shape" && exact(e, ["kind", "value"]) && e.kind === "shape" && shapes.includes(e.value)) {
      d.shape = e.value;
      d.phase = e.value === "ball" ? (o.mode === "versus" && d.boat === 0 ? "pass" : "done") : "load";
      d.pebbles = 0;
    } else if (d.phase === "load" && exact(e, ["kind"]) && e.kind === "load" && d.shape) {
      d.pebbles++;
      const max = capacity(d.shape, o.pace === "hard");
      if (d.pebbles > max) {
        d.held[((s.starter + d.boat) % 2) as 0 | 1] = max;
        d.phase = o.mode === "versus" && d.boat === 0 ? "pass" : "done";
      }
    } else if (d.phase === "pass" && exact(e, ["kind"]) && e.kind === "pass") {
      d.boat = 1;
      d.shape = null;
      d.pebbles = 0;
      d.phase = "shape";
    } else return null;
  }
  return d;
}
export function act(s: FloatState, e: Event, o: LearnOptions): FloatState {
  if (e.kind === "drop" || e.kind === "sort") return s;
  const n = { ...s, events: [...s.events, e] };
  return dock(n, o) ? n : s;
}
/** Objects per round; 1.4.0 rounds had 3, 4 and 5 and still load. */
export const counts = { easy: 6, medium: 7, hard: 8 } as const;
const legacyCounts = { easy: 3, medium: 4, hard: 5 } as const;
const paceRank = { easy: 0, medium: 1, hard: 2 } as const;
/** Boats offered at each pace. Gentle skips the solid ball so every first boat floats. */
export const shapesFor = (p: LearnOptions["pace"]): Shape[] => (p === "easy" ? ["bowl", "wide", "foil"] : [...shapes]);
export const engine: LearnEngine<FloatState> = {
  id: "float-sink",
  name: "Float or Sink Dock",
  island: "science",
  tagline: "Will it float or sink? Guess, then watch!",
  description: "Guess float or sink and watch each thing drop in the water. Then fill a boat with pebbles until it sinks.",
  help: "Tap Float or Sink to guess. The object drops in the water right away and goes onto the Floats or Sinks shelf by itself. A surprise is a discovery! Then pick a boat and tap the pebbles to load it, one at a time, until it sinks. How many can it hold? Taking turns, each player loads a boat and the one that holds more wins. In real life, material, size, trapped air and balance all change the result. These are example objects and equal pebbles.",
  helpAudio: "float-sink-help",
  introAudio: "float-sink-intro",
  modes: ["solo", "versus"],
  color: "#3A6FA0",
  surface: "#E1ECF7",
  skills: {
    ...scienceSkills,
    "sci.float-sink": "Floating and sinking",
    "sci.shape-buoyancy": "How shape helps boats float",
  },
  paceHelp: {
    easy: "Six everyday things, then load a boat.",
    medium: "Seven things, with some surprises.",
    hard: "Eight things, with a shape-and-air pair. Smaller boats.",
  },
  create: (o, c) => {
    const pool = objects.filter((x) => x.pace <= paceRank[o.pace]);
    // Obvious first: a rock that sinks and a leaf that floats, in either order.
    const obvious = c.rng() < 0.5 ? ["rock", "leaf"] : ["leaf", "rock"];
    const pair = c.rng() < 0.5 ? ["clay", "clay-boat"] : ["empty-bottle", "full-bottle"];
    const surprises =
      o.pace === "easy"
        ? []
        : pickItems(
            pool.filter((x) => ["apple", "log", "coin"].includes(x.id)),
            c.skills,
            o.pace === "medium" ? 2 : 1,
            c.rng,
            c.today
          ).map((x) => x.id);
    const fixed = [...obvious, ...surprises, ...(o.pace === "hard" ? pair : [])];
    const rest = pickItems(
      pool.filter((x) => !fixed.includes(x.id)),
      c.skills,
      counts[o.pace] - fixed.length,
      c.rng,
      c.today
    ).map((x) => x.id);
    // Keep the two obvious ones first; mix everything else.
    const later = [...surprises, ...(o.pace === "hard" ? pair : []), ...rest];
    for (let i = later.length - 1; i > 0; i--) {
      const j = Math.floor(c.rng() * (i + 1));
      [later[i], later[j]] = [later[j], later[i]];
    }
    later.sort((a, b) => objects.find(x => x.id === a)!.pace - objects.find(x => x.id === b)!.pace);
    return { items: [...obvious, ...later], starter: c.starter, events: [] };
  },
  validate: (x, o): x is FloatState => {
    if (!exact(x, ["items", "starter", "events"])) return false;
    const s = x as FloatState;
    return (
      prediction(s.starter) &&
      Array.isArray(s.items) &&
      (s.items.length === counts[o.pace] || s.items.length === legacyCounts[o.pace]) &&
      new Set(s.items).size === s.items.length &&
      s.items.every((id) => objects.some((x) => x.id === id && x.pace <= paceRank[o.pace])) &&
      (o.pace !== "medium" || s.items.some((id) => ["apple", "log", "coin"].includes(id))) &&
      (o.pace !== "hard" ||
        ["clay", "clay-boat"].every((id) => s.items.includes(id)) ||
        ["empty-bottle", "full-bottle"].every((id) => s.items.includes(id))) &&
      Array.isArray(s.events) &&
      s.events.length <= 60 &&
      s.events.every((e) => !!e && typeof e === "object") &&
      dock(s, o) !== null &&
      same(s, JSON.parse(JSON.stringify(s)))
    );
  },
  outcome: (s, o) => {
    const d = dock(s, o)!;
    return d.phase !== "done"
      ? null
      : o.mode === "solo"
        ? "done"
        : d.held[0] === d.held[1]
          ? "draw"
          : d.held[0] > d.held[1]
            ? 0
            : 1;
  },
  turn: (s, o) => ((s.starter + (dock(s, o)?.boat ?? 0)) % 2) as 0 | 1,
};
