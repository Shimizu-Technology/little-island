import { CANOE_DEPTH, isCanoe } from './geometry';
import { createRun, runLearning, runResult, runSpeed, runStep, runTransition, type RunInput, type RunState } from './engine';
import type { ScrollLevel } from '../scrolling/content';
/** Legal input fixture. It follows authored shell trails and reacts ahead of contact;
 * it never edits physics, hearts, powers, score, or collision state. */
export function fixtureInput(s: RunState): RunInput {
  const row = s.rows.filter(r => !r.passed).sort((a,b) => b.z-a.z)[0];
  if (!row) return { type: 'idle' };
  const lane = runLearning(s) ? row.fact.choices.indexOf(row.fact.answer) : row.shellLane;
  if (s.lane !== lane) {
    // Do not steer into the stern of the beat just passed. The next action can
    // still begin while we finish the current clear lane.
    const blocked = !runLearning(s) && s.rows.some(r => r.passed && r.z <= 1 + CANOE_DEPTH && r.z >= 1 &&
      (isCanoe(r.kind) && Math.abs(lane-r.lane)<.46 || r.second>=0 && isCanoe(r.secondKind) && Math.abs(lane-r.second)<.46 || r.third && isCanoe(r.kind) && Math.abs(lane-r.shellLane)<.46));
    if (!blocked) return { type: 'lane', lane };
  }
  const until = (1-row.z)/(runSpeed(s)*(row.kind === 'moving-canoe' || row.kind === 'coconut' ? 1.12 : 1));
  if (!runLearning(s) && until <= (row.surface === 'gap' ? s.sandals > 0 ? .3 : .12 : .4) && until > 0 && row.action === 'jump' && !s.jump && !s.kite) return {type:'jump'};
  if (!runLearning(s) && until <= .42 && until > 0 && row.action === 'duck' && !s.duck && !s.kite) return {type:'duck'};
  return {type:'idle'};
}
export function runFixture(level: ScrollLevel | 'endless', seed = 771, helper = false, ticks = 30000) {
  let s = createRun(level,seed,helper);
  const actions: {tick:number; input:RunInput;passed:number}[] = [];
  for (let tick=0; tick<ticks && !runResult(s); tick++) {
    const input = fixtureInput(s);
    if (input.type !== 'idle') actions.push({tick,input,passed:s.passed});
    s = runStep(runTransition(s,input),{type:'idle'},1/60);
  }
  return {state:s,actions,result:runResult(s)};
}
