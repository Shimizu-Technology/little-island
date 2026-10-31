import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { MoreItemArt, RoomShellArt } from '../src/home/art/More';
import { ItemArt } from '../src/home/art/Items';
import { moreCatalog, tintIds, type TintId } from '../src/home/catalogMore';
import { catalog } from '../src/home/catalog';
import { shade } from '../src/home/art/Tint';
import { Islander } from '../src/islander/rig/Islander';
import { defaultLook } from '../src/islander/look';
import { characterPoint, itemPoint, itemSize, seatAnchor } from '../src/home/geometry';
import { instance, type RoomState } from '../src/home/model';
import { SeatFront } from '../src/home/SeatFront';
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useSharedValue:(value:number)=>({value}),useAnimatedProps:()=>({}),cancelAnimation:()=>{},withRepeat:()=>0,withSequence:()=>0,withTiming:()=>0,Easing:{inOut:()=>0,sin:0}}));
vi.mock('react-native-svg', () => {
  const tags = { default: 'svg', Circle: 'circle', Ellipse: 'ellipse', G: 'g', Path: 'path', Rect: 'rect', Defs: 'defs', Filter: 'filter', FeColorMatrix: 'feColorMatrix', ClipPath: 'clipPath', Pattern: 'pattern', Text: 'text', LinearGradient: 'linearGradient', Stop: 'stop' };
  return Object.fromEntries(Object.entries(tags).map(([name, tag]) => [name, ({ children, accessible: _accessible, ...props }: Record<string, unknown>) => React.createElement(tag, props, children as React.ReactNode)]));
});
vi.mock('../src/home/art/Room', () => ({wallColors: {cream:'#F5E6C8', lagoon:'#C5DED3'}, floorColors: {sand:'#EBD7B2', honey:'#DDAE7D'}}));
vi.mock('../src/arcade/Art', () => ({StickerArt: () => null}));
const render = renderToStaticMarkup;
describe('free home art contract', () => {
  it('supplies distinct, tintable art for every free item and each active reaction', () => {
    expect(Object.keys(moreCatalog)).toHaveLength(56);
    const silhouettes = new Set<string>();
    for (const [id, spec] of Object.entries(moreCatalog)) {
      expect(spec.free).toBe(true);
      expect(spec.footprint.every(n => Number.isInteger(n) && n > 0)).toBe(true);
      expect(id in catalog).toBe(false);
      const original = render(<MoreItemArt id={id}/>);
      expect(original).toMatch(/<(path|ellipse|rect)/);
      silhouettes.add(original);
      for (const tint of spec.tintable ? tintIds.slice(1) : []) expect(render(<MoreItemArt id={id} tint={tint}/>)).not.toBe(original);
      if (spec.interactive) expect(render(<MoreItemArt id={id} active/>)).not.toBe(original);
    }
    expect(silhouettes.size).toBe(56);
  }, 30000);
  it('keeps original legacy output by default and tints fabric without repainting wood', () => {
    for (const item of Object.keys(catalog) as (keyof typeof catalog)[]) expect(render(<ItemArt item={item}/>)).toBe(render(<ItemArt item={item} tint="original"/>));
    for (const item of ['bed','chair','rug','beanbag','lamp','toy-box'] as const) {
      const tinted = render(<ItemArt item={item} tint="lagoon"/>);
      expect(tinted).toContain('#58B9B1');
      expect(tinted).not.toBe(render(<ItemArt item={item}/>));
    }
    expect(shade('#000000', .2)).toBe('#333333');
    expect(shade('#FFFFFF', -.2)).toBe('#cccccc');
  });
  it('preserves the room wall, floor polygon and grid exactly and honours earned patterns', () => {
    for (const room of ['kitchen','treehouse','beach'] as const) {
      const svg = render(<RoomShellArt room={room} theme={{wallpaper:'cream',floor:'sand'}}/>);
      expect(svg).toContain('viewBox="0 0 800 560"');
      expect(svg).toContain('M0 352H800V560H0Z');
      expect(svg).toContain('stage-floor-lines');
      expect(render(<RoomShellArt room={room} theme={{wallpaper:'night-sky',floor:'game-room'}}/>)).toContain('url(#night-sky)');
    }
  });
  it('writes the reproducible review sheets when HOME_ART_EVIDENCE is set', () => {
    if (!process.env.HOME_ART_EVIDENCE) return;
    for (const size of [64,120]) {
      let html = '<!doctype html><meta charset="utf-8"><style>body{background:#f7f1e3;color:#385451;font:12px system-ui}section{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:140px;padding:8px;background:#fff9ed;border-radius:12px}figcaption{height:30px}svg{overflow:visible}</style>';
      for (const tint of ['original','coral','lagoon','night'] as TintId[]) {
        html += `<h2>${size}px · ${tint}</h2><section>`;
        for (const id of Object.keys(moreCatalog)) html += `<figure><figcaption>${id}</figcaption>${render(<MoreItemArt id={id} size={size} tint={tint}/>)}</figure>`;
        for (const item of Object.keys(catalog) as (keyof typeof catalog)[]) html += `<figure><figcaption>existing ${item}</figcaption>${render(<ItemArt item={item} size={size} tint={tint}/>)}</figure>`;
        html += '</section>';
      }
      html += '<h2>Active reactions</h2><section>';
      for (const [id,spec] of Object.entries(moreCatalog)) if(spec.interactive) html += `<figure><figcaption>${id}</figcaption>${render(<MoreItemArt id={id} size={size} active/>)}</figure>`;
      html += '</section><h2>Rooms with sample furniture</h2>';
      for(const room of ['kitchen','treehouse','beach'] as const) {
        html += `<h3>${room}</h3><div style="position:relative;width:800px;height:560px">${render(<RoomShellArt room={room} theme={{wallpaper:'cream',floor:'sand'}}/>)}`;
        for (const [id,x,y] of [['sofa',270,310],['side-table',420,360],['potted-fern',440,325]] as const) html+=`<div style="position:absolute;left:${x}px;top:${y}px">${render(<MoreItemArt id={id}/>)}</div>`;
        html+='</div>';
      }
      writeFileSync(`${process.env.HOME_ART_EVIDENCE}/sheet-${size}.html`, html);
    }
  });
  it('renders all 41 at display size beside a standing Islander for visual review', () => {
    if (!process.env.POLISH_EVIDENCE) return;
    let html = '<!doctype html><meta charset="utf-8"><style>body{background:#d7e7dc;color:#284f4b;font:13px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{background:#fff9ee;border-radius:12px;margin:0;padding:8px;min-height:260px}figcaption{font-weight:bold}section{display:flex;align-items:end;justify-content:center;height:240px;gap:8px}svg{flex:none}@media(max-width:600px){main{grid-template-columns:repeat(2,1fr)}}</style><h1>Furniture beside the Islander (163 scene units)</h1><main>';
    const kid = render(<Islander size={163} />);
    for (const [id,spec] of Object.entries(moreCatalog)) html += `<figure><figcaption>${spec.name} · ${spec.itemSize}</figcaption><section>${kid}${render(<MoreItemArt id={id} size={spec.itemSize}/>)}</section></figure>`;
    html += '</main><h1>Aloha print</h1>';
    for (const outfit of ['aloha-shorts','mix'] as const) for (const view of ['front','back'] as const) html += `<figure>${outfit} ${view}<section>${render(<Islander size={163} view={view} pose={view==='front'?'idle':0} look={{...defaultLook,outfit,...(outfit==='mix'?{top:'aloha',bottom:'shorts'}:{})}}/>)}</section></figure>`;
    for (const frame of [0,3,8,11,16,23]) html += `<figure>Run ${frame}<section>${render(<Islander size={163} view="back" pose={frame} look={{...defaultLook,outfit:'aloha-shorts'}}/>)}</section></figure>`;
    writeFileSync(`${process.env.POLISH_EVIDENCE}/scale-and-aloha.html`,html);
  });
  it('renders every seat at its current size and character offset for visual review', () => {
    if (!process.env.POLISH_EVIDENCE) return;
    let html='<!doctype html><meta charset="utf-8"><style>body{background:#d7e7dc;color:#284f4b;font:13px system-ui}main{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}figure{background:#fff9ee;border-radius:12px;margin:0;padding:8px}section{position:relative;height:280px;overflow:hidden}svg{position:absolute}@media(max-width:700px){main{grid-template-columns:repeat(2,1fr)}}</style><h1>Seated Islander, 163 scene units</h1><main>';
    for(const id of ['bed','chair','rug','beanbag','shelf','sofa','armchair','bunk-bed','hammock','floor-cushion','rocking-chair','stool']) {
      const seat=instance('seat',id,4,4), room:RoomState={instances:[seat],characters:[],theme:{wallpaper:'cream',floor:'sand'}};
      const p=itemPoint(seat), cp=characterPoint(room,{slot:0,anchor:seatAnchor(seat),pose:'sit',seatId:'seat'}), size=itemSize(seat);
      const art=id in moreCatalog ? render(<MoreItemArt id={id} size={size}/>) : render(<ItemArt item={id} size={size}/>);
      html+=`<figure><figcaption>${id} · ${size}</figcaption><section><div style="position:absolute;left:${170-size/2}px;top:${205-size*.85}px">${art}</div><div style="position:absolute;left:${170-81}px;top:${205+cp.y-p.y-163}px">${render(<Islander size={163} pose="sit-relaxed"/>)}</div><div style="position:absolute;left:${170-size/2}px;top:${205-size*.85}px">${render(<SeatFront item={seat} size={size}/>)}</div></section></figure>`;
    }
    html+='</main>';writeFileSync(`${process.env.POLISH_EVIDENCE}/seats.html`,html);
  });
  it('shows three small items beside each other on a kitchen table',()=>{
    if(!process.env.POLISH_EVIDENCE) return;
    const table=instance('table','kitchen-table',6,6);
    const children=[{...instance('fruit','fruit-bowl',6,6),on:'table'},{...instance('tea','teapot',7,6),on:'table'},{...instance('flower','flower-vase',8,6),on:'table'}];
    const items=[table,...children];
    const html=`<!doctype html><meta charset="utf-8"><style>body{background:#d7e7dc;font:16px system-ui;color:#284f4b}.room{position:relative;width:800px;height:560px;overflow:hidden}svg{position:absolute}</style><h1>Three small items on one kitchen table</h1><div class="room">${render(<RoomShellArt room="kitchen" theme={{wallpaper:'lagoon',floor:'sand'}}/>)}${items.map(i=>{const p=itemPoint(i,items),size=itemSize(i);return `<div style="position:absolute;left:${p.x-size/2}px;top:${p.y-size*.85}px">${render(<MoreItemArt id={i.item} size={size}/>)}</div>`}).join('')}${`<div style="position:absolute;left:85px;top:260px">${render(<Islander size={163}/>)}</div>`}</div>`;
    writeFileSync(`${process.env.POLISH_EVIDENCE}/stack-three.html`,html);
  });
});
