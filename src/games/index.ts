import { Difficulty, GameId, Options } from "./types";
import { TicState, createTic, ticOutcome } from "./tic";
import { WordState, createWord, wordStatus } from "./words";
import { MemoryState, createMemory, memoryDone } from "./memory";
import { CheckersState, createCheckers } from "./checkers";
import { MazeState, createMaze, mazeDone } from "./maze";
import { NumbersState, createNumbers, numbersStatus } from "./numbers";
export type GameState = TicState | WordState | MemoryState | CheckersState | MazeState | NumbersState;
export type { GameId, Options, Difficulty } from "./types";
export const gameIds: GameId[] = ["tic-tac-toe", "word-rescue", "memory", "checkers", "maze", "numbers"];
export const games: Record<
  GameId,
  {
    name: string;
    tag: string;
    description: string;
    color: string;
    surface: string;
    help: string;
    solo: string;
    together: string;
  }
> = {
  "tic-tac-toe": {
    name: "Tic-tac-toe",
    tag: "A little strategy",
    description: "Three in a row. Your next clever move.",
    color: "#386C9A",
    surface: "#E8EFF9",
    help: "Take turns placing your shape in an empty square. Make a line of three across, down, or diagonally. A full board with no line is a draw—good defending! Try a hint whenever you like.",
    solo: "Play the computer",
    together: "Two players",
  },
  "word-rescue": {
    name: "Hangman",
    tag: "A little word challenge",
    description: "Find the word before six wrong guesses.",
    color: "#A04F38",
    surface: "#FBE8DE",
    help: "Guess one letter at a time. A correct letter fills every matching space. In Challenge, each new wrong letter adds one part to the stick figure. Find the whole word before six wrong guesses to win. At six, the round ends and shows the answer. Tapping an already-used letter never costs another guess. One optional hint reveals a missing letter and marks the result assisted. Practice has unlimited attempts and hints. A grown-up can choose a private family word. Hear the clue during play and the answer after the round.",
    solo: "Word packs",
    together: "Family secret word",
  },
  memory: {
    name: "Memory Pairs",
    tag: "A little noticing",
    description: "Turn, remember, and find a friend.",
    color: "#6C5B96",
    surface: "#EDE8F7",
    help: "Tap two cards. If their pictures match, the pair stays open. If they are different, look carefully, then try again. Play together on the same team, or take turns collecting pairs. A match earns another turn.",
    solo: "Solve together",
    together: "Take turns",
  },
  checkers: {
    name: "Checkers",
    tag: "A little thinking ahead",
    description: "Hop, plan, and earn your crown.",
    color: "#286B5D",
    surface: "#E2F1E9",
    help: "Red goes first. Ordinary pieces move and jump diagonally forward. Choose Friendly for optional jumps: you can jump or move another piece. Classic uses standard American rules: you must jump when one is available. In both modes, finish a chosen jump chain with the same piece. Reaching the far row makes a king and ends your turn. Kings move and jump in both directions. Win when the other player has no legal move. We automatically call a draw on three repeated positions or 40 turns each without a capture or ordinary-piece move.",
    solo: "Play the computer",
    together: "Two players",
  },
  maze: {
    name: "Maze Explorer",
    tag: "A little adventure",
    description: "Find a path to your island flag.",
    color: "#856123",
    surface: "#FCF0CC",
    help: "Start at the boat and find your way to the flag. Tap a neighboring square or use the arrow buttons. You cannot cross a wall. Go back whenever you like. A hint shows the next step. There is no time limit.",
    solo: "Explore at your pace",
    together: "Explore together",
  },
  numbers: {
    name: "Number Island",
    tag: "A little number magic",
    description: "Roll the dice. Make a perfect match.",
    color: "#2F737C",
    surface: "#E0F1F2",
    help: "Roll the dice. Tap open numbers that add up to your roll, then close them. For example, a roll of 5 can close 5, or 2 and 3. Gentle has one die and numbers 1–6; Growing uses two dice and 1–9; Challenge uses two dice and 1–12. Earlier saved Challenge rounds keep numbers 1–9. Close every number to clear the island. In new Gentle rounds, roll again if no combination fits and keep your closed numbers. Other rounds end when no combination fits; try another or undo. Save small numbers for flexible combinations.",
    solo: "Your own challenge",
    together: "Solve together",
  },
};
export function createGame(game: GameId, options: Options): GameState {
  switch (game) {
    case "tic-tac-toe":
      return createTic(options);
    case "word-rescue":
      return createWord(options);
    case "memory":
      return createMemory(options);
    case "checkers":
      return createCheckers(options);
    case "maze":
      return createMaze(options);
    case "numbers":
      return createNumbers(options);
  }
}
export function isFinished(s: GameState): boolean {
  switch (s.game) {
    case "tic-tac-toe":
      return !!ticOutcome(s.board);
    case "word-rescue":
      return wordStatus(s) !== "playing";
    case "memory":
      return memoryDone(s);
    case "checkers":
      return s.lesson === null && !!s.position.outcome;
    case "maze":
      return mazeDone(s);
    case "numbers":
      return numbersStatus(s) !== "playing";
  }
}
export const difficultyLabel: Record<Difficulty, string> = { easy: "Gentle", medium: "Growing", hard: "Challenge" };
