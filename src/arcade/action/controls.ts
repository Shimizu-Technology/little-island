import type { DragPoint, TouchPoints } from "../Input";
import { arenaTouch, type Arena } from "./arena";
import { clamp } from "./validation";
import { palmStep, palmTransition, type PalmState } from "../games/palm-patrol/engine";
import { beachStep, beachTransition, type BeachState } from "../games/beach-ball/engine";
export type PalmFrame = { x: number; down: boolean; taps: number; helper: boolean; finish: boolean; help?: boolean };
export type BeachFrame = { x: [number | null, number | null]; helper: boolean; finish: boolean };
export function palmFrameStep(s: PalmState, input: PalmFrame, dt: number): PalmState {
  "worklet";
  s = palmTransition(s, { type: "helper", value: input.helper });
  if (input.help) s = palmTransition(s, { type: "help" });
  s = palmTransition(s, { type: "move", x: input.x });
  if (input.finish) return palmTransition(s, { type: "finish" });
  const previousFact = s.fact, freshPress = input.down && !s.fireHeld;
  s = palmStep(s, { type: "tick" }, dt);
  s = { ...s, fireHeld: input.down };
  const tap = input.taps > s.inputTap;
  if (tap) s = { ...s, inputTap: input.taps };
  const learning = s.level !== "endless" && s.level.world === "learn";
  const fire = learning ? s.fact === previousFact && (freshPress || tap) : input.down || tap;
  return fire ? palmTransition(s, { type: "toss" }) : s;
}
export function beachFrameStep(s: BeachState, input: BeachFrame, dt: number): BeachState {
  "worklet";
  s = beachTransition(s, { type: "helper", value: input.helper });
  for (let seat = 0; seat < 2; seat++)
    if (input.x[seat] !== null) s = beachTransition(s, { type: "paddle", seat: seat as 0 | 1, x: input.x[seat]! });
  return input.finish ? beachTransition(s, { type: "finish" }) : beachStep(s, { type: "tick" }, dt);
}
export type SeatPointers = { owners: [number | null, number | null]; seats: Record<number, 0 | 1> };
/** Assign at down, keep the starting seat across centre, ignore extra fingers in an occupied seat. */
export function mapSeatPointers(previous: SeatPointers, points: TouchPoints, arena: Arena): SeatPointers {
  "worklet";
  const owners: SeatPointers["owners"] = [...previous.owners],
    seats = { ...previous.seats };
  for (const key of Object.keys(seats))
    if (!points[Number(key)]?.down) {
      const id = Number(key);
      if (owners[seats[id]] === id) owners[seats[id]] = null;
      delete seats[id];
    }
  for (const key of Object.keys(points)) {
    const id = Number(key),
      p = points[id];
    if (!p.down || seats[id] !== undefined) continue;
    const seat = arenaTouch(arena, p.x, p.y).y < 300 ? 1 : 0;
    seats[id] = seat;
    if (owners[seat] === null) owners[seat] = id;
  }
  return { owners, seats };
}
export function aimPoint(point: DragPoint, arena: Arena) {
  "worklet";
  return clamp(arenaTouch(arena, point.x, point.y).x, 24, 336);
}
