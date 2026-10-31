import { Seat, cleanName, defaultNames, newMatch, nextStarter, settle, validMatch, validSeat, NAME_MAX, nameLength } from "../games/match";
import { random } from "../games/types";
import { engines } from "./engines";
import { dayNumber } from "./skills";
import { LearnId, LearnOptions, LearnSession, Outcome, SkillProgress, learnIds } from "./types";
import { isGrowth } from "./growth/engine";
import { isMathGame, validMathOptions } from "./games/shell-math/round";

const MODES = ["solo", "together", "versus"] as const;
const PACES = ["easy", "medium", "hard"] as const;

export function outcomeOf(session: LearnSession): Outcome {
  return engines[session.game].outcome(session.state, session.options);
}
export const finished = (session: LearnSession) => outcomeOf(session) !== null;

export type StartChoices = {
  options: LearnOptions;
  names?: readonly string[];
  starter?: Seat;
  alternate?: boolean;
};

/** A fresh round from the setup sheet. */
export function startSession(game: LearnId, choices: StartChoices, skills: SkillProgress | undefined, seed = Date.now() >>> 0): LearnSession {
  const engine = engines[game];
  const options = { ...choices.options };
  // New setup callers use the supported pace list; an older generic caller may still
  // request "hard". Canonicalize a fresh round only, never rewrite a saved round.
  if (engine.paces && !engine.paces.includes(options.pace)) options.pace = engine.paces[0];
  const starter: Seat = choices.starter ?? 0;
  const twoPlayer = options.mode !== "solo";
  const names: [string, string] | undefined = twoPlayer
    ? [cleanName(choices.names?.[0] ?? "", defaultNames[0]), cleanName(choices.names?.[1] ?? "", defaultNames[1])]
    : undefined;
  return {
    game,
    version: 1,
    id: `${game}-${seed.toString(36)}-${Math.floor(random(seed)() * 1e9).toString(36)}`,
    revision: 0,
    levelHelped: false,
    options,
    ...(names ? { names } : {}),
    ...(twoPlayer ? { starter } : {}),
    ...(options.mode === "versus" ? { match: newMatch(names, choices.alternate ?? true) } : {}),
    state: engine.create(options, { skills: skills ?? {}, rng: random(seed ^ 0x5bd1e995), starter, today: dayNumber() }),
  };
}

/** "Play again": same players and options, score carried, starter alternated when chosen. */
export function replaySession(previous: LearnSession, skills: SkillProgress | undefined, seed = Date.now() >>> 0, learner = previous.learner): LearnSession {
  const engine = engines[previous.game];
  const result = outcomeOf(previous);
  const match = previous.match ? settle(previous.match, result === "done" ? null : result) : undefined;
  const starter: Seat = previous.match ? nextStarter(previous.match, previous.starter ?? 0) : previous.options.mode === "together" ? ((previous.starter ?? 0) === 0 ? 1 : 0) : 0;
  return {
    ...previous,
    ...(learner ? { learner } : {}),
    id: `${previous.game}-${seed.toString(36)}-${Math.floor(random(seed)() * 1e9).toString(36)}`,
    revision: 0,
    levelHelped: false,
    ...(match ? { match } : {}),
    ...(previous.options.mode !== "solo" ? { starter } : {}),
    state: engine.create(previous.options, {
      previous: previous.state,
      skills: skills ?? {},
      rng: random(seed ^ 0x5bd1e995),
      starter,
      today: dayNumber(),
    }),
  };
}

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const validName = (v: unknown) => typeof v === "string" && v.trim().length > 0 && nameLength(v) <= NAME_MAX;

export function validLearnSession(value: unknown, key?: string): value is LearnSession {
  if (!obj(value) || !learnIds.includes(value.game as LearnId) || (key !== undefined && value.game !== key)) return false;
  const o = value.options;
  if (
    value.version !== 1 ||
    typeof value.id !== "string" ||
    value.id.length < 3 ||
    value.id.length > 120 ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 0 ||
    value.revision > 1_000_000 ||
    !obj(o) ||
    !MODES.includes(o.mode as (typeof MODES)[number]) ||
    !PACES.includes(o.pace as (typeof PACES)[number]) ||
    (o.language !== undefined && o.language !== "en" && o.language !== "ch") ||
    Object.keys(o).some((k) => !["mode", "pace", "language", "stage", ...(isMathGame(value.game as string) ? ["mathOperation"] : [])].includes(k))
  )
    return false;
  const engine = engines[value.game as LearnId];
  if (o.stage !== undefined && o.stage !== "stretch" && o.stage !== "deep") return false;
  if (value.levelHelped !== undefined && typeof value.levelHelped !== "boolean") return false;
  if (value.learner !== undefined && (typeof value.learner !== "string" || !/^[a-z0-9-]{1,40}$/.test(value.learner))) return false;
  if (isMathGame(value.game as string) && !validMathOptions(o as LearnOptions)) return false;
  if (!engine.modes.includes(o.mode as LearnOptions["mode"])) return false;
  if (o.language === "ch" && !engine.languages?.includes("ch")) return false;
  const twoPlayer = o.mode !== "solo";
  if (value.names !== undefined && (!Array.isArray(value.names) || value.names.length !== 2 || !value.names.every(validName))) return false;
  if (value.starter !== undefined && !validSeat(value.starter)) return false;
  if (!twoPlayer && (value.match !== undefined || value.starter !== undefined || value.names !== undefined)) return false;
  if (o.mode === "versus" ? !validMatch(value.match) : value.match !== undefined) return false;
  if (o.stage && isGrowth(value.state) && value.state.starter !== (twoPlayer ? value.starter ?? 0 : 0)) return false;
  return engine.validate(value.state, o as LearnOptions);
}

export function validLearn(value: unknown): value is Partial<Record<LearnId, LearnSession>> {
  return obj(value) && Object.entries(value).every(([key, session]) => validLearnSession(session, key));
}

/** Preferences use the same supported options as a resumable session. */
export function validLearnOptions(game: LearnId, value: unknown): value is LearnOptions {
  if (!obj(value) || !MODES.includes(value.mode as LearnOptions["mode"]) || !PACES.includes(value.pace as LearnOptions["pace"]) || Object.keys(value).some(k => !["mode", "pace", "language", "stage", ...(isMathGame(game) ? ["mathOperation"] : [])].includes(k))) return false;
  const engine = engines[game];
  return engine.modes.includes(value.mode as LearnOptions["mode"]) &&
    (value.stage === undefined || value.stage === "stretch" || value.stage === "deep") &&
    (value.language === undefined || value.language === "en" || (value.language === "ch" && !!engine.languages?.includes("ch"))) &&
    (!isMathGame(game) || validMathOptions(value as LearnOptions));
}
