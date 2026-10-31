import { bindRoundOwners, roundOwner } from './owners';
import { ticOutcome } from '../games/tic';
import { FOOD_CHAIN, HABITATS, PLACES } from '../explore/activities';
import type { Save } from '../state/validation';
import { initializePersonalization, personFor, type Person } from '../personalization/model';
import { applyCompletion, badgesFor, grantsFor, type Completion, MAX_MILESTONES, grantCatalog } from './engine';
import { finished } from '../learn/session';
import { levelOf } from '../learn/levels';
import { learnIds } from '../learn/types';
import { gameIds, isFinished } from '../games';
import { boardIds } from '../board';
import { activityFinished, activityIds } from '../state/activities';
import { arcadeIds } from '../arcade/types';

function put(save: Save, owner: string, person: Person): Save {
  const initialized = initializePersonalization(save);
  return { ...initialized, personalization: { ...initialized.personalization!, people: { ...initialized.personalization!.people, [owner]:person } } };
}
export function rewardCompletion(save: Save, fact: Completion, owner = save.learning?.active ?? 'family'): Save {
  const person = personFor(save,owner), next = applyCompletion(person,fact);
  return person === next ? save : put(save,owner,next);
}
function openWorld(save: Save, owner: string): Save {
  if (!Object.values(save.arcade?.people[owner]?.games ?? {}).some(g=>g.openWorlds.includes('w3'))) return save;
  const p = personFor(save,owner); if (p.milestones.length >= MAX_MILESTONES || p.milestones.includes('world:open-3')) return save;
  const milestones = [...p.milestones,'world:open-3'], grants = grantsFor(badgesFor(milestones)).filter(id=>!p.earned.includes(id));
  if (p.earned.length + grants.length > grantCatalog().length) return save;
  return put(save,owner,{...p,milestones,earned:[...p.earned,...grants],unseen:[...p.unseen,...grants]});
}
/** Only accepted Store transitions enter here. No screen lifecycle or result effect awards anything. */
export function rewardTransitions(before: Save, after: Save): Save {
  const owner = before.learning?.active ?? 'family';
  let next = bindRoundOwners(before, after);
  const owned = next;
  for (const game of learnIds) {
    const old=before.learn?.[game], round=after.learn?.[game];
    if(old && round && old.id===round.id && !finished(old) && finished(round))
      next=rewardCompletion(next,{kind:'learning',game,level:levelOf(round.options),helped:!!round.levelHelped},round.learner ?? 'family');
  }
  for(const game of gameIds) {
    const old=before.sessions[game], round=after.sessions[game];
    if(old && round && old.id===round.id && !isFinished(old) && isFinished(round)) {
      const owner = roundOwner(owned,`classic:${game}`,round.id);
      next=rewardCompletion(next,{kind:'classic',game,won:round.options.mode==='solo' && (round.game==='checkers' && round.position.outcome==='red' || round.game==='tic-tac-toe' && ticOutcome(round.board)===round.human),opponentStrength:round.options.mode==='solo'?round.options.difficulty:undefined},owner);
      if(round.game==='memory' && round.pack==='chamoru') next=rewardCompletion(next,{kind:'learning',game:'chamoru-memory',level:round.options.difficulty==='hard'?3:round.options.difficulty==='medium'?2:1,helped:false},owner);
    }
  }
  for(const game of boardIds) {
    const old=before.board?.[game], round=after.board?.[game];
    if(old && round && old.id===round.id && old.position.outcome===null && round.position.outcome!==null) {
      const owner = roundOwner(owned,`board:${game}`,round.id);
      next=rewardCompletion(next,{kind:'classic',game,won:game!=='reef-sweep' && round.mode==='solo' && round.position.outcome===0,opponentStrength:round.mode==='solo'?round.strength:undefined},owner);
    }
  }
  for(const game of activityIds) {
    const old=before.activities?.[game],round=after.activities?.[game];
    if(old && round && old.id===round.id && !activityFinished(old) && activityFinished(round)) next=rewardCompletion(next,{kind:'classic',game},roundOwner(owned,`activity:${game}`,round.id));
  }
  for(const game of arcadeIds) {
    const old=before.arcade?.people[owner]?.games[game]?.stars ?? {}, stars=after.arcade?.people[owner]?.games[game]?.stars ?? {};
    for(const [level,value] of Object.entries(stars)) if(value && !old[level as keyof typeof old]) next=rewardCompletion(next,{kind:'arcade',game,level},owner);
  }
  const oldLabs=before.explore?.progress?.labs, labs=after.explore?.progress?.labs;
  if(labs) {
    const checks = { oceans: (s: typeof labs.oceans)=>s.chain.length===FOOD_CHAIN.length, animals:(s:typeof labs.animals)=>s.habitat===HABITATS.length, world:(s:typeof labs.world)=>s.expedition===PLACES.length, weather:(s:typeof labs.weather)=>s.journey.length>3 && s.water==='ocean', space:(s:typeof labs.space)=>s.turn===7 };
    for(const world of Object.keys(checks) as (keyof typeof checks)[]) if(checks[world](labs[world]) && (!oldLabs || !checks[world](oldLabs[world]))) next=rewardCompletion(next,{kind:'explore',topic:`lab-${world}`},roundOwner(owned,`explore:lab-${world}`,`explore:lab-${world}`));
  }
  return openWorld(next,owner);
}
/** Once per owner; old histories with completed-round evidence only. Never invent activity history. */
export function backfillRewards(save: Save): Save {
  let next=bindRoundOwners(save,initializePersonalization(save));
  for(const learner of next.learning?.people ?? [{id:'family',notes:{}}]) {
    const original=personFor(next,learner.id); if(original.milestones.length >= MAX_MILESTONES || original.milestones.includes('migration:badges-v1')) continue;
    for(const game of arcadeIds) for(const [level,stars] of Object.entries(next.arcade?.people[learner.id]?.games[game]?.stars ?? {})) if(stars) next=rewardCompletion(next,{kind:'arcade',game,level},learner.id);
    for(const [key,note] of Object.entries(learner.notes)) {
      const [game,stage,skill]=key.split(':');
      if(skill!=='think.level-round' || !(note.independent+note.helped)) continue;
      next=rewardCompletion(next,{kind:'learning',game,level:['easy','medium','hard','stretch','deep'].indexOf(stage)+1,helped:!!note.helped},learner.id);
    }
    next=openWorld(next,learner.id);
    const p=personFor(next,learner.id);
    next=put(next,learner.id,{...p,milestones:p.milestones.length < MAX_MILESTONES ? [...p.milestones,'migration:badges-v1'] : p.milestones,unseen:original.unseen});
  }
  return next;
}
/** Identifies a changed result, so a later mount of an old celebration cannot replay the card. */
export function completionSource(before: Save, after: Save): string | undefined {
  for(const game of learnIds) if(before.learn?.[game] !== after.learn?.[game] && after.learn?.[game] && finished(after.learn[game]!)) return after.learn[game]!.id;
  for(const game of gameIds) if(before.sessions[game] !== after.sessions[game] && after.sessions[game] && isFinished(after.sessions[game]!)) return after.sessions[game]!.id;
  for(const game of boardIds) if(before.board?.[game] !== after.board?.[game] && after.board?.[game]?.position.outcome != null) return after.board[game]!.id;
  for(const game of activityIds) if(before.activities?.[game] !== after.activities?.[game] && after.activities?.[game] && activityFinished(after.activities[game]!)) return after.activities[game]!.id;
  const owner=after.learning?.active ?? 'family';
  const topic=personFor(after,owner).milestones.find(m=>m.startsWith('explore:') && !personFor(before,owner).milestones.includes(m));
  if(topic) return topic;
  if(before.arcade?.people[owner]?.chest && !after.arcade?.people[owner]?.chest) return before.arcade.people[owner].chest!.round;
  const old=before.arcade?.people[owner]?.rounds ?? [];
  return after.arcade?.people[owner]?.rounds.find(r=>!old.includes(r));
}
