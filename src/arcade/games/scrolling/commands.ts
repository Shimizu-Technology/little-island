import { flightStep, flightTransition, type FlightInput, type FlightState } from "../fruit-bat-flight/engine";
import { runStep, runTransition, type RunInput, type RunState } from "../lagoon-run/engine";
import type { Commands } from "../../mailbox";
export type { Commands } from "../../mailbox";
/** A bounded command mailbox retains fast downs between frames, consumed exactly once on UI. */
export function flightFrame(s: FlightState, input: Commands<FlightInput>, dt: number) {
  "worklet";
  if (s.helper !== input.helper) s = flightTransition(s, { type: "helper", value: input.helper });
  for (const cmd of input.queue) if (cmd.id > s.command) { s = { ...flightTransition(s, cmd.action), command: cmd.id }; }
  return flightStep(s, { type: "idle" }, dt);
}
export function runFrame(s: RunState, input: Commands<RunInput>, dt: number) {
  "worklet";
  if (s.helper !== input.helper) s = runTransition(s, { type: "helper", value: input.helper });
  for (const cmd of input.queue) if (cmd.id > s.command) { s = { ...runTransition(s, cmd.action), command: cmd.id }; }
  return runStep(s, { type: "idle" }, dt);
}
