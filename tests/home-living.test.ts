import {describe,it,expect} from 'vitest';
import {homeReducer,instance,starterHome,validHome,migrateHome,type HomeStateV2,type HomeAction} from '../src/home/model';
import {dropBody,dropWorld,socketsOf,socketPoint} from '../src/home/interactions';
import {resolveDrop} from '../src/home/drop';
import {characterHand,characterSize} from '../src/home/geometry';
const fixture=()=>{const s=starterHome();s.rooms.home={...s.rooms.home,instances:[instance('fridge','fridge',4,0)],characters:[{slot:0,anchor:'floor',pose:'stand',x:10,y:8}]};return s;};
const act=(s:HomeStateV2,a:HomeAction)=>homeReducer(s,a).state;
describe('living world durable relationships',()=>{
 it('rejects closed/unknown/duplicate dispenser requests and never depletes an open source',()=>{
  let s=fixture();const request={type:'dispense' as const,source:'fridge',item:'mango',id:'m1',x:500,y:500};
  expect(act(s,request)).toEqual(s);s=act(s,{type:'toggle',id:'fridge'});
  expect(act(s,{...request,item:'teddy'})).toEqual(s);
  s=act(s,request);expect(s.rooms.home.instances.some(i=>i.id==='m1')).toBe(true);
  expect(act(s,request)).toEqual(s);s=act(s,{...request,id:'m2',x:600});
  expect(s.rooms.home.instances.filter(i=>i.item==='mango')).toHaveLength(2);expect(s.rooms.home.instances.find(i=>i.id==='fridge')?.powered).toBe(true);expect(validHome(s)).toBe(true);
 });
 it('consumes food once, preserves a drink ID as empty and carries it through reload',()=>{
  let s=fixture();s.rooms.home.instances.push(instance('m','mango',10,8),instance('j','juice',12,8));
  s=act(s,{type:'use-item',id:'m',slot:0,eat:true});expect(s.rooms.home.instances.some(i=>i.id==='m')).toBe(false);
  expect(act(s,{type:'use-item',id:'m',slot:0,eat:true})).toEqual(s);
  s=act(s,{type:'use-item',id:'j',slot:0,eat:true});expect(s.rooms.home.characters[0].holding).toBe('j');expect(s.rooms.home.instances.find(i=>i.id==='j')?.empty).toBe(true);
  expect(act(s,{type:'use-item',id:'j',slot:0,eat:true})).toEqual(s);
  s=act(s,{type:'transfer',slot:0,room:'treehouse',x:10,y:8});expect(s.rooms.treehouse.characters[0].holding).toBe('j');expect(s.rooms.home.instances.some(i=>i.id==='j')).toBe(false);
  expect(migrateHome(JSON.parse(JSON.stringify(s)))).toEqual(s);expect(validHome(s)).toBe(true);
 });
 it('toys hold without becoming food; malformed empty and holder relationships fail',()=>{
  let s=fixture();s.rooms.home.instances.push(instance('t','teddy',11,9));expect(act(s,{type:'use-item',id:'t',slot:0,eat:true})).toEqual(s);expect(act(s,{type:'toggle',id:'t'})).toEqual(s);
  s=act(s,{type:'use-item',id:'t',slot:0});expect(s.rooms.home.characters[0].holding).toBe('t');expect(validHome(s)).toBe(true);
  const bad=structuredClone(s);bad.rooms.home.instances.find(i=>i.id==='t')!.empty=true;expect(validHome(bad)).toBe(false);
  const duplicate=structuredClone(s);duplicate.rooms.home.characters.push({slot:2,anchor:'floor',pose:'stand',x:12,y:8,holding:'t'});expect(validHome(duplicate)).toBe(false);
 });
 it('shares the bed using separate human and foot sockets, with a small pet',()=>{
  let s=fixture();s.rooms.home.instances=[instance('bed','bed',5,0)];s.rooms.home.characters.push({slot:2,anchor:'floor',pose:'stand',x:12,y:8});
  const bed=s.rooms.home.instances[0],human=socketsOf(bed).find(i=>!i.id.startsWith('pet-'))!,pet=socketsOf(bed).find(i=>i.id.startsWith('pet-'))!;
  s=act(s,{type:'character',slot:0,anchor:'seat',seatId:'bed',socketId:human.id});s=act(s,{type:'character',slot:2,anchor:'seat',seatId:'bed',socketId:pet.id});
  expect(s.rooms.home.characters.map(c=>c.pose)).toEqual(['lie','lie']);expect(validHome(s)).toBe(true);
  const p=socketPoint(bed,pet);expect(resolveDrop(dropWorld(s.rooms.home),{slot:0},p.x,p.y)?.socketId).toBe(human.id);
  expect(characterSize(2)*110/120/characterSize(0)).toBeCloseTo(.4,1);
 });
 it('keeps existing in-bounds layouts rather than applying fresh starter composition',()=>{
  const s=fixture();s.rooms.home.instances=[instance('custom','plant',10,6)];const before=JSON.stringify(s);expect(migrateHome(s)).toEqual(s);expect(JSON.stringify(s)).toBe(before);
  expect(starterHome().rooms.home.characters.find(c=>c.slot===2)?.anchor).toBe('floor');
 });
});
describe('living state recovery and replacement',()=>{
 it.each(['lamp','table-lamp','floor-lamp','sink-counter','tv','radio','fridge'])('round-trips %s on/off and respects old active saves',item=>{
  let s=fixture();s.rooms.home.instances=[instance('toggle',item,6,0)];
  s=act(s,{type:'toggle',id:'toggle'});expect(s.rooms.home.instances[0].powered).toBe(true);expect(migrateHome(JSON.parse(JSON.stringify(s)))).toEqual(s);
  s=act(s,{type:'toggle',id:'toggle'});expect(s.rooms.home.instances[0].powered).toBe(false);
  if(item==='lamp'){s.rooms.home.instances[0].state='active';delete s.rooms.home.instances[0].powered;s=act(s,{type:'toggle',id:'toggle'});expect(s.rooms.home.instances[0].powered).toBe(false);}
 });
 it('puts the previous held drink down safely when receiving a teddy',()=>{
  let s=fixture();s.rooms.home.instances.push({...instance('j','juice',10,8),empty:true},instance('t','teddy',12,8));
  s=act(s,{type:'use-item',id:'j',slot:0});s=act(s,{type:'use-item',id:'t',slot:0});
  expect(s.rooms.home.characters[0].holding).toBe('t');const hand=characterHand(s.rooms.home,s.rooms.home.characters[0],'hold'),target=dropWorld(s.rooms.home).people[0];expect(target.handX).toBeCloseTo(hand.x);expect(target.handY).toBeCloseTo(hand.y);const food=instance('new','mango',0,0),world=dropWorld(s.rooms.home);expect(resolveDrop(world,dropBody(food),target.mouthX!,target.mouthY!)?.kind).toBe('mouth');expect(s.rooms.home.instances.filter(i=>i.id==='j')).toHaveLength(1);expect(validHome(s)).toBe(true);
 });
});
