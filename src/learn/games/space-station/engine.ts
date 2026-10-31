import { makeEngine } from "../weather-watch/model";
export const engine = makeEngine(
  "space-station",
  "Star Station",
  [7, 14],
  ["Day & night", "Moon phases", "Planet builder", "Gravity & orbits", "Light, tilt & eclipses"]
);
export { tasks, move, correct, currentTask } from "../weather-watch/model";
export type { ScienceState } from "../weather-watch/model";
