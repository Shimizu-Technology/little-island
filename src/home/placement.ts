/** Serializable footprint geometry shared by save validation and UI-thread previews. */
export type Footprint = { id: string; x: number; y: number; w: number; h: number; layer: string };
export function clearFootprint(others: readonly Footprint[], candidate: Footprint): boolean {
  "worklet";
  const { x, y, w, h, layer, id } = candidate;
  const wall = layer === "wall";
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x < 0 || y < 0 || x + w > 16 || y + h > (wall ? 4 : 12))
    return false;
  // The last two floor columns are the doorway; never fill them with furniture.
  return others.every(
    (o) => o.id === id || o.layer !== layer || x + w <= o.x || o.x + o.w <= x || y + h <= o.y || o.y + o.h <= y
  );
}
