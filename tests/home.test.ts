import { socketsOf } from "../src/home/interactions";
import { roomDefaultTheme } from '../src/home/art/roomDefaults';
import { describe, expect, it } from 'vitest';
import { catalog, furnitureIds, itemSpec } from '../src/home/catalog';
import { moreCatalog, roomIds, tintIds } from '../src/home/catalogMore';
import { currentRoom, homeReducer, instance, legacyStarterHome, MAX_INSTANCES, migrateHome, starterHome, validHome, validPlacement, type HomeStateV2, type RoomState } from '../src/home/model';
import { characterDepth, characterDrop, characterPoint, characterSize, floorPoint, itemPoint, itemSize, spotFromPoint, stackSpot, stackActionLabel, stackedHitWidth, surfacePoint, toolbarY } from '../src/home/geometry';
import { editHistory, type History } from '../src/home/useHomeStore';
import { emptySave, parseSave } from '../src/state/validation';
import { entitledHome, initializePersonalization } from '../src/personalization/model';
import { writeFileSync } from 'node:fs';
const clone = <T>(v:T):T => JSON.parse(JSON.stringify(v));
const room = currentRoom;
const patch = (state:HomeStateV2, patch:Partial<RoomState>):HomeStateV2 => ({ ...state, rooms:{...state.rooms,[state.current]:{...room(state),...patch}} });
const empty = () => patch(starterHome(), {instances:[], characters:[]});
const owned = { ownedItems:[...furnitureIds,'sticker:reef-fish'] };

describe('versioned home saves and recovery', () => {
 it('starts with four independent valid rooms, free furniture and visiting characters', () => {
  const s=starterHome(); expect(validHome(s)).toBe(true); expect(validHome(clone(s))).toBe(true);
  expect(Object.keys(s.rooms)).toEqual([...roomIds]); expect(room(s).instances.map(i=>i.item).sort()).toEqual(['bed','shelf','plant','lamp','rug','toy-box'].sort());
  expect(room(s).characters).toHaveLength(3); expect(s.rooms.kitchen.characters).toEqual([]);
  expect(s.rooms.kitchen).not.toBe(s.rooms.beach);
 });
 it('uses room defaults only for new rooms and keeps explicit saved choices',()=>{const s=starterHome();for(const id of roomIds)expect(s.rooms[id].theme).toEqual(roomDefaultTheme[id]);s.rooms.kitchen.theme={wallpaper:'peach',floor:'rose'};expect(migrateHome(s)!.rooms.kitchen.theme).toEqual({wallpaper:'peach',floor:'rose'});expect(s.rooms.kitchen.instances.map(i=>i.item)).toEqual(['fridge','sink-counter','stove','fruit-bowl','kitchen-table','stool','stool']);expect(s.rooms.treehouse.instances.map(i=>i.item)).toEqual(['hammock','floor-cushion','floor-cushion','string-lights','lantern','teddy','book']);expect(s.rooms.beach.instances.map(i=>i.item)).toEqual(['bubble-bath','lounger','beach-towel','beach-towel','ball','shell','banana-plant']);});
 it('migrates v1 exactly once without changing original geometry, state or character records', () => {
  const old=legacyStarterHome(); old.instances[0].mirrored=true; old.instances[3].state='active'; old.theme.wallpaper='peach';
  old.characters[0]={slot:0,anchor:'floor',pose:'stand',x:9,y:5};
  const before=clone(old), s=migrateHome(old)!; expect(validHome(old)).toBe(true); expect(old).toEqual(before);
  expect(migrateHome(s)).toBe(s); expect(room(s).theme).toEqual(old.theme);
  expect(room(s).instances.map(i=>i.id)).toEqual(old.instances.map(i=>i.id));
  expect(room(s).characters[0]).toEqual({...old.characters[0],x:18,y:10});
  for(let n=0;n<old.instances.length;n++) {
   const i=old.instances[n], migrated=room(s).instances[n],size=itemSize(migrated),p=itemPoint({...i,x:i.x*2,y:i.y*2});
   if(p.x-size/2>=8&&p.x+size/2<=792&&p.y-size*.85>=8&&p.y+size*.15<=552)expect(migrated).toEqual({...i,x:i.x*2,y:i.y*2});
  }
 });
 it('migrates the validated personalization envelope and round-trips backup/restore', () => {
  const save=initializePersonalization(emptySave()); save.personalization!.people.family.home=legacyStarterHome();
  const migrated=initializePersonalization(save); expect(migrated.personalization!.people.family.home.version).toBe(3);
  expect(save.personalization!.people.family.home.version).toBe(1); expect(initializePersonalization(migrated)).toBe(migrated);
  expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
 });
 it.each([null,[],{}, { ...starterHome(),version:4 },{...starterHome(),extra:true}, {...starterHome(),current:'attic'}, {...starterHome(),rooms:{home:starterHome().rooms.home}}])('rejects malformed roots without mutation: %j', v=>{
  const before=clone(v); expect(validHome(v)).toBe(false); expect(migrateHome(v)).toBeUndefined(); expect(v).toEqual(before);
 });
 it.each([{x:NaN},{x:Infinity},{x:-1},{x:16},{y:12},{y:1.5},{item:'unknown'},{layer:'wall'},{state:'broken'},{state:'active'},{rotation:45},{rotation:90},{mirrored:1},{id:'bad id'},{extra:1},{tint:'invalid'},{tint:undefined},{on:undefined},{on:'missing'}])('rejects malformed instance %j', changes=>{
  const s=patch(empty(),{instances:[{...instance('a','plant',0,0),...changes} as never]}); expect(validHome(s)).toBe(false);
 });
 it('rejects duplicate IDs, collisions, unsupported sticker transforms and mixed character shapes',()=>{
  for(const items of [[instance('a','bed',0,0),instance('b','plant',1,1)],[instance('a','plant',0,0),instance('a','plant',4,0)],[{...instance('s','sticker:reef-fish',0,0),mirrored:true}],[{...instance('s','sticker:reef-fish',0,0),tint:'coral' as const}]]) expect(validHome(patch(empty(),{instances:items}))).toBe(false);
  for(const c of [null,{slot:4,anchor:'hello',pose:'stand'},{slot:0,anchor:'hello',pose:'sit'},{slot:0,anchor:'floor',pose:'stand',x:20,y:0},{slot:0,anchor:'floor',pose:'stand',x:0,y:0,seatId:'bed'}]) expect(validHome(patch(starterHome(),{characters:[c as never]}))).toBe(false);
  const s=starterHome(); s.rooms.beach.characters=[...room(s).characters]; expect(validHome(s)).toBe(false);
 });
 it('preserves malformed legacy data for recovery instead of normalizing it',()=>{const old=legacyStarterHome();old.instances[0].x=-1;const before=clone(old);expect(migrateHome(old)).toBeUndefined();expect(old).toEqual(before);expect(validHome({...legacyStarterHome(),instances:[instance('s','sofa',0,0)],characters:[]})).toBe(false);});
 it('keeps earned-item and room-theme entitlement checks across every room',()=>{
  const s=starterHome(); s.rooms.beach.instances.push(instance('unowned','abacus',0,9)); expect(validHome(s)).toBe(true); expect(entitledHome(s,[])).toBe(false); expect(entitledHome(s,['abacus'])).toBe(true);
  s.rooms.kitchen.theme.wallpaper='math-lab'; expect(entitledHome(s,['abacus'])).toBe(false); expect(entitledHome(s,['abacus','math-lab'])).toBe(true);
  expect(entitledHome(starterHome(),[])).toBe(true);
 });
});

