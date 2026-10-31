import { chamoruWords, chamoruWord } from "../learn/content/chamoru";
import { Base, Options, base, shuffle } from "./types";
import { Match, Seat, RoundResult, newMatch, settle, nextStarter } from "./match";
export const memorySymbols = [
  "shell",
  "fish",
  "star",
  "boat",
  "sun",
  "leaf",
  "moon",
  "flower",
  "crab",
  "heart",
  "kite",
  "tree",
];
export type MemoryState = Base & {
  game: "memory";
  cards: string[];
  /** Absent in legacy rounds: identical picture pairs. */
  pack?: "pictures" | "chamoru";
  matched: number[];
  open: number[];
  turns: number;
  player: 0 | 1;
  scores: [number, number];
  history?: Pick<MemoryState, "matched" | "open" | "turns" | "player" | "scores">[];
  match?: Match;
  starter?: Seat;
};
export function createMemory(options: Options, starter: Seat = 0, pack: "pictures" | "chamoru" = "pictures"): MemoryState {
  const count = options.difficulty === "easy" ? 6 : options.difficulty === "medium" ? 8 : 12;
  const symbols = shuffle(memorySymbols).slice(0, count);
  const words = pack === "chamoru" ? shuffle(chamoruWords).slice(0, count) : [];
  return {
    ...base("memory", options),
    game: "memory",
    cards: pack === "chamoru" ? shuffle(words.flatMap(w => [`ch:${w.id}:picture`, `ch:${w.id}:word`])) : shuffle([...symbols, ...symbols]),
    ...(pack === "chamoru" ? { pack } : {}),
    matched: [],
    open: [],
    turns: 0,
    player: starter,
    starter,
    scores: [0, 0],
  };
}
export const memoryDone = (s: MemoryState) => s.matched.length === s.cards.length;
export function flipCard(s: MemoryState, index: number): MemoryState {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= s.cards.length ||
    s.open.length === 2 ||
    s.matched.includes(index) ||
    s.open.includes(index)
  )
    return s;
  if (!s.open.length) {
    const { matched, open, turns, player, scores } = s;
    return {
      ...s,
      open: [index],
      history: [...(s.history ?? []).slice(-39), { matched, open, turns, player, scores }],
    };
  }
  const first = s.open[0];
  const turns = s.turns + 1;
  if (memoryKey(s.cards[first]) === memoryKey(s.cards[index])) {
    const scores: [number, number] = [...s.scores];
    scores[s.player]++;
    return { ...s, turns, open: [], matched: [...s.matched, first, index], scores };
  }
  return { ...s, turns, open: [first, index] };
}
export function closeMismatch(s: MemoryState): MemoryState {
  return s.open.length === 2
    ? { ...s, open: [], player: s.options.mode === "together" ? (s.player === 0 ? 1 : 0) : 0 }
    : s;
}

export function memoryResult(s: MemoryState): RoundResult {
  return !memoryDone(s) ? null : s.scores[0] === s.scores[1] ? "draw" : s.scores[0] > s.scores[1] ? 0 : 1;
}
export function replayMemory(s: MemoryState): MemoryState {
  const match = settle(s.match ?? newMatch(), memoryResult(s)),
    starter = s.options.mode === "together" ? nextStarter(match, s.starter ?? 0) : 0;
  return { ...createMemory(s.options, starter, s.pack), match };
}

export function memoryUndo(s: MemoryState): MemoryState {
  if (!s.history?.length) return s;
  return { ...s, ...s.history[s.history.length - 1], history: s.history.slice(0, -1) };
}

/** A CHamoru pair has one picture and one word face; both retain the same reviewed content id. */
export function chamoruCard(card: string) {
  const match = /^ch:([a-z_]+\.[a-z_]+):(picture|word)$/.exec(card);
  const word = match && chamoruWord(match[1]);
  return word ? { word, face: match![2] as "picture" | "word" } : null;
}
export const memoryKey = (card: string) => chamoruCard(card)?.word.id ?? card;
export const validMemoryCard = (card: string, pack: unknown) => pack === "chamoru" ? !!chamoruCard(card) : memorySymbols.includes(card);
