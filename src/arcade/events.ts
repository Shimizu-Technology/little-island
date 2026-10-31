/** Event counters plus terminal/score edges cover engines that finish without incrementing event. */
export function arcadeEvent(s: unknown): string {
  "worklet";
  if (!s || typeof s !== "object") return "";
  const v = s as { event?: number; phase?: string; status?: string; score?: number };
  return `${v.event ?? ""}:${v.phase ?? ""}:${v.status ?? ""}:${v.score ?? ""}`;
}
