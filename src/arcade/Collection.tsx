import { stickerSections } from "./presentation";
import React from "react";
import { View } from "react-native";
import { Button, C, Copy, Heading } from "../components/ui";
import { ArcadeArt, StickerArt, stickerNames } from "./Art";
import { type ArcadeLearner, gameProgress, outfitIds, outfitNames, outfitStars, stickerIds, type OutfitId } from "./progress";
import type { ArcadeGame } from "./types";
/** All sixteen kit stickers, arranged as nine game chapters. Rewards remain shared. */
export const stickerChapters: { name: string; stickers: readonly (typeof stickerIds[number])[] }[] = [
  { name: "Canoe Cargo", stickers: ["moon-canoe"] },
  { name: "Fruit Bat Flight", stickers: ["flying-fox", "jelly-light"] },
  { name: "Lagoon Run", stickers: ["sea-turtle", "lagoon-ray"] },
  { name: "Reef Builder", stickers: ["reef-fish", "rainbow-fish"] },
  { name: "Shell Song", stickers: ["singing-shell", "star-shell"] },
  { name: "Rail Parade", stickers: ["tiny-rail", "island-flower"] },
  { name: "Crab Crossing", stickers: ["little-crab", "hermit-home"] },
  { name: "Palm Patrol", stickers: ["coconut", "sun-coral"] },
  { name: "Beach Ball", stickers: ["sea-star"] },
];
export function StickerBook({ person }: { person: ArcadeLearner }) {
  return <View style={{ gap: 14 }}><Heading>My island friends</Heading><Copy>{person.stickers.length} of {stickerIds.length} friends found. Every chest shows its sticker. Collect them in any game.</Copy>
    {stickerSections(person).map(chapter => <View key={chapter.name} style={{ gap: 10 }}><Heading style={{ fontSize: 19 }}>{chapter.name}</Heading>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>{chapter.stickers.map(id => {
        const found = person.stickers.includes(id);
        return <View key={id} accessibilityLabel={`${stickerNames[id]}, ${found ? "collected" : "waiting in a chest"}`} style={{ width: 136, minHeight: 156, padding: 12, alignItems: "center", gap: 6, backgroundColor: found ? "#FFF1CD" : "#E9E0CF", borderRadius: 26, borderWidth: 3, borderColor: found ? "#D4AA55" : "#D0C6B3", transform: [{ rotate: found ? "-3deg" : "2deg" }], boxShadow: "0 3px 0 #C9B993" }}>
          <View style={{ opacity: found ? 1 : .2, backgroundColor: "#FFF9E9", borderRadius: 48, borderWidth: 3, borderColor: "#FFFDF5" }}><StickerArt id={id} size={86}/></View><Copy style={{ fontSize: 14, textAlign: "center", color: C.ink }}>{stickerNames[id]}</Copy>
        </View>;
      })}</View>
    </View>)}
  </View>;
}
export function OutfitCloset({ game, person, onSelect }: { game: ArcadeGame; person: ArcadeLearner; onSelect: (outfit: OutfitId) => void }) {
  const p = gameProgress(person, game.id);
  return <View style={{ gap: 14 }}><Heading>Dress {game.hero.split(" the ")[0]}</Heading><Copy>Outfits open with your stars. They are just for fun. Helper earns the same stars.</Copy>
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>{outfitIds.map(id => {
      const unlocked = p.unlockedOutfits.includes(id);
      return <View key={id} style={{ width: 140, alignItems: "center", gap: 8, padding: 10, backgroundColor: p.outfit === id ? game.surface : C.paper, borderRadius: 20 }}><ArcadeArt game={game.id} size={110} outfit={id}/><Copy style={{ fontSize: 14, textAlign: "center" }}>{outfitNames[id]}</Copy><Button quiet compact selected={p.outfit === id} disabled={!unlocked} label={`${outfitNames[id]}, ${unlocked ? p.outfit === id ? "wearing" : "choose outfit" : `opens at ${outfitStars[id]} stars`}`} onPress={() => onSelect(id)}>{unlocked ? p.outfit === id ? "Wearing" : "Wear it" : `${outfitStars[id]} stars`}</Button></View>;
    })}</View>
  </View>;
}
