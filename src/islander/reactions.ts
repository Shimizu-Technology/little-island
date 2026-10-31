import type { GameState } from '../games';
import { ticResult } from '../games/tic';
import { memoryResult } from '../games/memory';
import { checkersResultSeat } from '../games/checkers';
import { wordStatus } from '../games/words';
import { numbersStatus } from '../games/numbers';
import type { RoundResult } from '../games/match';

export type CompanionEvent = 'idle' | 'entry' | 'waiting' | 'correct' | 'incorrect' | 'complete' | 'win' | 'loss' | 'draw';
/** Display only: every caller supplies an accepted engine event/outcome. */
export function companionPose(event: CompanionEvent, desk = false, frame = 0): string {
  switch (event) {
    case 'idle': return 'idle';
    case 'entry': return 'wave';
    case 'waiting': return desk ? 'desk-write' : 'think';
    case 'correct': case 'win': return 'cheer';
    case 'incorrect': case 'loss': return 'try-again';
    case 'draw': return 'clap';
    case 'complete': return `dance-${frame % 4}`;
  }
}
export function resultEvent(result: RoundResult, solo: boolean): CompanionEvent {
  return result === 'draw' ? 'draw' : solo && result === 1 ? 'loss' : 'win';
}
export function classicEvent(s: GameState): CompanionEvent {
  switch (s.game) {
    case 'tic-tac-toe': return resultEvent(ticResult(s), s.options.mode === 'solo');
    case 'memory': return resultEvent(memoryResult(s), s.options.mode === 'solo');
    case 'checkers': return resultEvent(checkersResultSeat(s), s.options.mode === 'solo');
    case 'word-rescue': return wordStatus(s) === 'won' ? 'win' : 'loss';
    case 'numbers': return numbersStatus(s) === 'won' ? 'win' : 'loss';
    case 'maze': return 'win';
  }
}
export function showLearningCompanion(settings: { learningIslander?: boolean }): boolean {
  return settings.learningIslander !== false;
}
/** A computer seat never borrows a matching learner name; family seats may use any name. */
export function learnerPortraitOwner(name: string, people: readonly { id: string; name: string }[], active: string, computer = false): string | null {
  if (computer) return null;
  if (name === 'You') return active;
  const matches = people.filter(p => p.name.toLowerCase() === name.toLowerCase());
  return matches.length === 1 ? matches[0].id : null;
}
