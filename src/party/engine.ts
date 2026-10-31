import { nameLength } from "../games/match";
import { random } from "../games/types";
import { PartyPackId, PartyWordId, PARTY_PACKS, partyPack } from "./content";
export type PartyResult = {
  winner: "family" | "imposter";
  reason: "caught" | "wrong-suspect" | "tied";
  suspect: number | null;
};
export type PartySession = {
  version: 1;
  game: "word-imposter";
  id: string;
  revision: number;
  players: string[];
  pack: PartyPackId;
  wordId: PartyWordId;
  imposter: number;
  clueRounds: 1 | 2;
  phase: "roles" | "clues" | "voting" | "runoff" | "result";
  roleCursor: number;
  clueCursor: number;
  firstClue?: number;
  ballots: number[];
  runoffBallots: number[];
  result: PartyResult | null;
};
export type PartyIntent = {
  sessionId: string;
  revision: number;
  player: number;
  type: "role-done" | "clue-done" | "vote";
  target?: number;
};
export type PartySetup = {
  players: string[];
  pack?: PartyPackId;
  clueRounds?: 1 | 2;
  seed?: number;
  id?: string;
  previousWord?: PartyWordId;
  previousImposter?: number;
  firstClue?: number;
};
export const PARTY_NAME_MAX = 24;
/** The same field-level rule is used by setup and imported-session validation. */
export function partyNameError(name: string, players: readonly string[], index: number): string | null {
  const tidy = name.trim();
  if (!tidy) return "Enter a name (1–24 characters).";
  if (nameLength(tidy) > PARTY_NAME_MAX) return `${nameLength(tidy)} characters · limit ${PARTY_NAME_MAX}.`;
  if (/[\u0000-\u001f\u007f]/.test(tidy)) return "Use a name without control characters.";
  if (players.some((p, i) => i !== index && p.trim().normalize("NFKC").toLowerCase() === tidy.normalize("NFKC").toLowerCase())) return "Choose a different name for each player.";
  return null;
}
export function validPartyNames(players: unknown): players is string[] {
  return (
    Array.isArray(players) &&
    players.length >= 3 &&
    players.length <= 8 &&
    players.every(
      (p) =>
        typeof p === "string" &&
        p.trim() === p &&
        p.length >= 1 &&
        nameLength(p) <= PARTY_NAME_MAX &&
        !/[\u0000-\u001f\u007f]/.test(p)
    ) &&
    new Set(players.map((p) => p.normalize("NFKC").toLowerCase())).size === players.length
  );
}
export function createPartySession(setup: PartySetup): PartySession {
  if (setup.id !== undefined && (typeof setup.id !== "string" || setup.id.length < 1 || setup.id.length > 120))
    throw new Error("Invalid round identity.");
  const players = setup.players.map((p) => p.trim());
  if (!validPartyNames(players)) throw new Error("Choose 3 to 8 different player names, with 1 to 24 characters each.");
  const pack = setup.pack ?? "animals",
    words = partyPack(pack)?.words;
  if (!words || (setup.clueRounds !== undefined && setup.clueRounds !== 1 && setup.clueRounds !== 2))
    throw new Error("Choose an available pack and one or two clue circles.");
  const seed = (setup.seed ?? Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const candidates = words.filter((w) => w.id !== setup.previousWord),
    wordId = candidates[seed % candidates.length].id;
  // Every player remains eligible, including the previous Imposter.
  const rng = random(seed);
  const imposter = Math.floor(rng() * players.length);
  const firstClue = setup.firstClue ?? Math.floor(rng() * players.length);
  if (!Number.isInteger(firstClue) || firstClue < 0 || firstClue >= players.length) throw new Error("Choose a valid first clue giver.");
  return {
    version: 1,
    game: "word-imposter",
    id: setup.id ?? `party-${Date.now()}-${seed}`,
    revision: 0,
    players,
    pack,
    wordId,
    imposter,
    clueRounds: setup.clueRounds ?? 1,
    phase: "roles",
    roleCursor: 0,
    clueCursor: 0,
    firstClue,
    ballots: [],
    runoffBallots: [],
    result: null,
  };
}
export function partyCandidates(s: PartySession): number[] {
  return s.phase === "runoff" ? topPartyVotes(s.ballots) : s.players.map((_, i) => i);
}
export function partyActor(s: PartySession): number | null {
  return s.phase === "roles"
    ? s.roleCursor
    : s.phase === "clues"
      ? ((s.firstClue ?? 0) + s.clueCursor) % s.players.length
      : s.phase === "voting"
        ? s.ballots.length
        : s.phase === "runoff"
          ? s.runoffBallots.length
          : null;
}
export function topPartyVotes(votes: readonly number[]): number[] {
  const counts = new Map<number, number>();
  for (const target of votes) counts.set(target, (counts.get(target) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  return [...counts]
    .filter(([, count]) => count === max)
    .map(([target]) => target)
    .sort((a, b) => a - b);
}
function resultFor(s: PartySession, leaders: number[]): PartyResult {
  if (leaders.length !== 1) return { winner: "imposter", reason: "tied", suspect: null };
  return leaders[0] === s.imposter
    ? { winner: "family", reason: "caught", suspect: leaders[0] }
    : { winner: "imposter", reason: "wrong-suspect", suspect: leaders[0] };
}
/** A stale revision, repeated delivery, wrong actor, illegal vote or terminal intent is an identity no-op. */
export function partyAction(s: PartySession, action: PartyIntent): PartySession {
  if (
    !validPartySession(s) ||
    action.sessionId !== s.id ||
    action.revision !== s.revision ||
    action.player !== partyActor(s) ||
    s.phase === "result"
  )
    return s;
  let next: PartySession;
  if (s.phase === "roles" && action.type === "role-done") {
    const roleCursor = s.roleCursor + 1;
    next = { ...s, roleCursor, phase: roleCursor === s.players.length ? "clues" : "roles" };
  } else if (s.phase === "clues" && action.type === "clue-done") {
    const clueCursor = s.clueCursor + 1;
    next = { ...s, clueCursor, phase: clueCursor === s.players.length * s.clueRounds ? "voting" : "clues" };
  } else if (
    (s.phase === "voting" || s.phase === "runoff") &&
    action.type === "vote" &&
    Number.isInteger(action.target) &&
    action.target !== action.player &&
    partyCandidates(s).includes(action.target!)
  ) {
    const field = s.phase === "voting" ? "ballots" : "runoffBallots",
      votes = [...s[field], action.target!];
    next = { ...s, [field]: votes };
    if (votes.length === s.players.length) {
      const leaders = topPartyVotes(votes);
      if (s.phase === "voting" && leaders.length > 1) next.phase = "runoff";
      else {
        next.phase = "result";
        next.result = resultFor(s, leaders);
      }
    }
  } else return s;
  return { ...next, revision: s.revision + 1 };
}
function validVotes(votes: unknown, n: number, candidates: readonly number[]): votes is number[] {
  return (
    Array.isArray(votes) &&
    votes.length <= n &&
    votes.every(
      (target, voter) =>
        Number.isInteger(target) && target >= 0 && target < n && target !== voter && candidates.includes(target)
    )
  );
}
export function validPartySession(value: unknown): value is PartySession {
  if (!value || typeof value !== "object") return false;
  const s = value as PartySession;
  if (
    s.version !== 1 ||
    s.game !== "word-imposter" ||
    typeof s.id !== "string" ||
    s.id.length < 1 ||
    s.id.length > 120 ||
    !Number.isInteger(s.revision) ||
    s.revision < 0 ||
    s.revision > 48 ||
    !validPartyNames(s.players) ||
    !PARTY_PACKS.some((p) => p.id === s.pack) ||
    !partyPack(s.pack).words.some((w) => w.id === s.wordId) ||
    !Number.isInteger(s.imposter) ||
    s.imposter < 0 ||
    s.imposter >= s.players.length ||
    (s.firstClue !== undefined && (!Number.isInteger(s.firstClue) || s.firstClue < 0 || s.firstClue >= s.players.length)) ||
    ![1, 2].includes(s.clueRounds) ||
    !["roles", "clues", "voting", "runoff", "result"].includes(s.phase)
  )
    return false;
  const n = s.players.length,
    clues = n * s.clueRounds,
    all = s.players.map((_, i) => i);
  if (
    !Number.isInteger(s.roleCursor) ||
    s.roleCursor < 0 ||
    s.roleCursor > n ||
    !Number.isInteger(s.clueCursor) ||
    s.clueCursor < 0 ||
    s.clueCursor > clues ||
    !validVotes(s.ballots, n, all)
  )
    return false;
  const leaders = topPartyVotes(s.ballots);
  if (
    !validVotes(s.runoffBallots, n, leaders) ||
    s.revision !== s.roleCursor + s.clueCursor + s.ballots.length + s.runoffBallots.length
  )
    return false;
  if (s.phase === "roles")
    return (
      s.roleCursor < n &&
      s.clueCursor === 0 &&
      s.ballots.length === 0 &&
      s.runoffBallots.length === 0 &&
      s.result === null
    );
  if (s.roleCursor !== n) return false;
  if (s.phase === "clues")
    return s.clueCursor < clues && s.ballots.length === 0 && s.runoffBallots.length === 0 && s.result === null;
  if (s.clueCursor !== clues) return false;
  if (s.phase === "voting") return s.ballots.length < n && s.runoffBallots.length === 0 && s.result === null;
  if (s.ballots.length !== n) return false;
  if (s.phase === "runoff") return leaders.length > 1 && s.runoffBallots.length < n && s.result === null;
  if (leaders.length > 1 ? s.runoffBallots.length !== n : s.runoffBallots.length !== 0) return false;
  const expected = resultFor(s, leaders.length > 1 ? topPartyVotes(s.runoffBallots) : leaders);
  return (
    !!s.result &&
    s.result.winner === expected.winner &&
    s.result.reason === expected.reason &&
    s.result.suspect === expected.suspect
  );
}
export function rematchParty(s: PartySession): PartySession {
  return createPartySession({
    players: [...s.players],
    pack: s.pack,
    clueRounds: s.clueRounds,
    previousWord: s.wordId,
    previousImposter: s.imposter,
    firstClue: ((s.firstClue ?? 0) + 1) % s.players.length,
  });
}
