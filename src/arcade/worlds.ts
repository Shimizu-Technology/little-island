import type { WorldId } from "./types";
export type WorldPalette = { top: string; water: string; sand: string; ink: string; accent: string };
/** Exhaustive maps: adding a world must supply its own colours and motif. */
export const worldPalettes: Record<WorldId, WorldPalette> = {
  w1: { top: "#077C91", water: "#52C4C2", sand: "#E7D5A1", ink: "#FFF8E4", accent: "#FFE197" },
  w2: { top: "#136D77", water: "#6DB9B0", sand: "#E8C196", ink: "#FFF8E4", accent: "#FFCC8E" },
  w3: { top: "#163F70", water: "#688FB9", sand: "#D9CCAD", ink: "#FFF8E4", accent: "#E6D9FF" },
  w4: { top: "#385E69", water: "#75B9AE", sand: "#DFC88E", ink: "#FFF8E4", accent: "#C9ECA5" },
  w5: { top: "#534677", water: "#958DBB", sand: "#E3B8A1", ink: "#FFF8E4", accent: "#F4C2E9" },
  w6: { top: "#95544D", water: "#70AAA8", sand: "#F2D19A", ink: "#FFF8E4", accent: "#FFE8A8" },
  learn: { top: "#157F85", water: "#8BCDB4", sand: "#EEE1B5", ink: "#FFF8E4", accent: "#FFE197" },
};
export const nightPalettes: Record<WorldId, WorldPalette> = {
  w1: { ...worldPalettes.w1, top: "#222958", water: "#466C98", sand: "#BEB6D6" },
  w2: { ...worldPalettes.w2, top: "#253F65", water: "#527B97", sand: "#C2BDDA" },
  w3: { ...worldPalettes.w3, top: "#161C48", water: "#3B5C8C", sand: "#ACA9CC" },
  w4: { ...worldPalettes.w4, top: "#1E494B", water: "#548D84", sand: "#B4C4A4" },
  w5: { ...worldPalettes.w5, top: "#45335F", water: "#816697", sand: "#CFB4CF" },
  w6: { ...worldPalettes.w6, top: "#5D384B", water: "#9C7383", sand: "#E0BDAB" },
  learn: { ...worldPalettes.learn, top: "#433560", water: "#697BA2", sand: "#CBC0DC" },
};
export const worldMotifs: Record<WorldId, { kind: "rays" | "ripples" | "stars" | "leaves" | "pearls" | "sunburst" | "sparks"; count: number }> = {
  w1: { kind: "rays", count: 4 }, w2: { kind: "ripples", count: 5 }, w3: { kind: "stars", count: 8 },
  w4: { kind: "leaves", count: 6 }, w5: { kind: "pearls", count: 7 }, w6: { kind: "sunburst", count: 9 }, learn: { kind: "sparks", count: 5 },
};
/** Array-based art uses this exhaustive lookup, with no untyped world fallback. */
export const worldIndex: Record<WorldId, number> = { w1: 0, w2: 1, w3: 2, w4: 3, w5: 4, w6: 5, learn: 6 };
