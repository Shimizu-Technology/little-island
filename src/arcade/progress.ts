import { validReef, type ReefState } from "./games/reef-builder/engine";
import { type PracticeResult, type PracticeSettings, validPracticeSettings } from "../practice/types";
import { arcadeIds, allLevelIds, type ArcadeId, type LevelId, type Stars, type WorldId, validLevelId, worldIds, worldStars, worldOf, levelNumber, starCount } from "./types";
export const stickerIds = ["reef-fish", "singing-shell", "little-crab", "sea-turtle", "moon-canoe", "sun-coral", "rainbow-fish", "star-shell", "coconut", "flying-fox", "lagoon-ray", "island-flower", "tiny-rail", "hermit-home", "sea-star", "jelly-light"] as const;
export type StickerId = typeof stickerIds[number];
export const outfitIds = ["island", "sunhat", "explorer", "starlight"] as const;
export type OutfitId = typeof outfitIds[number];
export const outfitNames: Record<OutfitId, string> = { island: "Island friend", sunhat: "Sun hat", explorer: "Ocean explorer", starlight: "Starlight" };
export const outfitStars: Record<OutfitId, number> = { island: 0, sunhat: 12, explorer: 30, starlight: 60 };
export type GameProgress = { stars: Partial<Record<LevelId, Stars>>; openWorlds: WorldId[]; best: number; outfit: OutfitId; unlockedOutfits: OutfitId[]; coached: boolean };
export type ChestOffer = { game: ArcadeId; level: LevelId; round: string; sticker: StickerId };
export type ReefSession = { version: 1; game: "reef-builder"; round: string; state: ReefState };
export function validReefSession(v: unknown): v is ReefSession {
  return exact(v, ["version", "game", "round", "state"]) && v.version === 1 && v.game === "reef-builder" && roundId(v.round) && validReef(v.state) && v.state.status === "playing";
}
export type ArcadeLearner = { session?: ReefSession; helper: boolean; helperDefaultV2?: true; games: Partial<Record<ArcadeId, GameProgress>>; stickers: StickerId[]; rounds: string[]; chest: ChestOffer | null };
export type ArcadeSave = { version: 1; music: boolean; breakMinutes: 0 | 15 | 20 | 30 | 45; unlockAll: boolean; people: Record<string, ArcadeLearner>; recent: ArcadeId | null; scores: { game: ArcadeId; name: string; score: number }[] };
export type ArcadeAction =
  | { type: "save-round"; session: ReefSession }
  | { type: "visit"; game: ArcadeId }
  | { type: "helper"; value: boolean }
  | { type: "coached"; game: ArcadeId }
  | { type: "outfit"; game: ArcadeId; outfit: OutfitId }
  | { type: "finish"; game: ArcadeId; level: LevelId | "endless"; stars: 0 | Stars; score: number; round: string; name: string }
  | { type: "skip-chest"; round: string }
  | { type: "claim-chest"; round: string; result: PracticeResult; config: PracticeSettings }
  | { type: "preferences"; music?: boolean; breakMinutes?: ArcadeSave["breakMinutes"]; unlockAll?: boolean };
