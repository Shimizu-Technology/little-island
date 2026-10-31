import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { frontPoses, backPoses } from '../src/islander/rig/poses';
import { Islander } from '../src/islander/rig/Islander';
import { RunHazard } from '../src/arcade/games/lagoon-run/Art';
import { defaultLook, hairStyles, hats, outfits, accessories } from '../src/islander/look';
import { createRun, rowSafe, SLIDE_SECONDS } from '../src/arcade/games/lagoon-run/engine';
import { DUCK_MAX_ELEVATION } from '../src/arcade/games/lagoon-run/geometry';
import { runnerFrame } from '../src/arcade/games/scrolling/character';
import { runLevels } from '../src/arcade/games/scrolling/content';
vi.mock('../src/arcade/Sprite',()=>({ArcadeSprite:()=>null}));
vi.mock('react-native',()=>({View:()=>null}));
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useAnimatedProps:()=>({})}));
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
function pathYs(d:string){
 const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g)!;
 let i=0,cmd='',x=0,y=0,sx=0,sy=0;const ys:number[]=[];
 while(i<tokens.length){
  if(/^[a-zA-Z]$/.test(tokens[i]))cmd=tokens[i++];
  const relative=cmd===cmd.toLowerCase(),op=cmd.toUpperCase();
  if(op==='Z'){x=sx;y=sy;cmd='';continue;}
  const count=op==='M'||op==='L'?2:op==='Q'?4:op==='H'||op==='V'?1:0;
  if(!count)throw new Error(`Unsupported SVG command ${cmd}`);
  const n=tokens.slice(i,i+count).map(Number);i+=count;
  if(op==='H'){x=(relative?x:0)+n[0];continue;}
  if(op==='V'){y=(relative?y:0)+n[0];ys.push(y);continue;}
  const originX=relative?x:0,originY=relative?y:0;
  for(let k=1;k<n.length;k+=2)ys.push(originY+n[k]);
  x=originX+n[n.length-2];y=originY+n[n.length-1];
  if(op==='M'){sx=x;sy=y;cmd=relative?'l':'L';}
 }
 return ys;
}
function attr(tag:string,name:string){return tag.match(new RegExp(` ${name}="([^"]+)"`))?.[1];}

