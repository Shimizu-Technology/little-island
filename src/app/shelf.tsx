import React, { useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Chip, Copy, GameHeader, Heading, styles } from "../components/ui";
import { GameCards } from "../components/GameShelf";
import { SaveStatus } from "../components/SaveStatus";
import { Recovery } from "../components/Recovery";
import { useStore } from "../state/Store";
import { islandNames, shelfGames } from "../learn/home";
const classicFilters = ["All games", "Play alone", "Play together", "Favorites", "Words & numbers", "Think & explore"];
export default function Shelf() {
  const { island } = useLocalSearchParams<{ island?: string }>();
  if (!island || !["reading", "numbers", "science", "thinking", "coding", "classic"].includes(island)) return <Redirect href="/" />;
  return <IslandShelf key={island} island={island as Exclude<keyof typeof islandNames, "explore">} />;
}
function IslandShelf({ island }: { island: Exclude<keyof typeof islandNames, "explore"> }) {
  const store = useStore(), insets = useSafeAreaInsets(), { width, fontScale } = useWindowDimensions();
  const [filter, setFilter] = useState("All games");
  const available = width - insets.left - insets.right;
  const columns = fontScale > 1.3 || available < 350 ? 1 : available >= 900 ? 3 : 2;
  const cardWidth = (Math.min(available, 1080) - 40 - 12 * (columns - 1)) / columns;
  const choices = shelfGames.filter(g => g.island === island && (filter === "All games" || (filter === "Favorites" ? store.save.favoriteGames?.includes(g.id) : g.filters.includes(filter))));
  if (!store.ready) return <SafeAreaView style={styles.page}><Heading>Getting your island ready…</Heading></SafeAreaView>;
  if (store.recovery) return <SafeAreaView style={styles.page}><Recovery /></SafeAreaView>;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: 20, gap: 14 }]}>
    <GameHeader title={islandNames[island]} backLabel="Islands" onBack={() => router.canGoBack() ? router.back() : router.replace("/")} />
    <SaveStatus />
    <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]} accessibilityLabel="Game categories">
      {(island === "classic" ? classicFilters : ["All games", "Play alone", "Play together", "Favorites"]).map(f => <Chip key={f} selected={f === filter} onPress={() => setFilter(f)}>{f}</Chip>)}
    </View>
    {!choices.length && <Copy>{filter === "Favorites" ? "Tap the star on a game to keep it close by." : "Try another way to play on this island."}</Copy>}
    <GameCards games={choices} width={cardWidth} />
    <Copy style={{ fontSize: 12, textAlign: "center", paddingVertical: 10 }}>Offline · No ads · Made for little moments together.</Copy>
  </ScrollView></SafeAreaView>;
}
