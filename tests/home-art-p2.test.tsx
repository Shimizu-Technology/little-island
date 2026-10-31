import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe,it,expect,vi } from 'vitest';
import { LivingArt, LivingShape, livingIds } from '../src/home/art/LivingArt';
import { HandProp } from '../src/home/art/PropShape';
import { DispenserFanArt } from '../src/home/art/DispenserFanArt';
import { holdableIds, foodIds, drinkIds, toyIds, dispenserChoices, dispenserFan } from '../src/home/art/living';
import { Islander } from '../src/islander/rig/Islander';
import { capabilityOf, type ItemVisualState } from '../src/home/world';
import { moreCatalog } from '../src/home/catalogMore';
import { defaultLook } from '../src/islander/look';
import { starterHome } from '../src/home/model';
import { itemSize, itemPoint } from '../src/home/geometry';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
describe('Phase 2 living art contract',()=>{
 it('declares free reusable holdables and all tap reactions',()=>{
  for(const id of holdableIds) {expect(moreCatalog[id].free).toBe(true);expect(moreCatalog[id].badge).toBeUndefined();expect(capabilityOf(id).holdable).toBe(true);}
  for(const id of foodIds) expect(capabilityOf(id).edible).toBe('food');
  for(const id of drinkIds) expect(capabilityOf(id).edible).toBe('drink');
  for(const id of toyIds) expect(capabilityOf(id).edible).toBeUndefined();
  for(const [id,toggle] of [['floor-lamp','light'],['table-lamp','light'],['sink-counter','water'],['tv','power'],['radio','power'],['fridge','open']]) {
   expect(capabilityOf(id).toggle).toBe(toggle);
   expect(render(<LivingArt id={id} state={{on:true}}/>)).not.toBe(render(<LivingArt id={id} state={{on:false}}/>));
  }
 });
 it('shows empty drinks without changing their identity or removing the straw',()=>{
  for(const id of drinkIds) {
   const full=render(<LivingArt id={id}/>), empty=render(<LivingArt id={id} state={{empty:true}}/>);
   expect(full).not.toBe(empty);expect(empty).toContain('<path');
   expect(render(<Islander pose="drink" held={<HandProp id={id} state={{empty:true}}/>}/>)).not.toMatch(/NaN|Infinity/);
  }
 });
 it('keeps water and music feedback visible under Reduce Motion',()=>{
  expect(render(<LivingArt id="sink-counter" state={{on:true}} reduced/>)).toContain('data-water="running"');
  expect(render(<LivingArt id="radio" state={{on:true}} reduced/>)).toContain('data-notes="static"');
 });
 it('only offers the fridge fan when open and never consumes stock',()=>{
  expect(dispenserChoices('fridge')).toEqual([]);
  expect(dispenserChoices('fridge',{on:true})).toEqual(['mango','banana','juice','rice-ball']);
  expect(dispenserChoices('fruit-bowl')).toEqual(['mango','banana','coconut-drink']);
  const before=dispenserChoices('fridge',{on:true});dispenserFan('fridge',{on:true});expect(dispenserChoices('fridge',{on:true})).toEqual(before);
  for(const id of ['fridge','fruit-bowl']) for(const slot of dispenserFan(id,{on:true})) {expect(slot.size).toBeGreaterThanOrEqual(44);expect(Math.abs(slot.x)+24).toBeLessThanOrEqual(112);expect(slot.y-24).toBeGreaterThanOrEqual(-120);}
 });
 it('starts a fresh kitchen with fridge, sink and reusable fruit bowl',()=>{
  const items=starterHome().rooms.kitchen.instances;
  expect(items.map(i=>i.item)).toEqual(expect.arrayContaining(['fridge','sink-counter','fruit-bowl','stove']));
  expect(items.find(i=>i.item==='fruit-bowl')?.on).toBe('starter-kitchen-table');
 });
 it('generates the reproducible state and held-node gallery',()=>{
  let cards='';
  const add=(id:string,label:string,svg:string)=>{cards+=`<article data-item="${id}"><h2>${id} · ${label}</h2>${svg}</article>`;};
  for(const id of livingIds) for(const [label,state] of [['rest',{}],['on',{on:true}],...(drinkIds.includes(id as typeof drinkIds[number])?[['empty',{empty:true}]]:[])] as [string,ItemVisualState][]) {
   add(id,label,render(<LivingArt id={id} size={240} state={state}/>));
  }
  for(const id of holdableIds) add(`${id}-scale`,'224-unit rig and catalog-size room prop',`<div class="scale">${render(<Islander size={224}/>)}${render(<LivingArt id={id} size={itemSize({id:'fixture',state:'rest',item:id,x:0,y:0,rotation:0,mirrored:false,layer:'furniture'})}/>)}</div>`);
  for(const id of holdableIds) for(const pose of ['hold',...(foodIds.includes(id as typeof foodIds[number])?['eat']:drinkIds.includes(id as typeof drinkIds[number])?['drink']:[])]) {
   for(const longHair of [false,true]) add(`held-${id}`,`${pose} · ${longHair?'long hair':'default'}`,render(<Islander size={224} pose={pose} look={longHair?{...defaultLook,hairStyle:'long-wavy',outfit:'sundress'}:defaultLook} held={<HandProp id={id}/>}/>));
   if(drinkIds.includes(id as typeof drinkIds[number])) add(`held-${id}`,`${pose} · empty`,render(<Islander size={224} pose={pose} held={<HandProp id={id} state={{empty:true}}/>}/>));
  }
  for(const id of ['radio','sink-counter']) add(`${id}-reduced`,'on · Reduce Motion',render(<LivingArt id={id} size={240} state={{on:true}} reduced/>));
  add('fridge-fan','closed',render(<DispenserFanArt item="fridge"/>));add('fridge-fan','open',render(<DispenserFanArt item="fridge" state={{on:true}}/>));add('bowl-fan','always available',render(<DispenserFanArt item="fruit-bowl"/>));
  // A room-scale kitchen fixture uses the production catalog sizes; no screenshot-only scaling.
  const kitchen=starterHome().rooms.kitchen.instances.map(i=>({id:i.item,size:itemSize(i)}));
  add('kitchen','fresh room fixtures',`<div class="kitchen">${kitchen.filter(i=>livingIds.includes(i.id as typeof livingIds[number])).map(i=>render(<LivingArt id={i.id} size={i.size} state={{on:true}}/>)).join('')}</div>`);
  const roomItems=starterHome().rooms.kitchen.instances, table=roomItems.find(i=>i.item==='kitchen-table')!, bowl=roomItems.find(i=>i.item==='fruit-bowl')!;
  const tablePoint=itemPoint(table,roomItems), origin={x:tablePoint.x-150,y:tablePoint.y-220};
  add('table-bowl-contact','engine surface and item anchors',render(<svg width={320} height={280} viewBox="0 0 320 280">{[table,bowl].map(item=>{const p=itemPoint(item,roomItems),size=itemSize(item);return <g key={item.id} transform={`translate(${p.x-origin.x-size/2} ${p.y-origin.y-size*.85}) scale(${size/150})`}><LivingShape id={item.item}/></g>;})}</svg>));
  expect(cards).not.toMatch(/NaN|Infinity/);
  if(process.env.V24_ART_P2) {mkdirSync(process.env.V24_ART_P2,{recursive:true});writeFileSync(`${process.env.V24_ART_P2}/living-gallery.html`,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Island Home · living props</title><style>*{box-sizing:border-box}body{margin:0;background:#CDE6DF;color:#385451;font:14px system-ui}header{padding:20px}h1{font-size:22px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;padding:12px}article{background:#FFF8E9;border-radius:16px;padding:16px;min-height:300px}article[data-item="kitchen"]{grid-column:1/-1}.scale{display:flex;align-items:end;justify-content:center}.kitchen{display:flex;align-items:end;justify-content:center;flex-wrap:wrap}h2{font-size:16px;margin:0 0 12px}svg{display:block;margin:auto;overflow:visible}</style><header><h1>Living props · all states and held nodes</h1><p>Original art; full/empty, toggles, hand attachments, unlimited dispensers.</p></header><main>${cards}</main>`);}
 });
});
