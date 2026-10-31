import { WORLDS, WorldId, topicById } from "./content";
import { FOOD_CHAIN, HABITATS, LabState, PLACES, WATER_ACTIONS, newLab } from "./activities";
export type ExploreLocation =
  | { kind: "map" }
  | { kind: "world"; world: WorldId }
  | { kind: "activity"; world: WorldId }
  | { kind: "topic"; id: string };
export const exploreLocationKey = (p: ExploreLocation) =>
  p.kind === "map" ? "map" : p.kind === "topic" ? `topic:${p.id}` : `${p.kind}:${p.world}`;
export type ExploreProgress = {
  version: 1;
  location: ExploreLocation;
  history: ExploreLocation[];
  query: string;
  onlyFavorites: boolean;
  labs: Record<WorldId, LabState>;
  positions: Record<string, number>;
};
export function newExploreProgress(): ExploreProgress {
  return {
    version: 1,
    location: { kind: "map" },
    history: [],
    query: "",
    onlyFavorites: false,
    labs: { space: newLab(), oceans: newLab(), animals: newLab(), weather: newLab(), world: newLab() },
    positions: {},
  };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const world = (v: unknown): v is WorldId => WORLDS.some((w) => w.id === v);
export function validExploreLocation(v: unknown): v is ExploreLocation {
  return (
    object(v) &&
    (v.kind === "map" ||
      ((v.kind === "world" || v.kind === "activity") && world(v.world)) ||
      (v.kind === "topic" && typeof v.id === "string" && !!topicById(v.id)))
  );
}
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
function validLab(v: unknown): v is LabState {
  if (
    !object(v) ||
    !integer(v.turn, 0, 7) ||
    !integer(v.habitat, 0, HABITATS.length) ||
    !integer(v.expedition, 0, PLACES.length) ||
    typeof v.message !== "string" ||
    v.message.length > 600
  )
    return false;
  if (v.habitatFeedback !== undefined && (typeof v.habitatFeedback !== "boolean" ||
    (v.habitatFeedback && (v.habitat === 0 || v.message !== HABITATS[(v.habitat as number) - 1].why)))) return false;
  if (!Array.isArray(v.chain) || v.chain.length > FOOD_CHAIN.length || v.chain.some((x, i) => x !== FOOD_CHAIN[i]))
    return false;
  if (!Array.isArray(v.matched) || v.matched.length !== v.habitat || v.matched.some((x, i) => x !== i)) return false;
  if (!Array.isArray(v.visited) || v.visited.length !== v.expedition || v.visited.some((x, i) => x !== PLACES[i].id))
    return false;
  const places = Object.keys(WATER_ACTIONS);
  if (
    !places.includes(v.water as string) ||
    !Array.isArray(v.journey) ||
    !v.journey.length ||
    v.journey.length > 14 ||
    v.journey.at(-1) !== v.water
  )
    return false;
  const journey = v.journey;
  return journey.every(
    (x, i) => places.includes(x) && (!i || WATER_ACTIONS[journey[i - 1] as LabState["water"]].some((a) => a.next === x))
  );
}
/** A bounded, versioned field for Store validation; missing fields use newExploreProgress(). */
export function validExploreProgress(v: unknown): v is ExploreProgress {
  if (
    !object(v) ||
    v.version !== 1 ||
    !validExploreLocation(v.location) ||
    !Array.isArray(v.history) ||
    v.history.length > 24 ||
    !v.history.every(validExploreLocation) ||
    typeof v.query !== "string" ||
    v.query.length > 100 ||
    typeof v.onlyFavorites !== "boolean" ||
    !object(v.labs) ||
    !object(v.positions)
  )
    return false;
  if (!WORLDS.every((w) => validLab((v.labs as Record<string, unknown>)[w.id]))) return false;
  const keys = Object.keys(v.positions);
  if (keys.length > 64) return false;
  return Object.entries(v.positions).every(
    ([key, y]) =>
      Number.isFinite(y) &&
      (y as number) >= 0 &&
      (y as number) <= 1000000 &&
      (key === "map" ||
        (/^((world|activity):[^:]+)$/.test(key) && world(key.split(":")[1])) ||
        (key.startsWith("topic:") && !!topicById(key.slice(6))))
  );
}
export function restoreExploreProgress(v: unknown): ExploreProgress {
  return validExploreProgress(v) ? (JSON.parse(JSON.stringify(v)) as ExploreProgress) : newExploreProgress();
}
