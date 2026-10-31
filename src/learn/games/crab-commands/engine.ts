import type { LearnEngine, Pace } from "../../types";
import { pickItems } from "../../skills";
import { exact, integer, prediction } from "../../kit/science";
export type Command = "up" | "right" | "down" | "left" | "forward" | "turn-left" | "turn-right" | "repeat";
export type Level = {
  id: string;
  pace: Pace;
  skill: string;
  rows: string[];
  facing: number;
  /** 0: two or three cards · 1: four to six · 2: a longer beach. A round plays one of each, in order. */
  tier: 0 | 1 | 2;
  /** Kept so older saved rounds still load; never offered in a new round. */
  retired?: boolean;
};
/** Hand-drawn beaches: C crab, S shell, H crab house, # sandcastle. */
const beaches: [id: string, tier: 0 | 1 | 2, rows: string[], retired?: true][] = [
  // Gentle: compass arrows. First beaches are one shell, then home.
  ["ea1", 0, ["CSH..", ".....", ".....", ".....", "....."]],
  ["ea2", 0, ["C....", "S....", "H....", ".....", "....."]],
  ["ea3", 0, ["CS...", ".H...", ".....", ".....", "....."]],
  ["ea4", 0, ["C#...", "S....", "H....", ".....", "....."]],
  ["ea5", 0, ["C....", "S....", ".H...", ".....", "....."]],
  ["ea6", 0, ["CS#..", "..H..", ".....", ".....", "....."]],
  ["eb1", 1, ["C.S..", "...H.", ".....", ".....", "....."]],
  ["eb2", 1, ["CS...", "##...", "..H..", ".....", "....."]],
  ["eb3", 1, ["C.#..", "S.#..", "..H..", ".....", "....."]],
  ["e1", 1, ["C.S.H", ".##..", ".....", ".....", "....."]],
  ["e2", 1, ["C#...", ".#...", ".S.H.", ".....", "....."]],
  ["e3", 1, ["C.S..", "##.#.", "...H.", ".....", "....."]],
  ["e4", 1, ["C....", ".##..", ".S#..", "..H..", "....."]],
  ["e5", 2, ["C.#..", "..#..", "S.S.H", ".....", "....."]],
  ["e6", 2, ["C..#H", ".S.#.", "...S.", ".###.", "....."]],
  ["e7", 2, ["C#S.H", ".#.#.", "...S.", ".....", "....."]],
  ["e8", 2, ["C....", "###S.", "S....", ".###.", "....H"], true],
  // Growing: walk forward and turn.
  ["ma1", 0, ["CSH..", ".....", ".....", ".....", "....."]],
  ["ma2", 0, ["CS...", ".H...", ".....", ".....", "....."]],
  ["ma3", 0, ["C....", "S....", "H....", ".....", "....."]],
  ["ma4", 0, ["CSH..", "###..", ".....", ".....", "....."]],
  ["mb1", 1, ["C.S..", "..#H.", ".....", ".....", "....."]],
  ["mb2", 1, ["C....", "S....", "..H..", ".....", "....."]],
  ["mb3", 1, ["CS...", "##...", "..H..", ".....", "....."]],
  ["m1", 1, ["C.S.H", ".###.", ".....", ".....", "....."]],
  ["mc1", 2, ["C.#..", "..S..", "..H..", ".....", "....."]],
  ["mc2", 2, ["C....", "..S..", "....H", ".....", "....."]],
  ["m2", 2, ["C#...", ".#S..", "...#H", ".....", "....."]],
  ["m3", 2, ["C..#H", "##.#.", "S..S.", ".###.", "....."], true],
  ["m4", 2, ["C.S..", ".#.#.", "...S.", ".###.", "....H"]],
  ["m5", 2, ["C#...", ".#.#.", "S..#H", "##.#.", "..S.."], true],
  ["m6", 2, ["C...H", ".###.", ".S.S.", ".....", "....."]],
  ["m7", 2, ["C.S#H", ".#.#.", "...S.", ".###.", "....."]],
  ["m8", 2, ["C#..H", ".#.#.", "S..S.", ".#.#.", "....."]],
  // Challenge: Again ×2 repeats the card before it two more times.
  ["ha1", 0, ["CS.H.", ".....", ".....", ".....", "....."]],
  ["ha2", 0, ["C....", "S....", "S....", "H....", "....."]],
  ["ha3", 0, ["C.S.H", ".....", ".....", ".....", "....."]],
  ["hb1", 1, ["C...S", "....H", ".....", ".....", "....."]],
  ["hb2", 1, ["C....", "S....", "S....", "...H.", "....."]],
  ["hb3", 1, ["CS.S.", "....H", ".....", ".....", "....."]],
  ["h1", 2, ["C...S", "####.", "H....", ".....", "....."]],
  ["h2", 2, ["C.S..", "####.", "S...H", ".....", "....."], true],
  ["h3", 2, ["C...S", ".###.", ".S..H", ".....", "....."]],
  ["h4", 2, ["C....", ".###S", "S...H", ".....", "....."]],
  ["h5", 2, ["C.S..", ".###.", "S...H", ".....", "....."]],
  ["h6", 2, ["C...H", ".###.", "S...S", ".....", "....."]],
  ["h7", 2, ["C...S", "##.#.", "H..S.", ".....", "....."]],
  ["h8", 2, ["C.S..", ".#.#.", "S#..H", "...#.", "....."], true],
];
export const levels: Level[] = beaches.map(([id, tier, rows, retired]) => ({
  id,
  rows,
  tier,
  ...(retired ? { retired } : {}),
  pace: id.startsWith("e") ? "easy" : id.startsWith("m") ? "medium" : "hard",
  skill: id.startsWith("h")
    ? "think.loops"
    : ["e2", "e4", "m2", "m5"].includes(id)
      ? "think.debug"
      : "think.sequence",
  facing: 1,
}));
export const commands = (p: Pace): Command[] =>
  p === "easy"
    ? ["up", "right", "down", "left"]
    : p === "medium"
      ? ["forward", "turn-left", "turn-right"]
      : ["forward", "turn-left", "turn-right", "repeat"];
