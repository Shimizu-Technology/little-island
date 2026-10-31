import { WorldId } from "./content";
export interface LabState {
  turn: number;
  chain: string[];
  habitat: number;
  habitatFeedback?: boolean;
  matched: number[];
  water: WaterPlace;
  journey: WaterPlace[];
  expedition: number;
  visited: string[];
  message: string;
}
export type WaterPlace = "ocean" | "vapor" | "cloud" | "rain" | "ground" | "ice";
export type LabAction =
  | { type: "turn"; by: 1 | -1 }
  | { type: "chain"; item: string }
  | { type: "unchain" }
  | { type: "next-animal" }
  | { type: "habitat"; choice: string }
  | { type: "water"; action: string }
  | { type: "place"; id: string }
  | { type: "reset" };
export const newLab = (): LabState => ({
  turn: 0,
  chain: [],
  habitat: 0,
  matched: [],
  water: "ocean",
  journey: ["ocean"],
  expedition: 0,
  visited: [],
  message: "",
});
export const FOOD_CHAIN = ["Sunlight", "Phytoplankton", "Zooplankton", "Small fish", "Larger fish"];
export const HABITATS = [
  {
    animal: "Green sea turtle",
    art: "turtle",
    home: "Seagrass meadow",
    why: "Adult green turtles can graze on seagrass. They still swim to the surface for air.",
  },
  {
    animal: "Reef fish",
    art: "fish",
    home: "Coral reef",
    why: "Many small reef fish find food and shelter among corals and other reef life.",
  },
  {
    animal: "Tadpole",
    art: "tadpole",
    home: "Freshwater pond",
    why: "Many tadpoles grow and swim in freshwater. They are not ready for a salty reef.",
  },
  {
    animal: "Caterpillar",
    art: "caterpillar",
    home: "Leafy garden",
    why: "A caterpillar needs a suitable food plant. Not every leaf is food for every caterpillar.",
  },
  {
    animal: "Honeybee",
    art: "bee",
    home: "Leafy garden",
    why: "A garden with suitable flowers can supply nectar and pollen. Bees also need safe nesting places.",
  },
  {
    animal: "Reef-building coral",
    art: "coral",
    home: "Coral reef",
    why: "Many reef-building corals thrive in clear, shallow seawater with suitable light and temperature.",
  },
];
export const HABITAT_CHOICES = ["Leafy garden", "Coral reef", "Freshwater pond", "Seagrass meadow"];
export const PLACES = [
  {
    id: "guam",
    name: "Guam",
    x: 326,
    y: 110,
    clue: "Find our island in the western Pacific, east of the Philippines and north of Australia.",
    fact: "Guam is part of the Mariana Islands. The Pacific Ocean surrounds it.",
    topic: "guam",
  },
  {
    id: "japan",
    name: "Japan",
    x: 330,
    y: 66,
    clue: "Find the island country north of Guam, beside the eastern edge of Asia.",
    fact: "Japan is an island country in eastern Asia. It lies north of Guam.",
    topic: "islands",
  },
  {
    id: "australia",
    name: "Australia",
    x: 316,
    y: 152,
    clue: "Find the large landmass south of Guam and southeast of Asia.",
    fact: "Australia is both a country and, in a common seven-continent model, a continent.",
    topic: "continents",
  },
  {
    id: "africa",
    name: "Africa",
    x: 207,
    y: 115,
    clue: "Find the continent south of Europe, between the Atlantic and Indian oceans.",
    fact: "The equator crosses Africa. Africa connects with Asia at its northeastern corner.",
    topic: "continents",
  },
  {
    id: "antarctica",
    name: "Antarctica",
    x: 220,
    y: 204,
    clue: "Find the continent around Earth's South Pole, at the bottom of this north-up map.",
    fact: "Antarctica surrounds the South Pole. This flat map stretches the polar regions.",
    topic: "continents",
  },
];
export const WATER_ACTIONS: Record<WaterPlace, { action: string; label: string; next: WaterPlace; explain: string }[]> =
  {
    ocean: [
      {
        action: "heat",
        label: "Add warmth: evaporate",
        next: "vapor",
        explain: "Some liquid water becomes invisible water vapor. The Sun supplies energy for much evaporation.",
      },
      {
        action: "freeze",
        label: "Cool below freezing",
        next: "ice",
        explain:
          "Liquid water freezes into solid ice. In nature, salty seawater freezes at a lower temperature than pure water.",
      },
    ],
    vapor: [
      {
        action: "cool",
        label: "Cool the rising air",
        next: "cloud",
        explain:
          "Water vapor condenses into tiny liquid drops. A cloud becomes visible. This model leaves out the tiny particles drops form on.",
      },
    ],
    cloud: [
      {
        action: "grow",
        label: "Let droplets grow",
        next: "rain",
        explain:
          "Drops grow large enough to fall as rain. In real clouds, rising air and ice particles can affect this process too.",
      },
      {
        action: "warm",
        label: "Warm and evaporate drops",
        next: "vapor",
        explain: "Cloud droplets evaporate back into invisible vapor. Water can take many paths.",
      },
    ],
    rain: [
      {
        action: "soak",
        label: "Soak into the ground",
        next: "ground",
        explain:
          "Some rain infiltrates soil and rock. Water below the surface can move slowly toward streams or the ocean.",
      },
      {
        action: "runoff",
        label: "Flow downhill to the ocean",
        next: "ocean",
        explain:
          "Surface runoff can join streams and rivers. This shortcut stands for a journey that may be very long.",
      },
    ],
    ground: [
      {
        action: "flow",
        label: "Follow groundwater to the sea",
        next: "ocean",
        explain: "Some groundwater flows toward the ocean. Other water stays stored or is taken up by plants.",
      },
    ],
    ice: [
      {
        action: "melt",
        label: "Warm and melt the ice",
        next: "ocean",
        explain:
          "Solid ice becomes liquid water. Freezing and melting change its state without changing it into a new substance.",
      },
    ],
  };
