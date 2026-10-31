import type { LearnEngine, LearnId } from "../../types";
import { random } from "../../../games/types";
import { levelOf, type LearningLevel } from "../../levelOptions";
export type Task = {
  prompt: string;
  clue: string;
  answer: string[];
  extras: string[];
  slots?: string[];
  picture?: string;
  panels?: string[];
  audio?: string;
  cardAudio?: Record<string, string>;
  completedWord?: string;
  completedAudio?: string;
  trace?: [number, number][];
};
export type State = {
  version: 1;
  level: LearningLevel;
  starter: 0 | 1;
  ids: number[];
  index: number;
  placed: string[];
  helped: boolean;
  hint: boolean;
  miss: boolean;
  clean: boolean[];
};
export type Action =
  | { type: "tile"; value: string }
  | { type: "help" }
  | { type: "listen" }
  | { type: "undo" }
  | { type: "next" }
  | { type: "trace"; points: [number, number][] };
export const current = (s: State, bank: readonly Task[][]) =>
  bank[s.level - 1][s.ids[Math.min(s.index, s.ids.length - 1)]];
export const complete = (s: State, bank: readonly Task[][]) =>
  s.index < s.ids.length && s.placed.length === current(s, bank).answer.length;
export function choices(s: State, bank: readonly Task[][]) {
  const t = current(s, bank);
  const tiles = [...new Set([...t.answer, ...t.extras])];
  const seed = [...t.prompt].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 71 + s.ids[s.index]);
  const rng = random(seed);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}
/** Ordered checkpoints plus a corridor check reject scribbles and jumping straight to the end. */
export function traces(points: [number, number][], path: [number, number][]) {
  if (
    points.length < path.length ||
    points.length > 1200 ||
    !points.every((p) => p.length === 2 && p.every(Number.isFinite))
  )
    return false;
  let next = 0;
  for (const p of points) {
    if (next < path.length && Math.hypot(p[0] - path[next][0], p[1] - path[next][1]) < 17) next++;
    const distance = Math.min(
      ...path.slice(1).map((b, i) => {
        const a = path[i],
          dx = b[0] - a[0],
          dy = b[1] - a[1];
        const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
        return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
      })
    );
    if (distance > 24) return false;
  }
  return next === path.length;
}
export function move(s: State, a: Action, bank: readonly Task[][]): State {
  if (s.index === s.ids.length) return s;
  const t = current(s, bank),
    done = complete(s, bank);
  if (a.type === "next")
    return done
      ? {
          ...s,
          index: s.index + 1,
          placed: [],
          helped: false,
          hint: false,
          miss: false,
          clean: [...s.clean, !s.helped],
        }
      : s;
  if (a.type === "undo")
    return done || !s.placed.length ? s : { ...s, placed: s.placed.slice(0, -1), miss: false, hint: false };
  if (done) return s;
  if (a.type === "listen") return { ...s, helped: true };
  if (a.type === "help") return { ...s, helped: true, hint: true, miss: false };
  const right =
    a.type === "trace"
      ? !!t.trace && traces(a.points, t.trace)
      : !t.trace && choices(s, bank).includes(a.value) && a.value === t.answer[s.placed.length];
  if (a.type === "tile" && !choices(s, bank).includes(a.value)) return s;
  return right
    ? { ...s, placed: [...s.placed, t.answer[s.placed.length]], miss: false, hint: false }
    : { ...s, helped: true, miss: true, hint: false };
}
export function makeEngine(
  id: LearnId,
  name: string,
  ages: readonly [number, number],
  names: readonly { name: string; description: string }[],
  bank: readonly Task[][]
): LearnEngine<State> {
  return {
    id,
    name,
    introAudio: `${id}-intro`,
    island: "reading",
    ages,
    ownLevels: true,
    levelNames: names,
    tagline: names[0].description,
    description: `${name}: ${names.map((n) => n.name.toLowerCase()).join(", ")}. No clock.`,
    help:
      "Tap cards to place them in the glowing space. Read the clue or ask a grown-up to read it with you. Help lights the next card. " +
      (id === "letter-lagoon"
        ? "Trace from the numbered start along the letter trail. "
        : id === "word-workshop"
          ? "Combine word parts, then connect them to their meanings. "
          : "Sort word roles, arrange story panels and build sentences and paragraphs. ") +
      "A miss means try again; helped work counts. Finish each creation, then tap Next. There is no clock.",
    color: "#227B80",
    surface: "#DDF4EF",
    modes: ["solo", "together"],
    skills: Object.fromEntries(names.map((n, i) => [`read.${id}-level-${i + 1}`, n.name])),
    create(o, c) {
      const level = levelOf(o),
        pool = bank[level - 1].map((_, i) => i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(c.rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const fresh = pool.filter((i) => c.previous?.level !== level || !c.previous.ids.includes(i));
      return {
        version: 1,
        level,
        starter: c.starter,
        ids: (fresh.length >= 4 ? fresh : pool).slice(0, 4),
        index: 0,
        placed: [],
        helped: false,
        hint: false,
        miss: false,
        clean: [],
      };
    },
    validate(v, o): v is State {
      if (
        !v ||
        typeof v !== "object" ||
        Object.keys(v).sort().join(",") !== "clean,helped,hint,ids,index,level,miss,placed,starter,version"
      )
        return false;
      const s = v as State;
      if (
        (s.starter !== 0 && s.starter !== 1) ||
        s.version !== 1 ||
        s.level !== levelOf(o) ||
        !Array.isArray(s.ids) ||
        s.ids.length !== 4 ||
        new Set(s.ids).size !== 4 ||
        !s.ids.every((i) => Number.isInteger(i) && i >= 0 && i < bank[s.level - 1].length) ||
        !Number.isInteger(s.index) ||
        s.index < 0 ||
        s.index > 4 ||
        !Array.isArray(s.clean) ||
        s.clean.length !== s.index ||
        !s.clean.every((x) => typeof x === "boolean") ||
        !Array.isArray(s.placed) ||
        !["helped", "hint", "miss"].every((k) => typeof s[k as "hint"] === "boolean")
      )
        return false;
      if (s.index === 4) return !s.placed.length && !s.helped && !s.hint && !s.miss;
      const t = current(s, bank);
      return (
        s.placed.length <= t.answer.length &&
        s.placed.every((x, i) => x === t.answer[i]) &&
        (!(s.hint || s.miss) || s.helped) &&
        !(s.hint && s.miss) &&
        (!complete(s, bank) || (!s.hint && !s.miss))
      );
    },
    outcome: (s) => (s.index === 4 ? "done" : null),
    turn: (s) => ((s.starter + s.index) % 2) as 0 | 1,
  };
}
