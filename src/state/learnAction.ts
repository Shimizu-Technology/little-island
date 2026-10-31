import type { Save } from "./validation";
import type { LearnId, LearnSession } from "../learn/types";
import { validLearnSession } from "../learn/session";
import { rememberLearningChoice, recordLearning, familyLearners } from "../learn/learners";
import { growthProgress, growthQuestions, isGrowth } from "../learn/growth/engine";
import { dayNumber, recordPractice } from "../learn/skills";
export type LearnExpected = { id: string | null; revision?: number; epoch: number };
/** Reject callbacks from replaced rounds or an earlier backup generation (same rules as activities). */
export function applyLearnSave(save: Save, game: LearnId, next: LearnSession, expected: LearnExpected, epoch: number): Save {
  const current = save.learn?.[game];
  if (
    expected.epoch !== epoch ||
    (current?.id ?? null) !== expected.id ||
    (expected.revision !== undefined && current?.revision !== expected.revision) ||
    !validLearnSession(next, game)
  )
    return save;
  let updated = { ...save, learn: { ...save.learn, [game]: next }, recentLearn: game, recentActivity: null } as Save;
  const owner = next.learner ?? "family";
  if (current?.id !== next.id && owner === (save.learning?.active ?? "family")) updated.learning = rememberLearningChoice(save.learning, owner, game, next.options);
  if (next.options.stage && isGrowth(next.state) && current?.id === next.id && isGrowth(current.state)) {
    const qs = growthQuestions(game, next.options, next.state), after = growthProgress(next.state, qs), before = growthProgress(current.state, qs);
    for (let i = before.clean.length; i < after.clean.length; i++) {
      const q = qs[i], helped = !after.clean[i];
      updated = applyPractice(updated, q.skill, !helped);
      if (next.options.mode === "solo") updated.learning = recordLearning(updated.learning, owner, game, next.options.stage, q.skill, q.id, next.id, helped);
    }
  }
  return updated;
}
export function applyPractice(save: Save, skill: string, correct: boolean, day = dayNumber()): Save {
  const skills = recordPractice(save.skills, skill, correct, day);
  return skills === save.skills ? save : { ...save, skills };
}

/** Original engines emit practice signals, not independently mastered task records. */
export function applyOwnedPractice(save: Save, game: LearnId, expected: LearnExpected, epoch: number, skill: string, correct: boolean): Save {
  const current = save.learn?.[game];
  if (!current || expected.epoch !== epoch || current.id !== expected.id || expected.revision === undefined || current.revision < expected.revision || current.revision > expected.revision + 1) return save;
  const shared = applyPractice(save, skill, correct);
  const owner = current.learner ?? "family", learning = save.learning ?? familyLearners();
  if (current.options.mode !== "solo" || learning.active !== owner || !learning.people.some(p => p.id === owner)) return shared;
  return { ...shared, learning: { ...learning, people: learning.people.map(p => p.id === owner ? { ...p, skills: recordPractice(p.skills, skill, correct) } : p) } };
}
