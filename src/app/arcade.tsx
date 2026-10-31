import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ArcadeGameScreen, ArcadeLobby } from "../arcade/ArcadeScreen";
import { RenderSpike } from "../arcade/RenderSpike";
import { arcadeGames } from "../arcade";
import { useStore } from "../state/Store";
import { Recovery } from "../components/Recovery";
import { Heading, styles } from "../components/ui";
export default function Arcade() {
  const params = useLocalSearchParams<{ game?: string; spike?: string; budget?: string }>(), store = useStore();
  const game = arcadeGames.find(g => g.id === params.game);
  return <SafeAreaView style={[styles.page, { backgroundColor: game?.id === "shell-song" ? "#222958" : "#077C91" }]}>{!store.ready ? <View style={styles.content}><Heading>Getting the arcade ready…</Heading></View> : store.recovery ? <Recovery/> : params.spike === "1" ? <ScrollView><RenderSpike/></ScrollView> : game ? <ArcadeGameScreen key={game.id} game={game} debug={params.budget === "1"}/> : <ArcadeLobby/>}</SafeAreaView>;
}
