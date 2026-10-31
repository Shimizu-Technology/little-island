import { GameIcon as ShelfArt } from "./GameIcon";
import { isBoardId } from "../board";
import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Text } from "./Text";
import { C, Copy, Heading, IconButton, PressableScale, font } from "./ui";
import { GameId, gameIds } from "../games";
import { LearnId, learnIds } from "../learn/types";
import { ongoing, shelfLevel, ShelfGame, ShelfId } from "../learn/home";
import { subjectTheme } from "../learn/LearnChrome";
import { learningCardArt } from "./learningCardArt";
import { useStore } from "../state/Store";
export function openShelfGame(id: ShelfId) {
  router.push({ pathname: isBoardId(id) ? "/board" : learnIds.includes(id as LearnId) ? "/learn" : gameIds.includes(id as GameId) ? "/play" : "/activity", params: { game: id } });
}
// Compatibility name for existing shelves; all listings share the same tile.
export { GameIcon as ShelfArt } from "./GameIcon";
export function GameCards({ games, width }: { games: ShelfGame[]; width: number }) {
  const store = useStore();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
    {games.map(g => {
      const live = ongoing(store.save, g.id), favorite = (store.save.favoriteGames ?? []).includes(g.id);
      const level = learnIds.includes(g.id as LearnId) ? shelfLevel(store.save, g.id as LearnId) : undefined;
      const learning = !!level;
      const theme = learning && g.id === "hafa-adai" ? { sky: "#FFE4D9", land: "#F5BCA6", accent: "#A44E3A", ink: "#65382D" } : learning ? subjectTheme[g.island as keyof typeof subjectTheme] : undefined;
      return <View key={g.id} style={{ width, borderRadius: learning ? 24 : 20, overflow: "hidden", backgroundColor: C.paper, borderWidth: learning ? 2 : 1, borderColor: theme?.accent ?? C.line, shadowColor: C.ink, shadowOpacity: learning ? 0.13 : 0, shadowOffset: { width: 0, height: 5 }, shadowRadius: 0, elevation: learning ? 3 : 0 }}>
        <PressableScale accessibilityRole="button" accessibilityLabel={`Play ${g.name}${level ? `, Level ${level} of 5` : ""}${g.ages ? `, ${g.ages}` : ""}${live ? ", saved round available" : ""}`} onPress={() => openShelfGame(g.id)} amount={0.98} style={{ flex: 1 }}>
          <View style={{ height: learning ? learningCardArt.height : 88, paddingRight: width < 200 ? 24 : 0, backgroundColor: theme?.sky ?? g.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {learning && <View pointerEvents="none" style={{ position: "absolute", bottom: learningCardArt.landBottom, width: width * 1.25, height: learningCardArt.landHeight, borderRadius: width, backgroundColor: theme?.land }}/>}
            <View style={{ zIndex: 1 }}><ShelfArt id={g.id} size={learning ? learningCardArt.size : 74} /></View>
          </View>
          <View style={{ padding: 12, gap: 5, flex: 1 }}>
            <Heading style={{ fontSize: 20 }}>{g.name}</Heading>
            {level && <><Copy style={{ fontSize: 12, fontWeight: "800", color: theme?.ink }}>Level {level} of 5</Copy><View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>{[1,2,3,4,5].map(n => <View key={n} style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: n === level ? theme?.accent : theme?.sky, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 12, fontWeight: "900", color: n === level ? C.paper : theme?.ink }}>{n}</Text></View>)}</View></>}
            <Copy style={{ fontSize: 12, lineHeight: 18, color: C.teal }}>{g.ages ? `${g.ages} · ${g.players}` : g.players}</Copy>
            <Copy style={{ fontSize: 13, lineHeight: 19 }}>{g.description}</Copy>
            <Text style={{ color: C.teal, fontFamily: font, fontWeight: "700", fontSize: 14, marginTop: "auto", paddingTop: 5 }}>{live ? "Continue →" : "Let’s play →"}</Text>
          </View>
        </PressableScale>
        <View style={{ position: "absolute", top: 8, right: 8 }}><IconButton icon={favorite ? "star-filled" : "star"} selected={favorite} size={44} label={`${favorite ? "Remove favorite" : "Favorite"} ${g.name}`} onPress={() => store.toggleGameFavorite(g.id)} /></View>
      </View>;
    })}
  </View>;
}
