import type { Save } from './validation';
import { rewardCompletion } from '../badges/transitions';
import { validPracticeSummary, validPracticeSettings } from '../practice/types';
import { recordLearning, levelRoundSkill } from '../learn/learners';
import type { PracticeResult, PracticeSettings } from '../practice/types';
/** Called only for an accepted complete sheet, never cancellation or bypass. */
export function applyWarmup(save: Save, results: PracticeResult[], config: PracticeSettings, round: string): Save {
  if (!validPracticeSettings(config) || !validPracticeSummary({ results, bypassed: false }) || !round || round.length > 120) return save;
  const owner = save.learning?.active ?? 'family';
  let learning = save.learning;
  for (const [i, result] of results.entries()) {
    const math = result.skill.startsWith('num.');
    const stage = math ? config.mathStage ?? (config.limit === 10 ? 'easy' : 'medium') : config.readingStage ?? 'easy';
    learning = recordLearning(learning, owner, math ? 'quick-practice' : 'which-one', stage, result.skill, `warmup-${i}`, round, result.helped);
  }
  let next = learning === save.learning ? save : { ...save, learning };
  for (const math of [true, false]) {
    const subject = results.filter(r => r.skill.startsWith('num.') === math);
    if (!subject.length) continue;
    const game = math ? 'quick-practice' : 'which-one';
    const stage = math ? config.mathStage ?? (config.limit === 10 ? 'easy' : 'medium') : config.readingStage ?? 'easy';
    const helped = subject.some(r => r.helped);
    const completed = recordLearning(next.learning, owner, game, stage, levelRoundSkill, 'warmup-complete', round, helped);
    if (completed !== next.learning) next = { ...next, learning: completed };
    next = rewardCompletion(next, { kind: 'learning', game, level: ['easy','medium','hard','stretch','deep'].indexOf(stage)+1, helped }, owner);
  }
  return next;
}
