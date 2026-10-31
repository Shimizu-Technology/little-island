import { bestLabel, currentLevel } from "./presentation";
import React, { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Button, Copy, Heading, PressableScale } from "../components/ui";
import { Text } from "../components/Text";
import { useReducedMotion } from "../components/motion";
import { StarDisplay } from "./Art";
import { Hero, HudPill } from "./Juice";
import { PlayScene, type ArcadeSceneProps } from "./PlayScene";
import { ChestArt } from "./TreasureArt";
import { type ArcadeGame, type ArcadeLevel, type LevelId, starCount } from "./types";
import { type ArcadeLearner, gameProgress, levelOpen, endlessOpen } from "./progress";
function CurrentNode({ children, active }: { children: React.ReactNode; active: boolean }) {
  const reduced = useReducedMotion(), t = useSharedValue(0);
  useEffect(() => { t.value = 0; if (active && !reduced) t.value = withRepeat(withSequence(withTiming(-5, { duration: 430, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 430, easing: Easing.inOut(Easing.sin) }), withDelay(1800, withTiming(0, { duration: 1 }))), -1, false); return () => cancelAnimation(t); }, [active, reduced, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: t.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
function LockStone() { return <Svg width={60} height={60} viewBox="0 0 60 60" accessible={false}><Path d="M7 45Q0 36 13 17Q23 5 40 14Q57 21 54 43Q49 54 20 52Z" fill="#8BACAC" stroke="#456D7B" strokeWidth={3}/><Path d="M15 23Q26 13 37 20" fill="none" stroke="#BAD1C7" strokeWidth={3} strokeLinecap="round"/><Rect x={23} y={28} width={17} height={15} rx={4} fill="#ECDFC4"/><Path d="M26 28V24Q26 16 32 16Q38 16 38 24V28" stroke="#ECDFC4" strokeWidth={3} fill="none"/><Circle cx={32} cy={34} r={2} fill="#456D7B"/></Svg>; }
export function LevelMap({ game, person, levels, unlockAll, onLevel, onOutfits, onChest, freeBest = 0, active = true, Scene, worldNote, learnerChip }: { learnerChip?: React.ReactNode; game: ArcadeGame; person: ArcadeLearner; levels: readonly ArcadeLevel[]; unlockAll: boolean; onLevel: (id: LevelId | "endless") => void; onOutfits: () => void; onChest: () => void; freeBest?: number; active?: boolean; Scene?: React.ComponentType<ArcadeSceneProps>; worldNote?: (world: ArcadeLevel["world"]) => string | undefined }) {
  const p = gameProgress(person, game.id), { width } = useWindowDimensions(), pathWidth = Math.min(650, width - (width >= 600 ? 54 : 22)), unit = pathWidth / 4;
  const next = currentLevel(person, game.id, levels, unlockAll);
  const [selectedWorld, setSelectedWorld] = useState(next?.world ?? game.worlds[0].id);
  return <View style={{ gap: 18, paddingBottom: 24 }}>
    <View style={{ paddingHorizontal: 16 }}>{learnerChip}</View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 }}><Hero game={game.id} size={110} outfit={p.outfit} active={active}/><View style={{ flex: 1, gap: 9 }}><Heading style={{ color: "#FFF8E4", fontSize: 29 }}>{game.name}</Heading><HudPill><Text style={{ color: "#8D6027" }}>★</Text> {starCount(p.stars)} · {person.stickers.length} stickers</HudPill><Button quiet compact onPress={onOutfits}>Dress {game.hero.split(" the ")[0]}</Button></View></View>
    {person.chest?.game === game.id && <PressableScale accessibilityRole="button" accessibilityLabel="Your sticker chest is waiting" onPress={onChest} style={{ marginHorizontal: 16, padding: 9, borderRadius: 26, backgroundColor: "#FFF0C8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }}><ChestArt sticker={person.chest.sticker} size={90} active={active}/><Heading style={{ fontSize: 20, color: "#65452F" }}>Your sticker chest →</Heading></PressableScale>}
    <View style={{ paddingHorizontal: 16, gap: 10 }}>
      {next && <Button quiet compact onPress={() => onLevel(next.id)}>Current level · {next.world === "learn" ? "Discover" : next.world.toUpperCase()}-{next.index}</Button>}
      <View accessibilityLabel="Choose a world" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{game.worlds.map((world, i) => <Button key={world.id} quiet compact selected={selectedWorld === world.id} onPress={() => setSelectedWorld(world.id)}>{world.learning ? "Discover" : `World ${i + 1}`}</Button>)}</View>
    </View>
    <View style={{ flexDirection: width >= 760 ? "row" : "column", flexWrap: "wrap", gap: 18, paddingHorizontal: width >= 760 ? 16 : 0, justifyContent: "space-between" }}>{game.worlds.map((world, worldIndex) => {
      if (world.id !== selectedWorld) return null;
      const open = unlockAll || p.openWorlds.includes(world.id), own = levels.filter(l => l.world === world.id), high = 310;
      const xs = [0, 1, 2, 3, 3, 2, 1, 0].map(c => c * unit + unit / 2), ys = [65, 46, 65, 84, 205, 223, 205, 187];
      const d = `M${xs[0]} ${ys[0]} C${xs[1]} 5 ${xs[2]} 26 ${xs[3]} ${ys[3]} Q${pathWidth + 10} 160 ${xs[4]} ${ys[4]} C${xs[5]} 267 ${xs[6]} 229 ${xs[7]} ${ys[7]}`;
      return <View key={world.id} testID={`world-${world.id}`} style={{ marginHorizontal: width >= 760 ? 0 : width >= 600 ? 24 : 8, width: width >= 760 ? "100%" : undefined, maxWidth: 700, alignSelf: "center", borderRadius: 32, overflow: "hidden", borderWidth: 3, borderColor: "#D5E8D3" }}>
        <PlayScene Scene={Scene} game={game.id} world={world.id} active={active}/>
        {world.palette && <View pointerEvents="none" style={{ position: "absolute", inset: 0, backgroundColor: world.palette[0], opacity: .38 }}/>}
        <View style={{ paddingTop: 20, paddingHorizontal: 20, gap: 5 }}><Copy style={{ color: "#FFF1C5", fontSize: 12, fontWeight: "800", letterSpacing: 2, backgroundColor: "#24536A", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>{world.learning ? "PLAY & DISCOVER" : `WORLD ${worldIndex + 1}`}</Copy><Heading style={{ fontSize: 28, color: "#FFF8E4", backgroundColor: "#24536A", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>{world.name}</Heading><Copy style={{ color: "#FFF8E4", fontSize: 15, backgroundColor: "#24536A", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 }}>{open ? worldNote?.(world.id) ?? world.detail : `${world.stars} stars to explore · ${starCount(p.stars)} found`}</Copy></View>
        <View style={{ width: pathWidth, height: high, alignSelf: "center", marginTop: 10 }}><Svg width={pathWidth} height={high} style={{ position: "absolute" }} accessible={false}><Path d={d} fill="none" stroke="#325F77" strokeWidth={23} strokeLinecap="round" opacity={.5}/><Path d={d} fill="none" stroke="#F2DDA5" strokeWidth={16} strokeLinecap="round"/><Path d={d} fill="none" stroke="#FFF3CE" strokeWidth={3} strokeDasharray="2 13" strokeLinecap="round"/></Svg>
          {own.map((level, i) => {
            const available = levelOpen(p, level.id, unlockAll), stars = p.stars[level.id] ?? 0, current = next?.id === level.id;
            const face = <View style={{ width: 62, height: 62, borderRadius: 25, justifyContent: "center", alignItems: "center", backgroundColor: available ? current ? "#FFDD78" : stars ? "#357F80" : "#FFF4D8" : "transparent", borderWidth: available ? 3 : 0, borderColor: current ? "#936035" : stars ? "#C3EAD1" : "#C9AC72", boxShadow: available ? "0 5px 0 #285C6C" : undefined }}>{available ? <Text style={{ color: stars ? "#FFF9EA" : "#684428", fontSize: 28, fontWeight: "900" }}>{level.index}</Text> : <LockStone/>}</View>;
            const node = <PressableScale testID={`level-${level.id}`} disabled={!available} accessibilityRole="button" accessibilityLabel={`${world.name}, level ${level.index}, ${level.name}, ${stars} stars${available ? "" : ", locked"}`} accessibilityState={{ disabled: !available }} onPress={() => onLevel(level.id)} style={{ width: 62, height: 62, borderRadius: 25 }}>
              {current ? <CurrentNode active={active}>{face}</CurrentNode> : face}
            </PressableScale>;
            return <View key={level.id} style={{ position: "absolute", left: xs[i] - unit / 2, top: ys[i] - 31, width: unit, alignItems: "center", gap: 3 }}>
              {current && <View style={{ position: "absolute", top: -23, backgroundColor: "#FFF1C7", paddingHorizontal: 9, paddingVertical: 2, borderRadius: 12 }}><Text style={{ color: "#5D3E2E", fontSize: 12, fontWeight: "900" }}>NEXT</Text></View>}{node}<StarDisplay stars={stars} size={18}/>
            </View>;
          })}
        </View>
      </View>;
    })}</View>
    <View style={{ marginHorizontal: 16, padding: 20, backgroundColor: "#FFF2CE", borderRadius: 28, gap: 10 }}><Heading style={{ fontSize: 25 }}>Free play</Heading><Copy>{endlessOpen(p, unlockAll) ? "Your own pace. Stop whenever you like." : "Clear the eight first-world levels to explore."}</Copy><Copy>Free-play record: {freeBest}</Copy><Copy>{bestLabel}: {p.best}</Copy><Copy style={{ fontSize: 13 }}>Historical scores include Helper and different level settings.</Copy><Button disabled={!endlessOpen(p, unlockAll)} onPress={() => onLevel("endless")}>Play freely</Button></View>
  </View>;
}
