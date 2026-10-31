import type { LearnOptions } from "./types";

export const levelNumbers = [1, 2, 3, 4, 5] as const;
export type LearningLevel = (typeof levelNumbers)[number];
export const levelOf = (o?: LearnOptions): LearningLevel =>
  o?.stage === "deep" ? 5 : o?.stage === "stretch" ? 4 : o?.pace === "hard" ? 3 : o?.pace === "medium" ? 2 : 1;
/** Only the existing pace/stage represent a level. Keep all other choices. */
export function optionsAtLevel(o: LearnOptions, level: LearningLevel): LearnOptions {
  const { stage: _stage, ...base } = o;
  return level <= 3
    ? { ...base, pace: (["easy", "medium", "hard"] as const)[level - 1] }
    : { ...base, stage: level === 4 ? "stretch" : "deep" };
}
export const levelStage = (o: LearnOptions) => o.stage ?? o.pace;
