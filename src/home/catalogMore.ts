/**
 * Little Island 2.1 contract: the free furniture catalogue, tint palette and extra rooms.
 * Owned by the art slice (fills entries and art); read by the Island Home engine slice.
 * Shapes here are the contract between them — change only by agreement.
 */
import type { ItemSpec } from "./catalog";

/** Free colours any tintable item can be painted. Index 0 is each item's own default colours. */
export const tintPalette = {
  original: null,
  coral: "#F08069",
  sunshine: "#F4C96C",
  lagoon: "#58B9B1",
  sky: "#8CC4E8",
  lilac: "#B59BD6",
  leaf: "#7DB37A",
  cocoa: "#8A6450",
  cloud: "#F4F0E6",
  night: "#3E4A6B",
} as const;
export type TintId = keyof typeof tintPalette;
export const tintIds = Object.keys(tintPalette) as TintId[];

export type MoreItemSpec = ItemSpec & {
  /** Illustrated height/footprint in the 800-unit scene; the Islander stands 163 units tall. */
  itemSize: number;
  /** Free for everyone (no track/badge). */
  free: true;
  /** Can be painted with tintPalette. */
  tintable: boolean;
  /** A surface other small items may sit on (table, shelf, counter, desk, dresser). */
  surface?: boolean;
  /** Small enough to sit on a surface (lamp, plant, vase, books, toy, cake…). */
  small?: boolean;
  /** Category for the Decorate tray. */
  category: "beds-seats" | "tables-storage" | "kitchen" | "plants-nature" | "lights" | "toys-fun" | "rugs-floor" | "wall-art";
  /** Rooms where this fits best (all items may go anywhere). */
  rooms?: readonly RoomId[];
};

/** Room scenes. "home" is the original room-1 (kept for save compatibility). */
export const roomIds = ["home", "kitchen", "treehouse", "beach"] as const;
export type RoomId = (typeof roomIds)[number];
export const roomNames: Record<RoomId, string> = { home: "My room", kitchen: "Kitchen", treehouse: "Tree house", beach: "Beach hut" };

