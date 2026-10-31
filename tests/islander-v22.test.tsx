import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Islander } from '../src/islander/rig/Islander';
import { backPoses, frontPoses } from '../src/islander/rig/poses';
import { buildFor, builds, defaultLook, hairStyles, hats, isValidLook, normalizeLook, presentationPresets, shoeColors, shoes, type IslanderLook } from '../src/islander/look';
import { canWear, selectedValue, styleCatalog } from '../src/personalization/catalog';
import { wardrobe } from '../src/islander/rig/wardrobe';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
const art=(look:IslanderLook,pose=frontPoses[0])=>renderToStaticMarkup(<Islander look={look} pose={pose} view={pose.view}/>);
describe('Islander 2.2 compatibility and art',()=>{
 it('leaves legacy saves unchanged while strictly validating the three new optional fields',()=>{
  expect(normalizeLook(defaultLook)).toEqual(defaultLook);
  for(const key of ['build','shoes','shoeColor'] as const) {
   expect(isValidLook({...defaultLook,[key]:undefined})).toBe(false);
   expect(normalizeLook({...defaultLook,[key]:'invalid'})).toEqual(defaultLook);
  }
  const selected=Object.freeze({...defaultLook,build:'girl' as const,shoes:'rain-boots' as const,shoeColor:'lilac' as const});
  expect(isValidLook(selected)).toBe(true);expect(normalizeLook(selected)).toEqual(selected);
 });
 it('provides distinct editable presentation defaults without constraining clothes or build',()=>{
  for(const preset of Object.values(presentationPresets)) expect(isValidLook({...defaultLook,...preset})).toBe(true);
  expect(presentationPresets.boy.lashes).toBe('none');expect(presentationPresets.girl.lashes).toBe('lashes');
  expect(buildFor({...defaultLook,presentation:'boy'})).toBe('boy');
  expect(buildFor({...defaultLook,presentation:'girl',build:'neutral'})).toBe('neutral');
  const cross={...defaultLook,...presentationPresets.girl,build:'boy' as const,outfit:'polo-shorts' as const};
  expect(isValidLook(cross)).toBe(true);expect(canWear(cross,[])).toBe(true);
  expect(new Set(builds.map(build=>art({...defaultLook,build})) ).size).toBe(3);
 });
 it('registers all new slots as free starter items and selects sensible defaults for old looks',()=>{
  for(const [category,values] of [['build',builds],['shoes',shoes],['shoeColor',Object.keys(shoeColors)]] as const) for(const value of values) {
   expect(styleCatalog.find(i=>i.category===category&&i.value===value)?.starter).toBe(true);
   expect(canWear({...defaultLook,[category]:value},[])).toBe(true);
  }
  expect(selectedValue(defaultLook,'build')).toBe('neutral');
  expect(selectedValue(defaultLook,'shoes')).toBe('sneakers');expect(selectedValue(defaultLook,'shoeColor')).toBe('cream');
  for(const id of shoes) expect(wardrobe.find(i=>i.slot==='shoes'&&i.id===id)?.anchors).toEqual(['leftFoot','rightFoot']);
 });
 it('keeps independent shoe colors and five visibly distinct shoe geometries across every frame',()=>{
  const geometry=new Set<string>();
  for(const shoe of shoes) {
   const markup=art({...defaultLook,shoes:shoe,shoeColor:'lilac'});
   expect(markup).toContain(shoeColors.lilac);expect([...markup.matchAll(/data-shoe=/g)]).toHaveLength(2);
   geometry.add(markup.replaceAll(`data-shoe="${shoe}"`,''));
   for(const pose of [...frontPoses,...backPoses]) expect(art({...defaultLook,shoes:shoe},pose)).not.toMatch(/NaN|Infinity|undefined/);
  }
  expect(geometry.size).toBe(5);
 },30000);
 it('renders fourteen distinct front and back hairstyles, and tucks them under hats in roll frames',()=>{
  expect(hairStyles).toHaveLength(14);
  for(const pose of [frontPoses[0],backPoses[4]]) {
   const styles=hairStyles.map(hairStyle=>art({...defaultLook,hairStyle},pose).replaceAll(hairStyle,''));
   expect(new Set(styles).size).toBe(hairStyles.length);
  }
  for(const hairStyle of hairStyles) for(const hat of hats) for(const frame of [11,12,13]) {
   const markup=art({...defaultLook,hairStyle,hat},backPoses[frame]);
   expect(markup).not.toMatch(/NaN|Infinity|undefined/);expect(markup).toContain('data-back-hair');
  }
 },30000);
 it('authors wink and star eyes for dance while keeping the five base expressions',()=>{
  const expressions=frontPoses.map(p=>art(defaultLook,p).match(/data-expression="([^"]+)"/)![1]);
  expect(new Set(expressions)).toEqual(new Set(['happy','proud','thinking','focused','surprised','wink','star-eyes','sleepy','yum']));
  const boy=art({...defaultLook,...presentationPresets.boy}), girl=art({...defaultLook,...presentationPresets.girl});
  expect(boy).not.toContain('M-12 7l-3-2M12 7l3-2');expect(girl).toContain('M-12 7l-3-2M12 7l3-2');
 });
});