export type Walker = { pos: number; facing: number; shells: number; previous: Command | null; bump: boolean };
const cell = (l: Level, p: number) => l.rows[Math.floor(p / 5)]?.[p % 5];
const shellCells = (l: Level) =>
  l.rows
    .join("")
    .split("")
    .flatMap((c, i) => (c === "S" ? [i] : []));
export const start = (l: Level): Walker => ({
  pos: l.rows.join("").indexOf("C"),
  facing: l.facing,
  shells: 0,
  previous: null,
  bump: false,
});
export function step(l: Level, w: Walker, c: Command): Walker {
  if (w.bump) return w;
  if (c === "repeat") {
    if (!w.previous || w.previous === "repeat") return { ...w, bump: true };
    return step(l, step(l, w, w.previous), w.previous);
  }
  if (c === "turn-left" || c === "turn-right")
    return { ...w, facing: (w.facing + (c === "turn-left" ? 3 : 1)) % 4, previous: c };
  const dir = c === "forward" ? w.facing : ["up", "right", "down", "left"].indexOf(c);
  const x = (w.pos % 5) + [0, 1, 0, -1][dir],
    y = Math.floor(w.pos / 5) + [-1, 0, 1, 0][dir];
  if (x < 0 || x > 4 || y < 0 || y > 4 || cell(l, y * 5 + x) === "#") return { ...w, previous: c, bump: true };
  const pos = y * 5 + x,
    shell = shellCells(l).indexOf(pos);
  return { pos, facing: dir, shells: w.shells | (shell < 0 ? 0 : 1 << shell), previous: c, bump: false };
}
/** One footprint per square walked, with the card that moved the crab there. */
export type Trail = { steps: { pos: number; facing: number; card: number }[]; bumpCard: number | null; bumpPos: number; bumpFacing: number };
/**
 * The planned path, one square at a time (Again ×2 expands to the card before it, exactly like step()).
 * Ends at the first bump so the beach can show where the crab would stop.
 */
export function trail(l: Level, program: Command[]): Trail {
  let w = start(l);
  const steps: Trail["steps"] = [];
  for (let card = 0; card < program.length; card++) {
    const c = program[card];
    const moves = c === "repeat" ? (w.previous && w.previous !== "repeat" ? [w.previous, w.previous] : null) : [c];
    if (!moves) return { steps, bumpCard: card, bumpPos: w.pos, bumpFacing: w.facing };
    for (const m of moves) {
      const n = step(l, w, m);
      if (n.bump) return { steps, bumpCard: card, bumpPos: w.pos, bumpFacing: m === "forward" ? w.facing : ["up", "right", "down", "left"].indexOf(m) };
      if (n.pos !== w.pos) steps.push({ pos: n.pos, facing: n.facing, card });
      w = n;
    }
    if (solved(l, w)) break;
  }
  return { steps, bumpCard: null, bumpPos: w.pos, bumpFacing: w.facing };
}
export const solved = (l: Level, w: Walker) =>
  !w.bump && cell(l, w.pos) === "H" && w.shells === (1 << shellCells(l).length) - 1;
