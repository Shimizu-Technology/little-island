import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { storage } from "../state/storage";
import { RecoveryEntry } from "../state/recoveryHistory";
import { parseSave } from "../state/validation";
import { exportBackup } from "../state/backup";
import { Button, C, Copy, Heading } from "./ui";

export function PreviousSaves({ onChoose }: { onChoose: (raw: string) => void }) {
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ key: string; raw: string; summary: string; valid: boolean }>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void storage.listRecovery().then((items) => { if (active) { setEntries(items); setError(""); } })
      .catch(() => { if (active) setError("Previous saves could not be opened. Your copies are still kept."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  async function inspect(entry: RecoveryEntry) {
    setBusy(true); setError(""); setSelected(undefined);
    try {
      const raw = await storage.readRecovery(entry.key);
      if (raw === null) throw new Error("missing");
      let summary: string, valid = false;
      try {
        const save = parseSave(raw);
        summary = `${Object.keys(save.sessions).length + Object.keys(save.activities ?? {}).length} saved game rounds · ${save.explore?.favorites.length ?? 0} favorite discoveries`;
        valid = true;
      } catch {
        summary = "This copy cannot be opened by this version. Export it to keep the original data.";
      }
      setSelected({ key: entry.key, raw, summary, valid });
    } catch {
      setError("That copy could not be read. Try again or choose another copy.");
    } finally { setBusy(false); }
  }
  return (
    <View style={{ gap: 12 }}>
      <Heading style={{ fontSize: 19 }}>Previous saves on this device</Heading>
      <Copy>Copies kept before a restore or fresh start. The date is when the copy was preserved. Nothing changes until you confirm a restore.</Copy>
      {loading && <Copy>Opening previous saves…</Copy>}
      {!loading && !error && entries.length === 0 && <Copy>No previous copies yet. Restoring a backup keeps a copy of the games it replaces.</Copy>}
      {!!error && <View accessibilityRole="alert" style={{ gap: 8 }}><Copy>{error}</Copy><Button quiet disabled={busy} onPress={() => { setLoading(true); setAttempt((n) => n + 1); }}>Try opening copies again</Button></View>}
      {entries.slice(0, limit).map((entry, index) => (
        <View key={entry.key} style={{ borderWidth: 1, borderColor: C.line, padding: 12, borderRadius: 14, gap: 8 }}>
          <Copy>{entry.createdAt === null ? "Earlier preserved copy" : new Date(entry.createdAt).toLocaleString()}</Copy>
          <Button quiet disabled={busy} selected={selected?.key === entry.key} label={`Inspect previous save ${index + 1}`} onPress={() => void inspect(entry)}>Inspect copy {index + 1}</Button>
          {selected?.key === entry.key && <>
            <Copy>{selected.summary}</Copy>
            <Button quiet disabled={busy} onPress={() => {
              setBusy(true);
              void exportBackup(selected.raw).catch(() => setError("This copy could not be exported. Please try again.")).finally(() => setBusy(false));
            }}>Export this copy</Button>
            {selected.valid && <Button disabled={busy} onPress={() => onChoose(selected.raw)}>Choose this copy to restore</Button>}
          </>}
        </View>
      ))}
      {entries.length > limit && <Button quiet disabled={busy} onPress={() => setLimit((n) => n + 10)}>Show older copies</Button>}
    </View>
  );
}
