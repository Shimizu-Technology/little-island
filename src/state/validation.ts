import { validRoundOwners, type RoundOwners } from '../badges/owners';
import { BoardId, BoardSessions, boardIds, isBoardId, validBoardSessions } from "../board";
import { ExploreProgress, validExploreProgress } from "../explore/progress";
import { GameId, GameState, gameIds } from "../games";
import { checkersResult } from "../games/checkers";
import { ticOutcome, lines } from "../games/tic";
import { memoryKey, validMemoryCard } from "../games/memory";
import { WordRecords, validWordRecords } from "./wordRecords";
import { Activities, ActivityId, activityIds, validActivities, validActivityRecords } from "./activities";
import type { RaceRecords } from "../racer/engine";
import { normalizeExploreFavorites, topicById } from "../explore/content";
import { WORDS } from "../games/words";
import { validMatch, validSeat, validPlayers } from "../games/match";
import type { LearnId, LearnSession, SkillProgress } from "../learn/types";
import { learnIds } from "../learn/types";
import { validLearn } from "../learn/session";
import { validLearners, type Learners } from "../learn/learners";
import { validSkills } from "../learn/skills";
import { PracticeNotes, PracticeSettings, validPracticeNotes, validPracticeSettings } from "../practice/types";
import { arcadeIds, validArcade, migrateArcade, type ArcadeId, type ArcadeSave } from "../arcade";
import { validPersonalization, type Personalization } from "../personalization/model";
export type Settings = { sound: boolean; help: boolean; homeNavigationSeen?: boolean; learningIslander?: boolean; practice?: PracticeSettings; narration?: boolean; effects?: boolean; automaticSpeech?: boolean; narrationVolume?: number; voice?: "warm" | "calm" };
export type Save = {
  version: 1;
  roundOwners?: RoundOwners;
  personalization?: Personalization;
  /** Island Arcade progress and validated untimed Reef rounds; real-time rounds are never persisted. */
  arcade?: ArcadeSave;
  settings: Settings;
  sessions: Partial<Record<GameId, GameState>>;
  recent: GameId | null;
  favoriteGames?: (GameId | ActivityId | LearnId | BoardId | ArcadeId)[];
  /** Board classics: one strictly replay-validated session per game. */
  board?: BoardSessions;
  recentBoard?: BoardId | null;
  wordRecords?: WordRecords;
  activities?: Activities;
  recentActivity?: ActivityId | null;
  raceRecords?: RaceRecords;
  explore?: { favorites: string[]; progress?: ExploreProgress };
  /** Family names remembered for quick two-player setup; most recent first. */
  players?: string[];
  /** Learning games (src/learn): one saved round per game. */
  learn?: Partial<Record<LearnId, LearnSession>>;
  recentLearn?: LearnId | null;
  /** Quiet spacing memory for learning games; never shown as a grade. */
  skills?: SkillProgress;
  /** Learning games whose first-move "show me" hand has been seen. */
  coached?: LearnId[];
  /** Local helped/independent practice counts, visible only in grown-up settings. */
  practiceNotes?: PracticeNotes;
  learning?: Learners;
};
export const emptySave = (): Save => ({
  version: 1,
  settings: { sound: true, help: true },
  sessions: {},
  recent: null,
});
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const int = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const nums = (v: unknown, min: number, max: number, limit: number): v is number[] =>
  Array.isArray(v) && v.length <= limit && v.every((n) => int(n, min, max));
const unique = (v: unknown[]) => new Set(v).size === v.length;
const strings = (v: unknown, max: number, count: number): v is string[] =>
  Array.isArray(v) && v.length <= count && v.every((n) => typeof n === "string" && n.length <= max);
