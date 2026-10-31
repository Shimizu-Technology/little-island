import { CardSession, validCardSession } from "../cards/engine";
import { RaceRecords, RaceSession, validRaceRecords, validRaceSession } from "../racer/engine";

import { MysterySession, validMysterySession } from "../mystery/engine";
import { PartySession, validPartySession } from "../party/engine";
export type ActivityId = "go-fish" | "crazy-eights" | "racer" | "word-imposter" | "island-mystery";
export type ActivitySession = CardSession | RaceSession | PartySession | MysterySession;
export type Activities = Partial<Record<ActivityId, ActivitySession>>;
export const activityIds: ActivityId[] = ["go-fish", "crazy-eights", "racer", "word-imposter", "island-mystery"];
export function validActivities(value: unknown): value is Activities {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, session]) =>
    key === "island-mystery"
      ? validMysterySession(session) && session.solo
      : key === "word-imposter"
        ? validPartySession(session)
        : key === "racer"
          ? validRaceSession(session)
          : (key === "go-fish" || key === "crazy-eights") && validCardSession(session) && session.game === key
  );
}
export function validActivityRecords(value: unknown): value is RaceRecords {
  return validRaceRecords(value);
}

export function activityFinished(session: ActivitySession): boolean {
  return session.game === "racer" ? ["finished", "timedout"].includes(session.status) : session.result !== null;
}
