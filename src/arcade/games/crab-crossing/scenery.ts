import type { Lane } from "./engine";

export type CoastPropKind = "palm" | "rock" | "flowers" | "umbrella" | "hut";
export type CoastPropPlacement = readonly [CoastPropKind, number, number, number];

/** Visual only: moving traffic lanes never receive stationary scenery. */
export const safeLaneScenery = (row: number, lane?: Lane): readonly CoastPropPlacement[] => {
  if (lane) return [];
  if (row === 0) return [["palm", 38, 80, .75], ["flowers", 320, 73, .8], ["rock", 382, 78, .7], ["flowers", 532, 74, .8], ["palm", 600, 82, .7], ["palm", 855, 82, .8]];
  if (row === 5) return [["hut", 342, 78, .65], ["flowers", 410, 75, .7], ["flowers", 526, 75, .7], ["umbrella", 578, 78, .65], ["rock", 864, 76, .65]];
  if (row === 10) return [["hut", 326, 80, .58], ["flowers", 354, 77, .7], ["rock", 390, 80, .7], ["flowers", 505, 76, .8], ["palm", 548, 82, .67], ["umbrella", 600, 82, .7], ["palm", 810, 82, .8]];
  if (row > 10) return row % 2
    ? [["flowers", 330, 76, .75], ["rock", 408, 80, .62], ["umbrella", 558, 82, .64]]
    : [["hut", 358, 80, .54], ["flowers", 520, 76, .75], ["palm", 575, 82, .62]];
  return [["rock", 70, 77, .6], ["flowers", 328, 74, .7], ["flowers", 545, 74, .7], ["palm", 790, 80, .65]];
};
