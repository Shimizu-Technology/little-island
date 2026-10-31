import React from 'react';
import { it, expect, vi } from 'vitest';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { RoomArt, SkyArt, ShoreArt } from '../src/home/art/Room';
import { RoomShellArt, MoreItemArt } from '../src/home/art/More';
import { ItemArt } from '../src/home/art/Items';
import { roomDefaultTheme } from '../src/home/art/roomDefaults';
import { moreCatalog } from '../src/home/catalogMore';
import { catalog } from '../src/home/catalog';
import { Islander } from '../src/islander/rig/Islander';
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:React.ElementType)=>({animatedProps:_a,...props}:Record<string,unknown>)=>React.createElement(c,{...props,'data-animated':true})},useSharedValue:(value:number)=>({value}),useAnimatedProps:()=>({}),cancelAnimation:()=>{},withRepeat:()=>0,withSequence:()=>0,withTiming:()=>0,Easing:{inOut:()=>0,sin:0}}));
vi.mock('react-native-svg',()=>Object.fromEntries(Object.entries({default:'svg',G:'g',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Path:'path',Defs:'defs',ClipPath:'clipPath',Pattern:'pattern',Text:'text',LinearGradient:'linearGradient',Stop:'stop',Filter:'filter',FeColorMatrix:'feColorMatrix'}).map(([name,tag])=>[name,({children,accessible:_a,...props}:Record<string,unknown>)=>React.createElement(tag,props,children as React.ReactNode)])));
vi.mock('../src/arcade/Art',()=>({StickerArt:()=>null}));
vi.mock('../src/badges/BadgeArt',()=>({BadgeGlyph:()=>null}));
const furniture: Record<'home'|'kitchen'|'treehouse'|'beach',readonly (readonly [string,number,number,number])[]> = {
  home:[['sofa',220,482,235],['side-table',421,486,140],['teapot',421,410,72],['round-rug',397,526,235],['floor-lamp',665,477,170],['bookcase',706,475,178],['toy-box',88,519,124],['teddy',530,525,77],['potted-fern',544,474,83]],
  kitchen:[['fridge',85,485,270],['sink-counter',305,480,190],['stove',664,482,205],['kitchen-table',478,511,208],['fruit-bowl',481,435,80],['cake-stand',563,444,91],['stool',626,528,122],['flower-vase',205,468,90]],
  treehouse:[['hammock',257,485,246],['banana-plant',86,479,177],['desk',551,502,205],['guitar',687,513,142],['floor-cushion',401,521,150],['round-rug',415,532,242],['table-lamp',550,415,88],['teddy',332,520,91]],
  beach:[['sofa',385,488,239],['surfboard',80,457,186],['lantern',664,468,125],['shell-pile',602,529,84],['round-rug',392,532,248],['side-table',590,494,138],['fruit-bowl',590,426,72],['banana-plant',735,465,155]],
};
it('keeps every item art and the four furnished rooms renderable',()=>{
  const ids=[...Object.keys(catalog),...Object.keys(moreCatalog)];
  expect(ids).toHaveLength(80);
  for(const id of ids) expect(render(id in moreCatalog?<MoreItemArt id={id}/>:<ItemArt item={id as keyof typeof catalog}/>)).toContain('<svg');
  expect(render(<MoreItemArt id="sofa" active animated/>)).not.toBe(render(<MoreItemArt id="sofa" active animated reduced/>));
  expect(render(<ItemArt item="aquarium" active animated/>)).not.toBe(render(<ItemArt item="aquarium" active animated reduced/>));
  expect(render(<RoomArt theme={roomDefaultTheme.home}/>)).toContain('viewBox="0 0 800 560"');
  for(const room of ['kitchen','treehouse','beach'] as const) expect(render(<RoomShellArt room={room} theme={roomDefaultTheme[room]}/>)).toContain('viewBox="0 0 800 560"');
  const dir=process.env.HOME_V22_EVIDENCE;if(!dir)return;
  const style='<style>body{margin:0;background:#f9f1e5;color:#3c524d;font:14px system-ui}h1{font-size:18px;margin:8px}h2{font-size:15px;margin:8px}.scene{position:relative;width:800px;height:560px;overflow:hidden;transform-origin:top left;transform:scale(var(--scale,1))}.viewport{overflow:hidden;height:var(--height,560px)}.scene>svg{position:absolute;inset:0;width:100%;height:100%}.item{position:absolute}.item svg{width:100%;height:100%}.reference{display:block;width:100%;height:auto}.label{padding:5px;background:#f5e9d1}</style>';
  for(const width of [390,1024])for(const room of ['home','kitchen','treehouse','beach'] as const){
    const shell=room==='home'?render(<RoomArt theme={roomDefaultTheme.home}/>):render(<RoomShellArt room={room} theme={roomDefaultTheme[room]}/>);
    const items=furniture[room].map(([id,x,y,size])=>`<div class="item" style="left:${(x-size/2)/8}%;top:${(y-size*.85)/5.6}%;width:${size/8}%;height:${size/5.6}%">${render(id in moreCatalog?<MoreItemArt id={id} size={size}/>:<ItemArt item={id as keyof typeof catalog} size={size}/>)}</div>`).join('');
    const islander=`<div class="item" style="left:58%;top:45%;width:28%;height:40%">${render(<Islander size={224}/>)}</div>`;
    const refs:{[key:string]:string}={home:'toca-6.jpg',kitchen:'toca-5.jpg',treehouse:'toca-7.jpg',beach:'toca-1.jpg'};
    const ref=`${process.env.HOME_V22_REFS ?? "./references"}/${refs[room]}`;
    writeFileSync(`${dir}/${room}-${width}.html`,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${style}<main style="width:${width}px"><div class="label">Little Island · ${room} · ${width}px</div><div class="viewport" style="--height:${width===390?600:717}px"><div class="scene" style="--scale:${width===390?1.07:1.28};margin-left:${width===390?-235:0}px">${shell}${items}${islander}</div></div><div class="label">Reference (internal study only)</div><img class="reference" src="file://${ref}"></main>`);
  }
  let sheet=`<!doctype html><meta charset="utf-8">${style}<style>.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.tile{background:#fffaf1;padding:5px;border-radius:7px}.tile svg{display:block;margin:auto}.tile small{display:block;white-space:nowrap;overflow:hidden}</style><h1>All 63 items · original, coral and lagoon · 120 px</h1>`;
  for(const tint of ['original','coral','lagoon'] as const){sheet+=`<h2>${tint}</h2><div class="grid">`;for(const id of ids)sheet+=`<div class="tile"><small>${id}</small>${render(id in moreCatalog?<MoreItemArt id={id} size={120} tint={tint}/>:<ItemArt item={id as keyof typeof catalog} size={120} tint={tint}/>)}</div>`;sheet+='</div>';}
  writeFileSync(`${dir}/all-items-120.html`,sheet);
  writeFileSync(`${dir}/outdoors.html`,`<!doctype html><meta charset="utf-8">${style}<main style="width:390px">${render(<SkyArt/>)}${render(<ShoreArt/>)}</main>`);
}, 30000);
