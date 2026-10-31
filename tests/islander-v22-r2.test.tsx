import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Islander } from '../src/islander/rig/Islander';
import { frontPoses, backPoses } from '../src/islander/rig/poses';
import { defaultLook, outfitDefaults, outfits, hairStyles } from '../src/islander/look';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
describe('round 2 art contracts',()=>{
 it('keeps idle hands down beside the torso rather than folded onto the hips',()=>{
  for(const pose of frontPoses.slice(0,2)) for(const side of ['left','right'] as const) {
   const hand=pose.joints[`${side}Hand`], shoulder=pose.joints[`${side}Shoulder`];
   expect(hand[1]-shoulder[1]).toBeGreaterThan(30);
   expect(side==='left'?hand[0]<shoulder[0]:hand[0]>shoulder[0]).toBe(true);
  }
 });
 it('varies outfit defaults while honoring explicit saved palettes',()=>{
  expect(new Set(outfits.map(o=>outfitDefaults[o].primary)).size).toBeGreaterThan(12);
  for(const outfit of outfits) {
   const look={...defaultLook,outfit,top:'tee' as const,bottom:'shorts' as const};
   expect(renderToStaticMarkup(<Islander look={look}/>)).toContain(outfitDefaults[outfit].primary);
   expect(renderToStaticMarkup(<Islander look={{...look,palette:'royal'}}/>)).toContain('#7859A0');
  }
 });
 it('keeps all hair geometry finite in every run, jump and compact frame',()=>{
  for(const hairStyle of hairStyles) for(const pose of backPoses) {
   const svg=renderToStaticMarkup(<Islander look={{...defaultLook,hairStyle}} pose={pose} view="back"/>);
   expect(svg).not.toMatch(/NaN|Infinity|undefined/);
  }
 });
});
