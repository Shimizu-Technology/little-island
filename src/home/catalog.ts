import { moreCatalog, type MoreItemSpec } from "./catalogMore";
import { stickerIds, type StickerId } from "../arcade/progress";
export type Track = "Math" | "Reading" | "Science & Thinking" | "Coding" | "CHamoru words" | "Arcade" | "Classic" | "Island";
export type ItemSpec = {
  name: string;
  footprint: readonly [number, number];
  layer: "ground" | "furniture" | "wall";
  rotations: readonly (0 | 90 | 180 | 270)[];
  mirror: boolean;
  interactive?: string;
  track?: Track;
  badge?: `${string}-${1|2|3|4}`;
};
const furniture = (
  name: string,
  footprint: readonly [number, number] = [1, 1],
  track?: Track,
  interactive?: string
): ItemSpec => ({ name, footprint, layer: "furniture", rotations: [0, 180], mirror: true, track, interactive });
export const catalog = {
  bed: furniture("Cloud bed", [2, 2]),
  rug: { ...furniture("Lagoon rug", [3, 2]), layer: "ground" as const },
  table: furniture("Pebble table", [2, 1]),
  chair: furniture("Coral chair"),
  shelf: furniture("Little treasures shelf", [2, 1]),
  plant: furniture("Happy palm"),
  lamp: furniture("Sunshine lamp", [1, 1], undefined, "The light is on"),
  "toy-box": furniture("Toy chest", [2, 1], undefined, "The toys are out"),
  blocks: { ...furniture("Number blocks", [1, 1], "Math"), badge: 'math-2' as const },
  abacus: { ...furniture("Rainbow abacus", [2, 1], "Math"), badge: 'math-3' as const },
  books: { ...furniture("Storybook library", [2, 1], "Reading"), badge: 'reading-3' as const },
  beanbag: { ...furniture("Reading cloud", [2, 1], "Reading"), badge: 'reading-2' as const },
  aquarium: { ...furniture("Pip’s reef", [2, 1], "Science & Thinking", "Pip swims hello"), badge: 'science-3' as const },
  telescope: { ...furniture("Stargazer telescope", [1, 1], "Science & Thinking"), badge: 'science-3' as const },
  globe: { ...furniture("Little blue planet", [1, 1], "Science & Thinking"), badge: 'science-2' as const },
  mat: { ...furniture("Woven island mat", [2, 2], "CHamoru words"), layer: "ground" as const, badge: "chamoru-2" as const },
  "island-lamp": { ...furniture("Woven glow lamp", [1, 1], "CHamoru words", "A warm island glow"), badge: 'chamoru-3' as const },
  trophies: { ...furniture("Good times shelf", [2, 1], "Arcade"), badge: 'arcade-3' as const },
  arcade: { ...furniture("Pocket arcade", [1, 1], "Arcade", "Ready for pretend play"), badge: 'arcade-2' as const },
  checkers: { ...furniture("Checkers for two", [2, 1], "Classic"), badge: 'classic-1' as const },
  chime: {
    ...furniture("Shell wind chime", [1, 1], "Classic", "Ting! A sea-breeze song"),
    badge: "classic-3" as const,
    layer: "wall" as const,
    rotations: [0] as const,
    mirror: false,
  },
  "robot-buddy": { ...furniture("Robot buddy", [1,1], "Coding", "Beep says hello"), badge: "coding-2" as const },
  "computer-desk": { ...furniture("Computer desk", [2,1], "Coding", "A little code lights up"), badge: "coding-4" as const },
  surfboard: { ...furniture("Lagoon surfboard", [1, 1], "Classic"), badge: "classic-2" as const },
} satisfies Record<string, ItemSpec>;
export type FurnitureId = keyof typeof catalog;
export type ItemId = FurnitureId | `sticker:${StickerId}` | (string & {});
export const furnitureIds = Object.keys(catalog) as FurnitureId[];
export const starterItems = furnitureIds.filter((id) => !catalog[id].track);
export const itemIds: readonly string[] = [...furnitureIds, ...Object.keys(moreCatalog), ...stickerIds.map((id) => `sticker:${id}`)];
export function itemSpec(id: ItemId): ItemSpec {
  if (id.startsWith("sticker:"))
    return { name: id.slice(8).replaceAll("-", " "), footprint: [1, 1], layer: "wall", rotations: [0], mirror: false };
  return moreCatalog[id] ?? catalog[id as FurnitureId];
}
export const wallThemes = ["cream", "lagoon", "night", "peach", "math-lab", "library", "night-sky", "arcade-neon"] as const;
export const floorThemes = ["sand", "honey", "seafoam", "rose", "island-breeze", "game-room"] as const;
export const badgeIds = ["math", "reading", "science", "coding", "chamoru", "arcade", "classic"] as const;
export type BadgeId = (typeof badgeIds)[number];

/** Reuse the existing arcade sticker ownership; no grants or copies. */
export const homeStickerItems = (stickers: readonly StickerId[]): ItemId[] => stickers.map(id => `sticker:${id}` as ItemId);

export const themeRewards = [
  { id: 'math-lab', slot: 'wallpaper', name: 'Math Lab', earned: true, track: 'math', badge: 'math-4' },
  { id: 'library', slot: 'wallpaper', name: 'Library', earned: true, track: 'reading', badge: 'reading-4' },
  { id: 'night-sky', slot: 'wallpaper', name: 'Night Sky', earned: true, track: 'science', badge: 'science-4' },
  { id: 'arcade-neon', slot: 'wallpaper', name: 'Arcade Neon', earned: true, track: 'arcade', badge: 'arcade-4' },
  { id: 'island-breeze', slot: 'floor', name: 'Island Breeze', earned: true, track: 'chamoru', badge: 'chamoru-4' },
  { id: 'game-room', slot: 'floor', name: 'Game Room', earned: true, track: 'classic', badge: 'classic-4' },
] as const;

/** Metadata for the original collection, extended without changing its art contract. */
export function decorSpec(id: ItemId): ItemSpec & Partial<MoreItemSpec> {
  if (moreCatalog[id]) return moreCatalog[id];
  const spec = itemSpec(id);
  return { ...spec, tintable: !id.startsWith("sticker:"),
    surface: ["table", "shelf", "toy-box", "books", "trophies"].includes(id),
    small: ["lamp", "plant", "blocks", "globe", "island-lamp"].includes(id),
    category: id.startsWith("sticker:") || spec.layer === "wall" ? "wall-art" : spec.layer === "ground" ? "rugs-floor" : ["bed", "chair", "beanbag"].includes(id) ? "beds-seats" : ["plant", "globe"].includes(id) ? "plants-nature" : ["lamp", "island-lamp"].includes(id) ? "lights" : ["table", "shelf", "books", "trophies"].includes(id) ? "tables-storage" : "toys-fun" };
}
export const isSeat = (id: ItemId) => ["bed", "chair", "rug", "beanbag", "shelf"].includes(id) || decorSpec(id).category === "beds-seats";
