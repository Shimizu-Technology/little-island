/** Pure, serializable hit contract. Seconds, advanced only while the round is active. */
export type Lives = { hearts: number; maxHearts: number; invulnerable: number; hit: number };
export const HIT_SECONDS = 1.2;
export function createLives(helper = false, oneHit = false): Lives {
  "worklet";
  const maxHearts = oneHit ? 1 : helper ? 5 : 3;
  return { hearts: maxHearts, maxHearts, invulnerable: 0, hit: 0 };
}
/** Switching Helper preserves damage already taken, so toggling never refills hearts. */
export function configureLives(lives: Lives, helper: boolean, oneHit = false): Lives {
  "worklet";
  const maxHearts = oneHit ? 1 : helper ? 5 : 3;
  return { ...lives, maxHearts, hearts: lives.hearts === 0 ? 0 : Math.max(0, maxHearts - (lives.maxHearts - lives.hearts)) };
}
export function stepLives(lives: Lives, dt: number): Lives {
  "worklet";
  if (!Number.isFinite(dt) || dt <= 0 || lives.invulnerable === 0) return lives;
  return { ...lives, invulnerable: Math.max(0, lives.invulnerable - Math.min(.1, dt)) };
}
export function hitLives(lives: Lives): Lives {
  "worklet";
  if (!lives.hearts || lives.invulnerable > 0) return lives;
  return { ...lives, hearts: lives.hearts - 1, invulnerable: HIT_SECONDS, hit: lives.hit + 1 };
}
export function validLives(v: unknown): v is Lives {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const l = v as Lives;
  return Object.keys(l).sort().join() === "hearts,hit,invulnerable,maxHearts" && [1, 3, 5].includes(l.maxHearts) && Number.isInteger(l.hearts) && l.hearts >= 0 && l.hearts <= l.maxHearts && Number.isInteger(l.hit) && l.hit >= 0 && l.hit <= 99999999 && Number.isFinite(l.invulnerable) && l.invulnerable >= 0 && l.invulnerable <= HIT_SECONDS;
}
