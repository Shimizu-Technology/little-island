import { engines } from "./engines";
import { levelInfo, type LearningLevel } from "./levels";
import { levelRoundSkill } from "./learners";
import type { LearnId } from "./types";
export function noteLabel(key: string, labels: Record<string, string>): string {
  const [game, stage, skill] = key.split(":");
  const levels: Record<string, LearningLevel> = { easy: 1, medium: 2, hard: 3, stretch: 4, deep: 5 };
  const id = game as LearnId, level = levels[stage];
  const name = engines[id]?.name ?? "Learning practice";
  const activity = level && engines[id] ? `Level ${level} · ${levelInfo(id, level).name}` : "Practice";
  return `${name} · ${activity} · ${skill === levelRoundSkill ? "Completed rounds" : labels[skill] ?? "Practiced ideas"}`;
}
