import type { SkillProgress, SkillRecord } from "./types";

/**
 * Quiet practice memory. Each skill sits in a spacing box (0–5). A correct attempt moves it
 * up and makes it come back less often; a miss moves it down so it returns soon. Nothing here
 * is a grade: it only decides what a game offers next and feeds the grown-up "practicing" view.
 */
export const SKILL_ID = /^(read|num|sci|think|ch)\.[a-z0-9-]{1,40}$/;
export const SKILLS_MAX = 400;
const CAP = 99_999;
/** Days before a skill in each box is "due" again. */
export const BOX_DAYS = [0, 1, 2, 4, 7, 14] as const;

export const dayNumber = (now = Date.now()) => Math.floor(now / 86_400_000);

export function recordPractice(
  progress: SkillProgress | undefined,
  skill: string,
  correct: boolean,
  day = dayNumber()
): SkillProgress {
  if (!SKILL_ID.test(skill)) return progress ?? {};
  const current = progress ?? {};
  const before: SkillRecord = current[skill] ?? { tries: 0, right: 0, box: 0, day };
  // At most one box step per day, so a burst of easy answers doesn't hide a skill for weeks.
  const sameDayClimb = before.day === day && before.tries > 0;
  const box = correct ? Math.min(5, before.box + (sameDayClimb && before.box >= 1 ? 0 : 1)) : Math.max(0, before.box - 2);
  const next: SkillRecord = {
    tries: Math.min(CAP, before.tries + 1),
    right: Math.min(CAP, before.right + (correct ? 1 : 0)),
    box,
    day,
  };
  if (!current[skill] && Object.keys(current).length >= SKILLS_MAX) return current;
  return { ...current, [skill]: next };
}

/** Higher means "offer this now": unseen, due again, or recently missed. */
export function priority(record: SkillRecord | undefined, day = dayNumber()): number {
  if (!record) return 1.6;
  const waited = day - record.day;
  const dueIn = BOX_DAYS[record.box] - waited;
  const due = dueIn <= 0 ? 1 + Math.min(1, -dueIn / 7) : 0.35;
  return due + (5 - record.box) * 0.12;
}

/**
 * Choose `count` items, favouring skills that are due or new, and mixing skills so the same
 * kind of problem doesn't repeat back to back (interleaving). Deterministic for a given rng.
 */
export function pickItems<T extends { skill: string }>(
  items: readonly T[],
  progress: SkillProgress | undefined,
  count: number,
  rng: () => number,
  day = dayNumber()
): T[] {
  const pool = items.map((item) => ({ item, weight: priority(progress?.[item.skill], day) * (0.6 + rng() * 0.8) }));
  pool.sort((a, b) => b.weight - a.weight);
  const chosen: T[] = [];
  const used = new Set<number>();
  while (chosen.length < Math.min(count, pool.length)) {
    const last = chosen[chosen.length - 1]?.skill;
    let index = pool.findIndex((p, i) => !used.has(i) && p.item.skill !== last);
    if (index < 0) index = pool.findIndex((_, i) => !used.has(i));
    used.add(index);
    chosen.push(pool[index].item);
  }
  return chosen;
}

/** Within a pace's skill list, which skill should this round lean on? */
export function focusSkill(skills: readonly string[], progress: SkillProgress | undefined, rng: () => number, day = dayNumber()) {
  return pickItems(skills.map((skill) => ({ skill })), progress, 1, rng, day)[0]?.skill ?? skills[0];
}

const count = (v: unknown, max: number) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export function validSkills(value: unknown): value is SkillProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return (
    entries.length <= SKILLS_MAX &&
    entries.every(([key, r]) => {
      if (!SKILL_ID.test(key) || !r || typeof r !== "object" || Array.isArray(r)) return false;
      const rec = r as Record<string, unknown>;
      return count(rec.tries, CAP) && count(rec.right, CAP) && (rec.right as number) <= (rec.tries as number) && count(rec.box, 5) && count(rec.day, 1_000_000);
    })
  );
}

export type PracticeLine = { skill: string; label: string; state: "getting-easier" | "practicing"; day: number };
/** Recent skills for the grown-up view: no percentages, just what she's been practising. */
export function practiceSummary(progress: SkillProgress | undefined, labels: Record<string, string>, day = dayNumber(), withinDays = 21): PracticeLine[] {
  return Object.entries(progress ?? {})
    .filter(([skill, r]) => labels[skill] && day - r.day <= withinDays)
    .sort((a, b) => b[1].day - a[1].day || b[1].tries - a[1].tries)
    .map(([skill, r]) => ({ skill, label: labels[skill], state: r.box >= 3 ? "getting-easier" : "practicing", day: r.day }));
}
