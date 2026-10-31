import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { Text } from "../../../components/Text";
import { PlayButton } from "../../Input";
import { nativeDriver, useReducedMotion } from "../../../components/motion";
import { Fruit, Hazard, ScrollHero } from "./Art";
import { createFlight, flightStep, flightTransition } from "../fruit-bat-flight/engine";
import { createRun, runStep, runTransition } from "../lagoon-run/engine";
import { PowerIcon } from "../lagoon-run/Art";
import { POWER_LABELS, POWER_SECONDS } from "../lagoon-run/course";
import { mathGate, equation, flightLevels, runLevels, type ScrollGame } from "./content";
const ink = "#29314C";
/** A safe rehearsal driven by the same pure movement rules as the full game. */
export function Rehearsal({ game, onTone, learning = false }: { game: ScrollGame; learning?: boolean; onTone: (key: string) => void }) {
  const bat = game === "fruit-bat-flight", reduced = useReducedMotion(), [motion] = useState(() => new Animated.Value(0)), [duck, setDuck] = useState(false);
  const trajectory = useMemo(() => {
    let flight = flightTransition(createFlight(flightLevels[0], 1), { type: "flap" });
    let run = runTransition(createRun(runLevels[0], 1), { type: "jump" });
    const y: number[] = [], t: number[] = [];
    for (let i = 0; i <= 66; i++) {
      t.push(i / 66); y.push(bat ? (flight.y - .5) * 170 : -(run.jump > 0 ? Math.sin((.55 - run.jump) / .55 * Math.PI) : 0) * 54);
      flight = flightStep(flight, { type: "idle" }, 1 / 60); run = runStep(run, { type: "idle" }, 1 / 60);
    }
    return { y, t };
  }, [bat]);
  useEffect(() => () => motion.stopAnimation(), [motion]);
  function tryMove(down = false) { setDuck(down); motion.stopAnimation(); motion.setValue(0); onTone(down ? "shell-1" : "shell-4"); Animated.timing(motion, { toValue: 1, duration: down ? 600 : 1100, easing: Easing.linear, useNativeDriver: nativeDriver }).start(); }
  if (learning) return <AnswerRehearsal game={game} onTone={onTone}/>;
  return <View style={{ width: "100%", gap: 10 }}><View style={{ height: 150, borderRadius: 25, overflow: "hidden", backgroundColor: bat ? "#263C5C" : "#A6DED9" }}>
    <Animated.View style={{ position: "absolute", left: "28%", top: 55, transform: [{ translateY: reduced ? 0 : duck ? 25 : motion.interpolate({ inputRange: trajectory.t, outputRange: trajectory.y }) }, { scale: 1 }] }}><ScrollHero game={game} size={80} back={!bat} frame={duck ? 12 : undefined}/></Animated.View>
    <View style={{ position: "absolute", left: "66%", top: 56 }}>{bat ? <Fruit size={65}/> : <Hazard kind={duck ? "frond" : "coconut"} size={75}/>}</View>
    <Text style={{ position: "absolute", left: 14, top: 12, color: bat ? "#FFF2CD" : ink, fontWeight: "800" }}>{bat ? "Tap ↑ then glide" : duck ? "↓ Roll under" : "↑ Jump over"}</Text>
  </View><View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}><PlayButton quiet compact onPress={() => tryMove()}>{bat ? "Try a flap ↑" : "Try a jump ↑"}</PlayButton>{!bat && <PlayButton quiet compact onPress={() => tryMove(true)}>Try a roll ↓</PlayButton>}</View>{!bat && <View style={{flexDirection:"row",flexWrap:"wrap",gap:10,justifyContent:"center"}}>{(["magnet","kite","sandals","shield"] as const).map(kind=><View key={kind} style={{flexDirection:"row",alignItems:"center",gap:7,width:145}}><PowerIcon kind={kind} size={38}/><Text style={{color:ink,fontSize:13,flex:1}}>{POWER_LABELS[kind]}{"\n"}{kind==="shield"?"Stops one hit":`${POWER_SECONDS[kind]} seconds`}</Text></View>)}<Text style={{color:ink,fontSize:14,textAlign:"center"}}>Run up ramps. Jump roof gaps or steer off to the sand. Roll in the air to drop.</Text></View>}</View>;
}

function AnswerRehearsal({ game, onTone }: { game: ScrollGame; onTone: (key: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null), bat = game === "fruit-bat-flight", fact = mathGate(42, 1).fact;
  // A stationary safe rehearsal: every choice is explicit, with no clock or lost hearts.
  return <View style={{ gap: 12 }}><Text style={{ color: ink, fontSize: 26, textAlign: "center" }}>{equation(fact)}</Text><Text style={{ color: ink, textAlign: "center" }}>{bat ? "Choose the height of the answer portal." : "Choose the answer lane."}</Text><View style={{ flexDirection: bat ? "column" : "row", gap: 8, justifyContent: "center" }}>{fact.choices.map((n,i) => <View key={n} style={{ flex: bat ? undefined : 1, borderRadius: 18, padding: 8, backgroundColor: selected === n ? "#C4E8D4" : "#E8ECD9" }}><PlayButton quiet compact onPress={() => { setSelected(n); onTone(n === fact.answer ? "clear" : "coral"); }}>{bat ? `${["High", "Middle", "Low"][i]} · ${n}` : `${["Left", "Middle", "Right"][i]} · ${n}`}</PlayButton>{selected === n && <ScrollHero game={game} size={50}/>}</View>)}</View><Text accessibilityLiveRegion="polite" style={{ color: ink, textAlign: "center" }}>{selected === fact.answer ? `${fact.a} + ${fact.b} = ${fact.answer}. ${bat ? "Flap or glide to this portal height." : "Steer into this lane."} You found it!` : selected !== null ? `Count ${fact.a} shells, then ${fact.b} more. Together they make ${fact.answer}. Try ${fact.answer}.` : "Try a choice. Practice here as often as you like."}</Text></View>;
}