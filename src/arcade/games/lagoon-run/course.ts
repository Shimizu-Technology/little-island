/** Authored four-beat phrases. Distances use the shared camera's contact units. */
export const HAZARDS = {
  log: 'jump', crate: 'jump', cooler: 'jump', coconut: 'jump', crab: 'jump',
  net: 'duck', banner: 'duck', frond: 'duck', line: 'duck',
  canoe: 'lane', rock: 'lane', wall: 'lane', 'moving-canoe': 'lane',
} as const;
export type HazardKind = keyof typeof HAZARDS;
export type PowerKind = 'none' | 'magnet' | 'kite' | 'sandals' | 'shield';
export const POWER_SECONDS = { magnet: 8, kite: 6, sandals: 10, shield: 1 } as const;
export const POWER_LABELS = { magnet: 'Shell Magnet', kite: 'Kite Glide', sandals: 'Spring Sandals', shield: 'Turtle Shield' } as const;
export type Surface = 'sand' | 'ramp' | 'boardwalk' | 'canoe-roof' | 'gap';
export type Beat = { lane: number; kind: HazardKind; second: number; secondKind: HazardKind; third: boolean; shellLane: number; surface: Surface; power: PowerKind; action: 'idle' | 'jump' | 'duck'; sky: boolean };
export type Chunk = { id: string; difficulty: number; unlock: number; beats: readonly Beat[] };
function beat(action: Beat['action'], kind: HazardKind, lane = 1, surface: Surface = 'sand', power: PowerKind = 'none'): Beat {
  return { lane: action === 'idle' ? (lane + 1) % 3 : 0, kind, second: action === 'idle' ? (lane + 2) % 3 : 2, secondKind: kind, third: action !== 'idle', shellLane: lane, surface, power, action, sky: false };
}
const laneBeat = (lane: number, kind: HazardKind = 'canoe') => beat('idle', kind, lane);
const roof = (surface: Surface, action: Beat['action'] = 'idle', kind: HazardKind = 'rock') => ({ ...beat(action, kind, 1, surface), lane: action === 'idle' || surface === 'gap' ? 0 : 1, second: 2, third: false });
export const RUN_CHUNKS: readonly Chunk[] = [
  { id: 'first-moves', difficulty: 0, unlock: 1, beats: [beat('jump','log'), beat('duck','net'), laneBeat(0), roof('ramp')] },
  { id: 'beach-picnic', difficulty: 0, unlock: 1, beats: [laneBeat(1,'rock'), beat('jump','cooler'), beat('duck','frond'), laneBeat(1,'wall')] },
  { id: 'boardwalk', difficulty: 0, unlock: 2, beats: [roof('ramp'), roof('boardwalk','jump','crate'), roof('gap','jump','log'), roof('canoe-roof')] },
  { id: 'magnet-cove', difficulty: 0, unlock: 4, beats: [beat('idle','rock',1,'sand','magnet'), laneBeat(2), beat('jump','crate'), beat('duck','banner')] },
  { id: 'canoe-drift', difficulty: 0, unlock: 7, beats: [laneBeat(0,'moving-canoe'), laneBeat(1,'moving-canoe'), beat('jump','coconut'), laneBeat(2,'canoe')] },
  { id: 'kite-sky', difficulty: 1, unlock: 9, beats: [beat('idle','rock',1,'sand','kite'), ...[0,1,2].map(lane => ({ ...laneBeat(lane), sky: true }))] },
  { id: 'spring-roofs', difficulty: 1, unlock: 13, beats: [beat('idle','wall',1,'sand','sandals'), roof('canoe-roof','jump','crate'), roof('boardwalk'), beat('duck','banner')] },
  { id: 'turtle-bay', difficulty: 2, unlock: 17, beats: [beat('idle','rock',1,'sand','shield'), beat('jump','crab'), beat('duck','net'), laneBeat(2,'moving-canoe')] },
  { id: 'crab-crossing', difficulty: 2, unlock: 17, beats: [beat('jump','crab'), laneBeat(0,'wall'), beat('jump','coconut'), beat('duck','frond')] },
  { id: 'festival-mix', difficulty: 3, unlock: 25, beats: [{...beat('duck','banner'),secondKind:'coconut'}, {...beat('jump','cooler'),secondKind:'net'}, laneBeat(2,'moving-canoe'), beat('duck','net')] },
  { id: 'roof-weave', difficulty: 4, unlock: 33, beats: [roof('ramp'), roof('boardwalk','duck','net'), roof('gap','jump','crate'), roof('canoe-roof','jump','cooler')] },
  { id: 'lagoon-finale', difficulty: 5, unlock: 41, beats: [laneBeat(0,'moving-canoe'), beat('duck','banner'), beat('jump','crab'), laneBeat(2,'wall')] },
];
/** A conservative reachability proof, independent of powers: each beat has a legal lane/action,
 * and enough time to finish it and move two lanes before the next beat. Roofs are optional.
 * Reject impossible authored edits before they can enter the course. Engine replay tests verify
 * timing, shell stars, moving hazards and actual platform contacts as a second check. */
export function validateChunkSequence(chunks: readonly Chunk[], speed: number, spacing: number) {
  'worklet';
  if (!Number.isFinite(speed) || speed <= 0 || !Number.isFinite(spacing) || spacing / speed < .67) return false;
  let reachable = [0,1,2];
  for (const chunk of chunks) for (const b of chunk.beats) {
    const next: number[] = [];
    for (let lane = 0; lane < 3; lane++) {
      const kinds: HazardKind[] = [];
      if (lane === b.lane) kinds.push(b.kind);
      if (lane === b.second) kinds.push(b.secondKind);
      if (b.third && lane === b.shellLane) kinds.push(b.kind);
      const jump = kinds.some(k => HAZARDS[k] === 'jump'), duck = kinds.some(k => HAZARDS[k] === 'duck');
      if (!kinds.some(k => HAZARDS[k] === 'lane') && !(jump && duck) && reachable.some(from => (from === lane ? 0 : .12) + .55 <= spacing/speed)) next.push(lane);
    }
    if (!next.length) return false;
    reachable = next;
  }
  return chunks.length > 0;
}
/** Unlock guarantees each new mechanic appears on that level, rather than waiting on RNG. */
export function courseBeat(ordinal: number, rank: number, serial: number, random: number, speed = .8, spacing = .64): { chunk: string; beat: Beat; short: boolean } {
  'worklet';
  const group = Math.floor(serial / 4), eligible = RUN_CHUNKS.filter(c => c.unlock <= ordinal && c.difficulty <= rank);
  let c = eligible[Math.min(eligible.length-1, Math.floor(random * eligible.length))];
  if (group === 0) c = RUN_CHUNKS.find(c => c.unlock === ordinal) ?? RUN_CHUNKS[0];
  if (ordinal === 1 && group === 1) c = RUN_CHUNKS[1];
  if (!validateChunkSequence([c],speed,spacing)) c = RUN_CHUNKS[1];
  // Stable chunk choice across its four beats: caller supplies one random per chunk.
  return { chunk: c.id, beat: c.beats[serial % 4], short: serial % 4 === 3 || c.beats[(serial+1)%4].surface === 'sand' };
}