describe('room editing, stacking and colours',()=>{
 it('writes a validated three-child touch fixture for browser QA',()=>{
  if(!process.env.TOUCH_EVIDENCE) return;
  const save=initializePersonalization(emptySave());
  const home=starterHome();
  home.current='kitchen';
  home.rooms.kitchen.characters=home.rooms.home.characters.map(c=>({...c,anchor:'hello' as const,pose:'stand' as const}));
  home.rooms.home.characters=[];
  home.rooms.kitchen.instances=[
   instance('table-touch','table',4,4),
   {...instance('fruit-touch','fruit-bowl',4,4),on:'table-touch'},
   {...instance('tea-touch','teapot',5,4),on:'table-touch'},
   {...instance('vase-touch','flower-vase',6,4),on:'table-touch'},
   instance('art-touch','sea-picture',8,0),
   instance('top-touch','clock',2,0),
   instance('bottom-touch','plant',10,8),
  ];
  for(const item of home.rooms.kitchen.instances) expect([item.id, validPlacement(home.rooms.kitchen.instances,item)]).toEqual([item.id,true]);
  expect(validHome(home)).toBe(true);
  save.personalization!.people.family.home=home;
  expect(parseSave(JSON.stringify(save))).toEqual(save);
  writeFileSync(`${process.env.TOUCH_EVIDENCE}/fixture-touch.json`,JSON.stringify(save));
 });
 it('keeps three stacked touch targets in separate projected cells at phone scales',()=>{
  const parent=instance('t','table',4,4);
  const children=[4,5,6].map((x,n)=>({...instance(`c${n}`,'lamp',x,4),on:'t'}));
  for(const scale of [0.36,0.48,1]) {
   const widths=children.map(i=>stackedHitWidth(i,scale,48));
   const centers=children.map(i=>itemPoint(i,[parent,...children]).x*scale);
   expect(widths.every(w=>w>=44)).toBe(true);
   expect(centers[0]).toBeLessThan(centers[1]);
   expect(centers[1]).toBeLessThan(centers[2]);
  }
  expect(stackedHitWidth(parent,.36,48)).toBe(48);
 });
 it('places a measured toolbar inside the header and tray without covering the object when space exists',()=>{
  expect(toolbarY(220,250,64,120,410)).toBe(258);
  expect(toolbarY(320,360,64,120,410)).toBe(248);
  expect(toolbarY(170,230,100,120,300)).toBe(124);
 });
 it('writes a valid browser fixture for duplicate surface action QA',()=>{
  if(!process.env.POLISH_EVIDENCE) return;
  const save=initializePersonalization(emptySave());
  const home=patch(starterHome(),{instances:[instance('table-a','table',3,4),instance('table-b','table',10,4),instance('lamp-a','lamp',1,1)],characters:[{slot:0,anchor:'hello',pose:'stand'},{slot:1,anchor:'hello',pose:'stand'},{slot:2,anchor:'hello',pose:'stand'}]});
  expect(validHome(home)).toBe(true);
  save.personalization!.people.family.home=home;
  expect(parseSave(JSON.stringify(save))).toEqual(save);
  writeFileSync(`${process.env.POLISH_EVIDENCE}/fixture-surfaces.json`,JSON.stringify(save));
 });
 it('gives every new item an explicit scene size relative to the Islander',()=>{
  expect(Object.keys(moreCatalog)).toHaveLength(56);
  for(const [id,spec] of Object.entries(moreCatalog)) expect(itemSize(instance(id,id,0,0))).toBe(Math.round(spec.itemSize*1.18));
  expect(itemSize(instance('f','fridge',0,0))).toBeGreaterThan(characterSize(0));
  expect(itemSize(instance('l','table-lamp',0,0))).toBeLessThan(characterSize(0)/2);
 });
 it('fits three small items in separate cells on one table and preserves them on move',()=>{
  let s=patch(empty(),{instances:[instance('t','table',4,4),instance('a','lamp',0,0),instance('b','plant',0,4),instance('c','teddy',8,4)]});
  for(const id of ['a','b','c']) {
    const child=room(s).instances.find(i=>i.id===id)!;
    const surface=surfacePoint(room(s).instances[0]);
    const spot=stackSpot(room(s).instances,child,surface.x,surface.y)!;
    expect(spot.on).toBe('t');
    s=homeReducer(s,{type:'move',id,...spot}).state;
  }
  const children=room(s).instances.filter(i=>i.on==='t');
  expect(new Set(children.map(i=>`${i.x},${i.y}`)).size).toBe(3);
  expect(validHome(s)).toBe(true);
  expect(stackSpot(room(s).instances,instance('d','lamp',0,0),surfacePoint(room(s).instances[0]).x,surfacePoint(room(s).instances[0]).y)).toBeUndefined();
  expect(validPlacement(room(s).instances,{...instance('d','lamp',9,4),on:'t'})).toBe(false);
  s=homeReducer(s,{type:'move',id:'t',x:8,y:6}).state;
  expect(room(s).instances.filter(i=>i.on==='t')).toHaveLength(3);
  expect(validHome(s)).toBe(true);
 });
 it('distinguishes duplicate surface action labels',()=>{
  const items=[instance('left','table',2,2),instance('right','table',8,2)];
  expect(items.map(i=>stackActionLabel(i,items))).toEqual(['Put on Pebble table 1','Put on Pebble table 2']);
 });
 it('allows free expanded catalogue and refuses unearned rewards',()=>{
  const s=empty(); expect(homeReducer(s,{type:'place',instance:instance('a','abacus',0,0)}).state).toBe(s);
  for(const id of Object.keys(moreCatalog)) expect(homeReducer(s,{type:'place',instance:instance('a',id,0,0)}).state).not.toBe(s);
  expect(homeReducer(s,{type:'place',instance:instance('a','abacus',0,0)},owned).state).not.toBe(s);
 });
 it('uses half-cells, scaled footprints and a clear door with exact projection round-trips',()=>{
  for(const [x,y] of [[0,0],[1,1],[13,9],[18,10]]) { const p=floorPoint(x,y); expect(spotFromPoint(p.x,p.y,1,false)).toEqual({x,y}); }
  for(const [x,y] of [[0,0],[1,1],[14,2]]) { const p=itemPoint(instance('s','sticker:reef-fish',x,y)); expect(spotFromPoint(p.x,p.y,1,true)).toEqual({x,y}); }
  const s=empty(), moved=homeReducer(s,{type:'place',instance:instance('p','plant',1,1)}).state; expect(room(moved).instances[0].x).toBe(1);
  expect(validPlacement([],instance('p','plant',16,0))).toBe(false); expect(validPlacement([instance('r','rug',0,0)],instance('t','table',0,0))).toBe(true);
 });
 it('jumps the camera without teleporting characters and keeps each layout and theme',()=>{
  let s=starterHome(); const before=clone(room(s).instances);
  s=homeReducer(s,{type:'room',room:'kitchen'}).state; expect(room(s).characters).toHaveLength(0); expect(s.rooms.home.characters).toHaveLength(3);
  s=homeReducer(s,{type:'tint',id:'starter-fridge',tint:'coral'}).state; s=homeReducer(s,{type:'room',room:'home'}).state;
  expect(room(s).instances).toEqual(before); expect(s.rooms.kitchen.instances[0].tint).toBe('coral'); expect(validHome(s)).toBe(true);
 });
 it('validates all tints, commits them and restores original through history',()=>{
  const s=starterHome(); for(const tint of tintIds) {const next=homeReducer(s,{type:'tint',id:'bed',tint}).state; expect(room(next).instances[0].tint).toBe(tint); expect(validHome(next)).toBe(true);}
  let h:History={present:s,past:[],future:[]};h=editHistory(h,{type:'tint',id:'bed',tint:'lagoon'});expect(editHistory(h,{type:'undo'}).present).toBe(s);
 });
 it('stacks a lamp on a table, moves the group, rejects overlap and puts the whole group away',()=>{
  let s=patch(empty(),{instances:[instance('t','table',4,4),instance('l','lamp',0,0),instance('p','plant',0,4)]});
  const surface=surfacePoint(room(s).instances[0]); expect(stackSpot(room(s).instances,room(s).instances[1],surface.x,surface.y)).toMatchObject({on:'t'});
  s=homeReducer(s,{type:'move',id:'l',x:4,y:4,on:'t'}).state;expect(room(s).instances[1].on).toBe('t');
  expect(homeReducer(s,{type:'move',id:'p',x:4,y:4,on:'t'}).state).toBe(s);
  s=homeReducer(s,{type:'move',id:'t',x:8,y:6}).state; expect(room(s).instances[1]).toMatchObject({x:8,y:6,on:'t'});
  expect(itemPoint(room(s).instances[1],room(s).instances).x).toBeLessThan(surfacePoint(room(s).instances[0]).x);
  const before=s, removed=homeReducer(s,{type:'put-away',id:'t'}).state; expect(room(removed).instances.map(i=>i.id)).toEqual(['p']);expect(validHome(removed)).toBe(true);
  const h=editHistory({present:before,past:[],future:[]},{type:'put-away',id:'t'});expect(editHistory(h,{type:'undo'}).present).toBe(before);
 });
 it('drops a stacked item to the floor and rejects cycles, non-small children and nested stacks',()=>{
  const s=patch(empty(),{instances:[instance('t','table',4,4),{...instance('l','lamp',4,4),on:'t'}]}); expect(validHome(s)).toBe(true);
  const next=homeReducer(s,{type:'move',id:'l',x:0,y:0}).state; expect(room(next).instances[1].on).toBeUndefined();expect(validHome(next)).toBe(true);
  for(const items of [[{...instance('t','table',4,4),on:'t'}],[instance('t','table',4,4),{...instance('b','bed',4,4),on:'t'}],[instance('t','table',4,4),{...instance('l','lamp',4,4),on:'t'},{...instance('p','plant',4,4),on:'l'}]]) expect(validHome(patch(empty(),{instances:items}))).toBe(false);
 });
 it('caps each room at 48, permits edits at cap and preserves rejected 49th item',()=>{
  let s=empty(); for(let n=0;n<48;n++) s=homeReducer(s,{type:'place',instance:instance(`p${n}`,'plant',(n%8)*2,Math.floor(n/8)*2)}).state;
  expect(room(s).instances).toHaveLength(MAX_INSTANCES);expect(validHome(s)).toBe(true);
  const result=homeReducer(s,{type:'place',instance:instance('extra','lamp',0,0)});expect(result.state).toBe(s);expect(result.message).toContain('Put something away');
  expect(homeReducer(s,{type:'tint',id:'p0',tint:'coral'}).state).not.toBe(s);
  s=homeReducer(s,{type:'room',room:'kitchen'}).state;expect(room(s).instances.length).toBeLessThan(48);
 });
 it('rotates, mirrors, toggles, gates themes and resets only the selected room with an undo snapshot',()=>{
  let s=starterHome();s=homeReducer(s,{type:'rotate',id:'bed'}).state;expect(room(s).instances[0].rotation).toBe(180);
  s=homeReducer(s,{type:'mirror',id:'bed'}).state;expect(room(s).instances[0].mirrored).toBe(true);
  s=homeReducer(s,{type:'toggle',id:'lamp'}).state;expect(room(s).instances.find(i=>i.id==='lamp')!.state).toBe('active');
  expect(homeReducer(s,{type:'theme',wallpaper:'math-lab'}).state).toBe(s);s=homeReducer(s,{type:'theme',wallpaper:'math-lab'},{ownedWallpapers:['math-lab']}).state;
  const reset=homeReducer(s,{type:'reset'});expect(reset.snapshot).toBe(s);expect(reset.state.rooms.kitchen).toBe(s.rooms.kitchen);expect(reset.state).toEqual(starterHome());
 });
 it('bounds undo/redo at 40 outside the persisted schema and clears redo on edit',()=>{
  let h:History={present:starterHome(),past:[],future:[]};for(let n=0;n<50;n++)h=editHistory(h,{type:'mirror',id:'bed'});expect(h.past).toHaveLength(40);
  h=editHistory(h,{type:'undo'});expect(h.future).toHaveLength(1);h=editHistory(h,{type:'tint',id:'bed',tint:'coral'});expect(h.future).toEqual([]);expect(validHome(h.present)).toBe(true);
 });
});

