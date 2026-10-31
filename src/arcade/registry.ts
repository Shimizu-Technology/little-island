import { type ArcadeGame, type ArcadeId, type ArcadeWorld } from "./types";
export const reefWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Little Lagoon", detail: "Make room for the first little fish.", stars: 0 },
  { id: "w2", name: "Coral Gardens", detail: "Turn corners. Open new channels.", stars: 12 },
  { id: "w3", name: "Deep Blue", detail: "Plan a reef with room to grow.", stars: 30 },
  { id: "w4", name: "Current Caves", detail: "Cross-currents leave rocky spaces to build around.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Turtle Nursery", detail: "Sheltered fish need winding channels.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Starlight Atoll", detail: "Plan around scattered reef islands.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Make Ten Reef", detail: "Number corals clear when a line makes 10.", stars: 0, learning: true },
];
export const songWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Singing Shore", detail: "Three shells. One little song.", stars: 0 },
  { id: "w2", name: "Tide Chorus", detail: "A new voice joins the shore.", stars: 12 },
  { id: "w3", name: "Moonlight Music", detail: "More shells and longer songs.", stars: 30 },
  { id: "w4", name: "Rain Shell Rhythm", detail: "Listen for rests between the notes.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Mangrove Echo", detail: "Answer a melody with alternating voices.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Dawn Orchestra", detail: "Remember longer phrases across the shore.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Sound a Word", detail: "Hear the sounds. Find their picture. Take your time.", stars: 0, learning: true },
];
export const cargoWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Picnic Harbor", detail: "Pack a little. Sail a little.", stars: 0 },
  { id: "w2", name: "Trade Wind Bay", detail: "Busy boats and precious cargo.", stars: 12 },
  { id: "w3", name: "Moon Tide", detail: "Rising cargo. Keep the harbor open.", stars: 30 },
  { id: "w4", name: "Outrigger Passage", detail: "Pack around the narrow cargo channels.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Monsoon Harbor", detail: "Shifting tides bring uneven stacks.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Star Compass Bay", detail: "Plan deliveries across a crowded hold.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Number Voyage", detail: "Match the sum. Send two canoes!", stars: 0, learning: true },
];
export const flightWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Sunset Forest", detail: "First flutter", stars: 0 },
  { id: "w2", name: "Moonlit Palms", detail: "Follow the moon", stars: 12 },
  { id: "w3", name: "Firefly Grove", detail: "Glow into the breeze", stars: 30 },
  { id: "w4", name: "Trade Wind Ridge", detail: "Gusts push you up and down between the palms.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Rainforest Falls", detail: "Openings breathe and slide with the falling water.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Dawn Canopy", detail: "The tightest openings, with a pulsing tailwind.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Number Canopy", detail: "Fly through the answer", stars: 0, learning: true },
];
export const runWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Morning Beach", detail: "To the water", stars: 0 },
  { id: "w2", name: "Village Festival", detail: "Follow the flags", stars: 12 },
  { id: "w3", name: "Sunset Lagoon", detail: "Chase the sea breeze", stars: 30 },
  { id: "w4", name: "Mangrove Bridges", detail: "Find gaps across the narrow bridges.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Rainy Village", detail: "Moving crabs cross the shell trails.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Festival Headland", detail: "Jump and duck through mixed lane patterns.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Number Boardwalk", detail: "Run into the answer lane", stars: 0, learning: true },
];
export const railWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Garden Parade", detail: "Little chicks. A big adventure.", stars: 0 },
  { id: "w2", name: "Fern Valley", detail: "Find a path around the ferns.", stars: 12 },
  { id: "w3", name: "Firefly Grove", detail: "A moonlit parade through the grove.", stars: 30 },
  { id: "w4", name: "Bamboo Bend", detail: "Turn through narrow bamboo corridors.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Mango Maze", detail: "Thread the parade around island groves.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Sunrise Nest", detail: "Two-turn paths curl toward the nest.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Clever Chicks", detail: "Count and spell. One swipe, one step.", stars: 0, learning: true },
];
export const crabWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Sunny Coast", detail: "Look, hop, ride. Home by the sea.", stars: 0 },
  { id: "w2", name: "Canoe Lagoon", detail: "Catch a ride across the blue.", stars: 12 },
  { id: "w3", name: "Moonlit Tide", detail: "Follow the moon to your burrow.", stars: 30 },
  { id: "w4", name: "Mangrove Channels", detail: "Ride logs that drift in opposite currents.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Rainy Coast", detail: "Choose gaps between mixed traffic lanes.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Sunrise Sandbar", detail: "Hop between small islands and moving logs.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Number Lagoon", detail: "A number path that waits for you.", stars: 0, learning: true },
];
export const palmWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Coconut Cove", detail: "A sunny grove. A gentle first toss.", stars: 0 },
  { id: "w2", name: "Breezy Palms", detail: "Swooping visitors in the sea breeze.", stars: 12 },
  { id: "w3", name: "Moonlit Grove", detail: "More nets. A big beetle friend.", stars: 30 },
  { id: "w4", name: "Breadfruit Ridge", detail: "Diving beetles break from the formation.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Rain Garden", detail: "Shield gaps change the safe toss paths.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Sunrise Palms", detail: "A boss joins fast mixed formations.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Number Grove", detail: "Find the beetle with the matching answer.", stars: 0, learning: true },
];
export const beachWorlds: readonly ArcadeWorld[] = [
  { id: "w1", name: "Sunny Sands", detail: "A ball. A buddy. A sunny rally.", stars: 0 },
  { id: "w2", name: "Turtle Breeze", detail: "Catch the wind. Let the turtle nap.", stars: 12 },
  { id: "w3", name: "Sunset Splash", detail: "Two balls under a violet sky.", stars: 30 },
  { id: "w4", name: "Sandbar Spin", detail: "Edge returns bend the rally.", stars: 50, palette: ["#264E65", "#6DADB0", "#F2D99B"] },
  { id: "w5", name: "Monsoon Match", detail: "Gusts change direction across the court.", stars: 75, palette: ["#4B426E", "#AA8FB6", "#F4C7A4"] },
  { id: "w6", name: "Starfish Finals", detail: "Two balls cross a shifting tide.", stars: 100, palette: ["#704C45", "#D89D7C", "#FFE5A0"] },
  { id: "learn", name: "Counting Coast", detail: "Every splash counts by 2s or 5s.", stars: 0, learning: true },
];
/** Add a finished descriptor here when integrating the next game; IDs are reserved in types.ts. */
export const arcadeGames: readonly ArcadeGame[] = [
  { id: "palm-patrol", name: "Palm Patrol", tagline: "Coconut tosses. Dizzy beetles. Happy palms!", color: "#28684B", surface: "#DBEABD", subject: "math", twoPlayer: false, worlds: palmWorlds, hero: "Coco the grove keeper" },
  { id: "beach-ball", name: "Beach Ball", tagline: "One beach. Two buddies. A whole lot of splash.", color: "#24667E", surface: "#FFE3B5", subject: "math", twoPlayer: true, worlds: beachWorlds, hero: "Bibi the beach ball" },
  { id: "fruit-bat-flight", name: "Fruit Bat Flight", tagline: "Little wings. A glowing forest adventure.", color: "#51456F", surface: "#E7DCEF", subject: "math", twoPlayer: false, worlds: flightWorlds, hero: "Tavi the fruit bat" },
  { id: "lagoon-run", name: "Lagoon Run", tagline: "A shell trail, a sea breeze, and you.", color: "#326C83", surface: "#D9ECEB", subject: "math", twoPlayer: false, worlds: runWorlds, hero: "Kai the lagoon runner" },
  { id: "rail-parade", name: "Rail Parade", tagline: "Tiny chicks. One grand island parade.", color: "#365D45", surface: "#DBEAC3", subject: "reading", twoPlayer: false, worlds: railWorlds, hero: "Rilla the Guam rail" },
  { id: "crab-crossing", name: "Crab Crossing", tagline: "A little hop. A big coastal adventure.", color: "#27637B", surface: "#D6EBEB", subject: "math", twoPlayer: false, worlds: crabWorlds, hero: "Kiko the land crab" },
  { id: "reef-builder", name: "Reef Builder", tagline: "A little coral. A whole ocean of possibilities.", color: "#246858", surface: "#DAEEE7", subject: "math", twoPlayer: false, worlds: reefWorlds, hero: "Pip the reef fish" },
  { id: "canoe-cargo", name: "Canoe Cargo", tagline: "Pack the hold. Catch the tide!", color: "#315D73", surface: "#D6E5DF", subject: "math", twoPlayer: false, worlds: cargoWorlds, hero: "Poko the cargo captain" },
  { id: "shell-song", name: "Shell Song", tagline: "Listen to the lagoon. Play its song back.", color: "#53568B", surface: "#E9E6F5", subject: "reading", twoPlayer: false, worlds: songWorlds, hero: "Mina the singing shell" },
];
export const arcadeGame = (id: ArcadeId) => arcadeGames.find(g => g.id === id);

/** Stable play shelf, independent of parallel registration order; new games remain visible. */
export const arcadeShelfOrder: readonly ArcadeId[] = ["fruit-bat-flight", "lagoon-run", "canoe-cargo", "reef-builder", "shell-song", "rail-parade", "crab-crossing", "palm-patrol", "beach-ball"];
export const arcadeShelfGames = () => [...arcadeGames].sort((a, b) => arcadeShelfOrder.indexOf(a.id) - arcadeShelfOrder.indexOf(b.id));
