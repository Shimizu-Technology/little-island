import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state/Store";
import { Copy, styles } from "../components/ui";
import { Recovery } from "../components/Recovery";
import { LearnFrame } from "../learn/LearnFrame";
import { LearnId, learnIds } from "../learn/types";

export default function Learn() {
  const { game } = useLocalSearchParams<{ game?: string }>(),
    store = useStore();
  if (!learnIds.includes(game as LearnId)) return <Redirect href="/" />;
  if (!store.ready)
    return (
      <SafeAreaView style={styles.page}>
        <Copy>Opening your game…</Copy>
      </SafeAreaView>
    );
  if (store.recovery)
    return (
      <SafeAreaView style={styles.page}>
        <Recovery />
      </SafeAreaView>
    );
  return <LearnFrame key={game} id={game as LearnId} />;
}