function validPosition(v: unknown): boolean {
  if (
    !obj(v) ||
    !nums(v.board, -2, 2, 64) ||
    v.board.length !== 64 ||
    ![1, -1].includes(v.turn as number) ||
    !int(v.quiet, 0, 80) ||
    !obj(v.repetitions) ||
    Object.keys(v.repetitions).length > 1000 ||
    !Object.entries(v.repetitions).every(([k, n]) => k.length <= 200 && int(n, 1, 3)) ||
    ![null, "red", "blue", "draw"].includes(v.outcome as null)
  )
    return false;
  if (
    v.board.some((p, i) => p !== 0 && (Math.floor(i / 8) + (i % 8)) % 2 !== 1) ||
    v.board.filter((p) => p > 0).length > 12 ||
    v.board.filter((p) => p < 0).length > 12
  )
    return false;
  // Engine's terminal truth must agree with imported outcomes.
  return checkersResult(v as unknown as Parameters<typeof checkersResult>[0]) === v.outcome;
}
function validBoard(v: unknown): v is ("X" | "O" | null)[] {
  if (!Array.isArray(v) || v.length !== 9 || !v.every((m) => m === null || m === "X" || m === "O")) return false;
  const x = v.filter((m) => m === "X").length,
    o = v.filter((m) => m === "O").length;
  if (x !== o && x !== o + 1) return false;
  const xWins = lines.some((line) => line.every((i) => v[i] === "X")),
    oWins = lines.some((line) => line.every((i) => v[i] === "O"));
  return !(xWins && oWins) && (!xWins || x === o + 1) && (!oWins || x === o);
}
export function validSession(v: unknown): v is GameState {
  if (
    !obj(v) ||
    !gameIds.includes(v.game as GameId) ||
    typeof v.id !== "string" ||
    v.id.length > 100 ||
    !obj(v.options) ||
    !["easy", "medium", "hard"].includes(v.options.difficulty as string) ||
    !["solo", "together"].includes(v.options.mode as string) ||
    typeof v.options.computerFirst !== "boolean" ||
    (v.options.checkersRules !== undefined &&
      !["friendly", "classic"].includes(v.options.checkersRules as string)) ||
    (v.options.wordRules !== undefined && !["practice", "challenge"].includes(v.options.wordRules as string))
  )
    return false;
  if (
    ["tic-tac-toe", "memory", "checkers"].includes(v.game as string) &&
    ((v.match !== undefined && !validMatch(v.match)) || (v.starter !== undefined && !validSeat(v.starter)))
  )
    return false;
  switch (v.game) {
    case "tic-tac-toe": {
      if (
        (v.first !== undefined && v.first !== "X" && v.first !== "O") ||
        (v.xSeat !== undefined && !validSeat(v.xSeat))
      )
        return false;
      const validRoundBoard = (board: unknown) =>
        validBoard(
          v.first === "O" && Array.isArray(board)
            ? board.map((m) => (m === "X" ? "O" : m === "O" ? "X" : m))
            : board,
        );
      if (
        !validRoundBoard(v.board) ||
        !["X", "O"].includes(v.human as string) ||
        !Array.isArray(v.history) ||
        v.history.length > 9 ||
        !v.history.every(validRoundBoard) ||
        v.history.length !== (v.board as unknown[]).filter(Boolean).length
      )
        return false;
      const states = [...v.history, v.board] as ("X" | "O" | null)[][];
      return states.every((b, j) => {
        if (!j) return b.every((m) => m === null);
        const previous = states[j - 1],
          changed = b.flatMap((m, i) => (m !== previous[i] ? [i] : []));
        return (
          !ticOutcome(previous) &&
          changed.length === 1 &&
          previous[changed[0]] === null &&
          b[changed[0]] === (j % 2 === 1 ? (v.first ?? "X") : v.first === "O" ? "X" : "O")
        );
      });
    }
    case "word-rescue": {
      const valid =
        typeof v.word === "string" &&
        /^[A-Z]{2,12}$/.test(v.word) &&
        typeof v.clue === "string" &&
        v.clue.length <= 300 &&
        typeof v.category === "string" &&
        v.category.length <= 50 &&
        (v.pack === undefined || v.pack === "All" || WORDS.some((word) => word[1] === v.pack)) &&
        strings(v.guessed, 1, 26) &&
        unique(v.guessed) &&
        v.guessed.every((l) => /^[A-Z]$/.test(l)) &&
        int(v.hints, 0, 12) &&
        typeof v.custom === "boolean" &&
        strings(v.seen, 12, 60);
      if (!valid) return false;
      const word = v.word as string,
        guessed = v.guessed as string[];
      const found = [...new Set(word)].filter((letter) => guessed.includes(letter)).length;
      const wrong = guessed.filter((letter) => !word.includes(letter)).length;
      return (
        (v.hints as number) <= found &&
        (v.options.wordRules !== "challenge" ||
          ((v.hints as number) <= 1 && wrong <= 6 && !(wrong === 6 && found === new Set(word).size)))
      );
    }
    case "memory": {
      if (v.pack !== undefined && v.pack !== "pictures" && v.pack !== "chamoru") return false;
      if (
        v.history !== undefined &&
        (!Array.isArray(v.history) ||
          v.history.length > 40 ||
          !v.history.every(
            (h) =>
              obj(h) &&
              Object.keys(h).every((key) => ["matched", "open", "turns", "player", "scores"].includes(key)) &&
              validSession({
                ...v,
                matched: h.matched,
                open: h.open,
                turns: h.turns,
                player: h.player,
                scores: h.scores,
                history: undefined,
              }),
          ))
      )
        return false;
      if (
        !strings(v.cards, v.pack === "chamoru" ? 80 : 20, 24) ||
        ![12, 16, 24].includes(v.cards.length) ||
        !nums(v.matched, 0, v.cards.length - 1, 24) ||
        !unique(v.matched) ||
        v.matched.length % 2 !== 0 ||
        !nums(v.open, 0, v.cards.length - 1, 2) ||
        !unique(v.open) ||
        v.open.some((i) => (v.matched as number[]).includes(i)) ||
        !int(v.turns, 0, 100000) ||
        ![0, 1].includes(v.player as number) ||
        !nums(v.scores, 0, 12, 2) ||
        v.scores.length !== 2
      )
        return false;
      const counts = v.cards.reduce<Record<string, number>>((a, c) => ({ ...a, [memoryKey(c)]: (a[memoryKey(c)] ?? 0) + 1 }), {});
      const matchedCounts = v.matched.reduce<Record<string, number>>(
        (a, i) => ({ ...a, [memoryKey((v.cards as string[])[i])]: (a[memoryKey((v.cards as string[])[i])] ?? 0) + 1 }),
        {},
      );
      const expectedCards =
        v.options.difficulty === "easy" ? 12 : v.options.difficulty === "medium" ? 16 : 24;
      return (
        v.cards.length === expectedCards &&
        v.cards.every((c) => validMemoryCard(c, v.pack)) &&
        (v.pack !== "chamoru" || unique(v.cards)) &&
        Object.values(counts).every((n) => n === 2) &&
        Object.values(matchedCounts).every((n) => n === 2) &&
        v.scores[0] + v.scores[1] === v.matched.length / 2 &&
        v.turns >= v.matched.length / 2 &&
        (v.open.length < 2 || memoryKey(v.cards[v.open[0]]) !== memoryKey(v.cards[v.open[1]]))
      );
    }
    case "checkers":
      return (
        validPosition(v.position) &&
        Array.isArray(v.history) &&
        v.history.length <= 160 &&
        v.history.every(validPosition) &&
        (v.lesson === null || int(v.lesson, 0, 3)) &&
        (v.lesson === null
          ? v.lessonBackup === null
          : obj(v.lessonBackup) &&
            validPosition(v.lessonBackup.position) &&
            Array.isArray(v.lessonBackup.history) &&
            v.lessonBackup.history.length <= 160 &&
            v.lessonBackup.history.every(validPosition))
      );
    case "maze": {
      if (
        ![5, 7, 9].includes(v.size as number) ||
        !nums(v.walls, 0, 15, 81) ||
        v.walls.length !== (v.size as number) ** 2 ||
        !nums(v.path, 0, v.walls.length - 1, 10000) ||
        !v.path.length ||
        v.path[0] !== 0 ||
        !int(v.seed, 0, 0xffffffff)
      )
        return false;
      const size = v.size as number,
        walls = v.walls;
      for (let i = 0; i < walls.length; i++) {
        const r = Math.floor(i / size),
          c = i % size,
          w = walls[i];
        if (
          (r === 0 && !(w & 1)) ||
          (c === 0 && !(w & 8)) ||
          (r === size - 1 && !(w & 4)) ||
          (c === size - 1 && !(w & 2))
        )
          return false;
        if (
          (c < size - 1 && !!(w & 2) !== !!(walls[i + 1] & 8)) ||
          (r < size - 1 && !!(w & 4) !== !!(walls[i + size] & 1))
        )
          return false;
      }
      const visited = new Set([0]),
        queue = [0];
      while (queue.length) {
        const cell = queue.pop()!;
        for (const [bit, delta] of [
          [1, -size],
          [2, 1],
          [4, size],
          [8, -1],
        ])
          if (!(walls[cell] & bit) && !visited.has(cell + delta)) {
            visited.add(cell + delta);
            queue.push(cell + delta);
          }
      }
      return (
        visited.size === walls.length &&
        v.path.every((cell, j) => {
          if (!j) return true;
          const prev = (v.path as number[])[j - 1],
            dr = Math.floor(cell / size) - Math.floor(prev / size),
            dc = (cell % size) - (prev % size);
          const bit =
            dr === -1 && dc === 0
              ? 1
              : dr === 1 && dc === 0
                ? 4
                : dc === 1 && dr === 0
                  ? 2
                  : dc === -1 && dr === 0
                    ? 8
                    : 0;
          return !!bit && !(walls[prev] & bit);
        })
      );
    }
    case "numbers": {
      const expectedMax = v.options.difficulty === "easy" ? 6 : v.options.difficulty === "medium" ? 9 : 12;
      if (v.maxNumber !== undefined && v.maxNumber !== expectedMax) return false;
      if (v.gentlePractice !== undefined && (v.gentlePractice !== true || v.options.difficulty !== "easy")) return false;
      if (v.bestRemaining !== undefined && !int(v.bestRemaining, 0, 78)) return false;
      const max = (v.maxNumber ?? (v.options.difficulty === "easy" ? 6 : 9)) as number,
        count = v.options.difficulty === "easy" ? 1 : 2;
      const valid = (x: unknown) =>
        obj(x) &&
        nums(x.available, 1, max, max) &&
        unique(x.available) &&
        nums(x.dice, 1, 6, count) &&
        [0, count].includes(x.dice.length) &&
        int(x.seed, 0, 0xffffffff) &&
        int(x.turns, 0, max);
      return (
        valid(v) &&
        nums(v.selected, 1, max, max) &&
        unique(v.selected) &&
        v.selected.every((n) => (v.available as number[]).includes(n)) &&
        ((v.dice as number[]).length > 0 || v.selected.length === 0) &&
        Array.isArray(v.history) &&
        v.history.length === v.turns &&
        v.history.every(valid)
      );
    }
    default:
      return false;
  }
}
export function parseSave(raw: string): Save {
  if (raw.length > 2_000_000) throw new Error("This backup is too large.");
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    throw new Error("This save is not readable JSON. Your original has been kept.");
  }
  if (!obj(v) || v.version !== 1)
    throw new Error("This save uses an unsupported version. Your original has been kept.");
  if (
    (v.arcade !== undefined && (!validArcade(v.arcade) || Object.keys(v.arcade.people).some(id => !(v.learning === undefined ? ["family"] : validLearners(v.learning) ? v.learning.people.map(p => p.id) : []).includes(id)))) ||
    !obj(v.settings) ||
    typeof v.settings.sound !== "boolean" ||
    typeof v.settings.help !== "boolean" ||
    ["narration", "effects", "automaticSpeech", "learningIslander", "homeNavigationSeen"].some(k => (v.settings as Record<string, unknown>)[k] !== undefined && typeof (v.settings as Record<string, unknown>)[k] !== "boolean") ||
    (v.settings.narrationVolume !== undefined && (typeof v.settings.narrationVolume !== "number" || !Number.isFinite(v.settings.narrationVolume) || v.settings.narrationVolume < 0 || v.settings.narrationVolume > 1)) ||
    (v.settings.voice !== undefined && !["warm", "calm"].includes(v.settings.voice as string)) ||
    (v.learning !== undefined && !validLearners(v.learning)) ||
    (v.personalization !== undefined && !validPersonalization(v.personalization, validLearners(v.learning) ? v.learning : undefined, validArcade(v.arcade) ? v.arcade : undefined)) ||
    (v.roundOwners !== undefined && !validRoundOwners(v.roundOwners, validLearners(v.learning) ? v.learning.people.map(p=>p.id) : ['family'])) ||
    !validLearningOwners(v.learn, v.learning) ||
    (v.settings.practice !== undefined && !validPracticeSettings(v.settings.practice)) ||
    (v.practiceNotes !== undefined && !validPracticeNotes(v.practiceNotes)) ||
    (v.board !== undefined && !validBoardSessions(v.board)) ||
    (v.recentBoard !== undefined && v.recentBoard !== null && !isBoardId(v.recentBoard)) ||
    !obj(v.sessions) ||
    Object.keys(v.sessions).some((k) => !gameIds.includes(k as GameId)) ||
    !Object.entries(v.sessions).every(([k, s]) => validSession(s) && s.game === k) ||
    (v.recent !== null && !gameIds.includes(v.recent as GameId)) ||
    (v.favoriteGames !== undefined &&
      (!Array.isArray(v.favoriteGames) || v.favoriteGames.length > gameIds.length + activityIds.length + learnIds.length + boardIds.length + arcadeIds.length ||
        !unique(v.favoriteGames) || !v.favoriteGames.every((id) => [...gameIds, ...activityIds, ...learnIds, ...boardIds, ...arcadeIds].includes(id)))) ||
    (v.wordRecords !== undefined && !validWordRecords(v.wordRecords)) ||
    (v.activities !== undefined && !validActivities(v.activities)) ||
    (v.recentActivity !== undefined &&
      v.recentActivity !== null &&
      !activityIds.includes(v.recentActivity as ActivityId)) ||
    (v.raceRecords !== undefined && !validActivityRecords(v.raceRecords)) ||
    (v.players !== undefined && !validPlayers(v.players)) ||
    (v.learn !== undefined && !validLearn(v.learn)) ||
    (v.recentLearn !== undefined && v.recentLearn !== null && !learnIds.includes(v.recentLearn as LearnId)) ||
    (v.skills !== undefined && !validSkills(v.skills)) ||
    (v.coached !== undefined &&
      (!Array.isArray(v.coached) || v.coached.length > learnIds.length || !unique(v.coached) || !v.coached.every((id) => learnIds.includes(id as LearnId)))) ||
    (v.explore !== undefined &&
      (!obj(v.explore) ||
        !Array.isArray(v.explore.favorites) ||
        v.explore.favorites.length > 50 ||
        !v.explore.favorites.every((id: unknown) => typeof id === "string" && !!topicById(id)) ||
        normalizeExploreFavorites(v.explore.favorites).length !== v.explore.favorites.length ||
        (v.explore.progress !== undefined && !validExploreProgress(v.explore.progress))))
  )
    throw new Error("Some saved game data is invalid. Your original has been kept.");
  const save = v as unknown as Save;
  // Feel v2: validate the original first; recovery/restore retain its original bytes.
  return save.arcade ? { ...save, arcade: migrateArcade(save.arcade) } : save;
}

function validLearningOwners(learn: unknown, learning: unknown): boolean {
  if (learn === undefined) return true;
  if (!obj(learn) || (learning !== undefined && !validLearners(learning))) return false;
  const ids = new Set((learning === undefined ? [{ id: "family" }] : learning.people).map(p => p.id));
  return Object.values(learn).every(s => obj(s) && (s.learner === undefined || ids.has(s.learner as string)));
}
