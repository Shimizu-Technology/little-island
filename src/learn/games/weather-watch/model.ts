import type { LearnEngine, LearnId } from "../../types";
import { levelOf } from "../../levelOptions";
import { exact, integer } from "../../kit/science";
export type Game = "weather-watch" | "food-web" | "space-station";
export type Task = {
  title: string;
  goal: string;
  kind: string;
  labels: string[];
  target: number[];
  fact: string;
  notice: string;
  hint: string;
};
export type ScienceState = {
  version: 1;
  seed: number;
  level: number;
  index: number;
  items: number[];
  values: number[];
  tested: boolean;
  actions: number;
  records: number[][];
};
export type Action =
  | { type: "set"; slot: number; value: number }
  | { type: "test" }
  | { type: "next" }
  | { type: "reset" };
const t = (
  title: string,
  goal: string,
  kind: string,
  labels: string[],
  target: number[],
  fact: string,
  notice: string
): Task => ({
  title,
  goal,
  kind,
  labels,
  target,
  fact,
  notice,
  hint:
    kind === "gravity"
      ? `${target[0]} kg, ${labels[target[1]]}`
      : kind === "tilt"
        ? `${target[0]}° tilt, ${labels[target[1]]}`
        : kind === "eclipse"
          ? `${labels[target[0]]}, orbit offset ${target[1]}`
          : target.map((n) => labels[n] ?? String(n)).join(" → "),
});
const planets = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
export { planets };
function curriculumTasks(game: Game, level: number, seed: number): Task[] {
  const v = seed % 3;
  if (game === "weather-watch") {
    if (level === 1)
      return [
        t(
          "Sunny beach",
          "Dress the explorer for sunshine.",
          "dress",
          ["Sunhat", "Raincoat", "Warm coat"],
          [0],
          "A sunhat shades your face. Use sunscreen and shade with a grown-up too.",
          "The hat made shade."
        ),
        t(
          "Rainy walk",
          "Keep the explorer dry.",
          "dress",
          ["Sunhat", "Raincoat", "Warm coat"],
          [1],
          "A raincoat keeps rain off your clothes.",
          "The coat kept the rain out."
        ),
        t(
          "Cold mountain",
          "Our explorer is visiting somewhere cold. Dress warmly.",
          "dress",
          ["Sunhat", "Raincoat", "Warm coat"],
          [2],
          "Weather differs from place to place. Guam is warm, but some places get cold.",
          "Warm layers help in cold weather."
        ),
        t(
          "Stormy afternoon",
          "Move play to a safe place.",
          "safety",
          ["Indoor drawing", "Ocean swim", "Under a tree"],
          [0],
          "When thunder roars, go indoors. A tree is not a safe lightning shelter.",
          "Indoor play is safer in a storm."
        ),
      ];
    if (level === 2)
      return [
        ...["Spring", "Summer", "Autumn", "Winter"].map((s, i) =>
          t(
            `${s} garden`,
            "Turn the season dial. Watch this temperate garden change.",
            "season",
            ["Spring", "Summer", "Autumn", "Winter"],
            [i],
            "This is a temperate garden model. Not every tree loses leaves; Guam mainly has wet and dry seasons.",
            `${s} changed the garden.`
          )
        ),
        t(
          "Guam rain garden",
          "Set the island garden to its wetter season.",
          "tropical",
          ["Drier season", "Wetter season"],
          [1],
          "Guam has a drier and a wetter season. Rain can still fall in either one.",
          "The wetter season has more rain."
        ),
      ];
    if (level === 3)
      return [
        t(
          "Follow a water drop",
          "Build the water cycle. Tap each process in order.",
          "cycle",
          ["Heat sea", "Cool vapor", "Rain", "River to sea"],
          [0, 1, 2, 3],
          "Sunlight supplies energy for evaporation. Cooling water vapor condenses into droplets; precipitation and runoff return water.",
          "Water moved through the cycle."
        ),
        t(
          "Cloud maker",
          "Start with invisible water vapor. Build the rest of its journey.",
          "cycle",
          ["Cool vapor", "Rain", "River to sea"],
          [0, 1, 2],
          "Cloud droplets are liquid water or ice, not invisible water vapor.",
          "Cooling made cloud droplets."
        ),
        t(
          "River journey",
          "Return rainwater to the sea, then start the cycle again.",
          "cycle",
          ["River to sea", "Heat sea", "Cool vapor", "Rain"],
          [0, 1, 2, 3],
          "Water also soaks into the ground. This model follows surface runoff.",
          "The cycle can start at any point."
        ),
      ];
    if (level === 4)
      return Array.from({ length: 7 }, (_, i) => {
        const temp = 24 + ((seed + i * 3) % 9),
          rain = ((seed + i * 3) % 7) * 5;
        return t(
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
          "Read the red thermometer and blue rain gauge. Use their scales to record today’s temperature and rain in your chart.",
          "gauge",
          [],
          [temp, rain],
          "Temperature is measured in degrees Celsius here. Rain depth is in millimeters; a taller bar means more rain.",
          `I recorded ${temp} °C and ${rain} mm.`
        );
      });
    return [
      t(
        "Falling pressure",
        "Pressure is falling, dark clouds are growing, wind is strengthening. Set a cautious forecast.",
        "forecast",
        ["Fair likely", "Rain or storm possible", "Snow certain"],
        [1],
        "Falling pressure can signal unsettled weather. These clues do not prove a hurricane is coming; follow official local forecasts.",
        "Several clues support possible stormy weather."
      ),
      t(
        "Settled skies",
        "Pressure is steady, clouds are few, winds are light. Set the forecast.",
        "forecast",
        ["Fair likely", "Rain or storm possible", "Snow certain"],
        [0],
        "Weather predictions have uncertainty. A fair-weather pattern does not guarantee a dry day.",
        "Fair weather is likely, not certain."
      ),
      t(
        "Family storm kit",
        "Pack three useful supplies in the kit.",
        "kit",
        ["Water", "Flashlight", "Battery radio", "Beach ball"],
        [0, 1, 2],
        "Prepare with an adult. Follow Guam emergency officials and evacuation instructions.",
        "Water, light and official information help."
      ),
      t(
        "Storm warning",
        "Move the family to shelter.",
        "safety",
        ["Sturdy indoor shelter", "Beach", "Under a tree"],
        [0],
        "Stay indoors away from windows. Never walk or drive through floodwater. Follow adult and local emergency instructions.",
        "Shelter and adult guidance come first."
      ),
    ];
  }
  if (game === "food-web") {
    if (level === 1)
      return [
        t(
          "Feed a parrotfish",
          "Tap food, then watch the parrotfish graze.",
          "feed",
          ["Algae", "Small fish", "Plastic"],
          [0],
          "Many parrotfish graze algae from reef surfaces. This is one simplified reef feeding relationship.",
          "The parrotfish grazed algae."
        ),
        t(
          "Feed a reef shark",
          "Send a small fish to the reef shark.",
          "feed",
          ["Algae", "Small fish", "Plastic"],
          [1],
          "Reef sharks eat animals including fish. Different species have different diets.",
          "The shark ate an animal."
        ),
        t(
          "Feed a sea urchin",
          "Help this grazing urchin find food.",
          "feed",
          ["Algae", "Small fish", "Plastic"],
          [0],
          "Many sea urchins graze algae. Plastic is not food.",
          "More than one animal grazes algae."
        ),
        t(
          "Sun-powered algae",
          "Give the algae its energy source.",
          "feed",
          ["Sunlight", "Small fish", "Plastic"],
          [0],
          "Algae use sunlight to make food by photosynthesis.",
          "Algae use sunlight."
        ),
      ];
    if (level === 2)
      return [0, 1, 2].map((n) =>
        t(
          ["Build a fish chain", "Build an urchin chain", "Build a plankton chain"][n],
          "Tap nodes in energy-flow order. Arrows point from food toward eater.",
          "chain",
          n === 1
            ? ["Sun", "Algae", "Urchin", "Triggerfish"]
            : n === 2
              ? ["Sun", "Phytoplankton", "Zooplankton", "Small fish"]
              : ["Sun", "Algae", "Small fish", "Reef shark"],
          [0, 1, 2, 3],
          "Sunlight powers producers. Energy moves from food to the animal eating it; arrows are not hunting directions.",
          "The arrows show energy moving to the eater."
        )
      );
    if (level === 3)
      return [
        t(
          "Two grazers",
          "Build both branches from algae to its grazers.",
          "web",
          ["Algae → Parrotfish", "Algae → Urchin", "Parrotfish → Algae"],
          [0, 1],
          "A food web has connected feeding relationships. Two grazers can share the same producer.",
          "One producer fed two grazers."
        ),
        t(
          "Two prey paths",
          "Link both animals to a predator.",
          "web",
          ["Small fish → Reef shark", "Crab → Reef shark", "Reef shark → Sun"],
          [0, 1],
          "Some reef sharks eat fish and crustaceans. This web represents selected relationships, not every reef species.",
          "A predator can have more than one food source."
        ),
        t(
          "Connect the reef",
          "Build four connections, including a branch.",
          "web",
          ["Algae → Parrotfish", "Algae → Urchin", "Urchin → Triggerfish", "Small fish → Reef shark"],
          [0, 1, 2, 3],
          "Real webs have many more connections. Losing one species can affect several others.",
          "Branching links connect the reef."
        ),
      ];
    if (level === 4)
      return [
        t(
          "Remove grazers",
          "Set grazers to 0. Run the model and compare algae with the baseline.",
          "population",
          [],
          [0],
          "In this teaching model, fewer grazers allow more algae. Real reefs also depend on nutrients, temperature and many species.",
          "Algae rose when grazers disappeared."
        ),
        t(
          "Restore grazing",
          "Set grazers to 8. Compare the result.",
          "population",
          [],
          [8],
          "Grazing can help control algae that compete with coral. The numbers are illustrative, not a real reef forecast.",
          "More grazers left less algae."
        ),
        t(
          "Try a middle population",
          `Set grazers to ${3 + v}. Compare both populations.`,
          "population",
          [],
          [3 + v],
          "Changing one input helps us compare cause and effect in a model. Real ecosystems are more complex.",
          "A middle population changed the balance."
        ),
      ];
    const energy = [1000, 2000, 5000][v];
    return [
      t(
        "Energy pyramid",
        `Producers store ${energy} energy units. Build the next two levels using our approximate 10% model.`,
        "energy",
        [],
        [energy / 10, energy / 100],
        "About 10% is a teaching approximation. Transfer varies; much energy supports life processes and leaves as heat. Energy is not recycled.",
        `Only about ${energy / 100} units reached the third level.`
      ),
      t(
        "Matter recyclers",
        "Build the path from dead matter to recycled nutrients to algae.",
        "chain",
        ["Dead matter", "Decomposers", "Nutrients", "Algae"],
        [0, 1, 2, 3],
        "Decomposers break down dead matter and return nutrients. Matter cycles; energy flows through.",
        "Decomposers recycle matter."
      ),
      t(
        "Protect the reef",
        "Set pollution to 0, then run the model.",
        "pollution",
        [],
        [0],
        "Reducing pollution and protecting grazers can help reefs. This model is illustrative; warming and other stresses also matter.",
        "Reducing pollution helped the model reef."
      ),
    ];
  }
  if (level === 1)
    return [
      t(
        "Make daytime",
        "Turn Earth until the island faces the Sun.",
        "rotation",
        ["Day", "Night"],
        [0],
        "Earth rotates. The side facing the Sun has day. Never look directly at the Sun.",
        "Facing the Sun made daytime."
      ),
      t(
        "Make nighttime",
        "Turn Earth until the island faces away from the Sun.",
        "rotation",
        ["Day", "Night"],
        [1],
        "The Sun is still shining when your side of Earth has night. Stars are present in daytime too.",
        "Turning away made nighttime."
      ),
      t(
        "Day comes again",
        "Turn Earth back toward the Sun.",
        "rotation",
        ["Day", "Night"],
        [0],
        "Earth rotates about once every 24 hours. The Moon can sometimes be visible in daytime.",
        "Rotation repeats day and night."
      ),
    ];
  if (level === 2)
    return Array.from({ length: 4 }, (_, i) => (seed + i * 2) % 8).map((p) =>
      t(
        [
          "New Moon",
          "Waxing crescent",
          "First quarter",
          "Waxing gibbous",
          "Full Moon",
          "Waning gibbous",
          "Third quarter",
          "Waning crescent",
        ][p],
        "Move the Moon around Earth. Watch the sunlit fraction we see.",
        "moon",
        [
          "New Moon",
          "Waxing crescent",
          "First quarter",
          "Waxing gibbous",
          "Full Moon",
          "Waning gibbous",
          "Third quarter",
          "Waning crescent",
        ],
        [p],
        "The Sun always lights half the Moon. Our view of that half changes as the Moon orbits. Ordinary phases are not Earth’s shadow.",
        "Moving the Moon changed our view of its lit half."
      )
    );
  if (level === 3)
    return [
      t(
        "Inner planets",
        "Place the four inner planets outward from the Sun.",
        "planets",
        planets,
        [0, 1, 2, 3],
        "Mercury, Venus, Earth and Mars are the rocky inner planets. Planet circles compare approximate diameters. The Sun icon and spacing are not to scale.",
        "Earth is the third planet."
      ),
      t(
        "Outer planets",
        "Place the four outer planets outward from the Sun.",
        "planets",
        planets,
        [4, 5, 6, 7],
        "Jupiter is the largest planet. Saturn, Uranus and Neptune follow it outward. Distances and sizes cannot share a practical screen scale.",
        "Jupiter is larger than the other planets."
      ),
      t(
        "Whole solar system",
        "Place all eight planets outward from the Sun.",
        "planets",
        planets,
        [0, 1, 2, 3, 4, 5, 6, 7],
        "Pluto is a dwarf planet. There are eight planets in this model.",
        "The same planet order fits the whole system."
      ),
    ];
  if (level === 4)
    return [
      t(
        "Moon laboratory",
        `Set mass to ${12 + v * 6} kg and select the Moon. Watch the weight change.`,
        "gravity",
        ["Earth", "Moon", "Mars", "Jupiter"],
        [12 + v * 6, 1],
        "Mass stays the same. Weight is gravitational force: mass × local gravity. Moon gravity is about 1.62 m/s².",
        "The same mass weighed less on the Moon."
      ),
      t(
        "Jupiter laboratory",
        "Keep a 12 kg mass. Select Jupiter and compare the weight.",
        "gravity",
        ["Earth", "Moon", "Mars", "Jupiter"],
        [12, 3],
        "Approximate gravity: Earth 9.81, Moon 1.62, Mars 3.71, Jupiter 23.1 m/s². Jupiter has no solid surface to stand on.",
        "Stronger gravity increased weight."
      ),
      t(
        "Orbit builder",
        "Select Orbit (the middle speed) to make the model orbit instead of falling or escaping.",
        "orbit",
        ["Fall", "Orbit", "Escape"],
        [1],
        "Gravity bends a moving object’s path. This is a qualitative orbit model, not a spacecraft trajectory calculator.",
        "Forward motion and gravity curved the path."
      ),
    ];
  return [
    t(
      "Sunlight clock",
      `Set distance to ${1 + v} AU. Then set light travel time to ${Math.round((1 + v) * 8.3)} minutes.`,
      "distance",
      [],
      [1 + v, Math.round((1 + v) * 8.3)],
      "One AU is about the Earth–Sun distance. Light takes about 8.3 minutes per AU; displayed minutes are rounded.",
      "Greater distance meant a longer light-time."
    ),
    t(
      "Tilted Earth",
      "Set axial tilt to about 23° and put the Northern Hemisphere toward the Sun.",
      "tilt",
      ["North toward Sun", "North away from Sun"],
      [23, 0],
      "Earth’s axial tilt is about 23.4°. Tilt changes sunlight angle and day length, causing opposite seasons in the hemispheres. This dial rounds the tilt.",
      "The hemisphere tilted toward the Sun has summer."
    ),
    t(
      "Solar eclipse alignment",
      "Move the Moon between the Sun and Earth, then align its orbit.",
      "eclipse",
      ["Moon between", "Earth between", "Not aligned"],
      [0, 0],
      "Solar eclipses require a new Moon aligned near an orbit crossing. The tilted lunar orbit means eclipses do not occur every month. Never look at the Sun without approved protection.",
      "Alignment allowed the Moon’s shadow to reach Earth."
    ),
    t(
      "Lunar eclipse alignment",
      "Put Earth between the Sun and Moon, then align the orbit.",
      "eclipse",
      ["Moon between", "Earth between", "Not aligned"],
      [1, 0],
      "A lunar eclipse happens when a full Moon passes through Earth’s shadow. Moon phases ordinarily do not come from that shadow.",
      "Earth’s shadow reached the full Moon."
    ),
  ];
}
/** Seeded palettes make building a model a real arrangement task, rather than tapping cards left to right. */
export function tasks(game: Game, level: number, seed: number): Task[] {
  return curriculumTasks(game, level, seed).map((q, taskIndex) => {
    if (!["cycle", "chain", "web", "planets", "kit"].includes(q.kind)) return q;
    const order = q.labels.map((_, i) => i);
    let word = (seed ^ ((taskIndex + 1) * 2654435761)) >>> 0;
    for (let i = order.length - 1; i > 0; i--) {
      word = (Math.imul(word, 1664525) + 1013904223) >>> 0;
      const j = word % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const labels = order.map((i) => q.labels[i]);
    const target = q.target.map((i) => order.indexOf(i));
    return t(q.title, q.goal, q.kind, labels, target, q.fact, q.notice);
  });
}
export const initialValues = (q: Task) =>
  q.kind === "gravity"
    ? [6, 0]
    : ["gauge", "energy", "distance", "tilt"].includes(q.kind)
      ? [0, 0]
      : q.kind === "eclipse"
        ? [2, 1]
        : ["cycle", "chain", "web", "planets", "kit"].includes(q.kind)
          ? []
          : [q.kind === "population" ? (q.target[0] === 5 ? 4 : 5) : q.kind === "pollution" ? 5 : (q.target[0] + 1) % q.labels.length];
export const correct = (q: Task, values: number[]) =>
  values.length === q.target.length &&
  (q.kind === "web" || q.kind === "kit"
    ? new Set(values).size === values.length && values.every((n) => q.target.includes(n))
    : values.every((n, i) => n === q.target[i]));
export const currentTask = (game: Game, s: ScienceState) => tasks(game, s.level, s.seed)[s.index];
function validValues(q: Task, values: unknown): values is number[] {
  if (
    !Array.isArray(values) ||
    Object.keys(values).length !== values.length ||
    values.length > 8 ||
    !Array.from(values).every((n) => integer(n, 0, 500))
  )
    return false;
  if (["cycle", "chain", "web", "planets", "kit"].includes(q.kind))
    return (
      values.length <= q.target.length &&
      new Set(values).size === values.length &&
      values.every((n) => n < q.labels.length)
    );
  const bounds: Record<string, number[]> = {
    gauge: [40, 40],
    energy: [500, 100],
    gravity: [30, 3],
    distance: [5, 42],
    tilt: [30, 1],
    eclipse: [2, 1],
    population: [10],
    pollution: [10],
  };
  const b = bounds[q.kind] ?? [q.labels.length - 1];
  return values.length === b.length && values.every((n, i) => n <= b[i]);
}
export function move(game: Game, s: ScienceState, a: Action): ScienceState {
  const q = currentTask(game, s);
  if (!q) return s;
  if (a.type === "reset") return { ...s, values: initialValues(q), tested: false };
  if (a.type === "test") return s.actions > 0 ? { ...s, tested: true } : s;
  if (a.type === "next")
    return s.tested && correct(q, s.values)
      ? {
          ...s,
          index: s.index + 1,
          records: [...s.records, s.values],
          actions: 0,
          values: tasks(game, s.level, s.seed)[s.index + 1]
            ? initialValues(tasks(game, s.level, s.seed)[s.index + 1])
            : [],
          tested: false,
        }
      : s;
  if (s.tested && correct(q, s.values)) return s;
  const values = [...s.values];
  if (["cycle", "chain", "web", "planets", "kit"].includes(q.kind)) {
    if (values.includes(a.value) || values.length >= q.target.length) return s;
    values.push(a.value);
  } else {
    if (!integer(a.slot, 0, values.length - 1)) return s;
    values[a.slot] = a.value;
  }
  return validValues(q, values) ? { ...s, values, tested: false, actions: Math.min(10000, s.actions + 1) } : s;
}
export function makeEngine(
  game: Game,
  name: string,
  ages: readonly [number, number],
  names: string[]
): LearnEngine<ScienceState> {
  return {
    id: game as LearnId,
    name,
    island: "science",
    ages,
    ownLevels: true,
    get levelNames() {
      return names.map((name, i) => ({ name, description: tasks(game, i + 1, 1)[0].goal }));
    },
    tagline:
      game === "weather-watch"
        ? "Make weather discoveries."
        : game === "food-web"
          ? "Build a living reef."
          : "Turn, orbit and explore.",
    description: "Change the model, test it, then record what you notice. Five hands-on levels grow with you.",
    help: "Tap the scene controls to build or change the model. Test your model, then record your observation. Reset lets you try a new plan. The Hint button shows one working setup. Models simplify the real world; facts stay visible. Reading is never timed.",
    introAudio: `${game}-intro`,
    helpAudio: "science-lab-help",
    modes: ["solo", "together"],
    color: "#4F793B",
    surface: "#E9F3CE",
    skills: { [`sci.${game}`]: name + " discoveries" },
    create: (o, c) => {
      const seed = Math.floor(c.rng() * 1000000),
        level = levelOf(o),
        qs = tasks(game, level, seed);
      return {
        version: 1,
        seed,
        level,
        index: 0,
        items: qs.map((_, i) => i),
        values: initialValues(qs[0]),
        tested: false,
        actions: 0,
        records: [],
      };
    },
    validate: (x, o): x is ScienceState => {
      if (!exact(x, ["version", "seed", "level", "index", "items", "values", "tested", "actions", "records"]))
        return false;
      const s = x as ScienceState;
      if (
        s.version !== 1 ||
        !integer(s.seed, 0, 999999) ||
        s.level !== levelOf(o) ||
        typeof s.tested !== "boolean" ||
        !integer(s.actions, 0, 10000) ||
        (s.tested && s.actions === 0)
      )
        return false;
      const qs = tasks(game, s.level, s.seed);
      if (
        !integer(s.index, 0, qs.length) ||
        !Array.isArray(s.items) ||
        s.items.length !== qs.length ||
        !Array.from(s.items).every((n, i) => n === i) ||
        !Array.isArray(s.records) ||
        s.records.length !== s.index ||
        !Array.from(s.records).every((r, i) => validValues(qs[i], r) && correct(qs[i], r))
      )
        return false;
      return s.index === qs.length
        ? Array.isArray(s.values) && s.values.length === 0 && !s.tested && s.actions === 0
        : validValues(qs[s.index], s.values);
    },
    outcome: (s) => (s.index === tasks(game, s.level, s.seed).length ? "done" : null),
  };
}

/** Approximate physical quantities; reef outputs are deliberately illustrative indices. */
export const gravity = [9.81, 1.62, 3.71, 23.1] as const;
export const weightNewtons = (mass: number, body: number) => mass * gravity[body];
export const lightMinutes = (au: number) => au * 8.3;
export const visibleMoonPercent = (phase: number) => Math.round((1 - Math.cos((phase * Math.PI) / 4)) * 50);
export const reefModel = (kind: "population" | "pollution", value: number) => {
  const algae = kind === "population" ? 100 - 8 * value : 35 + 5 * value;
  return { algae, health: kind === "population" ? 100 - algae : 100 - 8 * value };
};

/** Feedback uses the very same target and fact as testing and hints. */
export function wrongFeedback(q: Task, values: number[]): string {
  const chosen = q.labels[values[0]];
  switch (q.kind) {
    case "dress": return `${chosen === "Warm coat" ? "That coat keeps warmth in." : chosen === "Raincoat" ? "A raincoat keeps rain off clothes." : "A sunhat makes shade."} ${q.fact} Which item fits this weather?`;
    case "feed": return `${chosen === "Plastic" ? "Plastic is not food and does not give this reef life energy. " : "That is not the energy source for this reef life in our model. "}${q.fact}`;
    case "rotation": return `${values[0] === 1 ? "The island faces away from the Sun, so it has night." : "The island faces the Sun, so it has day."} ${q.goal}`;
    case "cycle": return `${q.fact} Reset the journey and follow where the water goes next.`;
    case "chain": return `${q.fact} Reset and build from the energy source toward each eater, or follow the matter-recycling path in the goal.`;
    case "planets": return `${q.fact} Reset and place the planets from nearest to farthest from the Sun.`;
    case "web": return `${q.fact} Check each food-to-eater arrow. Reset to change your connections.`;
    case "kit": return `${q.fact} Think about drinking water, light and hearing official information. Reset to repack.`;
    case "gauge": return "Read where each colored column ends. The red scale uses degrees Celsius; the blue scale uses millimeters. Count the small marks between the labeled numbers, then check both chart entries.";
    case "season": return `${q.fact} Compare the season dial with the garden named in the goal.`;
    case "tropical": return `${q.fact} Which setting brings more rain?`;
    case "safety": return `${q.fact} Choose a safe indoor activity or shelter with an adult.`;
    case "forecast": return `${q.fact} Compare all the weather clues; a forecast says what is likely, not certain.`;
    case "population": case "pollution": return `${q.fact} Compare your ${q.kind === "population" ? "grazer" : "pollution"} setting with the goal, then test one change.`;
    case "energy": return `${q.fact} In this model divide by ten at each step of the pyramid.`;
    case "moon": return `${q.fact} Compare the phase named above with the sunlit part we see.`;
    case "gravity": return `${q.fact} Check both the mass and the selected world.`;
    case "orbit": return `${q.fact} Too little forward motion falls inward; too much escapes. Try the middle setting.`;
    case "distance": return `${q.fact} Check both AU and rounded travel minutes.`;
    case "tilt": return `${q.fact} Check the tilt angle and which hemisphere faces the Sun.`;
    case "eclipse": return `${q.fact} Check which object is between the others and whether the orbit is aligned.`;
    default: return `${q.fact} ${q.goal}`;
  }
}
export const scienceSpeechKey = (text: string) => {
  let hash=2166136261;
  for(const char of text) hash=Math.imul(hash ^ char.charCodeAt(0),16777619) >>> 0;
  return `science-v25-${hash.toString(16)}`;
};
export const goalTranscript = (q: Task) => `${q.title}. ${q.goal}`;
export const scalePractice = (recordCount: number) => recordCount > 0;
