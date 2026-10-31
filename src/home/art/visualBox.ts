import type { ItemId } from '../catalog';
import { decorSpec, itemSpec } from '../catalog';
import { moreCatalog } from '../catalogMore';
import type { VisualBox } from '../world';
/** Matches geometry.itemSize without importing the engine. Engine places its square at
 * (itemPoint.x - size/2, itemPoint.y - size*.85). SVGs are clipped to this square.
 * Phase 2 reads the revised seat sizes directly from moreCatalog; the same square
 * contains both fridge door states, radio notes and lamp floor pools.
 * Intentionally conservative: includes stroke, shadows, hats are a character concern.
 * Current art supports horizontal facing swaps, never a screen-space 90° rotation.
 */
export function visualBox(item: ItemId, rotation = 0, mirrored = false): VisualBox {
  const spec = itemSpec(item);
  if (!spec) throw new RangeError(`Unknown item ${item}`);
  if (![0,90,180,270].includes(rotation) || typeof mirrored !== 'boolean') throw new RangeError('Invalid art orientation');
  const more = moreCatalog[item], decor = decorSpec(item);
  const size = more ? Math.round(more.itemSize * 1.18) : item === 'bed' ? 260 : spec.layer === 'ground' ? 250 : spec.layer === 'wall' ? 90 : decor.category === 'beds-seats' ? Math.max(...spec.footprint) >= 2 ? 218 : 165 : decor.small ? 105 : ['table','shelf','books','trophies','aquarium','checkers','toy-box','beanbag'].includes(item) || Math.max(...spec.footprint) >= 2 ? 182 : 148;
  return { left: -size / 2, top: -size * .85, width: size, height: size };
}
