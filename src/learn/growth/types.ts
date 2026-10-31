import type { LearnId } from "../types";

/** Additive stages: the original saved engines and their three paces remain intact. */
export type GrowthStage = "stretch" | "deep";
export type GrowthScene = {
  kind: "tens" | "groups" | "hops" | "passage" | "word" | "trials" | "program" | "language";
  values?: readonly number[];
  labels?: readonly string[];
  text?: string;
  cells?: readonly string[];
};
export type GrowthQuestion = {
  /** Stable within the game, independent of display order. */
  id: string;
  skill: string;
  skillLabel: string;
  prompt: string;
  context?: string;
  /** Each choice has a stable, unique value; positions are shuffled by the engine. */
  choices: readonly { value: string; label: string }[];
  answer: string;
  /** Visible and spoken from the same trusted content; also the Show me explanation. */
  explanation: string;
  scene?: GrowthScene;
  /** Optional word/program construction. The answer is the pieces joined with |. */
  tiles?: readonly string[];
};
export type GrowthTrack = { label: string; description: string; questions: readonly GrowthQuestion[] };
export type GrowthTracks = Partial<Record<LearnId, Record<GrowthStage, GrowthTrack>>>;
export type GrowthAction = { type: "answer"; value: string } | { type: "help" } | { type: "next" };
export type GrowthState = { type: "growth"; version: 1; starter: 0 | 1; ids: string[]; orders: string[][]; history: GrowthAction[]; draft?: number[] };
export type GrowthVisualProps = {
  question: GrowthQuestion;
  showHelp: boolean;
  width: number;
  disabled: boolean;
  /** Interactive demonstrations count as help; never award independent credit. */
  onHelp: () => void;
};
