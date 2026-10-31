import {describe,it,expect} from 'vitest';
import {starterHome,migrateHome,instance,validHome,type HomeStateV2} from '../src/home/model';
import {dropWorld,socketsOf} from '../src/home/interactions';
import {itemPoint,floorPoint} from '../src/home/geometry';
import {capabilityOf,visualBox} from '../src/home/world';
import {characterDropRoom,resolveDrop} from '../src/home/drop';
import {stageWidth} from '../src/home/stage';
import {initializePersonalization} from '../src/personalization/model';
import {emptySave,parseSave} from '../src/state/validation';
import {preserveHomeMigration} from '../src/state/homeMigration';
import type {StorageAdapter} from '../src/state/storage';
const fixtures=()=>{const s=starterHome();s.rooms.home={...s.rooms.home,characters:[{slot:0,anchor:'floor',pose:'stand',x:9,y:8}],instances:[instance('bed','bed',0,0)]};return s;};
const inside=(s:HomeStateV2,scale=1)=>{for(const room of Object.values(s.rooms))for(const i of room.instances){const p=itemPoint(i,room.instances),b=visualBox(i.item,i.rotation,i.mirrored);expect((p.x+b.left)*scale).toBeGreaterThanOrEqual(8*scale);expect((p.x+b.left+b.width)*scale).toBeLessThanOrEqual(792*scale);expect((p.y+b.top)*scale).toBeGreaterThanOrEqual(8*scale);expect((p.y+b.top+b.height)*scale).toBeLessThanOrEqual(552*scale);}};
describe('native starter and repair acceptance',()=>{
 it.each([{width:390,height:844},{width:844,height:390},{width:402,height:874}])('contains every instance, including surface props, at $width×$height',viewport=>{
  const s=starterHome(),scale=stageWidth(viewport,0,viewport.height-64,viewport.width>viewport.height?560:740)/800;
  expect(validHome(s)).toBe(true);inside(s,scale);
  for(const room of Object.values(s.rooms)){expect(room.instances.length).toBeGreaterThanOrEqual(6);expect(room.instances.length).toBeLessThanOrEqual(9);expect(room.instances.some(i=>capabilityOf(i.item).toggle||capabilityOf(i.item).dispenses||socketsOf(i).length)).toBe(true);}
  expect(s.rooms.kitchen.instances.filter(i=>i.item==='stool')).toHaveLength(2);
  expect(s.rooms.treehouse.instances.map(i=>i.item)).toEqual(expect.arrayContaining(['teddy','book','lantern','hammock']));
  expect(s.rooms.beach.instances.filter(i=>i.item==='beach-towel')).toHaveLength(2);
 });
 it('repairs an existing left-wall bed to the nearest visual-box-contained grid position, without mutation, and is idempotent',()=>{
  const old=fixtures(),bytes=JSON.stringify(old),fixed=migrateHome(old)!;
  expect(validHome(old)).toBe(true);expect(JSON.stringify(old)).toBe(bytes);expect(fixed.rooms.home.instances[0]).toMatchObject({id:'bed',x:3,y:0});inside(fixed);expect(migrateHome(fixed)).toBe(fixed);
 });
 it('checks a surface child after its parent moves',()=>{
  const s=fixtures();s.rooms.home.instances=[instance('shelf','shelf',0,0),{...instance('lamp','lamp',0,0),on:'shelf'}];
  const before=JSON.stringify(s),fixed=migrateHome(s)!;inside(fixed);expect(JSON.stringify(s)).toBe(before);expect(migrateHome(fixed)).toBe(fixed);expect(validHome(fixed)).toBe(true);
 });
});
describe('forgiving furniture destinations',()=>{
 it('uses the whole visible bed, including the far corner beyond the old 85-unit radius',()=>{
  const s=fixtures(),fixed=migrateHome(s)!,world=dropWorld(fixed.rooms.home),socket=world.sockets.find(s=>!s.pet)!,box=socket.box!;
  const p={x:box.right-2,y:box.bottom-2};expect(Math.hypot(p.x-socket.x,p.y-socket.y)).toBeGreaterThan(85);
  expect(resolveDrop(world,{slot:0},p.x,p.y)).toMatchObject({kind:'socket',itemId:'bed',socketId:socket.socketId,box});
  // Camera crops the head end. A visible far corner still resolves to its off-screen socket.
  const cameraX=-socket.x-15,screenX=p.x+cameraX;expect(socket.x+cameraX).toBeLessThan(0);expect(screenX).toBeGreaterThan(0);
  expect(resolveDrop(world,{slot:0},screenX-cameraX,p.y)?.itemId).toBe('bed');
 });
 it('accepts a finger or body centre over the bed even when the feet miss it',()=>{
  const s=migrateHome(fixtures())!,world=dropWorld(s.rooms.home),box=world.sockets[0].box!,feet=floorPoint(12,10),body={x:(box.left+box.right)/2,y:(box.top+box.bottom)/2};
  expect(resolveDrop(world,{slot:0},feet.x,feet.y,[body])).toMatchObject({kind:'socket',itemId:'bed'});
  expect(resolveDrop(world,{slot:0},feet.x,feet.y,[{x:box.right-1,y:box.bottom-1}])).toMatchObject({kind:'socket',itemId:'bed'});
  world.sockets=world.sockets.map(s=>({...s,occupied:1}));expect(resolveDrop(world,{slot:0},feet.x,feet.y,[body])?.kind).toBe('floor');
 });
 it('uses a finger or centre across a doorway consistently for preview and release',()=>{
  const s=migrateHome(fixtures())!,world=dropWorld(s.rooms.home),b=world.sockets[0].box!;
  const rooms=[{id:'left',origin:{x:0,y:0},world:{...world,sockets:[]}},{id:'right',origin:{x:800,y:0},world}];
  expect(characterDropRoom(rooms,0,[{x:800+b.right-2,y:b.bottom-2},{x:790,y:500}])?.id).toBe('right');
 });
 it('prefers the visible bed above its overlapping ground rug',()=>{
  const room=starterHome().rooms.home,world=dropWorld(room),box=world.sockets.find(s=>s.itemId==='bed')!.box!;
  expect(resolveDrop(world,{slot:0},box.right-15,box.bottom-12,[{x:box.right-15,y:box.bottom-140}])?.itemId).toBe('bed');
 });
 it('chooses the nearest free bunk socket on the hit item',()=>{
  const s=fixtures();s.rooms.home.instances=[instance('bunk','bunk-bed',5,0)];const world=dropWorld(s.rooms.home),human=world.sockets.filter(s=>!s.pet);human[0].occupied=1;
  expect(resolveDrop(world,{slot:0},human[0].x,human[0].y)?.socketId).toBe(human[1].socketId);
 });
});
describe('migration-style byte preservation',()=>{
 it('preserves exact whitespace-bearing source bytes before replacement, once',async()=>{
  const before=initializePersonalization(emptySave());before.personalization!.people.family.home=fixtures();const raw=' \n'+JSON.stringify(before,null,3)+'\n';let stored=raw;const backups:string[]=[],events:string[]=[];
  const adapter:StorageAdapter={get:async()=>stored,set:async(value)=>{events.push('set');stored=value;},preserve:async(value)=>{events.push('preserve');backups.push(value);},listRecovery:async()=>[],readRecovery:async()=>null};
  const parsed=parseSave(raw),after=initializePersonalization(parsed);expect(await preserveHomeMigration(adapter,raw,parsed,after)).toBe(true);
  expect(backups).toEqual([raw]);expect(events).toEqual(['preserve','set']);expect(JSON.stringify(before.personalization!.people.family.home)).toBe(JSON.stringify(fixtures()));
  const reloaded=parseSave(stored),again=initializePersonalization(reloaded);expect(await preserveHomeMigration(adapter,stored,reloaded,again)).toBe(false);expect(backups).toHaveLength(1);expect(again).toBe(reloaded);
 });
 it('does not replace the save if preserving its original fails',async()=>{
  const before=initializePersonalization(emptySave());before.personalization!.people.family.home=fixtures();const raw=JSON.stringify(before);let stored=raw;
  const adapter:StorageAdapter={get:async()=>stored,set:async(value)=>{stored=value;},preserve:async()=>{throw Error('disk full');},listRecovery:async()=>[],readRecovery:async()=>null};
  await expect(preserveHomeMigration(adapter,raw,before,initializePersonalization(before))).rejects.toThrow('disk full');expect(stored).toBe(raw);
 });
});
