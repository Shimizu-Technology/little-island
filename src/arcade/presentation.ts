import { arcadeIds, type ArcadeId, type ArcadeLevel } from "./types";
import { gameProgress, levelOpen, stickerIds, type ArcadeLearner, type ArcadeSave } from "./progress";
/** No historical best is reclassified as a level-only or free-play-only score. */
export const bestLabel = "Best across all modes";
export const returnLabel = (id: string) => arcadeIds.includes(id as ArcadeId) ? "Back to" : "Continue";
export const freePlayBest = (save: ArcadeSave | undefined, game: ArcadeId) => Math.max(0, ...(save?.scores ?? []).filter(s => s.game === game).map(s => s.score));
export const stickerSections = (person: ArcadeLearner) => [
  { name: "Collected · latest first", stickers: [...person.stickers].reverse() },
  { name: "Still to find", stickers: stickerIds.filter(id => !person.stickers.includes(id)) },
].filter(section => section.stickers.length);
export const currentLevel = (person: ArcadeLearner, game: ArcadeId, levels: readonly ArcadeLevel[], unlockAll: boolean) => levels.find(l => levelOpen(gameProgress(person, game), l.id, unlockAll) && !gameProgress(person, game).stars[l.id]);

export function nextStarGoal(goals: readonly [string, string, string], earned: number): string {
  return earned >= 3 ? "All three stars earned! You can enjoy this level again." : `Next star goal · ${goals[Math.max(0, Math.min(2, earned))]}`;
}
