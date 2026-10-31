import { livingCapabilities } from './art/living';
import { seatSockets } from './art/sockets';
import type { ItemId } from "./catalog";

/**
 * Island Home 2.4 contract: the Toca-style living world.
 *
 * Shared between the world engine (src/home/HomeScreen, model, geometry, Drag) and
 * the rig and art slices (src/islander/rig, src/home/art). Art declares what
 * each item can do. The engine decides where things land and what state they
 * are in. The rig draws the pose, and it never knows about rooms.
 */

/** How a character is posed. Furniture decides the pose; the child never picks it from a menu. */
export type WorldPose = "stand" | "sit" | "lie" | "bathe";

/** A spot on a piece of furniture where a character settles when dropped near it. */
export type SocketKind = "sit" | "lie" | "bathe";

export type Socket = Readonly<{
  id: string;
  kind: SocketKind;
  /**
   * Where the character's anchor lands, in the item's unrotated, unmirrored art box.
   * 0..1 of the drawn width and height; (0, 0) is the top-left corner.
   * Anchors: the feet for "stand", the seat contact for "sit", the head of the pillow end for "lie",
   * and the waterline centre for "bathe".
   */
  at: readonly [number, number];
  /** "lie" lies with the head at `at`. Mirroring the item mirrors this. */
  facing: "left" | "right" | "front";
  /**
   * The item's front layer (blanket, rail, counter, tub side) draws over the character.
   * The engine renders the back art, then the character, then the front art.
   */
  covered?: boolean;
}>;

/** Tap reactions. State is a boolean on the instance (on/off, open/closed). */
export type ToggleKind = "light" | "water" | "power" | "open";

export type Capability = Readonly<{
  /** Toca rule: almost everything can be dragged in Play. Built-in fixtures (stove, sink) can set false. */
  moveInPlay: boolean;
  /** A character can carry it: drop it on a hand. */
  holdable?: boolean;
  /** Dropping it on a character's mouth plays eat or drink, then removes it (food) or empties it (drink). */
  edible?: "food" | "drink";
  /** Tapping it toggles a visible state. */
  toggle?: ToggleKind;
  /** Furniture spots that give a pose. */
  sockets?: readonly Socket[];
  /** Tapping it while open offers food the child can drag out (fridge, fruit bowl). Never depletes. */
  dispenses?: readonly ItemId[];
}>;

/** Art fills this per item (src/home/art). The engine reads it only through `capabilityOf`. */
export const capabilities: Partial<Record<ItemId, Capability>> = { ...Object.fromEntries(Object.entries(seatSockets).map(([id, sockets]) => [id, { moveInPlay: true, sockets }])), ...livingCapabilities };

/** The default for items the art slice hasn't described yet: movable in Play, no special behaviour. */
export function capabilityOf(item: ItemId): Capability {
  return capabilities[item] ?? { moveInPlay: true };
}

/** The layer to draw. "all" is the classic single image; "back"/"front" split around an occupant. */
export type ArtLayer = "all" | "back" | "front";

/** Visible interactive state passed to item art. */
export type ItemVisualState = Readonly<{ on?: boolean; empty?: boolean }>;

/**
 * The containment rule: every instance's drawn bounds stay inside its room's interior.
 * The engine clips room content to the room. The art slice exports each item's
 * visual box relative to its footprint anchor (see `visualBox`), so the clamp uses what's drawn.
 */
export type VisualBox = Readonly<{ left: number; top: number; width: number; height: number }>;

export { visualBox } from './art/visualBox';
