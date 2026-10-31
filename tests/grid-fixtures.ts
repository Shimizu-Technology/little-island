import { railHedges, railLearning, railMove, railSnake, type RailState } from "../src/arcade/games/rail-parade/engine";
import { crabStep, crabTransition, type CrabState } from "../src/arcade/games/crab-crossing/engine";
import { delta, directions, opposite, same, type Direction } from "../src/arcade/games/grid/rules";
/** Reproducible route fixtures, not production hints. They use the actual rule engines. */
function safeTail(s: RailState): boolean {
  const tail = s.body.at(-1)!,
    seen = new Set<string>(),
    q = [s.body[0]];
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    if (same(p, tail)) return true;
    for (const d of directions) {
      const n = { x: p.x + delta[d].x, y: p.y + delta[d].y },
        key = `${n.x},${n.y}`;
      if (
        n.x < 0 ||
        n.x > 9 ||
        n.y < 0 ||
        n.y > 9 ||
        seen.has(key) ||
        s.body.slice(0, -1).some((b) => same(b, n)) ||
        railHedges(s).some((b) => same(b, n)) ||
        railSnake(s).some((b) => same(b, n))
      )
        continue;
      seen.add(key);
      q.push(n);
    }
  }
  return false;
}
export function railPath(s: RailState): Direction[] {
  const q = [{ ...s.body[0], path: [] as Direction[] }],
    seen = new Set<string>();
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    if (same(c, s.food)) {
      let future = s;
      for (const d of c.path) future = railMove(future, d);
      if (future.bumps === s.bumps && (future.phase === "cleared" || safeTail(future))) return c.path;
    }
    for (const d of directions) {
      if (!c.path.length && opposite(s.direction, d) && s.body.length > 1) continue;
      const p = { x: c.x + delta[d].x, y: c.y + delta[d].y },
        key = `${p.x},${p.y}`;
      if (
        p.x < 0 ||
        p.x > 9 ||
        p.y < 0 ||
        p.y > 9 ||
        seen.has(key) ||
        s.body.slice(0, -1).some((b) => same(b, p)) ||
        railHedges(s).some((b) => same(b, p)) ||
        (railLearning(s) && same(s.decoy, p)) ||
        railSnake(s).some((b) => same(b, p)) ||
        (!railLearning(s) && p.y === (s.level === "endless" ? 2 : s.level.snakeRow) && p.x > 0 && p.x < 9)
      )
        continue;
      seen.add(key);
      q.push({ ...p, path: [...c.path, d] });
    }
  }
  // Tail-following keeps the parade moving while a blocked route opens.
  return directions
    .filter((d) => !opposite(s.direction, d) && railMove(s, d).bumps === s.bumps && safeTail(railMove(s, d)))
    .sort((a, b) => {
      const pa = delta[a],
        pb = delta[b],
        tail = s.body.at(-1)!;
      return (
        Math.abs(s.body[0].x + pa.x - tail.x) +
        Math.abs(s.body[0].y + pa.y - tail.y) -
        Math.abs(s.body[0].x + pb.x - tail.x) -
        Math.abs(s.body[0].y + pb.y - tail.y)
      );
    });
}
export function crabAdvance(s: CrabState, frames = 8): CrabState {
  for (let i = 0; i < frames && s.phase === "play"; i++) s = crabStep(s, { type: "tick" }, 1 / 60);
  return s;
}
export function crossingPath(s: CrabState): (Direction | "wait")[] {
  const q = [{ state: s, path: [] as (Direction | "wait")[], cost: 0 }],
    seen = new Set<string>();
  for (let n = 0; q.length && n < 24000; n++) {
    // A* favors reaching shore; waiting remains available at every row.
    q.sort((a, b) => a.cost - b.cost);
    const { state, path } = q.shift()!;
    for (const d of ["up", "left", "right", "wait", "down"] as const) {
      const next = crabAdvance(d === "wait" ? state : crabTransition(state, { type: "hop", direction: d }));
      if (next.phase === "cleared" || next.crossed > s.crossed) return [...path, d];
      if (next.bumps > s.bumps || next.phase !== "play" || path.length >= 65 || next.hop || next.respawn > 0) continue;
      const key = [Math.round(next.x * 12), next.y, Math.round(next.travel * 12)].join();
      if (seen.has(key)) continue;
      seen.add(key);
      q.push({ state: next, path: [...path, d], cost: path.length + 1 + next.y * 1.5 });
    }
  }
  throw new Error(`No crossing route: ${s.level === "endless" ? "free" : s.level.id}, ${s.crossed}`);
}

/** Plan one cell ahead because an in-flight Rail turn applies at the next cell boundary. */
export function railUpcoming(s: RailState): Direction | undefined {
  const next = railMove(s, s.direction);
  if (next.phase !== "play" || next.bumps !== s.bumps) return undefined;
  return railPath({ ...next, patrol: (s.patrol + 1) % 10000 })[0];
}