describe('constant-size seating and depth',()=>{
 it('snaps to a front-row chair before treating the drop as beach',()=>{
  const s=patch(starterHome(),{instances:[instance('front-seat','chair',4,10)]});
  const p=characterPoint(room(s),{slot:0,anchor:'chair',pose:'sit',seatId:'front-seat'});
  expect(p.y).toBeLessThan(560);
  expect(characterDrop(room(s),0,p.x,p.y)).toMatchObject({seatId:'front-seat'});
 });
 it.each(['bed','chair','rug','beanbag','shelf','sofa','armchair','bunk-bed','hammock','floor-cushion','rocking-chair','stool'])('seats each character on %s, follows its seat and stands safely after removal',id=>{
  let s=patch(starterHome(),{instances:[instance('seat',id,4,4)],characters:[0,1,2].map(slot=>({slot:slot as 0|1|2,anchor:'hello',pose:'stand'}))});
  for(const slot of [0,1,2] as const){ const anchor=['bed','chair','rug','beanbag','shelf'].includes(id)?id as 'bed':'seat';
   const p=characterPoint(room(s),{slot,anchor,pose:'sit',seatId:'seat'});
   expect(characterDrop(room(s),slot,p.x,p.y)).toMatchObject({seatId:'seat'});
   s=homeReducer(s,{type:'character',slot,anchor,seatId:'seat'}).state;expect(room(s).characters[slot].pose).toBe(socketsOf(room(s).instances[0])[0].kind);expect(characterSize(slot)).toBe(slot===0?224:slot===2?98:170);
   expect(characterDepth(room(s),room(s).characters[slot])).toBeGreaterThan(itemPoint(room(s).instances[0]).y);
   if(slot!==2)s=homeReducer(s,{type:'character',slot,anchor:'floor',x:18,y:8}).state;
  }
  const before=characterPoint(room(s),room(s).characters[2]);s=homeReducer(s,{type:'move',id:'seat',x:6,y:6}).state;expect(characterPoint(room(s),room(s).characters[2])).not.toEqual(before);
  s=homeReducer(s,{type:'put-away',id:'seat'}).state;expect(room(s).characters.every(c=>c.pose==='stand')).toBe(true);expect(validHome(s)).toBe(true);
 });
 it('retains beach anchors and rejects malformed poses or coordinates',()=>{
  const s=starterHome();expect(characterDrop(room(s),0,400,650)).toEqual({type:'character',slot:0,anchor:'beach-middle'});
  for(const anchor of ['beach-left','beach-middle','beach-right'] as const){const next=homeReducer(s,{type:'character',slot:0,anchor}).state;expect(validHome(next)).toBe(true);expect(characterPoint(room(next),room(next).characters[0]).y).toBeLessThanOrEqual(540);}
 });
 it('retains original catalog earning metadata',()=>{expect(furnitureIds).toHaveLength(24);for(const id of furnitureIds)expect(itemSpec(id)).toEqual(catalog[id]);});
});
