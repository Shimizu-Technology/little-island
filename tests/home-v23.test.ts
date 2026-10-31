import { zoomLimits, boundedPan, buildingLayout, roomOrigin, buildingRoomAt, roomCamera, softPan } from '../src/home/camera';
import { describe, it, expect } from 'vitest';
import { sceneItemDepth, furniturePaintDepth, characterDepth, characterDrop, characterPoint, furnitureDepth, seatClipTop, characterSize, itemPoint } from '../src/home/geometry';
import { homeReducer, starterHome, instance, validHome } from '../src/home/model';
import {dropWorld} from '../src/home/interactions';
import {occlusion} from '../src/home/drop';
import { parseSave, emptySave } from '../src/state/validation';
import { initializePersonalization } from '../src/personalization/model';
import { writeFileSync } from 'node:fs';
describe('2.3 character regressions', () => {
  it('settles outside-floor drags without a furniture-placement message', () => {
    for (const [x,y] of [[-200,0],[900,300],[300,349]]) {
      const s=starterHome(), result=homeReducer(s,characterDrop(s.rooms.home,0,x,y));
      expect(result.message).toBeUndefined(); expect(validHome(result.state)).toBe(true);
    }
  });
  it('uses feet against the furniture front contact row', () => {
    const s=starterHome().rooms.home, bed=instance('b','bed',0,0);
    s.instances=[bed];
    expect(characterDepth(s,{slot:0,anchor:'floor',pose:'stand',x:0,y:4})).toBeGreaterThan(furnitureDepth(bed));
    expect(characterDepth(s,{slot:0,anchor:'floor',pose:'stand',x:8,y:0})).toBeLessThan(furnitureDepth(bed));
  });
  it('clips every occupied front rim below the torso, including the enlarged rig', () => {
    for(const item of ['chair','bed','beanbag','sofa','stool'] as const) {
      const s=starterHome().rooms.home, seat=instance('seat',item,4,4);
      s.instances=[seat];s.characters=[{slot:0,anchor:item==='sofa'||item==='stool'?'seat':item,seatId:'seat',pose:'sit'}];
      expect(seatClipTop(s,seat)).toBeGreaterThanOrEqual(characterPoint(s,s.characters[0]).y-characterSize(0)*.23);
    }
  });
  it('moves a crab dropped on a lamp to a visible unoccupied floor cell', () => {
    const s=starterHome(), lamp=instance('lamp','lamp',10,6);s.rooms.home.instances=[lamp];s.rooms.home.characters=s.rooms.home.characters.map(c=>({slot:c.slot,anchor:"floor",pose:"stand",x:18,y:c.slot*3}));
    const p=itemPoint(lamp), result=homeReducer(s,characterDrop(s.rooms.home,2,p.x,p.y));
    const c=result.state.rooms.home.characters.find(c=>c.slot===2)!;
    expect(c.anchor).toBe('floor');expect(c.x===10&&c.y===6).toBe(false);const point=characterPoint(result.state.rooms.home,c);expect(occlusion(dropWorld(result.state.rooms.home),2,point.x,point.y).fraction).toBeLessThanOrEqual(.25);
    expect(result.message).toBeUndefined();
  });
  it('also protects keyboard floor movement', () => {
    const s=starterHome();s.rooms.home.instances=[instance('lamp','lamp',10,6)];s.rooms.home.characters=s.rooms.home.characters.map(c=>({slot:c.slot,anchor:'floor',pose:'stand',x:18,y:c.slot*3}));
    const room=homeReducer(s,{type:'character',slot:0,anchor:'floor',x:10,y:6}).state.rooms.home,c=room.characters[0],p=characterPoint(room,c);expect(c.anchor).toBe('floor');expect(c.x===10&&c.y===6).toBe(false);expect(occlusion(dropWorld(room),0,p.x,p.y).fraction).toBeLessThanOrEqual(.25);
  });
});

describe('dollhouse room membership',()=>{
  it('transfers only the dragged friend, keeps themes/furniture and roundtrips version 2',()=>{
    const s=starterHome(), original=JSON.stringify(s), next=homeReducer(s,{type:'transfer',slot:0,room:'kitchen',x:8,y:8}).state;
    expect(s.rooms.home.characters).toHaveLength(3);expect(JSON.stringify(s)).toBe(original);
    expect(next.rooms.home.characters.map(c=>c.slot)).toEqual([1,2]);expect(next.rooms.kitchen.characters.map(c=>c.slot)).toEqual([0]);
    expect(next.rooms.kitchen.instances).toEqual(s.rooms.kitchen.instances);expect(validHome(JSON.parse(JSON.stringify(next)))).toBe(true);
    const back=homeReducer(next,{type:'transfer',roomId:'kitchen',room:'home',slot:0,x:0,y:5}).state;
    expect(back.rooms.home.characters).toHaveLength(3);expect(validHome(back)).toBe(true);
  });
  it('edits a visible neighbouring room without changing camera or another room',()=>{
    const s=starterHome(), next=homeReducer(s,{type:'toggle',roomId:'kitchen',id:'starter-stove'}).state;
    expect(next.current).toBe('home');expect(next.rooms.home).toBe(s.rooms.home);expect(next.rooms.kitchen.instances.find(i=>i.id==='starter-stove')?.state).toBe('active');
  });
  it('rejects duplicate slots across rooms and invalid transfer targets',()=>{
    const s=starterHome();s.rooms.kitchen.characters=[s.rooms.home.characters[0]];expect(validHome(s)).toBe(false);
    const clean=starterHome();expect(homeReducer(clean,{type:'transfer',slot:0,room:'kitchen',x:NaN,y:3}).state).toBe(clean);
  });
});

