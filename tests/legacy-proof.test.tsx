import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { it, expect, vi } from 'vitest';
import { Islander } from '../src/islander/rig/Islander';
import { frontPoses,backPoses } from '../src/islander/rig/poses';
import { defaultLook,outfits,hairStyles,hats,isValidLook,normalizeLook,type IslanderLook } from '../src/islander/look';
vi.mock('react-native-svg',()=>({default:'svg',G:'g',Path:'path',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Text:'text'}));
// 2.2 intentionally redraws old styles. Compatibility preserves saved selections,
// with implicit neutral build / cream sneakers, rather than freezing old pixels.
it('preserves old look data and renders its explicit compatibility defaults in every pose',()=>{
 const looks:IslanderLook[]=[...outfits.slice(0,7).flatMap(outfit=>hairStyles.slice(0,4).map(hairStyle=>({...defaultLook,outfit,hairStyle}))),...hats.map(hat=>({...defaultLook,hat}))];
 for(const look of looks) {
  const original=JSON.stringify(look);expect(isValidLook(look)).toBe(true);expect(normalizeLook(look)).toEqual(look);
  for(const pose of [...frontPoses,...backPoses]) {
   const markup=renderToStaticMarkup(<Islander look={look} pose={pose} view={pose.view}/>);
   expect(markup,`${look.outfit} ${look.hairStyle} ${pose.id}`).toBe(renderToStaticMarkup(<Islander look={{...look,build:'neutral',shoes:'sneakers',shoeColor:'cream'}} pose={pose} view={pose.view}/>));
   expect(markup).not.toMatch(/NaN|Infinity|undefined/);
  }
  expect(JSON.stringify(look)).toBe(original);
 }
},180000);