export const emptyGameProgress = (): GameProgress => ({ stars: {}, openWorlds: ["w1", "learn"], best: 0, outfit: "island", unlockedOutfits: ["island"], coached: false });
export const emptyArcadeLearner = (): ArcadeLearner => ({ helper: false, helperDefaultV2: true, games: {}, stickers: [], rounds: [], chest: null });
export const emptyArcade = (): ArcadeSave => ({ version: 1, music: false, breakMinutes: 0, unlockAll: false, people: {}, recent: null, scores: [] });
export const arcadeLearner = (arcade: ArcadeSave | undefined, owner = "family") => arcade && Object.hasOwn(arcade.people, owner) ? arcade.people[owner] : emptyArcadeLearner();
export const gameProgress = (person: ArcadeLearner, game: ArcadeId) => person.games[game] ?? emptyGameProgress();
export const openedWorlds = (stars: Partial<Record<LevelId, Stars>>) => worldIds.filter(id => starCount(stars) >= worldStars[id]);
export const openedOutfits = (stars: Partial<Record<LevelId, Stars>>) => outfitIds.filter(id => starCount(stars) >= outfitStars[id]);
export const endlessOpen = (p: GameProgress, unlockAll = false) => unlockAll || allLevelIds.filter(id => worldOf(id) === "w1").every(id => !!p.stars[id]);
export const levelOpen = (p: GameProgress, id: LevelId, unlockAll = false) => validLevelId(id) && (unlockAll || (p.openWorlds.includes(worldOf(id)) && (levelNumber(id) === 1 || !!p.stars[`${worldOf(id)}-${levelNumber(id) - 1}` as LevelId])));
export function offeredSticker(person: ArcadeLearner, game: ArcadeId, level: LevelId): StickerId {
  const start = (arcadeIds.indexOf(game) * 7 + allLevelIds.indexOf(level)) % stickerIds.length;
  return Array.from({ length: stickerIds.length }, (_, i) => stickerIds[(start + i) % stickerIds.length]).find(id => !person.stickers.includes(id)) ?? stickerIds[start];
}
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => obj(v) && Object.keys(v).sort().join() === [...keys].sort().join();
const int = (v: unknown, max = 99999999): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
const gameId = (v: unknown): v is ArcadeId => arcadeIds.includes(v as ArcadeId);
const uniqueList = <T extends string>(v: unknown, ids: readonly T[]): v is T[] => Array.isArray(v) && v.length <= ids.length && new Set(v).size === v.length && v.every(id => ids.includes(id));
const roundId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(v);
function validGame(v: unknown, legacy = false): v is GameProgress {
  if (!exact(v, ["stars", "openWorlds", "best", "outfit", "unlockedOutfits", "coached"]) || !obj(v.stars) || !int(v.best) || typeof v.coached !== "boolean" || !Object.entries(v.stars).every(([id, stars]) => validLevelId(id) && int(stars, 3) && stars >= 1)) return false;
  const stars = v.stars as GameProgress["stars"];
  return uniqueList(v.openWorlds, worldIds) && (v.openWorlds.join() === openedWorlds(stars).join() || legacy && Object.keys(stars).every(id => !/^w[456]-/.test(id)) && v.openWorlds.join() === openedWorlds(stars).filter(id => !["w4", "w5", "w6"].includes(id)).join()) && uniqueList(v.unlockedOutfits, outfitIds) && v.unlockedOutfits.join() === openedOutfits(stars).join() && v.unlockedOutfits.includes(v.outfit as OutfitId);
}
export function validArcade(v: unknown): v is ArcadeSave {
  if (!exact(v, ["version", "music", "breakMinutes", "unlockAll", "people", "recent", "scores"]) || v.version !== 1 || typeof v.music !== "boolean" || typeof v.unlockAll !== "boolean" || ![0, 15, 20, 30, 45].includes(v.breakMinutes as number) || !(v.recent === null || gameId(v.recent)) || !obj(v.people) || Object.keys(v.people).length > 5 || !Array.isArray(v.scores) || v.scores.length > 45) return false;
  if (!v.scores.every(s => exact(s, ["game", "name", "score"]) && gameId(s.game) && typeof s.name === "string" && !!s.name.trim() && s.name === s.name.trim() && [...s.name].length <= 24 && !/[\u0000-\u001f]/.test(s.name) && int(s.score))) return false;
  if (new Set(v.scores.map(s => `${s.game}:${s.name}`)).size !== v.scores.length) return false;
  return Object.entries(v.people).every(([id, p]) => {
    if (!/^[a-z0-9-]{1,40}$/.test(id) || !obj(p) || !exact(p, ["helper", "games", "stickers", "rounds", "chest", ...(Object.hasOwn(p, "helperDefaultV2") ? ["helperDefaultV2"] : []), ...(Object.hasOwn(p, "session") ? ["session"] : [])]) || (Object.hasOwn(p, "helperDefaultV2") && p.helperDefaultV2 !== true) || (Object.hasOwn(p, "session") && !validReefSession(p.session)) || typeof p.helper !== "boolean" || !obj(p.games) || !Object.entries(p.games).every(([g, progress]) => gameId(g) && validGame(progress, p.helperDefaultV2 === undefined)) || !uniqueList(p.stickers, stickerIds) || !Array.isArray(p.rounds) || p.rounds.length > 40 || new Set(p.rounds).size !== p.rounds.length || !p.rounds.every(roundId)) return false;
    if (p.session && p.rounds.includes((p.session as ReefSession).round)) return false;
    if (p.chest === null) return true;
    const c = p.chest;
    return exact(c, ["game", "level", "round", "sticker"]) && gameId(c.game) && validLevelId(c.level) && roundId(c.round) && p.rounds.includes(c.round) && stickerIds.includes(c.sticker as StickerId) && validGame(p.games[c.game], p.helperDefaultV2 === undefined) && !!(p.games[c.game] as GameProgress).stars[c.level];
  });
}
/** Checked again at the Store boundary; stale epoch/learner callbacks never reach this reducer. */
export function arcadeTransition(before: ArcadeSave | undefined, owner: string, action: ArcadeAction): ArcadeSave {
  const a = before ? migrateArcade(before) : emptyArcade(), person = arcadeLearner(a, owner);
  if (!/^[a-z0-9-]{1,40}$/.test(owner)) return a;
  let next = a, p = person;
  if (action.type === "preferences") next = { ...a, music: action.music ?? a.music, breakMinutes: action.breakMinutes ?? a.breakMinutes, unlockAll: action.unlockAll ?? a.unlockAll };
  else if (action.type === "visit") { if (!gameId(action.game) || a.recent === action.game) return a; next = { ...a, recent: action.game }; }
  else if (action.type === "save-round") {
    if (!validReefSession(action.session) || person.rounds.includes(action.session.round) || person.session === action.session) return a;
    p = { ...person, session: action.session };
  }
  else if (action.type === "helper") p = { ...person, helper: action.value };
  else if (action.type === "skip-chest" || action.type === "claim-chest") {
    if (!person.chest || person.chest.round !== action.round) return a;
    if (action.type === "claim-chest" && (!validPracticeSettings(action.config) || !/^(num|read)\.[a-z0-9-]{1,40}$/.test(action.result.skill) || typeof action.result.helped !== "boolean")) return a;
    p = { ...person, chest: null, stickers: action.type === "claim-chest" ? [...new Set([...person.stickers, person.chest.sticker])] : person.stickers };
  } else {
    if (!gameId(action.game)) return a;
    const progress = gameProgress(person, action.game);
    let g = progress;
    if (action.type === "coached") g = { ...progress, coached: true };
    if (action.type === "outfit" && progress.unlockedOutfits.includes(action.outfit)) g = { ...progress, outfit: action.outfit };
    if (action.type === "finish") {
      if (!roundId(action.round) || person.rounds.includes(action.round) || !int(action.score) || !int(action.stars, 3) || (action.level !== "endless" && (!validLevelId(action.level) || !levelOpen(progress, action.level, a.unlockAll))) || (action.level === "endless" && !endlessOpen(progress, a.unlockAll))) return a;
      const stars = { ...progress.stars };
      if (action.level !== "endless" && action.stars) stars[action.level] = Math.max(stars[action.level] ?? 0, action.stars) as Stars;
      g = { ...progress, stars, openWorlds: openedWorlds(stars), unlockedOutfits: openedOutfits(stars), best: Math.max(progress.best, action.score) };
      // Oldest offer wins until explicit claim/skip, including its validation reference.
      const chest = person.chest ?? (action.level !== "endless" && action.stars ? { game: action.game, level: action.level, round: action.round, sticker: offeredSticker(person, action.game, action.level) } : null);
      const rounds = [...p.rounds, action.round].filter(id => id !== chest?.round).slice(chest ? -39 : -40);
      if (chest) rounds.unshift(chest.round);
      p = { ...p, rounds, chest };
      if (p.session?.round === action.round) { const { session: _session, ...rest } = p; p = rest; }
      if (action.level === "endless" && action.score > 0) {
        const name = [...action.name.replace(/[\u0000-\u001f]/g, " ").trim().replace(/\s+/g, " ")].slice(0, 24).join("") || "Family";
        const scores = [...a.scores.filter(s => s.game !== action.game || s.name !== name), { game: action.game, name, score: Math.max(action.score, ...a.scores.filter(s => s.game === action.game && s.name === name).map(s => s.score)) }].sort((x, y) => y.score - x.score);
        // Five local names per game, bounded independently so one game's scores cannot evict another's.
        next = { ...a, scores: arcadeIds.flatMap(id => scores.filter(s => s.game === id).slice(0, 5)) };
      }
    }
    if (g === progress) return a;
    p = { ...p, games: { ...p.games, [action.game]: g } };
  }
  if (p !== person) next = { ...next, people: { ...a.people, [owner]: p } };
  return validArcade(next) ? next : a;
}

/** Call only after strict validation. Never mutates the saved/recovery original. */
export function migrateArcade(arcade: ArcadeSave): ArcadeSave {
  if (!validArcade(arcade)) return arcade;
  if (Object.values(arcade.people).every(p => p.helperDefaultV2 === true)) return arcade;
  return { ...arcade, people: Object.fromEntries(Object.entries(arcade.people).map(([id, p]) => [id, p.helperDefaultV2 ? p : {
    ...p, helper: false, helperDefaultV2: true as const,
    games: Object.fromEntries(Object.entries(p.games).map(([game, g]) => [game, { ...g, openWorlds: openedWorlds(g.stars) }])),
  }])) };
}
