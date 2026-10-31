import {describe,it,expect} from 'vitest';
import {anchors,instance,legacyStarterHome,migrateHome,poseFor,starterHome,validHome,type Character,type HomeStateV2} from '../src/home/model';
import {initializePersonalization} from '../src/personalization/model';
import {backfillRewards} from '../src/badges/transitions';
import {emptySave,parseSave} from '../src/state/validation';
import {assertMigratedHomes,preserveHomeMigration,preserveImportedHome} from '../src/state/homeMigration';
import type {StorageAdapter} from '../src/state/storage';
const envelope=(home:HomeStateV2)=>{const save=initializePersonalization(emptySave());save.personalization!.people.family.home=home;return save;};
const fixture=(slot:Character['slot'])=>{const home=starterHome();home.version=2;home.rooms.home.instances=[instance('bed','bed',4,0),instance('toy','teddy',10,8)];home.rooms.home.characters=[{slot,anchor:'seat',pose:'sit',holding:'toy'}];return envelope(home);};
describe('R2-M1 accepted legacy relationships migrate to readable v3 envelopes',()=>{
 it.each([0,1,2] as const)('migrates implicit first-seat slot %i with its held prop and exact-byte preservation',async slot=>{
  const source=fixture(slot),raw=' \n'+JSON.stringify(source,null,3)+'\n',parsed=parseSave(raw),next=backfillRewards(parsed),h=next.personalization!.people.family.home as HomeStateV2;
  expect(validHome(h)).toBe(true);expect(h.rooms.home.characters[0]).toMatchObject({slot,holding:'toy',anchor:'seat',pose:'lie',socket:{itemId:'bed',socketId:slot===2?'pet-pillow':'pillow'}});
  expect(parseSave(JSON.stringify(next))).toEqual(next);expect(' \n'+JSON.stringify(source,null,3)+'\n').toBe(raw);
  let stored='device';const originals:string[]=[];const adapter:StorageAdapter={get:async()=>stored,set:async s=>{stored=s;},preserve:async s=>{originals.push(s);},listRecovery:async()=>[],readRecovery:async()=>null};
  await preserveImportedHome(adapter,raw,parsed,next,'device');expect(originals).toEqual([raw,'device']);expect(parseSave(stored)).toEqual(next);
 });
 it('deconflicts implicit occupants onto free compatible sockets or floor while retaining every held prop',()=>{
  const source=fixture(0),home=source.personalization!.people.family.home as HomeStateV2;
  home.rooms.home.characters=[0,1,2].map(slot=>({slot:slot as Character['slot'],anchor:'seat',pose:'sit',holding:`toy-${slot}`}));home.rooms.home.instances=[instance('bed','bed',4,0),...[0,1,2].map(slot=>instance(`toy-${slot}`,'teddy',10,8))];
  const next=backfillRewards(parseSave(JSON.stringify(source))),h=next.personalization!.people.family.home as HomeStateV2;
  expect(h.rooms.home.characters.map(c=>c.anchor)).toEqual(['seat','floor','seat']);expect(h.rooms.home.characters.map(c=>c.holding)).toEqual(['toy-0','toy-1','toy-2']);expect(parseSave(JSON.stringify(next))).toEqual(next);
 });
 it('keeps a pet and its held toy on valid floor when the historical first seat has only a human bath socket',()=>{
  const source=fixture(2),home=source.personalization!.people.family.home as HomeStateV2;home.rooms.home.instances[0]=instance('bath','bathtub',4,0);
  const next=backfillRewards(parseSave(JSON.stringify(source))),h=next.personalization!.people.family.home as HomeStateV2;
  expect(h.rooms.home.characters[0]).toMatchObject({slot:2,anchor:'floor',pose:'stand',holding:'toy'});expect(validHome(h)).toBe(true);expect(parseSave(JSON.stringify(next))).toEqual(next);
 });
 it('sweeps all 60 historically accepted v1/v2 slot × anchor combinations, with strict v3 postconditions',()=>{
  let accepted=0;
  for(const version of [1,2])for(const slot of [0,1,2] as const)for(const anchor of anchors){
   const source=version===1?legacyStarterHome():{...starterHome(),version:2 as const};
   const c:Character={slot,anchor,pose:poseFor(anchor),...(anchor==='floor'?{x:4,y:4}:{})};
   if('rooms' in source){for(const room of Object.values(source.rooms))room.characters=[];source.rooms.home.characters=[c];}else source.characters=[c];
   if(!validHome(source))continue;accepted++;const bytes=JSON.stringify(source),next=migrateHome(source);
   expect(next,`v${version} ${slot} ${anchor}`).toBeDefined();expect(next?.version).toBe(3);expect(validHome(next),`v${version} ${slot} ${anchor}`).toBe(true);expect(JSON.stringify(source)).toBe(bytes);
  }
  expect(accepted).toBe(60);
 });
 it.each(['startup','restore'])('rejects an invalid migrated result before any %s replacement, keeping the exact original',async path=>{
  const source=fixture(0),encoded=' \n'+JSON.stringify(source,null,2)+'\n',before=parseSave(encoded),bad=backfillRewards(before),h=bad.personalization!.people.family.home as HomeStateV2;
  h.rooms.home.characters[0]={slot:0,anchor:'seat',pose:'sit'};
  expect(()=>assertMigratedHomes(bad)).toThrow('original has been kept');let stored=path==='startup'?encoded:'device';const originals:string[]=[];let writes=0;
  const adapter:StorageAdapter={get:async()=>stored,set:async s=>{writes++;stored=s;},preserve:async s=>{originals.push(s);},listRecovery:async()=>[],readRecovery:async()=>null};
  await expect(path==='startup'?preserveHomeMigration(adapter,encoded,before,bad):preserveImportedHome(adapter,encoded,before,bad,'device')).rejects.toThrow('original has been kept');
  expect(writes).toBe(0);expect(stored).toBe(path==='startup'?encoded:'device');expect(originals).toEqual([encoded]);
 });
});
