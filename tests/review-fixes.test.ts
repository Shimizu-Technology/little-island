import { expect, it } from 'vitest';
import { emptySave, parseSave } from '../src/state/validation';
import { initializePersonalization, personFor, applyPersonalization } from '../src/personalization/model';
import { rewardTransitions, backfillRewards } from '../src/badges/transitions';
import { addLearner, selectLearner } from '../src/learn/learners';
import { startSession } from '../src/learn/session';
import { mathMove, questionOf, type MathRound } from '../src/learn/games/shell-math/round';
import { mathAnswer } from '../src/math/questions';
import { spotFromPoint, characterDrop } from '../src/home/geometry';
import { instance, starterHome, validHome } from '../src/home/model';
import { applyWarmup } from '../src/state/warmupAction';
import { defaultPracticeSettings } from '../src/practice/types';
import { bindRoundOwners } from '../src/badges/owners';
import { createTic, ticMove } from '../src/games/tic';
import { defaultOptions } from '../src/games/types';
import { createSession, engines } from '../src/board';
import { newExploreProgress } from '../src/explore/progress';
import { newLab } from '../src/explore/activities';
import { milestoneCatalog, MAX_MILESTONES, grantCatalog, applyCompletion } from '../src/badges/engine';
import { emptyArcade, arcadeLearner } from '../src/arcade/progress';

function finish(s: MathRound) { while(s.index<s.questions.length) { while(s.steps<questionOf(s).b)s=mathMove(s,'shell-math',{type:'step'});s=mathMove(s,'shell-math',{type:'answer',answer:mathAnswer(questionOf(s))});s=mathMove(s,'shell-math',{type:'next'}); }return s; }
for(const [owner,active] of [['mina','family'],['family','mina'],['mina','leo'],['leo','mina']])it(`credits ${owner} while ${active} is active`,()=>{
 let learning=addLearner(addLearner(undefined,'Mina','mina'),'Leo','leo');learning=selectLearner(learning,active);
 const round={...startSession('shell-math',{options:{mode:'together',pace:'easy'}},{},44),learner:owner};
 const before=initializePersonalization({...emptySave(),learning,learn:{'shell-math':round}});
 const after=rewardTransitions(before,{...before,learn:{'shell-math':{...round,state:finish(round.state as MathRound)}}});
 expect(personFor(after,owner).milestones).toContain('learn:shell-math:1');expect(personFor(after,active).milestones).toEqual([]);
});
for(const change of ['look','furniture','sticker','theme','grant','milestone'])it(`rejects tampered ${change} at restore and write boundaries`,()=>{
 const save=initializePersonalization(emptySave()), p=structuredClone(personFor(save));
 if(change==='look')p.look={...p.look,outfit:'number-tee'};
 if(change==='furniture'){p.home=starterHome();p.home.rooms.home.instances=[instance('unowned','abacus',0,0)];p.home.rooms.home.characters=[];}
 if(change==='sticker')(p.home as import("../src/home/model").HomeStateV2).rooms.home.instances.push(instance('unowned','sticker:reef-fish' as never,0,0));
 if(change==='theme')(p.home as import("../src/home/model").HomeStateV2).rooms.home.theme.wallpaper='math-lab';
 if(change==='grant')p.earned=['garbage'];
 if(change==='milestone')p.milestones=['explore:made-up'];
 expect(validHome(p.home)).toBe(true);
 const bad={...save,personalization:{...save.personalization!,people:{family:p}}};
 expect(()=>parseSave(JSON.stringify(bad))).toThrow(/original has been kept/);
 if(['look','furniture','sticker','theme'].includes(change))expect(applyPersonalization(save,{look:p.look,home:p.home},{learner:'family',epoch:1},1)).toBe(save);
});
it('rejects beach and outside-wall drops before snapping; characters retain the beach',()=>{
 expect(spotFromPoint(400,650,1,false)).toBeUndefined();expect(spotFromPoint(400,650,1,true)).toBeUndefined();
 expect(characterDrop(starterHome().rooms.home,0,400,650)).toMatchObject({anchor:'beach-middle'});
});

it('completed assisted Family warmup earns Counter once with completion notes in the same save',()=>{
 const save=initializePersonalization(emptySave());
 const results=Array.from({length:3},()=>({skill:'num.add-within-10',helped:true}));
 const after=applyWarmup(save,results,defaultPracticeSettings,'warmup-test');
 expect(personFor(after).milestones).toContain('learn:quick-practice:1');
 expect(applyWarmup(after,results,defaultPracticeSettings,'warmup-test')).toBe(after);
 expect(applyWarmup(save,results.slice(0,2),defaultPracticeSettings,'incomplete')).toBe(save);
});

