import type { GameId, GameState } from "../games";
import type { Save } from "./validation";

// Player intents compose against the latest round; stale AI snapshots still use Store.update's identity guard.
export function applySessionAction(
  save: Save,
  game: GameId,
  roundId: string,
  transition: (current: GameState) => GameState
): Save {
  const current = save.sessions[game];
  if (!current || current.id !== roundId) return save;
  const next = transition(current);
  if (next === current || next.game !== game || next.id !== roundId) return save;
  return { ...save, sessions: { ...save.sessions, [game]: next }, recent: game, recentActivity: null, recentLearn: null };
}
