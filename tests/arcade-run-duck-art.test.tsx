import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultLook, hats } from '../src/islander/look';
import { RunnerFrameArt } from '../src/arcade/games/scrolling/CharacterArt';
import { RunHazard } from '../src/arcade/games/lagoon-run/Art';
import { createRun, rowSafe, SLIDE_SECONDS } from '../src/arcade/games/lagoon-run/engine';
import { DUCK_MAX_ELEVATION } from '../src/arcade/games/lagoon-run/geometry';
import { runnerFrame } from '../src/arcade/games/scrolling/character';
import { runLevels } from '../src/arcade/games/scrolling/content';
vi.mock('../src/islander/active',async()=>{const {defaultLook}=await import('../src/islander/look');return {useActiveIslanderLook:()=>defaultLook};});
vi.mock('../src/arcade/Sprite',()=>({ArcadeSprite:()=>null}));
vi.mock('react-native',()=>({View:()=>null}));
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useAnimatedProps:()=>({})}));
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
// Conservative Bezier control hull: every point of a quadratic stays inside it.
// Fail on unsupported commands rather than silently accepting newly authored art.
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
function artTop(markup:string){
 let top=Infinity; const offsets=[0];
 for(const match of markup.matchAll(/<\/?(?:g|path|circle|ellipse|rect)\b[^>]*>/g)){
  const tag=match[0];
  if(tag.startsWith('</g')){offsets.pop();continue;}
  if(tag.startsWith('</'))continue;
  const y=offsets[offsets.length-1];
  if(tag.startsWith('<g')){const t=attr(tag,'transform')?.match(/translate\(([-\d.]+) ([-\d.]+)\)/);offsets.push(y+(t?Number(t[2]):0));continue;}
  const op=tag.match(/^<(\w+)/)![1],padding=Math.max(3,Number(attr(tag,'stroke-width')??2))/2;
  const local=op==='path'?Math.min(...pathYs(attr(tag,'d')!)):op==='rect'?Number(attr(tag,'y')):Number(attr(tag,'cy')??0)-Number(attr(tag,op==='circle'?'r':'ry'));
  top=Math.min(top,y+local-padding);
 }
 return top;
}
describe('actual authored duck silhouettes',()=>{
 for(const kind of ['net','banner','frond','line'] as const)it(`${kind}: every 120Hz safe entry/recovery sample, every outfit, clears the rendered beam`,()=>{
  const hazard=renderToStaticMarkup(<RunHazard kind={kind}/>);
  const paths=[...hazard.matchAll(/<path\b[^>]*>/g)].map(m=>m[0]);
  const beam=paths.find(t=>attr(t,'d')?.startsWith('M4 27L12'))!;
  const highlight=paths.find(t=>attr(t,'d')==='M4 27H96M12 101H88')!;
  const beamBottom=Math.max(...pathYs(attr(beam,'d')!),...pathYs(attr(highlight,'d')!))+2.5;
  const clearance=(180-beamBottom)*129.6/180;
  const s=createRun(runLevels[0],42),row={...s.rows[0],kind,lane:1,second:-1,third:false,surface:'sand' as const};
  const seen=new Set<number>();
  for(let sample=0;sample<72;sample++){
   const state={...s,duck:SLIDE_SECONDS-sample/120,elevation:DUCK_MAX_ELEVATION-1e-6};
   if(!rowSafe(state,row))continue;
   const frame=runnerFrame(state);seen.add(frame);
   for(const hat of hats){
    const top=artTop(renderToStaticMarkup(<RunnerFrameArt frame={frame} look={{...defaultLook,hat}}/>));
    expect(130-top+state.elevation*85).toBeLessThan(clearance);
   }
  }
  expect([...seen].sort()).toEqual([11,12,13]);
 }, 30000);
});
