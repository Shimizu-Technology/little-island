import type { SpritePose } from "../../poses";
import { trackSprite } from "../lagoon-run/camera";
export const SCENE_COUNT = 12, SCENE_START = 96, TEXTURE_START = 108, TEXTURE_COUNT = 24;
/** Every band uses the road camera, with its own bounded distance/recycle interval. */
export function sceneryPose(travel: number, i: number): SpritePose {
  "worklet";
  const band = Math.floor(i/4), rate = [1,.55,.13][band], span = [1.22,.85,.28][band], start = [.01,.015,.02][band];
  const distance = travel*rate + (i%4)*span/4, cycle = Math.floor(distance/span), z=start+distance%span;
  const side=i%2 ? 1 : -1, lane=1+side*[2.12,2.7,5.2][band];
  return { identity: cycle, ...trackSprite(lane,z,100,140), opacity:.35+.65*Math.min(1,z) };
}

export function groundTexturePose(travel:number,i:number) {
  "worklet";
  const distance=travel+(i/4)*.205,z=distance%1.2,cycle=Math.floor(distance/1.2),lane=[-.32,.15,1.85,2.32][i%4];
  return {identity:cycle,...trackSprite(lane,z,16,5)};
}
