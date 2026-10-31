import type { PracticeNotes } from "./types";

export function recordPracticeNote(before: PracticeNotes | undefined, skill: string, helped: boolean): PracticeNotes {
  const notes = before ?? {};
  if (!/^(num|read)\.[a-z0-9-]{1,40}$/.test(skill) || (!notes[skill] && Object.keys(notes).length >= 100)) return notes;
  const current = notes[skill] ?? { independent: 0, helped: 0 };
  const key = helped ? "helped" : "independent";
  return { ...notes, [skill]: { ...current, [key]: Math.min(99999, current[key] + 1) } };
}
