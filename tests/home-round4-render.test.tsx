import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {describe,it,expect,vi} from 'vitest';
import {Islander} from '../src/islander/rig/Islander';
import {homeCharacterPose} from '../src/home/characterPose';
import {CrabFriend} from '../src/home/art/CrabFriend';
import {defaultLook} from '../src/islander/look';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
describe('native pose retention regression',()=>{
 it.each([false,true])('stand after lie/asleep equals a fresh stand, including transforms, viewport and clip (Reduce Motion %s)',async reduced=>{
  let subject!:ReactTestRenderer,fresh!:ReactTestRenderer;
  const rig=(pose:string)=><Islander pose={pose} size={224} reduced={reduced} look={{...defaultLook,hat:'sunhat',hairStyle:'long-wavy'}} held={<rect data-held="teddy" width={24} height={24}/>}/>;
  await act(()=>{subject=create(rig('idle'));fresh=create(rig('idle'));});
  for(const lying of ['lie','lie-asleep']){
   await act(()=>subject.update(rig(lying)));
   const oldSvg=subject.root.findByType('svg');
   expect(oldSvg.props.viewBox).toBe('0 0 144 92');
   expect(subject.root.findAllByType('g')[0].props.transform).toContain('rotate(-90)');
   // Include the stale sleep notification that can race a reducer's floor result.
   await act(()=>subject.update(rig(homeCharacterPose('stand','lie-asleep'))));
   expect(subject.root.findByType('svg')).not.toBe(oldSvg);
   expect(subject.toJSON()).toEqual(fresh.toJSON());
   const svg=subject.root.findByType('svg');
   expect(svg.props.viewBox).toBe('0 0 80 132');expect(svg.props.height).toBe(224);expect(svg.props.width).toBe(80*224/132);
   expect(subject.root.findAllByType('g')[0].props.transform).toBe('translate(0 0) rotate(0) scale(1 1)');
   expect(subject.root.findAll(n=>n.props['data-limb']?.endsWith('-leg'))).toHaveLength(2);
   expect(subject.root.findAll(n=>n.props.clipPath||n.type==='clipPath')).toHaveLength(0);
   expect(subject.root.findAll(n=>n.props['data-held']==='teddy')).toHaveLength(1);
  }
  await act(()=>{subject.unmount();fresh.unmount();});
 });
 it('also clears the crab lying/mirroring transforms when standing again',async()=>{
  let subject!:ReactTestRenderer,fresh!:ReactTestRenderer;
  await act(()=>{subject=create(<CrabFriend pose="lie" mirrored/>);fresh=create(<CrabFriend pose="stand"/>);});
  await act(()=>subject.update(<CrabFriend pose="stand"/>));
  expect(subject.toJSON()).toEqual(fresh.toJSON());
  expect(subject.root.findAllByType('g').slice(0,2).map(g=>g.props.transform)).toEqual(['translate(0 0) rotate(0) scale(1 1)','translate(0 0) rotate(0) scale(1 1)']);
  await act(()=>{subject.unmount();fresh.unmount();});
 });
 it('does not let an old sleep reaction change any non-lying pose box',()=>{
  for(const pose of ['stand','sit','bathe'] as const)expect(homeCharacterPose(pose,'lie-asleep')).toBe(homeCharacterPose(pose));
  expect(homeCharacterPose('lie','lie-asleep')).toBe('lie-asleep');
 });
});
