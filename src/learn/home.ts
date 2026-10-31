import { BoardId, boardIds, catalog, isBoardId } from "../board";
import { GameId, gameIds, games, isFinished } from "../games";
import { random } from "../games/types";
import { ActivityId, activityFinished, activityIds } from "../state/activities";
import type { Save } from "../state/validation";
import { engines } from "./engines";
import { finished } from "./session";
import { activeLearner } from "./learners";
import { levelOf } from "./levels";
import { dayNumber } from "./skills";
import { Island, LearnId, learnIds } from "./types";
import { arcadeIds, arcadeGames, type ArcadeId } from "../arcade";
export type ShelfId = GameId | ActivityId | LearnId | BoardId | ArcadeId;
export type ShelfGame = { id: ShelfId; name: string; description: string; surface: string; players: string; filters: string[]; island: Island | "classic" | "arcade"; ages?: string };
export const islandNames = { reading: "Reading", numbers: "Numbers", science: "Science", thinking: "Thinking", coding: "Coding", classic: "Classic games", arcade: "Arcade", explore: "Explore" };
const extraGames: { id: ActivityId; name: string; description: string; surface: string; players: string; filters: string[] }[] = [
  {
    id: "go-fish",
    name: "Go Fish",
    players: "1 or 2 players",
    description: "Collect matching families of cards.",
    surface: "#DEEDF2",
    filters: ["Words & numbers", "Play together"],
  },
  {
    id: "crazy-eights",
    name: "Crazy Eights",
    players: "1 or 2 players",
    description: "Match a suit. Change it with an eight.",
    surface: "#F4E8CB",
    filters: ["Think & explore", "Play together"],
  },
  {
    id: "racer",
    name: "Island Dash",
    players: "1 player",
    description: "Run, jump, and race island trails.",
    surface: "#DDECD7",
    filters: ["Think & explore"],
  },
  {
    id: "island-mystery",
    name: "Picnic Mystery",
    players: "Solo or 3–8 devices",
    description: "Do island jobs. Find the mischief maker.",
    surface: "#E5E9D5",
    filters: ["Think & explore", "Play together"],
  },
  {
    id: "word-imposter",
    name: "Secret Word",
    players: "3–8 players",
    description: "One secret. One Imposter. Play together.",
    surface: "#E8E1F3",
    filters: ["Words & numbers", "Play together"],
  },
];

export const shelfGames: ShelfGame[] = [
  ...boardIds.map(id => ({ id, name: catalog[id].name, description: catalog[id].description, surface: catalog[id].surface, island: "classic" as const, players: id === "reef-sweep" ? "Play alone" : "1 or 2 players", filters: ["Play alone", "Think & explore", ...(id === "reef-sweep" ? [] : ["Play together"])] })),
  ...arcadeGames.map(g => ({ id: g.id, name: g.name, description: g.tagline, surface: g.surface, players: g.twoPlayer ? "Alone or together" : "Play alone", filters: ["Play alone", "Think & explore"], island: "arcade" as const })),
  ...gameIds.map((id) => ({ id, ...games[id], island: "classic" as const,
    players: id === "maze" || id === "numbers" ? "Alone or together" : id === "word-rescue" ? "Word packs or family word" : "1 or 2 players",
    filters: ["Play alone", "Play together", ...(["word-rescue", "numbers"].includes(id) ? ["Words & numbers"] : ["Think & explore"])],
  })),
  ...extraGames.map(g => ({ ...g, island: "classic" as const, filters: [...g.filters, ...(g.id === "word-imposter" ? [] : ["Play alone"])] })),
  // Learning shelves read as a ladder: youngest starting age first, then the narrower span.
  ...[...learnIds].sort((a, b) => (engines[a].ages?.[0] ?? 0) - (engines[b].ages?.[0] ?? 0) || (engines[a].ages?.[1] ?? 0) - (engines[b].ages?.[1] ?? 0)).map(id => { const e = engines[id]; return { id, name: e.name, description: e.tagline, surface: e.surface, island: e.island,
    ...(e.ages ? { ages: `Ages ${e.ages[0]}–${e.ages[1]}` } : {}),
    players: e.modes.includes("solo") ? e.modes.length > 1 ? "Alone or together" : "Play alone" : "Play together",
    filters: [...(e.modes.includes("solo") ? ["Play alone"] : []), ...(e.modes.some(m => m !== "solo") ? ["Play together"] : [])] }; }),
];
export function ongoing(save: Save, id: ShelfId) {
  if (isBoardId(id)) { const s = save.board?.[id]; return !!s && s.position.outcome === null; }
  if (arcadeIds.includes(id as ArcadeId)) return save.arcade?.recent === id;
  if (learnIds.includes(id as LearnId)) { const s = save.learn?.[id as LearnId]; return !!s && !finished(s); }
  if (gameIds.includes(id as GameId)) { const s = save.sessions[id as GameId]; return !!s && !isFinished(s); }
  const a = save.activities?.[id as ActivityId]; return !!a && !activityFinished(a);
}
/** The active marker wins even when its round just finished; never revive an older marker. */
export function homeContinue(save: Save): ShelfId | null {
  const id = save.recentBoard ?? save.recentLearn ?? save.recentActivity ?? save.recent ?? save.arcade?.recent;
  return id && ongoing(save, id) ? id : null;
}
export function toggleShelfFavorite(save: Save, id: ShelfId): Save {
  if (![...gameIds, ...activityIds, ...learnIds, ...boardIds, ...arcadeIds].includes(id)) return save;
  const before = save.favoriteGames ?? [];
  return { ...save, favoriteGames: before.includes(id) ? before.filter(g => g !== id) : [...before, id] };
}
/** Daily, local and deterministic. No rewards or return pressure. Shuffle rotates each subject. */
export function dailySuggestions(save: Save, day = dayNumber(), shuffle = 0): LearnId[] {
  const rng = random(day ^ 0x6d2b79f5);
  const ranked = learnIds.map(id => {
    const skills = Object.keys(engines[id].skills).map(skill => save.skills?.[skill]?.day ?? -1);
    const session = save.learn?.[id];
    const playedDay = session ? 0 : -1;
    return { id, island: engines[id].island, recent: Math.max(-1, playedDay, ...skills, save.recentLearn === id ? day : -1), tie: rng() };
  }).sort((a,b) => a.recent - b.recent || a.tie - b.tie);
  return [(i: Island) => i === "reading", (i: Island) => i === "numbers", (i: Island) => i === "science" || i === "thinking"].map(accept => {
    const group = ranked.filter(g => accept(g.island)); return group[shuffle % group.length].id;
  });
}

/** Shelf and setup agree for the active learner; a different owner's saved round stays intact. */
export function shelfLevel(save: Save, game: LearnId) {
  const learner = activeLearner(save.learning), round = save.learn?.[game];
  return levelOf(round && (round.learner ?? "family") === learner.id ? round.options : learner.choices[game]);
}
