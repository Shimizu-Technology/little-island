import { makeEngine } from "../weather-watch/model";
export const engine = makeEngine(
  "food-web",
  "Food Web Reef",
  [6, 13],
  ["Reef feeding", "Food chains", "Branching webs", "Population lab", "Energy & care"]
);
export { tasks, move, correct, currentTask } from "../weather-watch/model";
export type { ScienceState } from "../weather-watch/model";