describe('building camera geometry',()=>{
  it('fills floors in room order with Tree house upstairs and grows upwards',()=>{
    const b=buildingLayout(4);
    expect(b.columns).toBe(2);expect(b.floors).toBe(2);
    expect(roomOrigin(0,b).y).toBe(roomOrigin(1,b).y);
    expect(roomOrigin(2,b).y).toBeLessThan(roomOrigin(0,b).y);
    expect(roomOrigin(3,b).x).toBeGreaterThan(roomOrigin(2,b).x);
    const extended=buildingLayout(7);
    expect(extended.floors).toBe(4);expect(roomOrigin(6,extended).y).toBe(extended.roof);
    for(let n=0;n<7;n++){const p=roomOrigin(n,extended);expect(buildingRoomAt(p.x+400,p.y+400,extended)).toBe(n);}
  });
  it.each([[390,844],[844,390],[1024,768]])('fits 90%% of the limiting viewport at %s×%s',(width,height)=>{
    const viewportHeight=height-146,b=buildingLayout(4,width/height>1.8),close=viewportHeight*800/740;
    const limits=zoomLimits(width,close,viewportHeight,b),scale=close*limits.min/800;
    expect(Math.max(b.width*scale/width,b.height*scale/viewportHeight)).toBeCloseTo(.9);
    expect(b.width*scale).toBeLessThanOrEqual(width);expect(b.height*scale).toBeLessThanOrEqual(viewportHeight);
    for(let n=0;n<4;n++){const p=roomCamera(n,b,scale,width,viewportHeight);expect(p.x).toBeCloseTo((width-b.width*scale)/2);expect(p.y).toBeCloseTo((viewportHeight-b.height*scale)/2);}
  });
  it('uses both axes for transfers and clamps overscroll with a soft edge',()=>{
    const b=buildingLayout(4),from=roomOrigin(0,b),to=roomOrigin(2,b);
    expect(buildingRoomAt(from.x+400,to.y+400,b)).toBe(2);
    expect(buildingRoomAt(-500,-500,b)).toBe(2);expect(buildingRoomAt(99999,99999,b)).toBe(1);
    expect(boundedPan(500,390,1640)).toBe(0);expect(boundedPan(-9999,390,1640)).toBe(-1250);
    expect(softPan(100,390,1640)).toBe(22);expect(softPan(-1350,390,1640)).toBe(-1272);
  });
  it('validates and roundtrips the optional navigation hint preference',()=>{
    const s=emptySave();s.settings.homeNavigationSeen=true;expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(()=>parseSave(JSON.stringify({...s,settings:{...s.settings,homeNavigationSeen:'yes'}}))).toThrow();
    expect(parseSave(JSON.stringify(emptySave())).settings.homeNavigationSeen).toBeUndefined();
  });
});

it('reset cannot duplicate friends living in another room',()=>{
 const s=homeReducer(starterHome(),{type:'transfer',slot:0,room:'kitchen',x:8,y:8}).state;
 const reset=homeReducer(s,{type:'reset',roomId:'home'}).state;
 expect(reset.rooms.home.characters.map(c=>c.slot)).toEqual([1,2]);expect(reset.rooms.kitchen.characters[0].slot).toBe(0);expect(validHome(reset)).toBe(true);
});

it('exports an optional isolated QA save with the sample character positions',()=>{
 if(!process.env.HOME_V23_FIXTURE)return;
 const save=initializePersonalization(emptySave());
 const home=save.personalization!.people.family.home;
 if(home.version!==2)throw Error('expected v2');
 home.rooms.home.characters=[{slot:0,anchor:'floor',pose:'stand',x:0,y:4},{slot:1,anchor:'shelf',pose:'sit'},{slot:2,anchor:'floor',pose:'stand',x:14,y:4}];
 expect(parseSave(JSON.stringify(save))).toEqual(save);
 writeFileSync(process.env.HOME_V23_FIXTURE,JSON.stringify(save));
});

it('renders an old window overlap safely without mutating its saved anchor',()=>{
 const s=starterHome().rooms.home, before=JSON.stringify(s.characters[0]);
 expect(characterPoint(s,s.characters[0]).x).toBeGreaterThanOrEqual(76);
 expect(characterPoint(s,s.characters[0]).y).toBeLessThanOrEqual(540);
 expect(JSON.stringify(s.characters[0])).toBe(before);
});

it('keeps a nearby tabletop behind a seated torso',()=>{
 const s=starterHome().rooms.home;s.instances.push(instance('table','table',12,6),instance('chair','chair',12,9));
 s.characters[0]={slot:0,anchor:'chair',pose:'sit',seatId:'chair'};
 expect(furniturePaintDepth(s,s.instances.find(i=>i.item==='table')!)).toBeLessThan(characterDepth(s,s.characters[0]));
});

it('paints stacked children above the front edge of their supporting furniture',()=>{
 const s=starterHome().rooms.home, table=instance('surface','table',4,4), child={...instance('fruit','fruit-bowl',4,4),on:'surface'};
 s.instances=[table,child];
 expect(sceneItemDepth(s,child)).toBeGreaterThan(sceneItemDepth(s,table));
 expect(sceneItemDepth(s,table)).toBeGreaterThan(itemPoint(table).y);
});
