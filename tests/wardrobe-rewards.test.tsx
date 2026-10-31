import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { defaultLook, isValidLook, normalizeLook, hairStyles, hats, outfits, outfitPalettes } from '../src/islander/look';
import { wardrobeRewards, rewardTracks } from '../src/islander/rewards';
import { wardrobe, anchorsFor } from '../src/islander/rig/wardrobe';
import { frontPoses, backPoses } from '../src/islander/rig/poses';
import { Islander } from '../src/islander/rig/Islander';
import { RoomArt } from '../src/home/art/Room';
import { starterHome, validHome } from '../src/home/model';
import { floorThemes, wallThemes, themeRewards } from '../src/home/catalog';
vi.mock('react-native-svg',()=>({default:'svg', G:'g', Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Defs:'defs',Pattern:'pattern',LinearGradient:'linearGradient',Stop:'stop',Text:'text'}));
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useSharedValue:()=>({value:0}),useAnimatedProps:()=>({}),cancelAnimation:()=>{},withRepeat:()=>0,withTiming:()=>0,Easing:{inOut:()=>0,sin:0}}));
const poses = [...frontPoses, ...backPoses];
describe('badge reward art contract',()=>{
 it('validates every reward, badge reference, and anchor in every authored pose',()=>{
  expect(wardrobeRewards).toHaveLength(21); expect(themeRewards).toHaveLength(6);
  for(const reward of [...wardrobeRewards,...themeRewards]) {
   expect(reward.earned).toBe(true); expect(rewardTracks).toContain(reward.track);
   expect(reward.badge).toMatch(new RegExp(`^${reward.track}-[1-4]$`));
  }
  for(const reward of wardrobeRewards){
   expect(isValidLook({...defaultLook,[reward.slot]:reward.id})).toBe(true);
   const spec = wardrobe.find(w=>w.id===reward.id);
   if(['hat','outfit','accessory'].includes(reward.slot)) expect(spec).toBeDefined();
   if(spec) for(const pose of poses){ expect(spec.views).toContain(pose.view); for(const anchor of spec.anchors) expect(anchorsFor(pose)[anchor].every(Number.isFinite)).toBe(true); }
  }
  for(const theme of themeRewards) { expect(theme.slot==='floor'?floorThemes:wallThemes).toContain(theme.id); const home=starterHome(); home.rooms.home.theme={...home.rooms.home.theme,[theme.slot]:theme.id}; expect(validHome(home)).toBe(true); }
  for(const item of wardrobe) expect(item.earned === true).toBe(wardrobeRewards.some(r=>r.slot===item.slot && r.id===item.id));
 });
 it('retains original saved look and optional palette semantics',()=>{
  const old = {skinTone:'earth',hairStyle:'braids',hairColor:'auburn',outfit:'sundress',hat:'flower-crown',accessory:'glasses'};
  expect(isValidLook(old)).toBe(true); expect(normalizeLook(old)).toEqual(old);
  expect(isValidLook({...old,palette:'twilight'})).toBe(true);
 });
 it('renders every reward with all hairstyles and poses within the original path budget',()=>{
  let paths=0, primitives=0;
  for(const reward of wardrobeRewards) for(const hairStyle of hairStyles) for(const pose of poses){
   const markup=renderToStaticMarkup(<Islander view={pose.view} pose={pose} look={{...defaultLook,hairStyle,[reward.slot]:reward.id}}/>);
   expect(markup).not.toMatch(/NaN|undefined/);
   paths=Math.max(paths,(markup.match(/<path\b/g)||[]).length); primitives=Math.max(primitives,(markup.match(/<(?:path|rect|circle|ellipse)\b/g)||[]).length);
  }
  for(const outfit of outfits) for(const palette of Object.keys(outfitPalettes) as (keyof typeof outfitPalettes)[]) { const look={...defaultLook,outfit,palette,...(outfit==='mix'?{top:'tee' as const,bottom:'shorts' as const}:{})}; expect(isValidLook(look)).toBe(true); for(const pose of poses) { const art=renderToStaticMarkup(<Islander view={pose.view} pose={pose} look={look}/>); expect(art).toContain(outfitPalettes[palette].primary); expect(art).not.toMatch(/NaN|undefined/); } }
  // Braids + lei maximize rear path detail; include both fun colour overlays and every hat/outfit.
  for(const pose of backPoses) for(const hat of hats) for(const outfit of outfits) for(const hairColor of ['galaxy','lightning-streak'] as const) {
   const art=renderToStaticMarkup(<Islander view="back" pose={pose} look={{...defaultLook,hairStyle:'braids',hat,outfit,hairColor,accessory:'flower-lei'}}/>);
   expect((art.match(/<path\b/g)||[]).length).toBeLessThanOrEqual(40);
   expect((art.match(/<(?:path|rect|circle|ellipse)\b/g)||[]).length).toBeLessThanOrEqual(65);
  }
  console.info('Reward path budget',{paths,primitives}); expect(paths).toBeLessThanOrEqual(48); expect(primitives).toBeLessThanOrEqual(85);
 }, 180000);
 it('writes reproducible contact sheets when explicitly requested',()=>{
  if(!process.env.WARDROBE_EVIDENCE) return;
  const dir=process.env.WARDROBE_EVIDENCE; mkdirSync(dir,{recursive:true});
  const selected=[...frontPoses.filter(p=>['idle','wave','cheer','desk-write','sit-relaxed'].includes(p.id)),...backPoses.filter(p=>[0,4,8,9,12].includes(p.frame!))];
  const doc=(body:string)=>`<!doctype html><html><head><meta charset="utf-8"><style>body{font:13px system-ui;background:#fcfaf4;color:#493946;margin:16px}h1{font-size:18px}main{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}.cell{text-align:center;background:#f0eadd;padding:8px;border-radius:10px}svg{display:block;margin:auto}small{display:block;font-size:9px}</style></head><body>${body}</body></html>`;
  for(const size of [64,120]) writeFileSync(`${dir}/before-${size}.html`,doc(`<h1>Starter look and room before reward expansion · ${size}px</h1><main>${hairStyles.flatMap(hairStyle=>selected.map(pose=>`<div class="cell">${renderToStaticMarkup(<Islander size={size} view={pose.view} pose={pose} look={{...defaultLook,hairStyle}}/>)}<small>${hairStyle} · ${pose.id}</small></div>`)).join('')}</main>${renderToStaticMarkup(<RoomArt reduced theme={{wallpaper:'cream',floor:'sand'}}/>).replace('width="100%" height="100%"',`width="${size*800/560}" height="${size}"` )}`));
  for(const reward of wardrobeRewards) for(const size of [64,120]){
   const cells=hairStyles.flatMap(hairStyle=>selected.map(pose=>`<div class="cell">${renderToStaticMarkup(<Islander size={size} view={pose.view} pose={pose} look={{...defaultLook,hairStyle,[reward.slot]:reward.id}}/>)}<small>${hairStyle} · ${pose.id}</small></div>`)).join('');
   writeFileSync(`${dir}/${reward.id}-${size}.html`,doc(`<h1>${reward.name} · ${size}px · ${reward.badge}</h1><main>${cells}</main>`));
  }
  for(const size of [64,120]) writeFileSync(`${dir}/themes-${size}.html`,doc(`<h1>Island Home themes · ${size}px</h1><main style="grid-template-columns:repeat(3,1fr)">${themeRewards.map(t=>`<div>${renderToStaticMarkup(<RoomArt reduced theme={{wallpaper:t.slot==='wallpaper'?t.id:'cream',floor:t.slot==='floor'?t.id:'sand'}}/>).replace('width="100%" height="100%"',`width="${size*800/560}" height="${size}"`)}<small>${t.name} · ${t.badge}</small></div>`).join('')}</main>`));
 });
});
