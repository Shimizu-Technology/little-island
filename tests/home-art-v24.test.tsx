import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { Islander } from '../src/islander/rig/Islander';
import { frontPoses, poseBox, resolvePose } from '../src/islander/rig/poses';
import { accessories, defaultLook, hairStyles, hats, outfits } from '../src/islander/look';
import { SocketGallery } from '../src/home/art/SocketGallery';
import { CrabFriend } from '../src/home/art/CrabFriend';
import { seatSockets } from '../src/home/art/sockets';
import { capabilityOf } from '../src/home/world';
import { visualBox } from '../src/home/art/visualBox';
import { itemIds, itemSpec } from '../src/home/catalog';
import { itemSize } from '../src/home/geometry';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
const ids = ['lie','lie-asleep','bathe','sit-front','sit-side','hold','eat','drink'];
describe('2.4 art and socket contract',()=>{
 it('renders every wardrobe layer in each pose with finite joints and a stable complete lying transform',()=>{
  const looks = [...outfits.map(outfit=>({...defaultLook,outfit})), ...hairStyles.map(hairStyle=>({...defaultLook,hairStyle})), ...hats.map(hat=>({...defaultLook,hat})), ...accessories.map(accessory=>({...defaultLook,accessory}))];
  for(const id of ids) for(const look of looks) {
   const pose = resolvePose('front',id), svg = renderToStaticMarkup(<Islander pose={id} look={look} held={<rect data-held="test" width={24} height={24}/>}/>);
   expect(svg).not.toMatch(/NaN|Infinity|undefined/);
   expect(Object.values(pose.joints).flat().every(Number.isFinite)).toBe(true);
   expect(svg.indexOf('data-layer="held"')).toBeLessThan(svg.indexOf('data-layer="hands"'));
   if (['hold','eat','drink'].includes(id)) expect(svg).toContain(`translate(${pose.joints.rightHand[0]-12} ${pose.joints.rightHand[1]-12})`);
   if(id.startsWith('lie')) { expect(svg).toContain('viewBox="0 0 144 92"'); expect(svg).toContain('translate(6 86) rotate(-90)'); expect(poseBox(pose).anchor).toEqual([44,46]); }
  }
  if(process.env.V24_ART_GALLERY) {
   mkdirSync(process.env.V24_ART_GALLERY,{recursive:true});
   writeFileSync(`${process.env.V24_ART_GALLERY}/wardrobe.html`, '<!doctype html><meta charset="utf-8"><title>Wardrobe bounds</title>' + ids.flatMap(id=>looks.map(look=>`<div data-pose="${id}">${renderToStaticMarkup(<Islander pose={id} look={look}/>)}</div>`)).join(''));
  }
  expect(frontPoses[0].id).toBe('idle');
 });
 it('hides sleep marks for Reduce Motion without changing the pose',()=>{
  expect(renderToStaticMarkup(<Islander pose="lie-asleep" reduced/>)).not.toContain('<text');
  expect(renderToStaticMarkup(<Islander pose="lie-asleep"/>)).toContain('>z<');
 });
 it('publishes unique normalised sockets for all catalog seats, including both bunk levels',()=>{
  for(const [id,sockets] of Object.entries(seatSockets)) {
   expect(itemSpec(id)).toBeTruthy();
   expect(capabilityOf(id).sockets).toEqual(sockets);
   expect(new Set(sockets.map(s=>s.id)).size).toBe(sockets.length);
   for(const s of sockets) expect(s.at.every(v=>v>=0&&v<=1)).toBe(true);
  }
  expect(seatSockets['bunk-bed'].map(s=>s.id)).toEqual(['lower','upper']);
 });
 it('matches the actual engine square for every catalog item in both facing orientations',()=>{
  for(const item of itemIds) for(const rotation of [0,180] as const) for(const mirrored of [false,true]) {
   const size = itemSize({id:'fixture',state:'rest',item,x:0,y:0,rotation,mirrored,layer:itemSpec(item).layer});
   expect(visualBox(item,rotation,mirrored)).toEqual({left:-size/2,top:-size*.85,width:size,height:size});
  }
 });
 it('exports the actual layered gallery for web visual QA when requested',()=>{
  let cards='';
  const looks = [defaultLook, {...defaultLook,outfit:'sundress' as const,hairStyle:'long-wavy' as const}, {...defaultLook,outfit:'hoodie' as const,hairStyle:'braids' as const,hat:'sunhat' as const}];
  for(const id of Object.keys(seatSockets).filter(id=>!['cloud-bed','shelf','rug'].includes(id))) for(let index=0;index<seatSockets[id].length;index++) for(const [l,look] of looks.entries()) for(const mirrored of [false,true]) {
   const size=itemSize({id:'fixture',state:'rest',item:id,x:0,y:0,rotation:0,mirrored:false,layer:'furniture'});
   cards+=`<article data-item="${id}"><h2>${id} · ${seatSockets[id][index].id}</h2><p>Look ${l+1} · ${mirrored?'right':'left'}</p>${renderToStaticMarkup(<SocketGallery id={id} index={index} mirrored={mirrored} look={look} size={size}/>)}</article>`;
  }
  for(const pose of ['stand','sit','lie','held'] as const) cards+=`<article><h2>Crab · ${pose}</h2>${renderToStaticMarkup(<CrabFriend pose={pose}/>)}</article>`;
  for(const pose of ids) cards+=`<article><h2>${pose}</h2>${renderToStaticMarkup(<Islander pose={pose} held={['hold','eat','drink'].includes(pose)?<circle cx={12} cy={12} r={7} fill="#E9C475"/>:undefined}/>)}</article>`;
  if(process.env.V24_ART_GALLERY) {
   mkdirSync(process.env.V24_ART_GALLERY,{recursive:true});
   writeFileSync(`${process.env.V24_ART_GALLERY}/art-gallery.html`,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Island Home art gallery</title><style>*{box-sizing:border-box}body{margin:0;background:#CDE6DF;color:#385451;font:14px system-ui}header{padding:20px}h1{font-size:22px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;padding:12px}article{background:#FFF8E9;border-radius:16px;padding:16px;min-height:450px;overflow:visible}h2{font-size:16px;margin:0}p{margin:4px 0 12px}svg{display:block;margin:auto;overflow:visible}</style><header><h1>Island Home · art sockets</h1><p>224-unit Islander; catalog furniture scale. Back → wardrobe rig → front. Both facings, three looks.</p></header><main>${cards}</main>`);
  }
  expect(cards).not.toMatch(/NaN|Infinity/);
 });
});
