import { newLab } from '../explore/activities';
import type { Save } from '../state/validation';
import { TOPICS, WORLDS } from '../explore/content';
import { gameIds } from '../games';
import { boardIds } from '../board';
import { activityIds } from '../state/activities';
export type RoundOwners = { version: 1; rounds: Record<string, { round: string; owner: string }> };
const keys = [...gameIds.map(g=>`classic:${g}`), ...boardIds.map(g=>`board:${g}`), ...activityIds.map(g=>`activity:${g}`), ...WORLDS.map(w=>`explore:lab-${w.id}`), ...TOPICS.map(t=>`explore:${t.id}`)];
/** One owner per saved round, independent of the current learner. Old rounds bind once on load. */
export function bindRoundOwners(before: Save, after: Save): Save {
  const rounds = { ...after.roundOwners?.rounds };
  const bind = (key: string, oldId: string | undefined, id: string | undefined) => {
    if (!id) { delete rounds[key]; return; }
    const previous = before.roundOwners?.rounds[key];
    rounds[key] = previous?.round === id ? previous : { round: id, owner: (oldId === id ? before : after).learning?.active ?? 'family' };
  };
  for (const [prefix, old, next] of [['classic',before.sessions,after.sessions],['board',before.board,after.board],['activity',before.activities,after.activities]] as const)
    for (const [game, round] of Object.entries(next ?? {})) bind(`${prefix}:${game}`, (old as Record<string, {id:string}> | undefined)?.[game]?.id, round?.id);
  const location = after.explore?.progress?.location;
  if (location?.kind === 'activity' || location?.kind === 'topic') {
    const key = `explore:${location.kind === 'activity' ? `lab-${location.world}` : location.id}`;
    // An Explore activity retains its owner through a learner switch and navigation.
    const reset = location.kind === 'activity' && JSON.stringify(after.explore?.progress?.labs[location.world]) === JSON.stringify(newLab()) && JSON.stringify(before.explore?.progress?.labs[location.world]) !== JSON.stringify(newLab());
    const enteringTopic = location.kind === 'topic' && JSON.stringify(before.explore?.progress?.location) !== JSON.stringify(location);
    if (!rounds[key] || reset || enteringTopic) rounds[key] = { round: key, owner: (reset || enteringTopic || !before.explore?.progress ? after : before).learning?.active ?? 'family' };
  }
  return JSON.stringify(rounds) === JSON.stringify(after.roundOwners?.rounds ?? {}) ? after : { ...after, roundOwners: { version: 1, rounds } };
}
export const roundOwner = (save: Save, key: string, round: string) => save.roundOwners?.rounds[key]?.round === round ? save.roundOwners.rounds[key].owner : save.learning?.active ?? 'family';
export function validRoundOwners(value: unknown, owners: readonly string[]): value is RoundOwners {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as RoundOwners;
  return Object.keys(v).sort().join() === 'rounds,version' && v.version === 1 && !!v.rounds && typeof v.rounds === 'object' && !Array.isArray(v.rounds)
    && Object.keys(v.rounds).length <= keys.length && Object.entries(v.rounds).every(([key,r]) => keys.includes(key) && !!r && Object.keys(r).sort().join() === 'owner,round' && typeof r.round === 'string' && r.round.length > 0 && r.round.length <= 120 && owners.includes(r.owner));
}
