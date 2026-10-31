import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RunnerFrameArt, RunnerRig, CharacterPortrait } from '../src/arcade/games/scrolling/CharacterArt';
import { backPoses, runCycleFrames } from '../src/islander/rig/poses';
import { anchorsFor } from '../src/islander/rig/wardrobe';
import { defaultLook, hairStyles, hats, outfits, accessories, skinTones, hairColors, outfitPalettes } from '../src/islander/look';
import * as active from '../src/islander/active';
import { KITE_HANDS, KITE_STRINGS } from '../src/arcade/games/scrolling/runnerAnchors';
import { runPoses } from '../src/arcade/games/scrolling/render';
import { createRun, runLevels } from '../src/arcade/games/lagoon-run/engine';
import { RUN_EXTRA } from '../src/arcade/games/scrolling/character';
vi.mock('../src/islander/active',async()=>{const {defaultLook}=await import('../src/islander/look');return {useActiveIslanderLook:()=>defaultLook};});
vi.mock('../src/arcade/Sprite',()=>({ArcadeSprite:({children,index}: {children:React.ReactNode;index:number})=><div data-sprite={index}>{children}</div>}));
vi.mock('react-native',()=>({View:()=>null}));
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useAnimatedProps:()=>({})}));
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
describe('Lagoon Run Islander integration',()=>{
 it('renders all 24 static frames for every wardrobe geometry combination',()=>{
  let samples=0,maxPaths=0,maxPrimitives=0,maxStaticTransforms=0;
  const looks=[...hairStyles.map(hairStyle=>({...defaultLook,hairStyle})),...hats.map(hat=>({...defaultLook,hat})),...outfits.map(outfit=>({...defaultLook,outfit,...(outfit==='mix'?{top:'tee' as const,bottom:'shorts' as const}:{})})),...accessories.map(accessory=>({...defaultLook,accessory}))];
  for(const look of looks) for(let frame=0;frame<24;frame++){
   const markup=renderToStaticMarkup(<RunnerFrameArt frame={frame} look={look}/>);
   expect(markup).not.toMatch(/NaN|undefined|Infinity/);
   expect(markup).toContain('viewBox="0 0 80 132"');
   expect([...markup.matchAll(/data-limb=/g)]).toHaveLength(4);
   expect([...markup.matchAll(/data-mitten=/g)]).toHaveLength(2);
   expect(markup).not.toContain('#E88D7D'); // rear view has no face
   for(const point of Object.values(anchorsFor(backPoses[frame]))) expect(point.every(Number.isFinite)).toBe(true);
   maxPaths=Math.max(maxPaths,[...markup.matchAll(/<path\b/g)].length);
   maxPrimitives=Math.max(maxPrimitives,[...markup.matchAll(/<(?:path|circle|ellipse|rect)\b/g)].length);
   maxStaticTransforms=Math.max(maxStaticTransforms,[...markup.matchAll(/<g[^>]*transform=/g)].length);
   samples++;
  }
  expect(samples).toBe(looks.length * 24);
  console.info('Run wardrobe vector budget',JSON.stringify({maxPaths,maxPrimitives,maxStaticTransforms,samples}));
  expect(maxPaths).toBeLessThanOrEqual(40);
  expect(maxPrimitives).toBeLessThanOrEqual(65);
 },180000);
 it('renders each color selection across every frame without altering anchors',()=>{
  for(const [key, values] of Object.entries({skinTone:Object.keys(skinTones),hairColor:Object.keys(hairColors),palette:Object.keys(outfitPalettes)})) for(const value of values) for(let frame=0;frame<24;frame++){
   const markup=renderToStaticMarkup(<RunnerFrameArt frame={frame} look={{...defaultLook,[key]:value}}/>);
   expect(markup).not.toMatch(/NaN|undefined|Infinity/);
  }
 },180000);
 it('keeps exactly the existing root and 24 sprite wrappers and indices',()=>{
  const poses={value:[]} as unknown as React.ComponentProps<typeof RunnerRig>['poses'];
  const markup=renderToStaticMarkup(<RunnerRig poses={poses}/>);
  expect([...markup.matchAll(/data-sprite="(\d+)"/g)].map(m=>Number(m[1]))).toEqual([0,...backPoses.map((_,i)=>i<16?80+i:RUN_EXTRA+i-16)]);
  expect([...markup.matchAll(/<svg\b/g)]).toHaveLength(24);
 });
 it('uses the active look on both runner and front map/result portraits',()=>{
  const selected={...defaultLook,hairColor:'lagoon' as const,hat:'sunhat' as const,accessory:'backpack' as const};
  const source=vi.spyOn(active,'useActiveIslanderLook').mockReturnValue(selected);
  const poses={value:[]} as unknown as React.ComponentProps<typeof RunnerRig>['poses'];
  expect(renderToStaticMarkup(<RunnerRig poses={poses}/>)).toContain(hairColors.lagoon);
  const idle=renderToStaticMarkup(<CharacterPortrait bat={false} size={120} outfit="starlight"/>);
  const clear=renderToStaticMarkup(<CharacterPortrait bat={false} size={120} outfit="island" happy/>);
  const loss=renderToStaticMarkup(<CharacterPortrait bat={false} size={120} outfit="island" dizzy/>);
  expect(new Set([idle,clear,loss]).size).toBe(3);
  for(const markup of [idle,clear,loss]){expect(markup).toContain('#E88D7D');expect(markup).toContain(hairColors.lagoon);}
  expect(idle).toBe(renderToStaticMarkup(<CharacterPortrait bat={false} size={120} outfit="island"/>));
  source.mockRestore();
 });
 it('swings both long hairstyles through the run cycle',()=>{
  for(const hairStyle of ['ponytail','braids'] as const){
   const hair=runCycleFrames.map(frame=>renderToStaticMarkup(<RunnerFrameArt frame={frame} look={{...defaultLook,hairStyle}}/>).split('data-layer="front-hair"')[1].split('data-layer="face"')[0]);
   // Compare same head height on opposite contacts: hair must still move.
   expect(hair[2]).not.toBe(hair[10]);
  }
 });
 it('attaches both kite strings to the apex hands in contact coordinates',()=>{
  const s={...createRun(runLevels[0],42),kite:1,poseLane:.6,lane:1};
  const p=runPoses(s);
  expect(p[0].angle).toBe(0);
  expect(KITE_STRINGS.match(/M36 72L/g)).toHaveLength(2);
  KITE_HANDS.forEach(([x,y],i)=>{
   const hand=i?backPoses[9].joints.rightHand:backPoses[9].joints.leftHand;
   expect(p[172].x+x).toBeCloseTo(p[0].x+hand[0]);
   expect(p[172].y+y).toBeCloseTo(p[0].y+hand[1]);
  });
 });
});
