import { afterEach, describe, expect, it } from 'vitest';
import { resolveDrop, type DropWorld } from '../src/home/drop';
import { dropBody, dropWorld, socketPoint, socketsOf } from '../src/home/interactions';
import { homeReducer, instance, legacyStarterHome, migrateHome, starterHome, validHome } from '../src/home/model';
import { capabilities } from '../src/home/world';
import { itemPoint } from '../src/home/geometry';
import { editHistory } from '../src/home/useHomeStore';
const original={...capabilities};
afterEach(()=>{for(const id of Object.keys(capabilities))delete capabilities[id];Object.assign(capabilities,original);});
const empty=()=>{const s=starterHome();s.rooms.home.instances=[];s.rooms.home.characters=[{slot:0,anchor:'floor',pose:'stand',x:8,y:8}];return s;};
const world:DropWorld={bodies:[],sockets:[],surfaces:[],people:[]};
describe('one drop rule for preview and commit',()=>{
 it('finds a floor destination past every wall and excludes the complete drawn bounds',()=>{
  const body=dropBody(instance('bed','bed',0,0));
  for(const [x,y] of [[-500,-500],[1500,1000],[400,300]]){
   const d=resolveDrop(world,body,x,y)!;expect(d.kind).toBe('floor');
   expect(d.px+body.left).toBeGreaterThanOrEqual(8);expect(d.px+body.right).toBeLessThanOrEqual(792);
   expect(d.py+body.top).toBeGreaterThanOrEqual(8);expect(d.py+body.bottom).toBeLessThanOrEqual(552);
  }
 });
 it('returns nothing for nonfinite coordinates or a fully blocked room',()=>{
  expect(resolveDrop(world,{slot:0},NaN,400)).toBeUndefined();
  expect(resolveDrop({...world,bodies:[{...dropBody(instance('wall','bed',0,0)),w:20,h:12}]},{slot:0},400,450)).toBeUndefined();
 });
 it('distinguishes mouth and hand by head/hand targets, with one held item',()=>{
  const body={...dropBody(instance('food','fruit-bowl',0,0)),holdable:true,edible:'food' as const};
  const w={...world,people:[{slot:0,x:400,y:500}]};
  expect(resolveDrop(w,body,442,416)?.kind).toBe('hand');expect(resolveDrop(w,body,400,340)?.kind).toBe('mouth');
  expect(resolveDrop({...w,people:[{...w.people[0],holding:'other'}]},body,442,416)?.kind).toBe('hand');
 });
 it('uses free sockets, nearest surface cells, then floor',()=>{
  const w={...world,sockets:[{itemId:'seat',socketId:'a',x:400,y:450,pose:'sit' as const,occupied:1}]};
  expect(resolveDrop(w,{slot:0},400,450)?.kind).toBe('floor');expect(resolveDrop(w,{slot:1},400,450)?.kind).toBe('socket');
  const body=dropBody(instance('cup','fruit-bowl',0,0));
  expect(resolveDrop({...world,surfaces:[{id:'table',x:6,y:4,w:4,sx:350,sy:370,radius:100}]},body,350,370)?.kind).toBe('surface');
 });
});
describe('version 3 world invariants',()=>{
 it('migrates v1/v2 once, preserving original bytes, themes, identities and valid coordinates',()=>{
  const old=legacyStarterHome(),bytes=JSON.stringify(old),migrated=migrateHome(old)!;
  expect(migrated.version).toBe(3);expect(validHome(migrated)).toBe(true);expect(JSON.stringify(old)).toBe(bytes);expect(migrateHome(migrated)).toBe(migrated);
  const v2={...starterHome(),version:2 as const};v2.rooms.home.instances.push(instance('chair','chair',12,8));v2.rooms.home.characters=[{slot:0,anchor:'chair',pose:'sit',seatId:'chair'}];
  const before=JSON.stringify(v2),v3=migrateHome(v2)!;expect(v3.rooms.home.characters[0].socket?.itemId).toBe('chair');expect(JSON.stringify(v2)).toBe(before);
 });
 it('normalizes starters with their conservative visual silhouettes',()=>{
  for(const room of Object.values(starterHome().rooms))for(const i of room.instances){const p=itemPoint(i),b=dropBody(i);expect(p.x+b.left).toBeGreaterThanOrEqual(8);expect(p.x+b.right).toBeLessThanOrEqual(792);expect(p.y+b.top).toBeGreaterThanOrEqual(8);expect(p.y+b.bottom).toBeLessThanOrEqual(552);}
 });
 it('rejects impossible pose, missing held item and duplicate socket occupants',()=>{
  const s=empty();s.rooms.home.instances=[instance('chair','chair',5,4)];
  let next=homeReducer(s,{type:'character',slot:0,anchor:'seat',seatId:'chair'}).state;
  expect(validHome(next)).toBe(true);next=structuredClone(next);next.rooms.home.characters[0].pose='lie';expect(validHome(next)).toBe(false);
  const missing=structuredClone(s);missing.rooms.home.characters[0].holding='removed';expect(validHome(missing)).toBe(false);
  const occupied=homeReducer(s,{type:'character',slot:0,anchor:'seat',seatId:'chair'}).state;occupied.rooms.home.characters.push({...occupied.rooms.home.characters[0],slot:1});expect(validHome(occupied)).toBe(false);
 });
 it('carries socket occupants with the seat, mirrors contact and stands them after putting away',()=>{
  const s=empty(),seat=instance('chair','chair',5,4);s.rooms.home.instances=[seat];
  capabilities.chair={moveInPlay:true,sockets:[{id:'right',kind:'sit',at:[.3,.65],facing:'right',covered:true}]};
  const socket=socketsOf(seat)[0];expect(socketPoint(seat,socket).x).not.toBe(socketPoint({...seat,mirrored:true},socket).x);
  const seated=homeReducer(s,{type:'character',slot:0,anchor:'seat',seatId:'chair'}).state;
  const moved=homeReducer(seated,{type:'move',id:'chair',x:9,y:6}).state;expect(moved.rooms.home.characters[0].socket).toEqual(seated.rooms.home.characters[0].socket);
  expect(homeReducer(moved,{type:'put-away',id:'chair'}).state.rooms.home.characters[0]).toMatchObject({pose:'stand',anchor:'floor'});
 });
 it('holds, transfers between rooms, releases and roundtrips a carried object',()=>{
  const s=empty();s.rooms.home.instances=[instance('prop','fruit-bowl',4,4)];
  const held=homeReducer(s,{type:'use-item',slot:0,id:'prop'}).state;expect(held.rooms.home.characters[0].holding).toBe('prop');
  const moved=homeReducer(held,{type:'transfer',slot:0,room:'kitchen',x:8,y:8}).state;
  expect(moved.rooms.home.instances).toEqual([]);expect(moved.rooms.kitchen.instances.some(i=>i.id==='prop')).toBe(true);expect(validHome(JSON.parse(JSON.stringify(moved)))).toBe(true);
  const released=homeReducer(moved,{type:'release-held',roomId:'kitchen',slot:0,x:12,y:10}).state;
  expect(released.rooms.kitchen.characters[0].holding).toBeUndefined();expect(validHome(released)).toBe(true);
 });
 it('consumes food, empties drinks, and keeps dispensers inexhaustible',()=>{
  capabilities['fruit-bowl']={moveInPlay:true,holdable:true,edible:'food'};capabilities.teapot={moveInPlay:true,holdable:true,edible:'drink'};capabilities.fridge={moveInPlay:true,toggle:'open',dispenses:['fruit-bowl']};
  const s=empty();s.rooms.home.instances=[instance('food','fruit-bowl',4,4),instance('drink','teapot',8,4),{...instance('fridge','fridge',12,0),powered:true}];
  const eaten=homeReducer(s,{type:'use-item',slot:0,id:'food',eat:true}).state;expect(eaten.rooms.home.instances.some(i=>i.id==='food')).toBe(false);
  const drink=homeReducer(eaten,{type:'use-item',slot:0,id:'drink',eat:true}).state;expect(drink.rooms.home.characters[0].holding).toBe('drink');expect(drink.rooms.home.instances.find(i=>i.id==='drink')?.empty).toBe(true);expect(validHome(drink)).toBe(true);
  let supply=drink;for(let n=0;n<3;n++)supply=homeReducer(supply,{type:'dispense',source:'fridge',id:`food-${n}`,item:'fruit-bowl',x:300+n*70,y:480}).state;
  expect(supply.rooms.home.instances.filter(i=>i.item==='fruit-bowl')).toHaveLength(3);expect(supply.rooms.home.instances.find(i=>i.id==='fridge')?.powered).toBe(true);
 });
 it('toggles capabilities without requiring legacy interactive metadata',()=>{
  capabilities.fridge={moveInPlay:true,toggle:'open'};const s=empty();s.rooms.home.instances=[instance('fridge','fridge',6,0)];
  const opened=homeReducer(s,{type:'toggle',id:'fridge'}).state;expect(opened.rooms.home.instances[0].powered).toBe(true);expect(validHome(opened)).toBe(true);
 });
 it('keeps camera navigation out of world history and preserves context on undo',()=>{
  const s=starterHome();let h=editHistory({present:s,past:[],future:[]},{type:'mirror',id:'bed'});h=editHistory(h,{type:'room',room:'kitchen'});expect(h.past).toHaveLength(1);h=editHistory(h,{type:'undo'});expect(h.present.current).toBe('kitchen');expect(h.present.rooms.home.instances[0].mirrored).toBe(false);
 });
 it('previews and commits exactly the same floor landing',()=>{
  const s=empty();s.rooms.home.instances=[instance('lamp','lamp',5,5)];const d=resolveDrop(dropWorld(s.rooms.home),dropBody(s.rooms.home.instances[0]),-500,900)!;
  const next=homeReducer(s,{type:'move',id:'lamp',x:d.x,y:d.y}).state;expect(next.rooms.home.instances[0]).toMatchObject({x:d.x,y:d.y});
 });
 it('puts a previous held prop on free floor when a drink becomes the held empty cup',()=>{
  capabilities.teapot={moveInPlay:true,holdable:true,edible:'drink'};
  const s=empty();s.rooms.home.instances=[instance('toy','fruit-bowl',6,4),instance('cup','teapot',10,4)];
  const holding=homeReducer(s,{type:'use-item',id:'toy',slot:0}).state;
  const drank=homeReducer(holding,{type:'use-item',id:'cup',slot:0,eat:true}).state;
  expect(drank.rooms.home.characters[0].holding).toBe('cup');expect(drank.rooms.home.instances.some(i=>i.id==='toy')).toBe(true);expect(validHome(drank)).toBe(true);
 });
 it('releases held props onto available surfaces using the same destination relation',()=>{
  const s=empty();s.rooms.home.instances=[instance('toy','fruit-bowl',6,8),instance('table','table',6,4)];
  const holding=homeReducer(s,{type:'use-item',id:'toy',slot:0}).state;
  // A table at floor y=443.6 has a surface at 365.6.
  const released=homeReducer(holding,{type:'release-held',slot:0,x:6,y:(365.6-386)/14.4}).state;
  expect(released.rooms.home.characters[0].holding).toBeUndefined();expect(released.rooms.home.instances.find(i=>i.id==='toy')?.on).toBe('table');expect(validHome(released)).toBe(true);
 });

 it('supports a dispenser drop directly into a hand or mouth without an intermediate room item',()=>{
  capabilities['fruit-bowl']={moveInPlay:true,holdable:true,edible:'food'};capabilities.fridge={moveInPlay:true,toggle:'open',dispenses:['fruit-bowl']};
  const s=empty();s.rooms.home.instances=[{...instance('fridge','fridge',4,0),powered:true}];
  const person=dropWorld(s.rooms.home).people[0];
  const held=homeReducer(s,{type:'dispense',source:'fridge',item:'fruit-bowl',id:'snack',x:person.handX!,y:person.handY!}).state;
  expect(held.rooms.home.characters[0].holding).toBe('snack');expect(validHome(held)).toBe(true);
  const eaten=homeReducer(s,{type:'dispense',source:'fridge',item:'fruit-bowl',id:'snack',x:person.mouthX!,y:person.mouthY!}).state;
  expect(eaten.rooms.home.instances).toHaveLength(1);expect(eaten.rooms.home.instances[0].id).toBe('fridge');expect(validHome(eaten)).toBe(true);
 });

});
