import { TOPICS } from '../src/explore/content';
import { milestoneCatalog, grantCatalog, MAX_MILESTONES } from '../src/badges/engine';
import { describe, expect, it } from 'vitest';
import { badgeInfo, applyCompletion, badgesFor, grantsFor, progressFor, progressForBadge, tracks, type Completion } from '../src/badges/engine';
import { backfillRewards, rewardTransitions } from '../src/badges/transitions';
import { starterPerson, personFor, validPerson, applyPersonalization } from '../src/personalization/model';
import { emptySave, parseSave } from '../src/state/validation';
import { arcadeTransition, emptyArcade } from '../src/arcade/progress';
import { applyArcadeAction } from '../src/arcade/saveAction';
import { startSession } from '../src/learn/session';
import { applyLearnSave } from '../src/state/learnAction';
import { mathMove, questionOf, type MathRound } from '../src/learn/games/shell-math/round';
import { mathAnswer } from '../src/math/questions';
import { addLearner, recordLearning, levelRoundSkill } from '../src/learn/learners';
import { defaultOptions } from '../src/games/types';
import { createTic, ticMove } from '../src/games/tic';
import { createSession, engines } from '../src/board';
import { canWear, styleCatalog, lockedReason } from '../src/personalization/catalog';
import { preserveAndReplace } from '../src/state/replacement';
const learnGames = {math:['shell-math','number-hop'],reading:['sound-boat','turtle-tales'],science:['tide-pool','float-sink'],coding:['beep-bot','turtle-draw'],chamoru:['hafa-adai','chamoru-memory']} as const;
function finishMath(s: MathRound) { while(s.index<s.questions.length) { while(s.steps<questionOf(s).b) s=mathMove(s,'shell-math',{type:'step'}); s=mathMove(s,'shell-math',{type:'answer',answer:mathAnswer(questionOf(s))});s=mathMove(s,'shell-math',{type:'next'}); } return s; }
describe('permanent distinct accomplishment badges',()=>{
  for(const track of ['math','reading','science','coding','chamoru'] as const) {
    const [game,other] = learnGames[track];
    it(`${track}: counts assistance and all four count thresholds`,()=>{
      let p=starterPerson();
      for(let i=0;i<10;i++) {
        p=applyCompletion(p,{kind:'learning',game:i<5?game:other,level:other==='chamoru-memory' && i>=5?i%3+1:i%5+1,helped:true});
        if(i===0) expect(badgesFor(p.milestones)).toContain(`${track}-1`);
        if(i===2) expect(badgesFor(p.milestones)).toContain(`${track}-2`);
      }
      expect(badgesFor(p.milestones).filter(b=>b.startsWith(track))).toHaveLength(4);
      expect(validPerson(p)).toBe(true);
    });
    it(`${track}: independent level shortcuts and exact boundaries`,()=>{
      expect(badgesFor([`learn:${game}:2`])).not.toContain(`${track}-3`);
      expect(badgesFor([`learn:${game}:3`])).toContain(`${track}-3`);
      expect(badgesFor([`learn:${game}:4`])).not.toContain(`${track}-4`);
      expect(badgesFor([`learn:${game}:5`])).toContain(`${track}-4`);
      const prefix=track==='science'?'explore:':'learn:'+game+':';
      // Count routes remain available without a high-level requirement.
      const ids=track==='science'?Array.from({length:10},(_,i)=>prefix+'topic-'+i):[game,other,...(track==='math'?['reef-race','island-market','quick-practice']:track==='reading'?['which-one']:track==='coding'?['crab-commands','tide-logic','code-lab']:[])].flatMap(g=>[1,2].map(l=>`learn:${g}:${l}`));
      if(ids.length>=6) {expect(badgesFor(ids.slice(0,5))).not.toContain(`${track}-3`);expect(badgesFor(ids.slice(0,6))).toContain(`${track}-3`);}
      if(ids.length>=10) {expect(badgesFor(ids.slice(0,9))).not.toContain(`${track}-4`);expect(badgesFor(ids)).toContain(`${track}-4`);}
    });
  }
  it('science topics are distinct and never grant from duplicate topics',()=>{
    let p=starterPerson(); for(let i=0;i<10;i++)p=applyCompletion(p,{kind:'explore',topic:TOPICS[i % TOPICS.length].id});
    expect(badgesFor(p.milestones)).toEqual(['science-1','science-2','science-3','science-4']);
    expect(applyCompletion(p,{kind:'explore',topic:TOPICS[9].id})).toBe(p);
  });
  it('arcade 1/8/40, a complete world, World 3 opened, and World 6',()=>{
    const ids=Array.from({length:40},(_,i)=>`arcade:reef-builder:w${Math.floor(i/8)+1}-${i%8+1}`);
    expect(badgesFor(ids.slice(0,1))).toContain('arcade-1');
    expect(badgesFor(ids.slice(0,7))).not.toContain('arcade-2');
    expect(badgesFor(ids.slice(0,8))).toEqual(expect.arrayContaining(['arcade-2','arcade-3']));
    expect(badgesFor(ids.slice(0,39))).not.toContain('arcade-4');
    expect(badgesFor(ids)).toContain('arcade-4');
    expect(badgesFor(['world:open-3'])).toContain('arcade-3');
    expect(badgesFor(['arcade:lagoon-run:w6-1'])).toContain('arcade-4');
  });
  it('both learning-only and arcade-only routes reach track tier four',()=>{
    expect(badgesFor(['learn:shell-math:5'])).toContain('math-4');
    for(const game of ['reef-builder','shell-song']) {
      let p=starterPerson();for(let i=0;i<10;i++)p=applyCompletion(p,{kind:'arcade',game:i<8?game:game==='shell-song'?'rail-parade':'lagoon-run',level:`learn-${i%8+1}`});
      expect(badgesFor(p.milestones)).toContain(game==='shell-song'?'reading-4':'math-4');
    }
  });
  it('classic counts different games, draws and losses; only opponent wins shortcut Champion',()=>{
    const games=['tic-tac-toe','memory','checkers','maze','numbers','coconut-drop','fishing-nets','go-fish','crazy-eights','racer'];let p=starterPerson();
    games.forEach((game,i)=>{p=applyCompletion(p,{kind:'classic',game});if([0,2,5,9].includes(i))expect(badgesFor(p.milestones)).toContain(`classic-${[0,2,5,9].indexOf(i)+1}`);});
    for(const strength of ['growing','challenge','medium','hard'])expect(badgesFor(applyCompletion(starterPerson(),{kind:'classic',game:'checkers',won:true,opponentStrength:strength}).milestones)).toContain('classic-4');
    expect(badgesFor(applyCompletion(starterPerson(),{kind:'classic',game:'checkers',won:true,opponentStrength:'gentle'}).milestones)).not.toContain('classic-4');
  });
  it('all 28 badges grant catalog items and object rows',()=>{
    for(const track of tracks)for(const tier of [1,2,3,4] as const)expect(grantsFor([`${track}-${tier}`]).length).toBeGreaterThan(0);
    expect(grantsFor(['science-3'])).toEqual(expect.arrayContaining(['aquarium','telescope']));
    expect(grantsFor(['math-2'])).toEqual(expect.arrayContaining(['blocks','outfit:number-tee']));
    expect(grantsFor(['classic-3'])).toContain('chime');
  });
  it('a high-level first badge never prevents earning the earlier count badges',()=>{
    let p=applyCompletion(starterPerson(),{kind:'learning',game:'shell-math',level:5,helped:true});
    p=applyCompletion(p,{kind:'learning',game:'shell-math',level:1,helped:true});p=applyCompletion(p,{kind:'learning',game:'number-hop',level:1,helped:true});
    expect(badgesFor(p.milestones)).toEqual(['math-1','math-2','math-3','math-4']);
    expect(badgesFor(applyCompletion(starterPerson(),{kind:'classic',game:'go-fish',won:true,opponentStrength:'hard'}).milestones)).not.toContain('classic-4');
  });
  it('duplicates/retries/reloads are identity no-ops, capped without evicting earlier evidence',()=>{
    const fact:Completion={kind:'learning',game:'shell-math',level:1,helped:true},p=applyCompletion(starterPerson(),fact);
    expect(applyCompletion(p,fact)).toBe(p);expect(applyCompletion(JSON.parse(JSON.stringify(p)),fact)).toEqual(p);
    let all=starterPerson();for(let i=0;i<1000;i++)all=applyCompletion(all,{kind:'explore',topic:TOPICS[i % TOPICS.length].id});
    expect(all.milestones).toHaveLength(10);expect(all.milestones[0]).toBe(`explore:${TOPICS[0].id}`);expect(validPerson(all)).toBe(true);
    expect(progressFor('science',all.milestones)).toBe('All four badges earned');
    expect(progressFor('math',p.milestones)).toContain('1 of 3');
    expect(progressForBadge('classic-4',['classic:maze'])).toContain('1 of 10');
  });
  it('the save boundary rejects an unearned look from any editor',()=>{
    const save=backfillRewards(emptySave()), expected={learner:'family',epoch:1};
    expect(applyPersonalization(save,{look:{...personFor(save).look,outfit:'number-tee'},made:true},expected,1)).toBe(save);
    const earned=rewardTransitions(save,save);earned.personalization!.people.family.earned=['outfit:number-tee'];
    expect(applyPersonalization(earned,{look:{...personFor(earned).look,outfit:'number-tee'}},expected,1)).not.toBe(earned);
  });
  it('reward wardrobe choices really lock and earned choices wear',()=>{
    const item=styleCatalog.find(i=>i.id==='outfit:number-tee')!;expect(lockedReason(item,[])).toContain('Builder');expect(canWear({...starterPerson().look,outfit:'number-tee'},[])).toBe(false);expect(canWear({...starterPerson().look,outfit:'number-tee'},['outfit:number-tee'])).toBe(true);
  });
});
describe('accepted transitions, backfill, recovery',()=>{
  it('arcade clear uses one atomic result, retry/reload and stale owners never re-emit',()=>{
    const before=backfillRewards(emptySave()),action={type:'finish',game:'reef-builder',level:'w1-1',round:'badge-round',stars:1,score:1,name:'Family'} as const,expected={learner:'family',epoch:1};
    const accepted=applyArcadeAction(before,action,expected,1),after=rewardTransitions(before,accepted);
    expect(personFor(after).earned).toEqual(expect.arrayContaining(['hat:runner-headband']));
    expect(personFor(after).earned).not.toContain('accessory:calculator-watch');
    expect(applyArcadeAction(after,action,expected,1)).toBe(after);
    expect(rewardTransitions(after,parseSave(JSON.stringify(after)))).toEqual(after);
    expect(applyArcadeAction(before,action,{learner:'other',epoch:1},1)).toBe(before);
    expect(applyArcadeAction(before,action,expected,2)).toBe(before);
    const loss=applyArcadeAction(before,{...action,stars:0},expected,1);expect(personFor(rewardTransitions(before,loss)).earned).toEqual([]);
  });
  it('helped Family/together learning earns in the accepted save, never from a result mount',()=>{
    const round={...startSession('shell-math',{options:{mode:'together',pace:'easy'}},{},44),learner:'family'},before={...backfillRewards(emptySave()),learn:{'shell-math':round}};
    const done={...round,revision:1,levelHelped:true,state:finishMath(round.state as MathRound)};
    const accepted=applyLearnSave(before,'shell-math',done,{id:round.id,revision:0,epoch:1},1),after=rewardTransitions(before,accepted);
    expect(personFor(after).earned).toContain('accessory:calculator-watch');expect(applyLearnSave(after,'shell-math',done,{id:round.id,revision:0,epoch:1},1)).toBe(after);
    expect(rewardTransitions(after,after)).toEqual(after);
  });
  it('classic accepted end awards once; unfinished setup and replay do not',()=>{
    let s=createTic({...defaultOptions,mode:'together'}); for(const cell of [0,3,1,4])s=ticMove(s,cell);
    const before={...backfillRewards(emptySave()),sessions:{'tic-tac-toe':s}},after=rewardTransitions(before,{...before,sessions:{'tic-tac-toe':ticMove(s,2)}});
    expect(personFor(after).milestones).toContain('classic:tic-tac-toe');expect(personFor(rewardTransitions(after,after)).earned).toEqual(personFor(after).earned);
  });
  it('real board engine win at Growing grants Champion',()=>{
    let round=createSession('coconut-drop',{mode:'solo',strength:'growing',seed:1});
    for(const move of [0,1,0,1,0,1])round={...round,position:engines['coconut-drop'].move(round.position,move)};
    const before={...backfillRewards(emptySave()),board:{'coconut-drop':round}},after=rewardTransitions(before,{...before,board:{'coconut-drop':{...round,position:engines['coconut-drop'].move(round.position,0)}}});
    expect(personFor(after).earned).toContain('palette:royal');
  });
  it('backfill is idempotent, seen, preserves original bytes and only reliable round histories',()=>{
    let save=emptySave();save.arcade=arcadeTransition(emptyArcade(),'family',{type:'finish',game:'reef-builder',level:'w1-1',stars:2,score:1,round:'old',name:'Family'});
    const raw=JSON.stringify(save),next=backfillRewards(parseSave(raw));expect(JSON.stringify(save)).toBe(raw);expect(personFor(next).unseen).toEqual([]);expect(personFor(next).milestones).toContain('arcade:reef-builder:w1-1');expect(backfillRewards(next)).toBe(next);expect(parseSave(JSON.stringify(next))).toEqual(next);
  });
  it('accepts every real milestone with headroom and rejects capacity-exhausting garbage',()=>{
    const save=backfillRewards(emptySave()),p=save.personalization!.people.family;
    p.milestones=[...milestoneCatalog];p.earned=grantCatalog();p.unseen=[...p.earned];
    expect(MAX_MILESTONES).toBeGreaterThan(milestoneCatalog.length);
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(backfillRewards(save)).toBe(save);
    p.milestones=Array.from({length:256},(_,i)=>`legacy:${i}`);
    expect(()=>parseSave(JSON.stringify(save))).toThrow(/original has been kept/);
  });
  it('backfills only reliable completed-round notes for each learner and marks grants seen',()=>{
    let learning=addLearner(undefined,'Mina','mina');
    learning=recordLearning(learning,'mina','shell-math','hard',levelRoundSkill,'completed-round','old-complete',true);
    learning=recordLearning(learning,'mina','sound-boat','easy','read.short-a','one-answer','unfinished',false);
    const save={...emptySave(),learning},migrated=backfillRewards(save);
    expect(personFor(migrated,'mina').milestones).toContain('learn:shell-math:3');
    expect(personFor(migrated,'mina').earned).toContain('abacus');
    expect(personFor(migrated,'mina').earned).not.toContain('hat:bookworm-beanie');
    expect(personFor(migrated,'family').earned).toEqual([]);
    expect(personFor(migrated,'mina').unseen).toEqual([]);expect(backfillRewards(migrated)).toBe(migrated);
  });
  it('an accepted helped chest claim earns its subject once, atomically with consumption',()=>{
    const expected={learner:'family',epoch:1};
    const cleared=applyArcadeAction(backfillRewards(emptySave()),{type:'finish',game:'reef-builder',level:'w1-1',stars:1,score:1,round:'chest-round',name:'Family'},expected,1);
    const claimed=applyArcadeAction(cleared,{type:'claim-chest',round:'chest-round',result:{skill:'num.add-within-10',helped:true},config:{enabled:true,subject:'math',limit:10,operation:'mixed'}},expected,1);
    expect(claimed.arcade!.people.family.chest).toBeNull();expect(personFor(claimed).earned).toContain('accessory:calculator-watch');
    expect(applyArcadeAction(claimed,{type:'claim-chest',round:'chest-round',result:{skill:'num.add-within-10',helped:true},config:{enabled:true,subject:'math',limit:10,operation:'mixed'}},expected,1)).toBe(claimed);
  });
  it('rejects malformed extended fields and retains exact recovery original on replacement',async()=>{
    const save=backfillRewards(emptySave()),bad=JSON.parse(JSON.stringify(save));bad.personalization.people.family.unseen=['not-earned'];expect(()=>parseSave(JSON.stringify(bad))).toThrow(/original has been kept/);
    const preserved:string[]=[];let stored='';await preserveAndReplace({get:async()=>null,listRecovery:async()=>[],readRecovery:async()=>null,preserve:async raw=>{preserved.push(raw)},set:async raw=>{stored=raw}},JSON.stringify(save),'{bad original');expect(preserved).toEqual(['{bad original']);expect(parseSave(stored)).toEqual(save);
  });
});

// These labels are shared by My badges, wall details and all locked reward reasons.
it('explains distinct progress without game-level jargon or losing alternative routes', () => {
  expect(badgeInfo('math-2').rule).toBe('Finish 3 different math games or levels.');
  expect(badgeInfo('arcade-2').rule).toBe('Clear 8 different arcade levels.');
  expect(badgeInfo('math-4').rule).toBe('Finish a Math round at Level 5, or finish 10 different math games or levels.');
  for (const track of tracks) for (const tier of [1, 2, 3, 4] as const) expect(badgeInfo(`${track}-${tier}`).rule).not.toMatch(/pairs|3\+/);
  expect(progressForBadge('math-2', ['learn:shell-math:1'])).toBe('1 of 3 done');
  expect(progressForBadge('arcade-2', ['arcade:reef-builder:w1-1'])).toBe('1 of 8 done');
});
