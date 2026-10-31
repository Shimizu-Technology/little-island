import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import type { SpritePose } from '../src/arcade/poses';
const babel=createRequire(import.meta.url)('@babel/core') as {
 transformFileSync:(path:string,options:Record<string,unknown>)=>{code:string};
};
type Worklet = { __closure: Record<string,unknown>; __initData: {code:string} };
it('initializes painter sorting before the production Babel worklet captures it',()=>{
 const {code}=babel.transformFileSync(fileURLToPath(new URL('../src/arcade/poses.ts',import.meta.url)),{
  presets:['babel-preset-expo'],envName:'production',caller:{name:'metro',platform:'ios',supportsStaticESM:false},
 });
 const exports:Record<string,Worklet>={};runInNewContext(code,{exports});
 const interpolate=exports.interpolatePoses;
 // JS declaration hoisting masks an undefined capture after worklet conversion.
 expect(typeof interpolate.__closure.rankPainterPoses).toBe('function');
 const serialized=runInNewContext(`(${interpolate.__initData.code})`) as (this:{__closure:Record<string,unknown>},a:SpritePose[],b:SpritePose[],alpha:number)=>SpritePose[];
 const a=[{x:0,y:0,painterDepth:.998,painterKey:0,frame:1}];
 const b=[{x:0,y:2,painterDepth:1.002,painterKey:0,frame:10001}];
 expect(serialized.call({__closure:interpolate.__closure},a,b,.01)[0].frame).toBeLessThan(10000);
 expect(serialized.call({__closure:interpolate.__closure},a,b,.99)[0].frame).toBeGreaterThan(10000);
});