function artTop(markup: string) {
 let top=Infinity; const offsets=[0];
 for (const match of markup.matchAll(/<\/?(?:g|path|circle|ellipse|rect)\b[^>]*>/g)) {
  const tag=match[0];
  if(tag.startsWith('</g')) {offsets.pop();continue;}
  if(tag.startsWith('</')) continue;
  const y=offsets[offsets.length-1];
  if(tag.startsWith('<g')) {const t=attr(tag,'transform')?.match(/translate\(([-\d.]+) ([-\d.]+)\)/); offsets.push(y+(t?Number(t[2]):0));continue;}
  const op=tag.match(/^<(\w+)/)![1];
  const local=op==='path'?Math.min(...pathYs(attr(tag,'d')!)):op==='rect'?Number(attr(tag,'y')):Number(attr(tag,'cy')??0)-Math.max(Number(attr(tag,'r')??0),Number(attr(tag,'ry')??0),Number(attr(tag,'rx')??0));
  top=Math.min(top,y+local-2.5);
 }
 return top;
}
describe('Islander authored art',()=>{
 it('keeps every wardrobe combination below the duck beam through safe entry/recovery samples',()=>{
  const s=createRun(runLevels[0],42), row={...s.rows[0],kind:'net' as const,lane:1,second:-1,third:false,surface:'sand' as const};
  const frames=new Set<number>();
  for(let sample=0;sample<72;sample++){const state={...s,duck:SLIDE_SECONDS-sample/120,elevation:DUCK_MAX_ELEVATION-1e-6};if(rowSafe(state,row))frames.add(runnerFrame(state));}
  expect([...frames].sort()).toEqual([11,12,13]);
  // Read actual hazard art, including outline, rather than assuming a beam height.
  const clearance = Math.min(...(['net','banner','frond','line'] as const).map(kind => {
    const paths = [...renderToStaticMarkup(<RunHazard kind={kind}/>).matchAll(/<path\b[^>]*>/g)].map(m => m[0]);
    const beam = paths.find(tag => attr(tag,'d')?.startsWith('M4 27L12'))!;
    const highlight = paths.find(tag => attr(tag,'d') === 'M4 27H96M12 101H88')!;
    const bottom = Math.max(...pathYs(attr(beam,'d')!),...pathYs(attr(highlight,'d')!)) + 2.5;
    return (180 - bottom) * 129.6 / 180;
  }));
  const looks=[...hairStyles.flatMap(hairStyle=>hats.map(hat=>({...defaultLook,hairStyle,hat}))),...outfits.flatMap(outfit=>accessories.map(accessory=>({...defaultLook,outfit,accessory})))];
  for(const frame of frames) for(const look of looks){
   const top=artTop(renderToStaticMarkup(<Islander view="back" pose={frame} look={look}/>));
   expect(130-top+DUCK_MAX_ELEVATION*85,`${frame} ${look.hairStyle} ${look.hat} ${look.outfit} ${look.accessory}`).toBeLessThan(clearance);
  }
 }, 180000);
 it('keeps the busiest wardrobe silhouettes inside the vector budget', () => {
  const paths: number[] = [], primitives: number[] = [];
  for (const pose of [...frontPoses, ...backPoses]) for (const outfit of outfits) for (const hat of hats) {
   const markup = renderToStaticMarkup(<Islander view={pose.view} pose={pose} look={{...defaultLook,hairStyle:'braids',outfit,hat,accessory:'backpack'}}/>);
   paths.push([...markup.matchAll(/<path\b/g)].length);
   primitives.push([...markup.matchAll(/<(?:path|circle|ellipse|rect)\b/g)].length);
  }
  const metrics = { minPaths: Math.min(...paths), maxPaths: Math.max(...paths), maxPrimitives: Math.max(...primitives), samples: paths.length };
  console.info('Islander vector budget', JSON.stringify(metrics));
  expect(metrics.maxPaths).toBeLessThanOrEqual(48);
  expect(metrics.maxPrimitives).toBeLessThanOrEqual(85);
 }, 180000);
 it('uses four continuous limb contours and two unlined mitten silhouettes',()=>{
  for(const pose of [...frontPoses,...backPoses]) {
   const markup=renderToStaticMarkup(<Islander view={pose.view} pose={pose}/>);
   expect([...markup.matchAll(/data-limb=/g)]).toHaveLength(4);
   expect([...markup.matchAll(/data-mitten=/g)]).toHaveLength(2);
   for(const tag of [...markup.matchAll(/<path[^>]*data-mitten=[^>]*>/g)].map(m=>m[0])) {
    const d=attr(tag,'d')!;
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.endsWith('Z')).toBe(true);
   }
  }
 });
 it('distinguishes rear hairstyles and exposes lifted soles with the forward hand behind clothing',()=>{
  const silhouettes=hairStyles.map(hairStyle=>renderToStaticMarkup(<Islander view="back" pose={0} look={{...defaultLook,hairStyle}}/>).replace(/ data-back-hair="[^"]*"/g,''));
  expect(new Set(silhouettes).size).toBe(hairStyles.length);
  for(const frame of [0,4]) {
   const markup=renderToStaticMarkup(<Islander view="back" pose={frame}/>);
   expect(markup).toContain('data-sole="lifted"');
   expect(markup.indexOf('data-mitten=')).toBeLessThan(markup.indexOf('data-layer="clothing"'));
   expect(markup.lastIndexOf('data-mitten=')).toBeGreaterThan(markup.indexOf('data-layer="clothing"'));
  }
 });
 it('defaults each view to its own idle frame', () => {
  expect(renderToStaticMarkup(<Islander/>)).toBe(renderToStaticMarkup(<Islander view="front" pose="idle"/>));
  expect(renderToStaticMarkup(<Islander view="back"/>)).toBe(renderToStaticMarkup(<Islander view="back" pose={0}/>));
 });
 it('paints the same static markup repeatedly and never includes a rear-view face',()=>{
  const back=renderToStaticMarkup(<Islander view="back" pose={0}/>);
  expect(back).toBe(renderToStaticMarkup(<Islander view="back" pose={0}/>));
  expect(back).toContain('data-layer="face"');
  expect(back).not.toContain('#E88D7D');
 });
});

describe('native rig regressions',()=>{
 it('uses flat mid-thigh hems on both legs in every short outfit and pose',()=>{
  for(const outfit of outfits.filter(o=>!['hoodie','space-suit','pirate','overalls'].includes(o))) for(const pose of [...frontPoses,...backPoses]) {
   const markup=renderToStaticMarkup(<Islander view={pose.view} pose={pose} look={{...defaultLook,outfit}}/>);
   const shorts=[...markup.matchAll(/<path[^>]*data-garment="shorts"[^>]*>/g)].map(m=>m[0]);
   expect(shorts).toHaveLength(2);
   for(const tag of shorts) {
    const d=attr(tag,'d')!;
    expect(d.match(/L/g)).toHaveLength(3);
    expect(d).not.toMatch(/[QC]/);
   }
   // Both legs paint below the shared waist, so neither cap covers its outline.
   expect(markup.lastIndexOf('data-limb="right-leg"')).toBeLessThan(markup.indexOf('data-layer="clothing"'));
  }
 },180000);
});
