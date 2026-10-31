import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Copy, Heading, styles } from "./ui";
import { useStore } from "../state/Store";
import { exportBackup } from "../state/backup";
export function Recovery() {
  const store = useStore(),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  async function fresh() {
    try {
      await store.startFresh();
    } catch {
      setError("We could not preserve your old save. Please try again before starting fresh.");
    }
  }
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: 50, gap: 18 }]}>
      <Heading>Let’s look after your saved games.</Heading>
      <Copy>{store.recovery}</Copy>
      <Copy>
        Retry first. You can keep a copy of the original before starting fresh. Starting fresh preserves the original in
        recovery storage.
      </Copy>
      {error && <Copy>{error}</Copy>}
      <Button onPress={() => void store.retry()}>Try opening again</Button>
      {store.raw && (
        <Button
          quiet
          onPress={() =>
            void exportBackup(store.raw!).catch(() => setError("The original could not be exported. Please try again."))
          }
        >
          Save the original backup
        </Button>
      )}
      <Button quiet onPress={() => (confirm ? void fresh() : setConfirm(true))}>
        {confirm ? "Confirm: preserve original and start fresh" : "Start fresh instead"}
      </Button>
    </ScrollView>
  );
}
