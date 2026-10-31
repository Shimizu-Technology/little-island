import type { Save } from "./validation";
import { ActivityId, ActivitySession, validActivities } from "./activities";
import { mergeRaceRecord, raceRecord } from "../racer/engine";
export type ActivityExpected = { id: string | null; revision?: number; epoch: number };
/** Reject callbacks from replaced rounds or an earlier backup generation. */
export function applyActivitySave(
  save: Save,
  game: ActivityId,
  next: ActivitySession,
  expected: ActivityExpected,
  epoch: number
): Save {
  const current = save.activities?.[game];
  if (
    expected.epoch !== epoch ||
    (current?.id ?? null) !== expected.id ||
    (expected.revision !== undefined &&
      (!current || !("revision" in current) || current.revision !== expected.revision)) ||
    next.game !== game ||
    !validActivities({ [game]: next })
  )
    return save;
  return {
    ...save,
    activities: { ...save.activities, [game]: next },
    recentActivity: game,
    recentLearn: null,
    ...(next.game === "racer" ? { raceRecords: mergeRaceRecord(save.raceRecords ?? {}, raceRecord(next)) } : {}),
  };
}
