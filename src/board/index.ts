import { Match, newMatch, nextStarter, Seat, settle, validMatch } from "../games/match";
import * as coconut from "./coconut-drop/engine";
import * as nets from "./fishing-nets/engine";
import * as canoes from "./hidden-canoes/engine";
import * as pits from "./shell-pits/engine";
import * as reef from "./reef-sweep/engine";
import { Engine, object, Position, Strength, strengths } from "./types";
export * from "./types";
export const boardIds = ["coconut-drop", "fishing-nets", "hidden-canoes", "shell-pits", "reef-sweep"] as const;
export type BoardId = (typeof boardIds)[number];
export const isBoardId = (id: unknown): id is BoardId =>
  typeof id === "string" && (boardIds as readonly string[]).includes(id);
export const engines: Record<BoardId, Engine> = {
  "coconut-drop": coconut,
  "fishing-nets": nets,
  "hidden-canoes": canoes,
  "shell-pits": pits,
  "reef-sweep": reef,
};
export const catalog: Record<
  BoardId,
  { name: string; description: string; surface: string; sizes: number[]; rule: string; lesson: string }
> = {
  "coconut-drop": {
    name: "Coconut Drop",
    description: "Drop a coconut. Connect four in a row.",
    surface: "#E6EED7",
    sizes: [7],
    rule: "Take turns dropping into a column. Four matching coconuts in a straight line wins: across, up, or diagonally.",
    lesson:
      "Watch the middle column. A coconut falls to the lowest open spot. Four coconut circles connect across this little example.",
  },
  "fishing-nets": {
    name: "Fishing Nets",
    description: "Tie the last rope. Gather a little reef.",
    surface: "#DEEDEF",
    sizes: [3, 4, 5],
    rule: "Tap a rope between two dots. Close the fourth side of a box to claim it and go again. Most boxes wins after every rope is tied.",
    lesson:
      "These three ropes leave one side open. Tie the glowing fourth rope to make a net. Closing a net earns another turn.",
  },
  "hidden-canoes": {
    name: "Hidden Canoes",
    description: "Search the lagoon, one coordinate at a time.",
    surface: "#DCECF2",
    sizes: [6],
    rule: "Each lagoon has three hidden canoes: lengths 3, 2 and 2. Charts are arranged for you. Take turns searching one coordinate, even after a find. Find all seven canoe spaces first. Keep your own chart private!",
    lesson:
      "A letter names a column and a number names a row. C3 is column C, row 3. A little canoe means a find; a ripple means open water.",
  },
  "shell-pits": {
    name: "Shell Pits",
    description: "Sow, count, and collect your shells.",
    surface: "#F3E6CF",
    sizes: [6],
    rule: "Kalah: each of six pits starts with four shells. Choose a pit on your side and sow one shell into each next pit, counterclockwise. Skip the other store. Finish in your store to go again. Finish in your own empty pit, opposite a nonempty pit, to capture both. When either side empties, sweep each side into its store. Most shells wins.",
    lesson:
      "Choose a pit to preview the path. Four shells go one, two, three, four. The ring shows where the last shell lands. Tap Sow shells when you are ready.",
  },
  "reef-sweep": {
    name: "Reef Sweep",
    description: "Find pearls. Give sea urchins room.",
    surface: "#E0EFE9",
    sizes: [5, 6, 7],
    rule: "Open every pearl space without touching a sea urchin. Your first opening and its neighbors are safe. A number counts urchins in the eight touching spaces, including diagonals. Switch to Flag to mark a suspected urchin. Flags are reminders, not proof. Some boards need a careful guess.",
    lesson:
      "This 1 touches one sea urchin, including diagonal neighbors. Mark the urchin with a flag, then open the other pearl spaces. Empty spaces open their neighbors for you.",
  },
};
export type BoardSession = {
  version: 1;
  id: string;
  game: BoardId;
  mode: "solo" | "together";
  strength: Strength;
  position: Position;
  match: Match;
  taught: boolean;
};
export type BoardSessions = Partial<Record<BoardId, BoardSession>>;
export function createSession(
  game: BoardId,
  config: {
    mode?: "solo" | "together";
    strength?: Strength;
    size?: number;
    seed?: number;
    starter?: Seat;
    names?: [string, string];
    alternate?: boolean;
  } = {}
): BoardSession {
  const seed = config.seed ?? Date.now() >>> 0;
  return {
    version: 1,
    id: `board-${seed}-${Math.random().toString(36).slice(2, 10)}`,
    game,
    mode: game === "reef-sweep" ? "solo" : (config.mode ?? "solo"),
    strength: config.strength ?? "gentle",
    position: engines[game].create(seed, config.size, config.starter),
    match: newMatch(config.names, config.alternate),
    taught: false,
  };
}
export function playAgain(s: BoardSession, seed: number): BoardSession {
  const position = engines[s.game].create(
    seed,
    s.position.size,
    s.game === "reef-sweep" ? 0 : nextStarter(s.match, s.position.starter)
  );
  return {
    ...s,
    id: `board-${seed}-${Math.random().toString(36).slice(2, 10)}`,
    position,
    match: s.game === "reef-sweep" ? s.match : settle(s.match, s.position.outcome),
  };
}
export function validBoardSession(v: unknown): v is BoardSession {
  return (
    object(v) &&
    Object.keys(v).sort().join() === "game,id,match,mode,position,strength,taught,version" &&
    v.version === 1 &&
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.id.length <= 100 &&
    isBoardId(v.game) &&
    (v.mode === "solo" || v.mode === "together") &&
    (v.game !== "reef-sweep" || v.mode === "solo") &&
    strengths.includes(v.strength as Strength) &&
    typeof v.taught === "boolean" &&
    validMatch(v.match) &&
    engines[v.game].validate(v.position)
  );
}
export function validBoardSessions(v: unknown): v is BoardSessions {
  return object(v) && Object.entries(v).every(([id, s]) => isBoardId(id) && validBoardSession(s) && s.game === id);
}
export function undo(s: BoardSession): BoardSession {
  if (!s.position.moves.length || s.game === "hidden-canoes" || (s.mode === "together" && s.game !== "reef-sweep"))
    return s;
  const engine = engines[s.game],
    states = [engine.create(s.position.seed, s.position.size, s.position.starter)];
  for (const m of s.position.moves) states.push(engine.move(states[states.length - 1], m));
  for (let i = states.length - 2; i >= 0; i--) if (states[i].turn === 0) return { ...s, position: states[i] };
  return s;
}
/** Compare-and-swap plus restore generation prevents delayed AI or old screens overwriting a new save. */
export function applyBoardSave<
  T extends {
    board?: BoardSessions;
    recentBoard?: BoardId | null;
    recentLearn?: unknown;
    recentActivity?: unknown;
    recent?: unknown;
  },
>(
  save: T,
  game: BoardId,
  next: BoardSession,
  expected: BoardSession | undefined,
  expectedEpoch: number,
  epoch: number
): T {
  if (epoch !== expectedEpoch || save.board?.[game] !== expected || next.game !== game || !validBoardSession(next))
    return save;
  return {
    ...save,
    board: { ...save.board, [game]: next },
    recentBoard: game,
    recentLearn: null,
    recentActivity: null,
    recent: null,
  };
}
