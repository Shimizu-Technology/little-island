import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { Button, C, Copy, Heading } from "../components/ui";
import { nativeDriver, useReducedMotion } from "../components/motion";
import { ReefFish, Shell } from "./Art";
import { CargoTeaching } from "./games/canoe-cargo/Teaching";
import type { ArcadeGame } from "./types";
export function Teaching({ game, learning, onPlay, onHear }: { game: ArcadeGame; learning: boolean; onPlay: () => void; onHear: () => void }) {
  const reduced = useReducedMotion(), [replay, setReplay] = useState(0), [phase, setPhase] = useState(0), [move] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    move.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(move, { toValue: 1, delay: 350, duration: 1100, useNativeDriver: nativeDriver });
    if (!reduced) animation.start();
    [0, 1, 2, 3].forEach((n, i) => timers.push(setTimeout(() => setPhase(n), reduced ? 0 : i * 650)));
    return () => { animation.stop(); timers.forEach(clearTimeout); };
  }, [replay, reduced, move]);
  if (game.id === "canoe-cargo") return <CargoTeaching learning={learning} onHear={onHear} onPlay={onPlay}/>;
  const reef = game.id === "reef-builder";
  return <View style={{ gap: 16, alignItems: "center" }}>
    <Heading>{reef ? learning ? "Two number friends make ten" : "A little coral. A happy fish." : learning ? "Sounds make a word" : "The shore sings. You echo."}</Heading>
    {reef ? <>
      <ReefFish size={100}/><View style={{ width: 288, height: 140, backgroundColor: "#D1E8DF", borderRadius: 18, overflow: "hidden", padding: 16 }}>
        <View style={{ flexDirection: "row", position: "absolute", top: 22, left: 16 }}>{Array.from({ length: 8 }, (_, i) => <View key={i} style={{ width: 32, height: 36, borderWidth: 1, borderColor: "#76A994", backgroundColor: i < (learning ? 1 : 6) ? "#E3B77C" : "#B9DBCC", alignItems: "center", justifyContent: "center" }}><Heading style={{ fontSize: 18 }}>{learning && i === 0 ? "4" : ""}</Heading></View>)}</View>
        <Animated.View style={{ position: "absolute", left: learning ? 48 : 208, top: 22, width: learning ? 32 : 64, height: 36, backgroundColor: "#E79A7C", borderWidth: 2, borderColor: "#4F7B62", alignItems: "center", justifyContent: "center", transform: [{ translateX: move.interpolate({ inputRange: [0, 1], outputRange: [learning ? 74 : -90, 0] }) }, { translateY: move.interpolate({ inputRange: [0, 1], outputRange: [65, 0] }) }] }}><Heading style={{ fontSize: 18 }}>{learning ? "6" : "→"}</Heading></Animated.View>
      </View>
      <Copy style={{ textAlign: "center" }}>{learning ? "4 + 6 = 10. Put 6 beside 4 and watch the line clear. Rows and columns can both make ten." : "Pick a piece. Drag its first coral into the gap. A full row or column clears and releases its fish."}</Copy>
      <Copy style={{ textAlign: "center", color: C.teal }}>You can also tap a piece, then its spot. There is no timer.</Copy>
    </> : <>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>{[0, 1, 2].map(i => <View key={i} style={{ alignItems: "center" }}><Shell size={88} index={i} glowing={reduced || (phase < 3 && [0, 1, 0][phase] === i)}/><Heading style={{ fontSize: 22 }}>{learning ? ["c", "a", "t"][i] : i + 1}</Heading></View>)}</View>
      <Heading style={{ fontSize: 24 }}>{learning ? "c · a · t → cat" : "1 → 2 → 1"}</Heading>
      <Copy style={{ textAlign: "center" }}>{learning ? "Hear the letter sounds in order. Tap them, blend them together, then choose the cat picture. You can listen again or ask for help." : "Watch the glow and listen. When it says Your turn, tap 1, then 2, then 1. The next song adds one more sound."}</Copy>
      <Copy style={{ textAlign: "center", color: C.teal }}>Take your time to answer. Listen again whenever you like.</Copy>
    </>}
    <Button quiet onPress={() => { setPhase(0); setReplay(n => n + 1); onHear(); }}>Show & tell me again</Button>
    <Button onPress={onPlay}>I’m ready · let’s play</Button>
  </View>;
}
