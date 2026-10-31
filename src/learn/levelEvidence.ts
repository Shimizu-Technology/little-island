import type { Save } from "../state/validation";
import type { LearnId } from "./types";
import { engines } from "./engines";
import { finished } from "./session";
import { growthProgress, growthQuestions } from "./growth/engine";
import type { GrowthState } from "./growth/types";
import { levelRoundSkill, recordLearning } from "./learners";
import { levelStage } from "./levels";
import { dayNumber } from "./skills";

/** A round summary is separate from individual answers and optional warm-up practice. */

export function recordLevelRound(before: Save, after: Save, game: LearnId, day = dayNumber()): Save {
  const old = before.learn?.[game], next = after.learn?.[game];
  if (!old || !next || old.id !== next.id || finished(old) || !finished(next) || next.options.mode !== "solo" ||
    (next.learner ?? "family") === "family" || next.learner !== after.learning?.active ||
    old.levelHelped === undefined || next.levelHelped === undefined) return after;
  let helped = old.levelHelped || next.levelHelped || !!engines[game].notWon?.(next.state, next.options);
  if (next.options.stage && !engines[game].ownLevels) {
    const s = next.state as GrowthState;
    helped ||= growthProgress(s, growthQuestions(game, next.options, s)).clean.some(clean => !clean);
  }
  // Browsing vocabulary is discovery, not independent word recognition.
  if (game === "hafa-adai" && !next.options.stage && (next.state as { activity: string }).activity !== "spy") helped = true;
  const learning = recordLearning(after.learning, next.learner!, game, levelStage(next.options), levelRoundSkill, "completed-round", next.id, helped, day);
  return learning === after.learning ? after : { ...after, learning };
}
