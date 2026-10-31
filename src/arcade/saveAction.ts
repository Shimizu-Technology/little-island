import { rewardCompletion } from '../badges/transitions';
import { recordLearning } from "../learn/learners";
import { recordPracticeNote } from "../practice/notes";
import type { Save } from "../state/validation";
import { emptyArcade, arcadeTransition, type ArcadeAction } from "./progress";
import type { ArcadeExpected } from "./types";
/** One atomic progress/practice write, owned by the active learner and restore generation. */
export function applyArcadeAction(before: Save, action: ArcadeAction, expected: ArcadeExpected, epoch: number): Save {
  const owner = before.learning?.active ?? "family";
  if (expected.epoch !== epoch || expected.learner !== owner) return before;
  const base = before.arcade ?? emptyArcade(), arcade = arcadeTransition(base, owner, action);
  if (arcade === base && !(action.type === "visit" && (before.recent || before.recentActivity || before.recentLearn || before.recentBoard))) return before;
  let next: Save = { ...before, arcade };
  if (action.type === "visit") next = { ...next, recent: null, recentActivity: null, recentLearn: null, recentBoard: null };
  if (action.type === "claim-chest") {
    // Only an accepted, unconsumed chest reaches here. A double tap cannot double-credit notes.
    const result = action.result, math = result.skill.startsWith("num.");
    const stage = math ? action.config.mathStage ?? (action.config.limit === 10 ? "easy" : "medium") : action.config.readingStage ?? "easy";
    next = { ...next, practiceNotes: recordPracticeNote(before.practiceNotes, result.skill, result.helped), learning: recordLearning(before.learning, owner, math ? "quick-practice" : "which-one", stage, result.skill, "arcade-chest", action.round, result.helped) };
    next = rewardCompletion(next, { kind: "learning", game: math ? "quick-practice" : "which-one", level: ["easy","medium","hard","stretch","deep"].indexOf(stage) + 1, helped: result.helped }, owner);
  }
  return next;
}