/** Filled by the art slice: about 30 free items. Keys are stable item IDs (kebab-case, no clash with catalog.ts). */
const entry = (name: string, category: MoreItemSpec["category"], footprint: readonly [number, number], options: Partial<MoreItemSpec> & Pick<MoreItemSpec, "itemSize">): MoreItemSpec => ({
  name, category, footprint, layer: "furniture", rotations: [0, 180], mirror: true,
  free: true, tintable: true, rooms: ["home", "treehouse", "beach"], ...options,
});
export const moreCatalog: Record<string, MoreItemSpec> = {
  "beach-towel": entry("Beach towel", "rugs-floor", [2, 1], {itemSize:145,layer:"ground",rooms:["beach"]}),
  "lounger": entry("Beach lounger", "beds-seats", [2, 1], {itemSize:200,rooms:["beach"]}),
  "tv": entry("Calm television", "toys-fun", [2, 1], {itemSize: 160, interactive: "The screen is on"}),
  "radio": entry("Island radio", "toys-fun", [1, 1], {itemSize: 85, small: true, interactive: "Music is on"}),
  "mango": entry("Mango", "kitchen", [1, 1], {itemSize: 55, small: true, tintable: false}),
  "banana": entry("Banana", "kitchen", [1, 1], {itemSize: 55, small: true, tintable: false}),
  "rice-ball": entry("Rice ball", "kitchen", [1, 1], {itemSize: 52, small: true, tintable: false}),
  "cupcake": entry("Cupcake", "kitchen", [1, 1], {itemSize: 55, small: true, tintable: false}),
  "coconut-drink": entry("Coconut drink", "kitchen", [1, 1], {itemSize: 60, small: true, tintable: false}),
  "juice": entry("Juice box", "kitchen", [1, 1], {itemSize: 58, small: true, tintable: false}),
  "book": entry("Little storybook", "toys-fun", [1, 1], {itemSize: 55, small: true}),
  "shell": entry("Seashell", "toys-fun", [1, 1], {itemSize: 48, small: true}),
  "bathtub": entry("Bathtub", "beds-seats", [2, 1], {itemSize: 190}),
  "bubble-bath": entry("Bubble bath", "beds-seats", [2, 1], {itemSize: 190}),
  "bench": entry("Garden bench", "beds-seats", [2, 1], {itemSize: 220}),
  "sofa": entry("Sofa", "beds-seats", [2, 1], {itemSize: 230, }),
  "armchair": entry("Armchair", "beds-seats", [1, 1], {itemSize: 190, }),
  "bunk-bed": entry("Bunk bed", "beds-seats", [2, 2], {itemSize: 230, }),
  "hammock": entry("Hammock", "beds-seats", [2, 1], {itemSize: 190, interactive: "A gentle sway"}),
  "floor-cushion": entry("Floor cushion", "beds-seats", [1, 1], {itemSize: 90, }),
  "rocking-chair": entry("Rocking chair", "beds-seats", [1, 1], {itemSize: 190, }),
  "stool": entry("Stool", "beds-seats", [1, 1], {itemSize: 180, }),
  "desk": entry("Desk", "tables-storage", [2, 1], {itemSize: 145, surface: true}),
  "dresser": entry("Dresser", "tables-storage", [2, 1], {itemSize: 125, surface: true}),
  "bookcase": entry("Bookcase", "tables-storage", [2, 1], {itemSize: 190, surface: true}),
  "side-table": entry("Side table", "tables-storage", [1, 1], {itemSize: 105, surface: true}),
  "coffee-table": entry("Coffee table", "tables-storage", [2, 1], {itemSize: 115, surface: true}),
  "fridge": entry("Fridge", "kitchen", [1, 1], {itemSize: 285, rooms: ["kitchen"], interactive: "The fridge is open"}),
  "stove": entry("Stove", "kitchen", [1, 1], {itemSize: 185, rooms: ["kitchen"], interactive: "The pot is steaming"}),
  "sink-counter": entry("Sink counter", "kitchen", [2, 1], {itemSize: 190, surface: true, rooms: ["kitchen"], interactive: "The water is running"}),
  "kitchen-table": entry("Kitchen table", "kitchen", [2, 1], {itemSize: 145, surface: true, rooms: ["kitchen"]}),
  "cake-stand": entry("Cake stand", "kitchen", [1, 1], {itemSize: 68, small: true, rooms: ["kitchen"]}),
  "fruit-bowl": entry("Fruit bowl", "kitchen", [1, 1], {itemSize: 90, small: true, rooms: ["kitchen"]}),
  "teapot": entry("Teapot", "kitchen", [1, 1], {itemSize: 58, small: true, rooms: ["kitchen"], interactive: "Tea is ready"}),
  "potted-fern": entry("Potted fern", "plants-nature", [1, 1], {itemSize: 72, small: true}),
  "cactus": entry("Cactus", "plants-nature", [1, 1], {itemSize: 62, small: true}),
  "flower-vase": entry("Flower vase", "plants-nature", [1, 1], {itemSize: 65, small: true}),
  "banana-plant": entry("Banana plant", "plants-nature", [1, 1], {itemSize: 170, }),
  "shell-pile": entry("Shell pile", "plants-nature", [1, 1], {itemSize: 55, small: true}),
  "table-lamp": entry("Table lamp", "lights", [1, 1], {itemSize: 72, small: true, interactive: "The light is on"}),
  "string-lights": entry("String lights", "lights", [1, 1], {itemSize: 105, layer: "wall", rotations: [0], mirror: false, interactive: "The lights twinkle"}),
  "lantern": entry("Lantern", "lights", [1, 1], {itemSize: 75, small: true, interactive: "A warm glow"}),
  "floor-lamp": entry("Floor lamp", "lights", [1, 1], {itemSize: 170, interactive: "A warm reading light"}),
  "teddy": entry("Teddy", "toys-fun", [1, 1], {itemSize: 75, small: true, interactive: "A friendly wave"}),
  "ball": entry("Ball", "toys-fun", [1, 1], {itemSize: 60, small: true, interactive: "Bounce!"}),
  "dollhouse": entry("Dollhouse", "toys-fun", [2, 1], {itemSize: 130, }),
  "easel": entry("Easel", "toys-fun", [1, 1], {itemSize: 150, }),
  "guitar": entry("Guitar", "toys-fun", [1, 1], {itemSize: 125, interactive: "A little island strum"}),
  "kite": entry("Kite", "toys-fun", [1, 1], {itemSize: 90, layer: "wall", rotations: [0], mirror: false}),
  "round-rug": entry("Round rug", "rugs-floor", [2, 2], {itemSize: 205, layer: "ground"}),
  "striped-rug": entry("Striped rug", "rugs-floor", [2, 2], {itemSize: 220, layer: "ground"}),
  "star-rug": entry("Star rug", "rugs-floor", [2, 2], {itemSize: 205, layer: "ground"}),
  "sea-picture": entry("Sea picture", "wall-art", [1, 1], {itemSize: 85, layer: "wall", rotations: [0], mirror: false}),
  "clock": entry("Clock", "wall-art", [1, 1], {itemSize: 65, layer: "wall", rotations: [0], mirror: false, interactive: "Tick tock"}),
  "mirror": entry("Mirror", "wall-art", [1, 1], {itemSize: 100, layer: "wall", rotations: [0], mirror: false}),
  "world-map": entry("World map", "wall-art", [1, 1], {itemSize: 105, layer: "wall", rotations: [0], mirror: false}),
};
export type MoreItemId = keyof typeof moreCatalog;
