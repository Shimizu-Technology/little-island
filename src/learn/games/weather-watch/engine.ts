import { makeEngine } from "./model";
export const engine = makeEngine(
  "weather-watch",
  "Weather Watch",
  [4, 10],
  ["Weather wardrobe", "Season garden", "Water cycle", "Weather chart", "Forecast & prepare"]
);
export { tasks, move, correct, currentTask } from "./model";
export type { ScienceState } from "./model";