export function dayNightDot(turn: number) {
  return { x: Math.cos((turn * Math.PI) / 4), y: -Math.sin((turn * Math.PI) / 4) };
}
export function isDay(turn: number): boolean {
  return Math.cos(((turn % 8) * Math.PI) / 4) < -0.001;
}
export function labAction(state: LabState, action: LabAction): LabState {
  if (action.type === "reset") return newLab();
  if (action.type === "turn") return { ...state, turn: (state.turn + action.by + 8) % 8, message: "" };
  if (action.type === "unchain") return { ...state, chain: state.chain.slice(0, -1), message: "" };
  if (action.type === "chain") {
    if (state.chain.length === FOOD_CHAIN.length) return state;
    const expected = FOOD_CHAIN[state.chain.length];
    if (action.item !== expected)
      return {
        ...state,
        message:
          state.chain.length === 0
            ? "Start with the energy source. Which choice supplies light?"
            : `Look for what receives energy next from ${state.chain.at(-1)}. Try another choice.`,
      };
    const chain = [...state.chain, action.item];
    return {
      ...state,
      chain,
      message:
        chain.length === FOOD_CHAIN.length
          ? "A connected chain! Arrows show energy moving from food to eater. Real food webs have many more paths."
          : `${action.item} added. Choose the next link.`,
    };
  }
  if (action.type === "next-animal") return state.habitatFeedback ? { ...state, habitatFeedback: false, message: "" } : state;
  if (action.type === "habitat") {
    if (state.habitatFeedback) return state;
    if (state.habitat >= HABITATS.length) return state;
    const target = HABITATS[state.habitat];
    return action.choice === target.home
      ? { ...state, habitat: state.habitat + 1, matched: [...state.matched, state.habitat], habitatFeedback: true, message: target.why }
      : {
          ...state,
          message: `Think about what ${target.animal.toLowerCase()} needs to eat, breathe, and grow. Try a different habitat.`,
        };
  }
  if (action.type === "water") {
    const next = WATER_ACTIONS[state.water].find((choice) => choice.action === action.action);
    if (!next) return { ...state, message: "That step is not available here. Choose one of the actions below." };
    return { ...state, water: next.next, journey: [...state.journey, next.next].slice(-14), message: next.explain };
  }
  if (action.type === "place") {
    const target = PLACES[state.expedition];
    if (!target) return state;
    const chosen = PLACES.find((place) => place.id === action.id);
    if (!chosen) return state;
    if (target.id !== action.id)
      return { ...state, message: `You found ${chosen.name}. Use the clue and try another destination.` };
    return { ...state, expedition: state.expedition + 1, visited: [...state.visited, target.id], message: target.fact };
  }
  return state;
}
export const activityTopic: Record<WorldId, string> = {
  space: "day-night",
  oceans: "food-web",
  animals: "habitats",
  weather: "water-cycle",
  world: "maps",
};
