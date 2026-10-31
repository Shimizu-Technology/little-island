import type { GrowthStage } from "../learn/growth/types";
import type { MathLimit, MathOperation } from "../math/questions";

export type PracticeSettings = { enabled: boolean; subject: "math" | "reading" | "mixed"; limit: MathLimit; operation: MathOperation; mathStage?: GrowthStage; readingStage?: GrowthStage };
export const defaultPracticeSettings: PracticeSettings = { enabled: false, subject: "math", limit: 10, operation: "mixed" };
/** Completion is separate from accuracy: using help never prevents play. */
export type PracticeResult = { skill: string; helped: boolean };
export type PracticeSummary = { results: PracticeResult[]; bypassed: boolean };
export type PracticeNotes = Record<string, { independent: number; helped: number }>;

export function validPracticeSummary(v: unknown): v is PracticeSummary {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  return Object.keys(s).length === 2 && typeof s.bypassed === "boolean" && Array.isArray(s.results) &&
    s.results.length <= 3 && (s.bypassed || s.results.length === 3) && s.results.every(raw => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
      const r = raw as Record<string, unknown>;
      return Object.keys(r).length === 2 && typeof r.helped === "boolean" && typeof r.skill === "string" && /^(num|read)\.[a-z0-9-]{1,40}$/.test(r.skill);
    });
}

export function validPracticeSettings(v: unknown): v is PracticeSettings {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  return Object.keys(s).length >= 4 && Object.keys(s).length <= 6 && Object.keys(s).every(k => ["enabled", "subject", "limit", "operation", "mathStage", "readingStage"].includes(k)) &&
    typeof s.enabled === "boolean" && ["math", "reading", "mixed"].includes(s.subject as string) &&
    [10, 20].includes(s.limit as number) && [s.mathStage, s.readingStage].every(stage => stage === undefined || stage === "stretch" || stage === "deep") && ["add", "subtract", "mixed"].includes(s.operation as string);
}
export function validPracticeNotes(v: unknown): v is PracticeNotes {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.keys(v).length <= 100 && Object.entries(v).every(([skill, raw]) => {
    if (!/^(num|read)\.[a-z0-9-]{1,40}$/.test(skill) || !raw || typeof raw !== "object" || Array.isArray(raw)) return false;
    const n = raw as Record<string, unknown>;
    return Object.keys(n).length === 2 && ["independent", "helped"].every(k => typeof n[k] === "number" && Number.isInteger(n[k]) && (n[k] as number) >= 0 && (n[k] as number) <= 99999);
  });
}
