import { trackSprite } from './camera';
/** Paired tall shore props share track depth, with far bands providing haze. */
export function harborSceneryPose(travel:number,i:number) {
  'worklet';
  const band=Math.floor(i/4),span=[2.35,1.5,.8][band],rate=[1,.6,.28][band];
  const distance=travel*rate+Math.floor(i%4/2)*span/2+(i%2)*.025,z=-1.15+distance%span;
  const lane=1+(i%2?1:-1)*[1.72,2.45,3.5][band];
  return {identity:Math.floor(distance/span),...trackSprite(lane,z,100,240),opacity:.22+.78*Math.max(0,Math.min(1,(z+1.2)/2.2))};
}
