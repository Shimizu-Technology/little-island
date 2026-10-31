import React, { useState } from "react";
import { View } from "react-native";
import { useStore } from "../state/Store";
import { Button, Copy } from "./ui";

export function SaveStatus() {
  const store = useStore();
  const [retrying, setRetrying] = useState(false);
  if (!store.error) return null;
  return (
    <View accessibilityRole="alert" style={{ padding: 14, backgroundColor: "#FBE8DE", borderRadius: 16, gap: 8, marginBottom: 12 }}>
      <Copy>{store.error}</Copy>
      <Button quiet disabled={retrying} onPress={() => {
        setRetrying(true);
        void store.retry().finally(() => setRetrying(false));
      }}>{retrying ? "Trying to save…" : "Try saving again"}</Button>
    </View>
  );
}
