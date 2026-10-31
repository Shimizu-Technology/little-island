import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Islander } from '../src/islander/rig/Islander';
import { defaultLook, hairStyles, outfits, tops, bottoms, brows, lashes, freckles, cheeks, type IslanderLook } from '../src/islander/look';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
const newHair = hairStyles.slice(4);
const newOutfits = outfits.slice(7,15);
const poses = [{view:'front' as const,pose:'idle'},{view:'front' as const,pose:'sit-relaxed'},{view:'front' as const,pose:'desk-write'},{view:'front' as const,pose:'dance-1'},...([0,4,8,12] as const).map(pose=>({view:'back' as const,pose}))];
function cell(label:string,look:IslanderLook,view:'front'|'back',pose:string|number){return `<div class="cell">${renderToStaticMarkup(<Islander look={look} view={view} pose={pose} size={120}/>)}<small>${label}</small></div>`;}
function page(title:string,cells:string){return `<!doctype html><html><meta charset="utf-8"><style>body{font:14px system-ui;color:#493946;background:#fffaf2;margin:16px}h1{font-size:23px}main{display:grid;grid-template-columns:repeat(6,150px);gap:8px}.cell{text-align:center;background:#f0eadd;border-radius:12px;padding:8px;min-height:150px}svg{display:block;margin:auto}small{display:block;font-size:11px;margin-top:4px}</style><h1>${title}</h1><main>${cells}</main></html>`;}
it('renders the complete new look contact matrix',()=>{
 const hair = newHair.flatMap(hairStyle=>['none','cap','sunhat'].flatMap(hat=>['front','back'].map(view=>cell(`${hairStyle} · ${hat} · ${view}`,{...defaultLook,hairStyle,hat:hat as IslanderLook['hat']},view as 'front'|'back',view==='back'?0:'idle')))).join('');
 const clothing = newOutfits.flatMap(outfit=>poses.map(({view,pose})=>cell(`${outfit} · ${view} ${pose}`,{...defaultLook,outfit},view,pose))).join('');
 const mix = tops.flatMap(top=>bottoms.map(bottom=>poses.map(({view,pose})=>cell(`${top} + ${bottom} · ${view} ${pose}`,{...defaultLook,outfit:'mix',top,bottom},view,pose)).join(''))).join('');
 const face = [...brows.map(b=>({label:`brows ${b}`,look:{...defaultLook,brows:b}})),...lashes.map(l=>({label:`lashes ${l}`,look:{...defaultLook,lashes:l}})),...freckles.map(f=>({label:`freckles ${f}`,look:{...defaultLook,freckles:f}})),...cheeks.map(c=>({label:`cheeks ${c}`,look:{...defaultLook,cheeks:c}}))].map(({label,look})=>cell(label,look,'front','idle')).join('');
 for(const html of [hair,clothing,mix,face]) expect(html).not.toMatch(/NaN|undefined|Infinity/);
 const dir=process.env.V21_CONTACT_DIR;if(dir){mkdirSync(dir,{recursive:true});for(const [name,content] of Object.entries({hair,clothing,mix,face}))writeFileSync(`${dir}/${name}.html`,page(`Little Island 2.1 · ${name}`,content));}
},180000);

it('keeps new identity choices free and rejects incomplete restored mixes',async()=>{
 const { canWear } = await import('../src/personalization/catalog');
 const { starterPerson, validPerson } = await import('../src/personalization/model');
 for(const presentation of ['boy','girl','me'] as const){
  const look={...defaultLook,presentation,outfit:'mix' as const,top:'aloha' as const,bottom:'cargo-shorts' as const,brows:'arched' as const,lashes:'lashes' as const,freckles:'freckles' as const,cheeks:'rosy' as const,hairStyle:'afro-puffs' as const,hairColor:'mint' as const};
  expect(canWear(look,[])).toBe(true);
  expect(validPerson({...starterPerson(),look})).toBe(true);
  expect(validPerson({...starterPerson(),look:{...look,bottom:undefined}})).toBe(false);
 }
});

it('renders each new hair and every mix pair on the shared front and back pose rig',async()=>{
 const { frontPoses, backPoses } = await import('../src/islander/rig/poses');
 for(const hairStyle of newHair) for(const pose of [...frontPoses,...backPoses]){
  const html=renderToStaticMarkup(<Islander look={{...defaultLook,hairStyle}} view={pose.view} pose={pose}/>);
  expect(html).not.toMatch(/NaN|undefined|Infinity/);
 }
 for(const top of tops) for(const bottom of bottoms) for(const pose of [...frontPoses,...backPoses]){
  const html=renderToStaticMarkup(<Islander look={{...defaultLook,outfit:'mix',top,bottom}} view={pose.view} pose={pose}/>);
  expect(html).not.toMatch(/NaN|undefined|Infinity/);
 }
},180000);


it('keeps mixed garments independent and thumbnails truthful', async () => {
 const { lookWithStyle, canWear } = await import('../src/personalization/catalog');
 const look = lookWithStyle(defaultLook, {category:'top',value:'hoodie-top'});
 expect(look).toMatchObject({outfit:'mix',top:'hoodie-top',bottom:'shorts'});
 const html = renderToStaticMarkup(<Islander look={look}/>);
 expect([...html.matchAll(/data-garment="shorts"/g)]).toHaveLength(2);
 expect(renderToStaticMarkup(<Islander look={lookWithStyle(look,{category:'bottom',value:'skirt'})}/>)).toContain('data-garment="separate-skirt"');
 expect(canWear({} as IslanderLook,[])).toBe(false);
});

it('round-trips expanded looks through the real save parser and preserves rejected raw data', async () => {
 const { emptySave, parseSave } = await import('../src/state/validation');
 const { initializePersonalization } = await import('../src/personalization/model');
 const save = initializePersonalization(emptySave());
 const person = save.personalization!.people.family;
 person.look = {...defaultLook,presentation:'girl',hairStyle:'long-straight',hairColor:'sky-blue',brows:'bold',lashes:'lashes',freckles:'freckles',cheeks:'rosy',outfit:'mix',top:'hoodie-top',bottom:'cargo-shorts'};
 expect(parseSave(JSON.stringify(save))).toEqual(save);
 for(const bad of [{...person.look,bottom:undefined},{...person.look,top:'unlisted'},{...person.look,presentation:'unknown'},{...person.look,hat:'bookworm-beanie'}]) {
  const raw = JSON.stringify({...save,personalization:{...save.personalization,people:{family:{...person,look:bad}}}});
  expect(()=>parseSave(raw)).toThrow();
  expect(JSON.parse(raw).personalization.people.family.look).toEqual(JSON.parse(JSON.stringify(bad)));
 }
});
