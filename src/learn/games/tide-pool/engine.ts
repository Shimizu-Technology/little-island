/** Model review reference: https://oceanservice.noaa.gov/facts/coral_bleach.html (reviewed 2026-10-25). */
import type { LearnEngine, LearnOptions, Pace } from "../../types";
import { pickItems } from "../../skills";
import { exact, integer, isRecord, prediction, scienceSkills } from "../../kit/science";
export const creatures = ["crab", "snail", "fish", "sea-star", "seaweed", "coral"] as const;
export type Creature = (typeof creatures)[number];
/** Pictures a child can name, used as answers. */
export type AnswerPicture =
  | "algae"
  | "fish"
  | "sand"
  | "shell"
  | "sea-star"
  | "seaweed"
  | "sun"
  | "cloud"
  | "water"
  | "air"
  | "low"
  | "deep"
  | "pale-coral"
  | "big-coral";
export type MissionId = "snail" | "crab" | "coral" | "seaweed" | "tide" | "fish" | "heat";
/**
 * Each mission is one concrete question. "guess" missions: pick a picture answer, make the change,
 * watch it happen, hear why. The "fix" mission: change sun, water and tide until the coral is happy.
 */
export type Mission = {
  id: MissionId;
  kind: "guess" | "fix";
  pace: 0 | 1 | 2;
  skill: string;
  question: string;
  answers: { picture: AnswerPicture; label: string }[];
  right: number;
  /** The change she makes after guessing. */
  change: string;
  why: string;
};
export const missions: Mission[] = [
  {
    id: "snail",
    kind: "guess",
    pace: 0,
    skill: "sci.living-needs",
    question: "What will the snail eat?",
    answers: [
      { picture: "algae", label: "Green fuzz" },
      { picture: "fish", label: "The fish" },
      { picture: "sand", label: "Sand" },
    ],
    right: 0,
    change: "Add the snail",
    why: "Snails eat the green fuzz on rocks. It’s called algae!",
  },
  {
    id: "crab",
    kind: "guess",
    pace: 0,
    skill: "sci.living-needs",
    question: "Where will the hermit crab live?",
    answers: [
      { picture: "sea-star", label: "Sea star" },
      { picture: "shell", label: "Empty shell" },
      { picture: "seaweed", label: "Seaweed" },
    ],
    right: 1,
    change: "Add the hermit crab",
    why: "Hermit crabs live in empty shells. The shell keeps their soft body safe.",
  },
  {
    id: "coral",
    kind: "fix",
    pace: 0,
    skill: "sci.ocean-habitat",
    question: "Make the coral happy!",
    answers: [],
    right: 0,
    change: "",
    why: "This shallow-water coral needs suitable light, seawater, and water that is not too hot or too cold. Tropical reef corals are used to warm water.",
  },
  {
    id: "seaweed",
    kind: "guess",
    pace: 1,
    skill: "sci.cause-effect",
    question: "What helps the seaweed grow?",
    answers: [
      { picture: "cloud", label: "Dark clouds" },
      { picture: "sun", label: "Sunshine" },
      { picture: "sand", label: "More sand" },
    ],
    right: 1,
    change: "Bring out the sun",
    why: "Seaweed uses sunshine to make its own food, so it grows!",
  },
  {
    id: "tide",
    kind: "guess",
    pace: 1,
    skill: "sci.ocean-habitat",
    question: "The tide goes out. What happens?",
    answers: [
      { picture: "deep", label: "More water" },
      { picture: "low", label: "Less water" },
    ],
    right: 1,
    change: "Tide out",
    why: "At low tide the sea moves away, so the pool gets shallow. The tide comes back later.",
  },
  {
    id: "fish",
    kind: "guess",
    pace: 2,
    skill: "sci.living-needs",
    question: "What does a fish breathe from?",
    answers: [
      { picture: "air", label: "Air" },
      { picture: "water", label: "Water" },
      { picture: "sand", label: "Sand" },
    ],
    right: 1,
    change: "Add the fish",
    why: "Fish breathe with gills. Gills take oxygen out of the water.",
  },
  {
    id: "heat",
    kind: "guess",
    pace: 2,
    skill: "sci.cause-effect",
    question: "What does hot water do to coral?",
    answers: [
      { picture: "big-coral", label: "Grows bigger" },
      { picture: "pale-coral", label: "Turns white" },
    ],
    right: 1,
    change: "Make the water hot",
    why: "Too much heat makes coral lose its tiny helpers and turn white. Returning to its usual reef temperature can help it recover. Water that is too cold can stress coral too.",
  },
];
export const missionById = (id: string) => missions.find((m) => m.id === id);
export type TideState = {
  missions: string[];
  index: number;
  /** Picture answers for this mission: one, or one per person with a grown-up. */
  guesses: number[];
  /** The change was made and she watched it (fix mission: the coral is happy). */
  watched: boolean;
  /** What the pool looks like. Sun, cool and high are the coral mission's controls (true elsewhere). */
  pool: Pool;
  starter: 0 | 1;
};
export type Pool = { sun: boolean; cool: boolean; high: boolean; creatures: Creature[] };
/** Who is in the pool for each mission, before and after the change. */
export function creaturesFor(id: string | undefined, watched: boolean): Creature[] {
  const before: Record<MissionId, Creature[]> = {
    snail: ["fish"],
    crab: ["sea-star", "seaweed"],
    coral: ["coral", "seaweed", "fish"],
    seaweed: ["seaweed", "fish"],
    tide: ["sea-star", "fish", "seaweed"],
    fish: [],
    heat: ["coral"],
  };
  const added: Partial<Record<MissionId, Creature>> = { snail: "snail", crab: "crab", fish: "fish" };
  const m = id as MissionId | undefined;
  if (!m || !Object.hasOwn(before, m)) return ["coral", "seaweed", "fish"];
  return watched && added[m] ? [...before[m], added[m]!] : before[m];
}
/** 1.4.0 rounds stored a simulated pool. They still load: progress is kept, the current mission restarts. */
export type LegacyTideState = {
  missions: string[];
  index: number;
  pool: Record<string, unknown>;
  action: string | null;
  guesses: number[];
  result: boolean;
  last: string | null;
  rained: boolean;
  starter: 0 | 1;
};
export type TideSave = TideState | LegacyTideState;
export const paceNumber = (p: Pace) => ({ easy: 0, medium: 1, hard: 2 })[p];
export const missionCount = (p: Pace) => 3 + paceNumber(p);
export const needFor = (o: LearnOptions) => (o.mode === "together" ? 2 : 1);
/** How the coral's pool starts: one thing wrong at Gentle, two at Growing, three at Challenge. */
export const coralStart = (p: Pace) => ({ sun: p === "easy", cool: false, high: p !== "hard" });
export const happy = (s: Pick<Pool, "sun" | "cool" | "high">) => s.sun && s.cool && s.high;
const poolFor = (id: string | undefined, p: Pace, watched = false): Pool => ({
  ...(id === "coral" ? coralStart(p) : { sun: true, cool: true, high: true }),
  creatures: creaturesFor(id, watched),
});
export const current = (s: TideState) => missionById(s.missions[s.index]);
/** Whose picture answer is next (with a grown-up, both answer; the starter makes the change). */
export const guesser = (s: TideState) => ((s.starter + s.guesses.length) % 2) as 0 | 1;
export function answer(s: TideState, choice: number, o: LearnOptions): TideState {
  const m = current(s);
  if (
    !m ||
    m.kind !== "guess" ||
    s.watched ||
    s.guesses.length >= needFor(o) ||
    !integer(choice, 0, m.answers.length - 1)
  )
    return s;
  return { ...s, guesses: [...s.guesses, choice] };
}
export function makeChange(s: TideState, o: LearnOptions): TideState {
  const m = current(s);
  if (!m || m.kind !== "guess" || s.watched || s.guesses.length !== needFor(o)) return s;
  return { ...s, watched: true, pool: { ...s.pool, creatures: creaturesFor(m.id, true) } };
}
export type Control = "sun" | "cool" | "high";
export function toggle(s: TideState, control: Control): TideState {
  const m = current(s);
  if (!m || m.kind !== "fix" || s.watched) return s;
  const pool = { ...s.pool, [control]: !s.pool[control] };
  return { ...s, pool, watched: happy(pool) };
}
export function nextMission(s: TideState, o: LearnOptions): TideState {
  if (!s.watched || s.index >= s.missions.length) return s;
  const index = s.index + 1;
  return {
    ...s,
    index,
    guesses: [],
    watched: false,
    pool: poolFor(s.missions[index], o.pace),
    starter: o.mode === "together" ? (((s.starter + 1) % 2) as 0 | 1) : s.starter,
  };
}
const legacyIds: Record<string, MissionId> = {
  coral: "coral",
  crab: "crab",
  snail: "snail",
  light: "seaweed",
  rain: "tide",
  heat: "heat",
};
const legacyPace: Record<string, number> = { coral: 0, crab: 0, snail: 0, light: 1, rain: 1, heat: 2 };
const legacyActions = ["sun", "rain", "temperature", "tide", ...creatures];
function validLegacy(x: unknown, o: LearnOptions): x is LegacyTideState {
  if (!exact(x, ["missions", "index", "pool", "action", "guesses", "result", "last", "rained", "starter"]))
    return false;
  const s = x as LegacyTideState,
    p = s.pool;
  return (
    Array.isArray(s.missions) &&
    s.missions.length === missionCount(o.pace) &&
    new Set(s.missions).size === s.missions.length &&
    s.missions.every(
      (id) => typeof id === "string" && Object.hasOwn(legacyPace, id) && legacyPace[id] <= paceNumber(o.pace)
    ) &&
    integer(s.index, 0, s.missions.length) &&
    exact(p, ["light", "warm", "high", "salt", "heat", "algae", "grazed", "creatures"]) &&
    ["light", "warm", "high", "grazed"].every((k) => typeof p[k] === "boolean") &&
    integer(p.salt, 0, 2) &&
    integer(p.heat, 0, 2) &&
    integer(p.algae, 0, 3) &&
    Array.isArray(p.creatures) &&
    p.creatures.length <= 6 &&
    new Set(p.creatures).size === p.creatures.length &&
    p.creatures.every((c) => creatures.includes(c as Creature)) &&
    (s.action === null || legacyActions.includes(s.action)) &&
    (s.last === null || legacyActions.includes(s.last)) &&
    Array.isArray(s.guesses) &&
    s.guesses.length <= needFor(o) &&
    s.guesses.every(prediction) &&
    typeof s.result === "boolean" &&
    typeof s.rained === "boolean" &&
    prediction(s.starter) &&
    (s.index < s.missions.length || (!s.result && s.action === null))
  );
}
/** Read any valid save as the current shape. */
export function upgrade(x: TideSave, o: LearnOptions): TideState {
  if (!("action" in x)) return x;
  const ids = x.missions.map((id) => legacyIds[id]);
  return {
    missions: ids,
    index: x.index,
    guesses: [],
    watched: false,
    pool: poolFor(ids[x.index], o.pace),
    starter: x.starter,
  };
}
function validCurrent(x: unknown, o: LearnOptions): x is TideState {
  if (!exact(x, ["missions", "index", "guesses", "watched", "pool", "starter"])) return false;
  const s = x as TideState;
  if (
    !Array.isArray(s.missions) ||
    s.missions.length !== missionCount(o.pace) ||
    new Set(s.missions).size !== s.missions.length ||
    !s.missions.every(
      (id) => typeof id === "string" && missions.some((m) => m.id === id && m.pace <= paceNumber(o.pace))
    ) ||
    !integer(s.index, 0, s.missions.length) ||
    !Array.isArray(s.guesses) ||
    s.guesses.length > needFor(o) ||
    typeof s.watched !== "boolean" ||
    !exact(s.pool, ["sun", "cool", "high", "creatures"]) ||
    typeof s.pool.sun !== "boolean" ||
    typeof s.pool.cool !== "boolean" ||
    typeof s.pool.high !== "boolean" ||
    !Array.isArray(s.pool.creatures) ||
    s.pool.creatures.length > creatures.length ||
    !prediction(s.starter)
  )
    return false;
  const m = current(s);
  const expected = creaturesFor(m?.id, s.watched);
  if (s.pool.creatures.length !== expected.length || !expected.every((c, i) => s.pool.creatures[i] === c)) return false;
  if (!m) return s.guesses.length === 0 && !s.watched && happy(s.pool);
  if (m.kind === "fix") return s.guesses.length === 0 && s.watched === happy(s.pool);
  return (
    s.guesses.every((g) => integer(g, 0, m.answers.length - 1)) &&
    happy(s.pool) &&
    (!s.watched || s.guesses.length === needFor(o))
  );
}
export const engine: LearnEngine<TideSave> = {
  id: "tide-pool",
  name: "Tide Pool Lab",
  island: "science",
  tagline: "Guess what will happen, then watch!",
  description: "Answer a question about the tide pool with a picture, make the change, and watch what happens.",
  help: "Each question has picture answers. Tap the one you think is right, then make the change and watch what happens in the pool. A surprise is a discovery! To make the coral happy, try the sun, the water and the tide until it smiles. With a grown-up, you each pick an answer, then compare. In real life, animals and plants differ, and changes like coral turning white take days or weeks. Watch real tide pools with a grown-up and leave the creatures at home.",
  helpAudio: "tide-pool-help",
  introAudio: "tide-pool-intro",
  color: "#2C6E8F",
  surface: "#DDEFF5",
  modes: ["solo", "together"],
  skills: { ...scienceSkills, "sci.living-needs": "What living things need", "sci.ocean-habitat": "Ocean homes" },
  paceHelp: {
    easy: "Snails, hermit crabs and a sad coral.",
    medium: "Add sunshine and tide questions.",
    hard: "Add how fish breathe and what heat does.",
  },
  create: (o, c) => {
    const chosen = pickItems(
      missions.filter((m) => m.pace <= paceNumber(o.pace)),
      c.skills,
      missionCount(o.pace),
      c.rng,
      c.today
    );
    // The easiest questions come first; the coral puzzle comes after a guess or two.
    const order: MissionId[] = ["snail", "crab", "seaweed", "coral", "tide", "fish", "heat"];
    const ids = chosen.map((m) => m.id).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return { missions: ids, index: 0, guesses: [], watched: false, pool: poolFor(ids[0], o.pace), starter: c.starter };
  },
  validate: (x, o): x is TideSave => isRecord(x) && (validCurrent(x, o) || validLegacy(x, o)),
  outcome: (s, o) => (upgrade(s, o).index === s.missions.length ? "done" : null),
  turn: (s, o) => {
    const n = upgrade(s, o),
      m = current(n);
    return m?.kind === "guess" && n.guesses.length < needFor(o) ? guesser(n) : n.starter;
  },
};
