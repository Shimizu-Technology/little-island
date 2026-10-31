import type { LearnEngine } from "./types";
/** Placeholder until a game's worker replaces its engine. Validates and plays nothing. */
export type StubState = { stub: true };
export function stubEngine(meta: Omit<LearnEngine<StubState>, "create" | "validate" | "outcome" | "skills"> & { skills?: Record<string, string> }): LearnEngine<StubState> {
  return {
    skills: {},
    ...meta,
    create: () => ({ stub: true }),
    validate: (state: unknown): state is StubState => !!state && typeof state === "object" && (state as StubState).stub === true,
    outcome: () => null,
  };
}