export const run = (l: Level, program: Command[]) => program.reduce((w, c) => step(l, w, c), start(l));
/** Breadth first search uses exactly the same step/loop semantics as Go. */
export function solve(l: Level): Command[] {
  const queue = [{ w: start(l), path: [] as Command[] }],
    seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const { w, path } = queue[i];
    if (solved(l, w)) return path;
    for (const c of commands(l.pace)) {
      const n = step(l, w, c);
      if (n.bump) continue;
      const key = `${n.pos}/${n.facing}/${n.shells}/${n.previous}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ w: n, path: [...path, c] });
      }
    }
  }
  return [];
}
export type CrabState = {
  levels: string[];
  completed: Command[][];
  program: Command[];
  cursor: number;
  running: boolean;
  starter: 0 | 1;
  cards: number;
  debugging: boolean;
};
export const currentLevel = (s: CrabState) =>
  levels.find((l) => l.id === s.levels[Math.min(s.completed.length, s.levels.length - 1)])!;
export function tick(s: CrabState): CrabState {
  if (!s.running) return s;
  const cursor = s.cursor + 1,
    l = currentLevel(s),
    w = run(l, s.program.slice(0, cursor));
  return {
    ...s,
    cursor,
    debugging: s.debugging || w.bump,
    running: cursor < s.program.length && !w.bump && !solved(l, w),
  };
}
export const engine: LearnEngine<CrabState> = {
  id: "crab-commands",
  name: "Crab Commands",
  island: "coding",
  tagline: "Plan the crab's path, then Go!",
  description: "Tap arrow cards to lead the crab to its shell and home. Footprints show the path before you press Go.",
  help: "Tap arrow cards to plan the crab's walk. Footprints on the sand show where it will go, and a red mark shows where it would bump. Press Go to watch it walk. Tap a card in your plan to take it out. Gentle uses arrows that point the way. Growing uses Walk and Turn: the crab walks the way it faces. Challenge adds Again ×2, which does the card before it two more times. With a grown-up, take turns adding cards. The first beach is short and later ones grow. No timer and no move limit.",
  helpAudio: "crab-commands-help",
  introAudio: "crab-commands-intro",
  modes: ["solo", "together"],
  color: "#B0563A",
  surface: "#FBE6DC",
  skills: {
    "think.sequence": "Putting steps in order",
    "think.debug": "Finding and fixing a step",
    "think.loops": "Repeating steps",
  },
  paceHelp: {
    easy: "Arrow cards. Short beaches first.",
    medium: "Walk and turn cards.",
    hard: "Add Again ×2 to repeat a card.",
  },
  create: (o, c) => ({
    // One beach from each tier, easiest first, so the first beach is two or three cards.
    levels: ([0, 1, 2] as const).map(
      (tier) =>
        pickItems(
          levels.filter((l) => l.pace === o.pace && l.tier === tier && !l.retired),
          c.skills,
          1,
          c.rng,
          c.today
        )[0].id
    ),
    completed: [],
    program: [],
    cursor: 0,
    running: false,
    starter: c.starter,
    cards: 0,
    debugging: false,
  }),
  validate: (x, o): x is CrabState => {
    if (!exact(x, ["levels", "completed", "program", "cursor", "running", "starter", "cards", "debugging"]))
      return false;
    const s = x as CrabState,
      validProgram = (p: unknown): p is Command[] =>
        Array.isArray(p) && p.length <= 80 && p.every((c) => commands(o.pace).includes(c));
    if (
      typeof s.debugging !== "boolean" ||
      !prediction(s.starter) ||
      !integer(s.cards, 0, 1000000) ||
      !Array.isArray(s.levels) ||
      s.levels.length !== 3 ||
      new Set(s.levels).size !== 3 ||
      !s.levels.every((id) => levels.some((l) => l.id === id && l.pace === o.pace)) ||
      !Array.isArray(s.completed) ||
      s.completed.length > 3 ||
      !s.completed.every(
        (p, i) =>
          validProgram(p) &&
          solved(levels.find((l) => l.id === s.levels[i])!, run(levels.find((l) => l.id === s.levels[i])!, p)) &&
          p.every(
            (_, j) =>
              !solved(
                levels.find((l) => l.id === s.levels[i])!,
                run(levels.find((l) => l.id === s.levels[i])!, p.slice(0, j))
              )
          )
      ) ||
      !validProgram(s.program) ||
      !integer(s.cursor, 0, s.program.length) ||
      typeof s.running !== "boolean"
    )
      return false;
    const l = currentLevel(s),
      w = run(l, s.program.slice(0, s.cursor));
    const previous = s.cursor > 0 ? run(l, s.program.slice(0, s.cursor - 1)) : null;
    return (
      s.cards >= s.program.length + s.completed.reduce((n, p) => n + p.length, 0) &&
      (!previous || (!previous.bump && !solved(l, previous))) &&
      (!w.bump || s.debugging) &&
      (s.cursor === 0 || s.running || w.bump || solved(l, w) || s.cursor === s.program.length) &&
      (!s.running || (s.completed.length < 3 && s.cursor < s.program.length && !w.bump && !solved(l, w))) &&
      (s.completed.length < 3 || (s.program.length === 0 && s.cursor === 0 && !s.running))
    );
  },
  outcome: (s) => (s.completed.length === 3 ? "done" : null),
  turn: (s) => ((s.starter + s.cards) % 2) as 0 | 1,
};
