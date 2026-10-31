import type { Match, RoundResult, Seat } from "../games/match";
import type { MathOperation } from "../math/questions";
import type { GrowthStage } from "./growth/types";

/** Wave 1 learning games. Each id has a pure engine (src/learn/games/<id>/engine.ts) and a Board. */
export const learnIds = [
  "reef-race",
  "island-market",
  "sound-boat",
  "turtle-tales",
  "which-one",
  "tide-pool",
  "float-sink",
  "crab-commands",
  "hafa-adai",
  "shell-math",
  "number-hop",
  "quick-practice",
  "beep-bot",
  "turtle-draw",
  "tide-logic",
  "code-lab",
  "pattern-path",
  "shape-shift",
  "logic-lagoon",
  "weather-watch",
  "food-web",
  "space-station",
  "times-tide",
  "fraction-feast",
  "treasure-algebra",
  "letter-lagoon",
  "word-workshop",
  "story-studio",
] as const;
export type LearnId = (typeof learnIds)[number];
export type Island = "reading" | "numbers" | "science" | "thinking" | "coding";
/** solo: on my own · together: with a grown-up (cooperative turns) · versus: take turns with a family score. */
export type LearnMode = "solo" | "together" | "versus";
export type Pace = "easy" | "medium" | "hard";
export type Language = "en" | "ch";
export type LearnOptions = { mode: LearnMode; pace: Pace; language?: Language; mathOperation?: MathOperation; stage?: GrowthStage };

export type LearnSession<S = unknown> = {
  game: LearnId;
  version: 1;
  id: string;
  revision: number;
  /** Local owner of a new round. Legacy unowned rounds belong to family practice. */
  learner?: string;
  options: LearnOptions;
  /** Optional round evidence. Absent on legacy rounds; true after any miss or assistance. */
  levelHelped?: boolean;
  /** Versus only: tally of earlier rounds (see src/games/match.ts). */
  match?: Match;
  /** Who started this round (versus/together). */
  starter?: Seat;
  /** Names for together/versus turns. */
  names?: [string, string];
  state: S;
};

/** null while playing; "done" when a solo/together round is complete; a seat or "draw" for versus. */
export type Outcome = RoundResult | "done";

export type SkillRecord = {
  /** Total attempts and correct attempts, capped. */
  tries: number;
  right: number;
  /** Spacing box 0–5: higher means it's getting easier and comes back less often. */
  box: number;
  /** Day number (days since 1970) of the last attempt. */
  day: number;
};
export type SkillProgress = Record<string, SkillRecord>;

export type CreateContext<S> = {
  previous?: S;
  skills: SkillProgress;
  rng: () => number;
  starter: Seat;
  today: number;
};

/** Pure description of a learning game: rules, content selection and validation. No React. */
export type LearnEngine<S> = {
  id: LearnId;
  name: string;
  island: Island;
  /** One short line for cards. */
  tagline: string;
  /** Shown in the first setup sheet. */
  description: string;
  /** How to play, also spoken from helpAudio when provided. */
  help: string;
  helpAudio?: string;
  /** One short spoken line that says the goal, played when a new round starts (e.g. "Tap the letters to spell the word!"). */
  introAudio?: string;
  color: string;
  surface: string;
  modes: LearnMode[];
  modeLabels?: Partial<Record<LearnMode, string>>;
  paceLabels?: Partial<Record<Pace, string>>;
  paces?: Pace[];
  /** Arithmetic setup is offered only by the three math activities. */
  mathControls?: boolean;
  paceHelp?: Partial<Record<Pace, string>>;
  languages?: Language[];
  /** Typical age range the game's Level 1–5 spans, shown on shelf cards. */
  ages?: readonly [number, number];
  /** The game implements all five levels itself (levelOf(options)); skip the shared Level 4–5 quiz board. */
  ownLevels?: boolean;
  /** Names for all five levels when ownLevels is set (Level 1 easiest … Level 5 hardest). */
  levelNames?: readonly { name: string; description: string }[];
  /** Skill id → kid-and-parent friendly label (shown in the grown-up practice view). Ids look like "read.short-a". */
  skills: Record<string, string>;
  create: (options: LearnOptions, ctx: CreateContext<S>) => S;
  validate: (state: unknown, options: LearnOptions) => state is S;
  outcome: (state: S, options: LearnOptions) => Outcome;
  /**
   * When a finished solo/together round wasn't a win for the players (the island friend or the
   * tide got there first), a kind heading for the finish card. The card then skips the win fanfare.
   */
  notWon?: (state: S, options: LearnOptions) => string | null;
  /** Whose turn it is in together/versus play, for the scoreboard. */
  turn?: (state: S, options: LearnOptions) => Seat | null;
};

export type BoardProps<S> = {
  session: LearnSession<S>;
  /** Replace this round's state; the frame bumps the revision and saves. */
  update: (state: S) => void;
  /** Record one attempt at a skill (quiet spacing, never shown as a score). */
  practice: (skill: string, correct: boolean) => void;
  /** One completed math question; helped work must not count as independent mastery. */
  notePractice?: (skill: string, helped: boolean) => void;
  /** Mark explicit assistance even when it does not change the board state. */
  assistance?: () => void;
  skills: SkillProgress;
  /** Feedback tones ("tap" | "match" | "win") and any registered speech key. */
  sound: (key: string, automatic?: boolean) => void;
  stopSound: () => void;
  soundOn: boolean;
  width: number;
  height: number;
  /** False while a sheet is open or the app is in the background: pause timers and computer turns. */
  active: boolean;
  /**
   * First-move coaching: while `coach.active`, wrap the thing to touch first in <CoachSpot active>
   * (src/learn/Coach.tsx) and call `coach.done()` once the child makes that move.
   */
  coach: { active: boolean; done: () => void };
  /**
   * Celebrate a right answer ("right": small burst + tone) or a big moment ("big"). Never delays play.
   * Pass `say` (a speech key) instead of calling sound() alongside: there is one player, so the tone
   * would cut the line off. The frame plays the tone, then the line just after it.
   */
  cheer: (kind?: "right" | "big", say?: string) => void;
};
