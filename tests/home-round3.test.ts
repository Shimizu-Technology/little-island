import {describe,it,expect} from 'vitest';
import {characterDropRoom,occlusion,resolveDrop} from '../src/home/drop';
import {dropWorld,characterForSocket,socketsOf} from '../src/home/interactions';
import {characterPoint,floorPoint,itemPoint} from '../src/home/geometry';
import {homeReducer,instance,migrateHome,settleFriends,starterHome,validHome,type Character} from '../src/home/model';
import {editHistory} from '../src/home/useHomeStore';
import {initializePersonalization,validPerson} from '../src/personalization/model';
import {emptySave,parseSave} from '../src/state/validation';
import {backfillRewards} from '../src/badges/transitions';
import {preserveImportedHome} from '../src/state/homeMigration';
import type {StorageAdapter} from '../src/state/storage';
const bedRoom=()=>{const s=starterHome();s.rooms.home.instances=[instance('bed','bed',4,0)];s.rooms.home.characters=[{slot:0,anchor:'floor',pose:'stand',x:8,y:8}];return s;};
describe('native headboard release and visible floor settlement',()=>{
 it('converts the reported (162,355) native release against the measured bed into room units and resolves to its socket',()=>{
  const s=bedRoom(),w=dropWorld(s.rooms.home),b=w.sockets[0].box!;
  const scale=(308-103)/(b.right-b.left),origin={x:103-b.left*scale,y:403-b.top*scale};
  const release={x:(162-origin.x)/scale,y:(355-origin.y)/scale};
  expect(release.x).toBeCloseTo(137.829268);expect(release.y).toBeCloseTo(104.121951);
  expect(resolveDrop(w,{slot:0},release.x,release.y)).toMatchObject({kind:'socket',itemId:'bed',pose:'lie'});
  expect(characterDropRoom([{id:'home',origin,world:w}],0,[{x:release.x+origin.x,y:release.y+origin.y}])?.id).toBe('home');
  // Lifting the sleeping occupant follows the very same rule; its own socket remains available.
  s.rooms.home.characters[0]=characterForSocket(s.rooms.home.characters[0],s.rooms.home.instances[0],socketsOf(s.rooms.home.instances[0])[0]);
  expect(resolveDrop(dropWorld(s.rooms.home),{slot:0},release.x,release.y)?.kind).toBe('socket');
 });
 it('uses a full character-height headboard band, with symmetric compatibility and occupied seats excluded',()=>{
  const s=bedRoom(),w=dropWorld(s.rooms.home),b=w.sockets[0].box!;
  expect(resolveDrop(w,{slot:0},b.right-1,b.top-223)?.kind).toBe('socket');
  w.sockets.find(s=>!s.pet)!.occupied=1;
  expect(resolveDrop(w,{slot:0},b.left+10,b.top-40)?.kind).toBe('floor');
  expect(resolveDrop(w,{slot:2},b.right-1,b.top-89)).toMatchObject({kind:'socket',pet:true});
 });
 it('puts a free-floor friend in front when more than a quarter of the silhouette would be covered',()=>{
  const s=bedRoom(),w=dropWorld(s.rooms.home),p=floorPoint(4,0);
  expect(occlusion(w,0,p.x,p.y).fraction).toBeGreaterThan(.25);
  const d=resolveDrop(w,{slot:0,floorOnly:true},p.x,p.y)!;
  expect(d.kind).toBe('floor');expect(d.py+1).toBeGreaterThan(w.bodies[0].depth!);expect(occlusion(w,0,d.px,d.py).fraction).toBeLessThanOrEqual(.25);
 });
 it('lifts out just beyond the side of a bed onto the nearest clear floor directly in front',()=>{
  const s=bedRoom(),room=s.rooms.home,bed=room.instances[0];room.instances.push(instance('rug','rug',8,8));room.characters[0]=characterForSocket(room.characters[0],bed,socketsOf(bed)[0]);
  const w=dropWorld(room),b=w.sockets[0].box!,release={x:b.right+25,y:b.bottom+40};
  const d=resolveDrop(w,{slot:0},release.x,release.y,[release])!;
  expect(d.kind).toBe('floor');expect(d.py+1).toBeGreaterThan(w.bodies[0].depth!);expect(Math.abs(d.px-(b.left+b.right)/2)).toBeLessThan(25);
  expect(resolveDrop(w,{slot:0},w.people[0].x,w.people[0].y,[release,{x:(b.left+b.right)/2,y:(b.top+b.bottom)/2}])?.kind).toBe('floor');
  expect(occlusion(w,0,d.px,d.py).fraction).toBeLessThanOrEqual(.25);
 });
 it('nudges hidden free friends on the next settled layout edit, preserving held props, and is idempotent',()=>{
  const s=bedRoom(),r=s.rooms.home;r.characters=[{slot:0,anchor:'floor',pose:'stand',x:4,y:0,holding:'teddy'}];r.instances.push(instance('teddy','teddy',10,8));
  const bytes=JSON.stringify(r),fixed=settleFriends(r),p=characterPoint(fixed,fixed.characters[0]);
  expect(occlusion(dropWorld(fixed),0,p.x,p.y).fraction).toBeLessThanOrEqual(.25);expect(fixed.characters[0].holding).toBe('teddy');expect(JSON.stringify(r)).toBe(bytes);expect(settleFriends(fixed)).toBe(fixed);
  const settled=homeReducer(s,{type:'mirror',id:'bed'}).state.rooms.home,point=characterPoint(settled,settled.characters[0]);
  expect(occlusion(dropWorld(settled),0,point.x,point.y).fraction).toBeLessThanOrEqual(.25);
 });
 it('settles a friend forward when furniture is actually moved in front of them',()=>{
  const s=bedRoom(),r=s.rooms.home;r.instances=[instance('bed','bed',10,2)];r.characters=[{slot:0,anchor:'floor',pose:'stand',x:4,y:0}];
  const p=characterPoint(r,r.characters[0]);expect(occlusion(dropWorld(r),0,p.x,p.y).fraction).toBe(0);
  const next=homeReducer(s,{type:'move',id:'bed',x:4,y:2}).state.rooms.home,after=characterPoint(next,next.characters[0]);
  expect(next.instances[0]).toMatchObject({x:4,y:2});expect(after.y+1).toBeGreaterThan(dropWorld(next).bodies[0].depth!);expect(occlusion(dropWorld(next),0,after.x,after.y).fraction).toBeLessThanOrEqual(.25);
 });
 it('finds both Islander and crab across rooms with their held items, without moving furniture, and supports Undo',()=>{
  let s=bedRoom();s=homeReducer(s,{type:'transfer',slot:0,room:'treehouse',x:8,y:9}).state;
  s.rooms.home.characters=[{slot:2,anchor:'floor',pose:'stand',x:7,y:10}];s.current='kitchen';
  s.rooms.treehouse.instances.push(instance('carry','teddy',2,8));s.rooms.treehouse.characters[0].holding='carry';
  const before=JSON.stringify(s),h=editHistory({present:s,past:[],future:[]},{type:'find-friends'}),r=h.present.rooms.kitchen;
  expect(validHome(h.present)).toBe(true);expect(r.characters.map(c=>c.slot)).toEqual([0,2]);expect(r.characters[0].holding).toBe('carry');expect(r.instances.some(i=>i.id==='carry')).toBe(true);
  for(const c of r.characters){const p=characterPoint(r,c);expect(occlusion(dropWorld(r),c.slot,p.x,p.y).fraction).toBeLessThanOrEqual(.25);}
  expect(JSON.stringify(s)).toBe(before);expect(editHistory(h,{type:'undo'}).present).toEqual(s);
 });
 it('keeps the new kitchen table, bowl and stools to the right of the open fridge, without changing existing saves',()=>{
  const s=starterHome(),r=s.rooms.kitchen,fridge=r.instances.find(i=>i.item==='fridge')!,table=r.instances.find(i=>i.item==='kitchen-table')!;
  expect(itemPoint(table).x-itemPoint(fridge).x).toBeGreaterThan(175);expect(fridge.mirrored).toBe(true);expect(r.instances.filter(i=>i.item==='stool').every(i=>i.x>fridge.x+2)).toBe(true);
  expect(r.instances.find(i=>i.item==='fruit-bowl')?.on).toBe(table.id);
  table.x=8;r.instances.find(i=>i.item==='fruit-bowl')!.x=9;const bytes=JSON.stringify(s);expect(migrateHome(s)).toBe(s);expect(JSON.stringify(s)).toBe(bytes);
 });
});
const envelope=(characters:Character[],item='chair')=>{const save=initializePersonalization(emptySave()),home=bedRoom();home.rooms.home.instances=[instance(item,item,4,0)];home.rooms.home.characters=characters;save.personalization!.people.family.home=home;return save;};
describe('M1 complete-envelope canonical v3 validation',()=>{
 it.each([
  {name:'duplicate socket-less chair occupants',item:'chair',characters:[{slot:0,anchor:'seat',pose:'sit',seatId:'chair'},{slot:1,anchor:'seat',pose:'sit',seatId:'chair'}]},
  {name:'socket-less sitting bed occupant',item:'bed',characters:[{slot:0,anchor:'seat',pose:'sit',seatId:'bed'}]},
  {name:'pet occupying human chair socket',item:'chair',characters:[{slot:2,anchor:'seat',pose:'sit',seatId:'chair',socket:{itemId:'chair',socketId:'seat'}}]},
 ])('rejects $name into recovery without rewriting bytes',({item,characters})=>{
  const save=envelope(characters as Character[],item),raw=' \n'+JSON.stringify(save,null,2)+'\n';
  expect(validPerson(save.personalization!.people.family)).toBe(false);expect(()=>parseSave(raw)).toThrow();expect(migrateHome(save.personalization!.people.family.home)).toBeUndefined();expect(' \n'+JSON.stringify(save,null,2)+'\n').toBe(raw);
 });
 it('also rejects implicit furniture anchors and humans in pet sockets',()=>{
  for(const c of [{slot:0,anchor:'chair',pose:'sit'},{slot:0,anchor:'seat',pose:'sit',seatId:'chair',socket:{itemId:'chair',socketId:'pet-seat'}}])expect(()=>parseSave(JSON.stringify(envelope([c as Character])))).toThrow();
 });
 it('accepts v2 only at the legacy boundary, canonicalizes compatible sockets, and deconflicts duplicate occupants',()=>{
  const save=envelope([{slot:0,anchor:'seat',pose:'sit',seatId:'bed'},{slot:1,anchor:'seat',pose:'sit',seatId:'bed'}],'bed');
  save.personalization!.people.family.home.version=2;const raw=JSON.stringify(save),parsed=parseSave(raw),next=backfillRewards(parsed),home=next.personalization!.people.family.home;
  expect(home.version).toBe(3);expect(validHome(home)).toBe(true);expect('rooms' in home&&home.rooms.home.characters[0]).toMatchObject({pose:'lie',socket:{itemId:'bed',socketId:'pillow'}});expect('rooms' in home&&home.rooms.home.characters[1]).toMatchObject({anchor:'floor'});expect(JSON.stringify(save)).toBe(raw);
 });
});
describe('M2 successful restore byte preservation',()=>{
 const fixture=()=>{const before=envelope([{slot:0,anchor:'floor',pose:'stand',x:8,y:8}],'bed');const h=before.personalization!.people.family.home;if('rooms' in h)h.rooms.home.instances[0].x=0;return before;};
 it('awaits exact incoming whitespace, persisted device and latest device bytes before replacement; both originals are recoverable',async()=>{
  const incoming=' \n'+JSON.stringify(fixture(),null,3)+'\n\t',before=parseSave(incoming),after=backfillRewards(before);let stored='current-device-save';const recovery=new Map<string,string>(),events:string[]=[];
  const adapter:StorageAdapter={get:async()=>stored,set:async raw=>{events.push('set');stored=raw;},preserve:async raw=>{await Promise.resolve();events.push('preserve');recovery.set(String(recovery.size),raw);},listRecovery:async()=>[...recovery.keys()].map(key=>({key,createdAt:0,bytes:0})),readRecovery:async key=>recovery.get(key)??null};
  await preserveImportedHome(adapter,incoming,before,after,'latest-device-save');
  expect([...recovery.values()]).toEqual([incoming,'current-device-save','latest-device-save']);expect(events).toEqual(['preserve','preserve','preserve','set']);expect(parseSave(stored)).toEqual(after);
  expect(await adapter.readRecovery('0')).toBe(incoming);expect(await adapter.readRecovery('1')).toBe('current-device-save');
 });
 it.each([1,2,3])('never replaces any data if preservation step %i fails',async failure=>{
  const incoming=' \n'+JSON.stringify(fixture(),null,4)+'\n',before=parseSave(incoming),after=backfillRewards(before);let stored='device',calls=0;
  const adapter:StorageAdapter={get:async()=>stored,set:async raw=>{stored=raw;},preserve:async()=>{if(++calls===failure)throw Error('disk full');},listRecovery:async()=>[],readRecovery:async()=>null};
  await expect(preserveImportedHome(adapter,incoming,before,after,'live')).rejects.toThrow('disk full');expect(stored).toBe('device');
 });
});