for(const owner of ['family','mina'])it(`persists original ${owner} classic, board and Explore owners across switches and reload`,()=>{
 const active=owner==='mina'?'family':'mina';let learning=addLearner(undefined,'Mina','mina');learning=selectLearner(learning,owner);
 let tic=createTic({...defaultOptions,mode:'together'});for(const cell of [0,3,1,4])tic=ticMove(tic,cell);
 let board=createSession('coconut-drop',{mode:'solo',strength:'growing',seed:1});for(const move of [0,1,0,1,0,1])board={...board,position:engines['coconut-drop'].move(board.position,move)};
 const progress={...newExploreProgress(),location:{kind:'activity' as const,world:'space' as const}};
 const before=bindRoundOwners(emptySave(),initializePersonalization({...emptySave(),learning,sessions:{'tic-tac-toe':tic},board:{'coconut-drop':board},explore:{favorites:[],progress}}));
 const switched=parseSave(JSON.stringify(rewardTransitions(before,{...before,learning:selectLearner(learning,active)})));
 const after=rewardTransitions(switched,{...switched,sessions:{'tic-tac-toe':ticMove(tic,2)},board:{'coconut-drop':{...board,position:engines['coconut-drop'].move(board.position,0)}},explore:{favorites:[],progress:{...progress,labs:{...progress.labs,space:{...newLab(),turn:7}}}}});
 expect(personFor(after,owner).milestones).toEqual(expect.arrayContaining(['classic:tic-tac-toe','classic:coconut-drop','explore:lab-space']));
 expect(personFor(after,active).milestones).toEqual([]);
});
it('all catalog milestones fit and any missing last milestone can still earn',()=>{
 expect(new Set(milestoneCatalog).size).toBe(milestoneCatalog.length);expect(MAX_MILESTONES).toBeGreaterThan(milestoneCatalog.length);
 const p={...personFor(initializePersonalization(emptySave())),milestones:milestoneCatalog.filter(id=>!id.startsWith('classic:')),earned:grantCatalog()};
 const next=applyCompletion(p,{kind:'classic',game:'maze'});expect(next.milestones).toContain('classic:maze');
 expect(parseSave(JSON.stringify({...emptySave(),personalization:{version:1,catalogVersion:1,people:{family:next}}}))).toBeTruthy();
 expect(applyCompletion(p,{kind:'explore',topic:'invented'})).toBe(p);
 expect(applyCompletion(p,{kind:'learning',game:'chamoru-memory',level:5,helped:false})).toBe(p);
});
it('allows earned home, theme and arcade-owned sticker writes and strict restore',()=>{
 const save=initializePersonalization(emptySave());save.personalization!.people.family.earned=['abacus','math-lab'];
 save.arcade={...emptyArcade(),people:{family:{...arcadeLearner(undefined,'family'),stickers:['reef-fish']}}};
 const home=starterHome();home.rooms.home={instances:[instance('a','abacus',0,0),instance('s','sticker:reef-fish',0,0)],characters:[],theme:{wallpaper:'math-lab',floor:'honey'}};
 const next=applyPersonalization(save,{home},{learner:'family',epoch:1},1);expect(next).not.toBe(save);expect(parseSave(JSON.stringify(next))).toEqual(next);
});
it('completed mixed warmup earns both subjects and backfills explicit completion markers',()=>{
 const save=initializePersonalization({...emptySave(),learning:addLearner(undefined,'Mina','mina')});
 const next=applyWarmup(save,[{skill:'num.add-within-10',helped:true},{skill:'read.short-a',helped:false},{skill:'read.short-a',helped:true}],{...defaultPracticeSettings,subject:'mixed'},'mixed');
 expect(personFor(next).milestones).toEqual(expect.arrayContaining(['learn:quick-practice:1','learn:which-one:1']));
 expect(personFor(backfillRewards({...next,personalization:undefined})).milestones).toEqual(expect.arrayContaining(['learn:quick-practice:1','learn:which-one:1']));
});
it('does not permit a personalization patch to grant itself ownership',()=>{
 const save=initializePersonalization(emptySave());
 expect(applyPersonalization(save,{earned:['abacus']} as never,{learner:'family',epoch:1},1)).toBe(save);
});
it('new Explore attempts after reset belong to the learner who starts them',()=>{
 const learning=addLearner(undefined,'Mina','mina');
 const progress={...newExploreProgress(),location:{kind:'activity' as const,world:'space' as const},labs:{...newExploreProgress().labs,space:{...newLab(),turn:7}}};
 const save=bindRoundOwners(emptySave(),initializePersonalization({...emptySave(),learning,explore:{favorites:[],progress}}));
 const switched={...save,learning:selectLearner(learning,'family')};
 const reset=rewardTransitions(switched,{...switched,explore:{favorites:[],progress:{...progress,labs:{...progress.labs,space:newLab()}}}});
 const next=rewardTransitions(reset,{...reset,explore:{favorites:[],progress}});
 expect(personFor(next,'family').milestones).toContain('explore:lab-space');
});
it('rejects points beyond the illustrated floor edge before snapping to the last row',()=>{
 expect(spotFromPoint(810,525,1,false)).toBeUndefined();
});
