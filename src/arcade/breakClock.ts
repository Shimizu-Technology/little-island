/** In-memory play time shared across arcade games. Pauses/sheets do not count; no mid-level save. */
export type BreakClock = { played: number; since: number | null };
export function changeBreakClock(clock: BreakClock, active: boolean, now: number): BreakClock {
  if (!Number.isFinite(now)) return clock;
  if (active) return clock.since === null ? { ...clock, since: now } : clock;
  return clock.since === null ? clock : { played: clock.played + Math.max(0, now - clock.since), since: null };
}
export function breakDue(clock: BreakClock, minutes: number, now: number) {
  return minutes > 0 && clock.played + (clock.since === null ? 0 : Math.max(0, now - clock.since)) >= minutes * 60000;
}
let shared: BreakClock = { played: 0, since: null };
export function markArcadePlaying(active: boolean) { shared = changeBreakClock(shared, active, Date.now()); }
export function arcadeBreakDue(minutes: number) { return breakDue(shared, minutes, Date.now()); }
export function acknowledgeArcadeBreak() { shared = { played: 0, since: shared.since === null ? null : Date.now() }; }
