import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { Button, Copy, Heading } from "../../../components/ui";
import { nativeDriver, useReducedMotion } from "../../../components/motion";
import { CargoCaptain, CargoCanoe, CargoTile } from "./Art";
/** Five-second supplied-gap demonstration; it awards nothing and never replaces the real level. */
export function CargoTeaching({ learning, onHear, onPlay }: { learning: boolean; onHear: () => void; onPlay: () => void }) {
  const reduced = useReducedMotion(), [demo] = useState(() => new Animated.Value(0)), [replay, setReplay] = useState(0), [phase, setPhase] = useState(0);
  useEffect(() => {
    demo.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(demo, { toValue: 1, duration: 5000, useNativeDriver: nativeDriver });
    if (!reduced) animation.start();
    const timers = reduced ? [] : [0, 1200, 2400, 3000].map((ms, i) => setTimeout(() => setPhase(i), ms));
    return () => { animation.stop(); timers.forEach(clearTimeout); };
  }, [demo, reduced, replay]);
  return <View style={{ alignItems: "center", gap: 14 }}><CargoCaptain size={90}/><Heading style={{ textAlign: "center" }}>{learning ? "Make the sum. Sail twice!" : "Pack it. Drop it. Sail!"}</Heading>
    <View testID="cargo-demo" style={{ width: 288, height: 150, backgroundColor: "#1E4755", borderRadius: 18, overflow: "hidden" }}>
      {!reduced && phase < 3 && [0, 1, 2, 7, 8].map(c => <View key={c} style={{ position: "absolute", left: c * 32, top: 92 }}><CargoTile kind="crate" value={learning ? 1 : 0}/></View>)}
      {!reduced && phase < 3 && <Animated.View style={{ position: "absolute", left: 96, top: 0, flexDirection: "row", transform: [{ translateX: demo.interpolate({ inputRange: [0, .12, .24, 1], outputRange: [-64, -64, 0, 0] }) }, { translateY: demo.interpolate({ inputRange: [0, .4, .43, 1], outputRange: [6, 6, 92, 92] }) }] }}>{[0, 1, 2, 3].map(i => <CargoTile key={i} kind="coconut" value={learning ? 1 : 0}/>)}</Animated.View>}
      {(reduced || phase === 3) && <Animated.View style={{ position: "absolute", top: 70, transform: [{ translateX: reduced ? 96 : demo.interpolate({ inputRange: [0, .6, 1], outputRange: [96, 96, 290] }) }] }}><CargoCanoe size={100}/></Animated.View>}
    </View>
    <Copy style={{ textAlign: "center" }}>{learning ? "Nine parcels of 1 make 9. A full row always sails; matching the target sends a bonus canoe." : ["Slide the bundle over the open spaces.", "The rope outline shows where it will land.", "Hard drop lands now. A full row sails away.", "Now pack a real hold. Send four canoes!"][reduced ? 3 : phase]}</Copy>
    <Copy style={{ textAlign: "center" }}>Tap the board to turn. Drag sideways to slide. Pull down slowly and hold to fall faster; flick down to land. Tap Hold to save a bundle. The buttons work too.</Copy>
    {learning && <Copy style={{ textAlign: "center" }}>No falling clock. Count, then drop when ready.</Copy>}
    <Button quiet onPress={() => { setReplay(n => n + 1); onHear(); }}>Show & tell me again</Button><Button onPress={onPlay}>I’m ready · let’s play</Button>
  </View>;
}
