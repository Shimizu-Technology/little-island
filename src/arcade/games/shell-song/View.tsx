import { PressControl, PlayButton } from "../../Input";
import React, { memo, useEffect, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, Easing, withSequence, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Button, Copy, Heading } from "../../../components/ui";
import { Icon } from "../../../components/Icon";
import { useReducedMotion } from "../../../components/motion";
import { PictureObject } from "../../../learn/art/Objects";
import { wordAudio } from "../../../learn/kit/reading";
import { Shell } from "../../Art";
import { Hero, HudPill, MiniStars } from "../../Juice";
import { useArcadeLoop, type FrameBudget } from "../../loop";
import { glowingShell, songChunks, noteDuration, songResult, songStep, songTiles, songTransition, type SongInput, type SongState } from "./engine";
import type { ArcadeResult } from "../../types";
import type { OutfitId } from "../../progress";
import { HeartsHud, HitReaction } from "../../LivesHud";
const ShellArt = memo(Shell);
const tick: SongInput = { type: "tick" };
const SingingShell = memo(function SingingShell({ index, lit, cue, size, outfit, wrong }: { index: number; lit: boolean; cue: string; size: number; outfit: OutfitId; wrong: boolean }) {
  const reduced = useReducedMotion(), bounce = useSharedValue(0), notes = useSharedValue(0), shake = useSharedValue(0);
  useEffect(() => { if (wrong && !reduced) shake.value = withSequence(withTiming(-7, { duration: 40 }), withTiming(7, { duration: 50 }), withTiming(-4, { duration: 50 }), withTiming(0, { duration: 60 })); }, [wrong, cue, reduced, shake]);
  useEffect(() => { bounce.value = 0; notes.value = 0; if (lit && !reduced) { bounce.value = withSequence(withTiming(1, { duration: 95 }), withSpring(0, { damping: 8, stiffness: 180 })); notes.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }); } return () => { cancelAnimation(bounce); cancelAnimation(notes); }; }, [lit, cue, reduced, bounce, notes]);
  const style = useAnimatedStyle(() => ({ opacity: wrong ? .65 : 1, transform: [{ translateX: shake.value }, { translateY: -bounce.value * 14 }, { scaleX: 1 + bounce.value * .07 }, { scaleY: 1 - bounce.value * .06 }] }));
  const noteStyle = useAnimatedStyle(() => ({ opacity: reduced ? 1 : 1 - notes.value * .7, transform: [{ translateY: reduced ? 0 : -notes.value * 28 }, { translateX: reduced ? 0 : notes.value * 8 }] }));
  return <View><Animated.View style={style}><ShellArt size={size} index={index} glowing={lit} outfit={outfit}/></Animated.View>{lit && <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 0, top: 0 }, noteStyle]}><Svg width={44} height={58} viewBox="0 0 44 58" accessible={false}><Path d="M14 47V19L32 13V38M14 24L32 18" stroke="#FFE3A3" strokeWidth={4} fill="none"/><Ellipse cx={9} cy={47} rx={7} ry={5} fill="#FFE3A3"/><Ellipse cx={27} cy={38} rx={7} ry={5} fill="#FFE3A3"/><Circle cx={36} cy={5} r={3} fill="#F9BF9F"/></Svg></Animated.View>}</View>;
});
export function SongBoard({ initial, active, helper, outfit, onResult, onTone, onSay, debug, width: arenaWidth, height: availableHeight }: { initial: SongState; active: boolean; helper: boolean; outfit: OutfitId; onResult: (result: ArcadeResult, helped?: boolean) => void; onTone: (tone: string, haptic?: boolean) => void; onSay: (key: string, automatic?: boolean) => boolean; debug?: boolean; width?: number; height?: number }) {
  const [chunks, setChunks] = useState(false), [chunk, setChunk] = useState(0), [chunkPlaying, setChunkPlaying] = useState(false);
  const restartWhole = useRef(false);
  const chunkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heard = useRef(initial.onset);
  const { snapshot: s, dispatch, state, budget } = useArcadeLoop({ initial, reduce: songTransition, step: songStep, input: tick, active: active && !chunks, onFrame: current => {
    // The event clock publishes sound and the glow snapshot in the same animation frame.
    if (current.onset === heard.current) return;
    heard.current = current.onset;
    const note = glowingShell(current);
    if (note === null) return;
    const word = current.level !== "endless" && !!current.level.word;
    if (!(word && onSay(`arcade-phoneme-${songTiles(current)[note]}`, true))) onTone(`shell-${note}`, false);
  } });
  const [manualGlow, setManualGlow] = useState<number | null>(null), [tapCue, setTapCue] = useState(0), [status, setStatus] = useState<{ id: number; text: string } | null>(null);
  const [wrongShell, setWrongShell] = useState<number | null>(null);
  const reported = useRef(false), feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null), reduced = useReducedMotion();
  const window = useWindowDimensions(), width = arenaWidth ?? window.width, arenaHeight = availableHeight ?? window.height - 62, glow = chunks ? null : glowingShell(s), learning = s.level !== "endless" && !!s.level.word, tiles = songTiles(s);
  const noteKey = String(s.onset), showPicture = s.phase === "picture" && manualGlow === null;
  useEffect(() => { if (active && !chunks && state.current.helper !== helper) dispatch({ type: "helper", value: helper }); }, [active, helper, chunks, dispatch, state]);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  useEffect(() => { if (!status) return; const timer = setTimeout(() => { setStatus(null); setWrongShell(null); }, 450); return () => clearTimeout(timer); }, [status]);
  useEffect(() => {
    const result = songResult(s);
    if (!result || !active || reported.current) return;
    const timer = setTimeout(() => { if (!reported.current) { reported.current = true; onResult(result, s.helped); } }, result.cleared ? reduced ? 150 : 700 : 0);
    return () => clearTimeout(timer);
  }, [s, active, onResult, reduced]);
  useEffect(() => {
    if (active) return;
    if (chunkTimer.current) clearTimeout(chunkTimer.current);
    const reset = setTimeout(() => { setManualGlow(null); setChunkPlaying(false); }, 0);
    return () => clearTimeout(reset);
  }, [active]);
  useEffect(() => () => { if (chunkTimer.current) clearTimeout(chunkTimer.current); }, []);
  function playChunk() {
    if (!active || chunkPlaying) return;
    const notes = songChunks(s.pattern)[chunk];
    if (!notes) return;
    setChunkPlaying(true);
    let i = 0;
    const next = () => {
      setManualGlow(notes[i]); setTapCue(n => n+1); onTone(`shell-${notes[i]}`, false);
      chunkTimer.current = setTimeout(() => {
        setManualGlow(null); i++;
        if (i < notes.length) chunkTimer.current = setTimeout(next, 180);
        else setChunkPlaying(false);
      }, Math.max(450, noteDuration(s)));
    };
    next();
  }
  useEffect(() => { if (active && !chunks && restartWhole.current) { restartWhole.current = false; dispatch({ type: "replay" }); } }, [active, chunks, dispatch]);
  function closeChunks() {
    if (chunkTimer.current) clearTimeout(chunkTimer.current);
    setManualGlow(null); setChunkPlaying(false); restartWhole.current = true; setChunks(false);
  }
  function tap(index: number) {
    if (!active || chunks || state.current.phase !== "repeat") return;
    const before = state.current, next = dispatch({ type: "shell", index });
    if (!(learning && onSay(`arcade-phoneme-${tiles[index]}`))) onTone(`shell-${index}`, false);
    setManualGlow(index); setTapCue(n => n + 1);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setManualGlow(null), 220);
    if (next.slips > before.slips) { if (learning) onTone("bump"); setWrongShell(index); setStatus({ id: before.score + next.slips, text: "Once more" }); }
    else if (next.rounds > before.rounds) { onTone("clear"); setStatus({ id: next.score, text: "+ phrase!" }); }
  }
  // The parent arena is the space below the app chrome, not the entire display.
  const wide = width >= 700 && arenaHeight < 440, columns = wide ? s.shells : 3, rows = Math.ceil(s.shells / columns);
  const shellSize = Math.floor(Math.max(54, Math.min(width >= 600 ? rows === 2 ? 148 : 180 : 116, (Math.min(1100, width) - 30) / columns, (arenaHeight - (learning ? 265 : chunks ? 410 : s.level !== "endless" && ["w5", "w6"].includes(s.level.world) ? 300 : 245)) / rows - 30)));
  const twistLabel = s.level === "endless" ? "Growing song" : s.level.twist === "response" ? "New call each round" : s.level.twist === "twins" ? "Twin echoes · play each note twice" : s.level.twist === "finale" ? "Two new notes each round" : "";
  const phase = chunks ? "Short listening phrases" : s.phase === "watch" ? "Watch" : s.phase === "picture" ? "Find the picture" : s.phase === "cleared" ? "Bravo!" : s.phase === "over" ? "Game over" : s.phase === "rest" ? "Again?" : "Your turn";
  return <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: arenaHeight < 440 ? 4 : 10, paddingBottom: 8 }}>
    {!(wide && showPicture) && <View style={{ width: "100%", maxWidth: shellSize * columns + 32, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" }}><HudPill icon={<Icon name="flag" color="#986940"/>}>{learning ? "Sound a word" : s.level === "endless" ? `Pattern ${s.rounds + 1}` : `${Math.min(s.rounds + 1, s.level.rounds)}/${s.level.rounds} tunes`}</HudPill>{!learning && <HeartsHud lives={s.lives}/>}<HudPill><MiniStars stars={s.slips === 0 ? 3 : s.slips <= 1 ? 2 : 1}/></HudPill></View>}
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}><HitReaction hit={s.lives.hit} onTone={onTone}><Hero game="shell-song" size={wide ? 44 : arenaHeight < 650 ? 60 : 68} outfit={outfit} cue={`${s.rounds}-${s.slips}-${s.cursor}`} mood={s.slips && s.cursor === 0 ? "dizzy" : s.cursor || s.rounds ? "happy" : "idle"} active={active}/></HitReaction><View accessibilityLiveRegion="polite" style={{ gap: 4 }}><View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><Heading style={{ color: "#FFF3D4", fontSize: chunks ? 24 : 29, maxWidth: width - 110 }}>{phase}</Heading>{status && <Copy style={{ color: "#FFDB8C", fontSize: 16 }}>{status.text}</Copy>}</View><Copy style={{ color: "#F5E5D9", fontSize: 15 }}>{s.phase === "watch" ? "Follow the glow" : s.phase === "repeat" ? "Play it back · no hurry" : s.phase === "picture" ? "Blend the sounds" : s.phase === "cleared" ? "A beautiful song" : "A fresh song is waiting"}</Copy>{!!twistLabel && <Copy style={{ color: "#F5E5D9", fontSize: 12, maxWidth: width - 120 }}>{twistLabel}</Copy>}</View></View>
    {!showPicture ? <>
      <View accessibilityLabel={`Pattern progress, ${s.cursor} of ${s.pattern.length}`} style={{ flexDirection: "row", gap: 7, justifyContent: "center", flexWrap: "wrap", paddingHorizontal: 16 }}>{s.pattern.map((_, i) => <View key={i} style={{ width: 13, height: 13, borderRadius: i < s.cursor ? 4 : 7, backgroundColor: s.phase === "repeat" && i < s.cursor ? "#FFDB8C" : "#7983AA", borderWidth: 2, borderColor: "#D4D0E0" }}/>)}</View>
      <View style={{ width: "100%", maxWidth: shellSize * columns + 24, alignItems: "center", position: "relative", paddingVertical: 2 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 2, rowGap: 7, maxWidth: shellSize * columns + 24 }}>
          {tiles.map((tile, index) => {
            const lit = glow === index || manualGlow === index, next = learning && helper && s.phase === "repeat" && s.pattern[s.cursor] === index;
            return <PressControl key={index} disabled={!active || chunks || s.phase !== "repeat"} accessibilityRole="button" accessibilityLabel={`Shell ${index + 1}${learning ? `, sound ${tile}` : ""}${next ? ", Helper suggests this shell" : ""}`} accessibilityState={{ disabled: !active || chunks || s.phase !== "repeat", selected: lit }} onPress={() => tap(index)} style={{ width: shellSize, minHeight: shellSize + 30, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: next ? "#FFE5A1" : "transparent", backgroundColor: next ? "#5E658C" : "transparent" }}>
              <SingingShell index={index} size={shellSize - 6} lit={lit} wrong={wrongShell === index} cue={manualGlow === index ? `tap-${tapCue}` : noteKey} outfit={index === 0 ? outfit : "island"}/><Heading style={{ fontSize: learning ? 32 : 23, color: "#403F65", backgroundColor: "#FFF1D5", minWidth: 37, paddingHorizontal: 9, borderRadius: 14, textAlign: "center" }}>{learning ? tile : index + 1}</Heading>
            </PressControl>;
          })}
        </View>
      </View>

    </> : <View style={{ gap: wide ? 5 : 14, alignItems: "center", width: "100%" }}>
      <View style={{ flexDirection: width >= 600 ? "row" : "column", alignItems: "center", gap: width >= 600 ? 6 : 14 }}><Heading style={{ fontSize: wide ? 24 : 38, letterSpacing: wide ? 2 : 5, color: "#FFF0CC" }}>{tiles.join(" · ")}</Heading><PlayButton quiet compact onPress={() => { if (s.level !== "endless" && s.level.word) onSay(wordAudio(s.level.word)); }}>{wide ? "Hear word" : "Hear the blended word"}</PlayButton>{wide && <PlayButton quiet compact onPress={() => dispatch({ type: "show" })}>Help · show the picture</PlayButton>}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>{s.choices.map(word => <PressControl key={word} accessibilityRole="button" accessibilityLabel={`Word picture: ${word}`} disabled={!active} onPress={() => { const next = dispatch({ type: "picture", word }); if (next.phase === "cleared") onTone("clear"); else onTone("bump"); }} style={{ width: Math.min(196, (width - 48) / 3), minHeight: wide ? 84 : width >= 600 ? 190 : 118, padding: 8, backgroundColor: "#FFF4D8", borderRadius: 26, borderWidth: 3, borderColor: s.helped && s.level !== "endless" && s.level.word === word ? "#F8BD54" : "#B9AED1", justifyContent: "center", alignItems: "center" }}><PictureObject name={word} size={wide ? 62 : width >= 600 ? 130 : 78}/></PressControl>)}</View>
      <View accessibilityLiveRegion="polite"><Copy style={{ color: "#FFF3D4", textAlign: "center" }}>{s.helped && s.level !== "endless" ? `Blend it: ${s.level.word}.` : s.slips ? "Try blending the sounds again." : "Which picture?"}</Copy></View>
      {!wide && <PlayButton quiet compact onPress={() => dispatch({ type: "show" })}>Help · show the picture</PlayButton>}
    </View>}
    {s.level !== "endless" && ["w5", "w6"].includes(s.level.world) && !["over", "cleared", "rest"].includes(s.phase) && <View style={{ gap: 6, alignItems: "center", paddingHorizontal: 12 }}>
      <Button quiet compact disabled={!active} onPress={() => { if (chunks) closeChunks(); else { setChunk(0); setChunks(true); setManualGlow(null); } }}>{chunks ? "Back to the whole song" : "Listen in short phrases"}</Button>
      {chunks && <><Copy style={{ color: "#FFF3D4", textAlign: "center", fontSize: 14 }}>Phrase {chunk+1}/{songChunks(s.pattern).length} · notes {chunk*3+1}–{Math.min(s.pattern.length,chunk*3+3)}. Listen again whenever you like, then try the whole song.</Copy><View style={{ flexDirection: "row", gap: 8 }}><Button quiet compact disabled={!active || chunkPlaying} onPress={playChunk}>Listen to this phrase</Button><Button quiet compact disabled={!active || chunkPlaying} onPress={() => setChunk(n => (n+1)%songChunks(s.pattern).length)}>Next phrase</Button></View></>}
    </View>}
    {!chunks && <PlayButton quiet compact icon="refresh" disabled={!active || chunks || s.phase === "cleared" || s.phase === "rest" || s.phase === "over"} onPress={() => { dispatch({ type: "replay" }); onTone("coral"); }}>Listen & watch again</PlayButton>}
    {s.level === "endless" && <Button quiet compact disabled={!active} onPress={() => dispatch({ type: "finish" })}>Finish my free-play song</Button>}
    {debug && <BudgetOverlay budget={budget}/>}
  </View>;
}
export function BudgetOverlay({ budget }: { budget: FrameBudget }) { return <View testID="arcade-budget"><Copy style={{ fontSize: 12, color: "#FFF0CC", backgroundColor: "#29385D", borderRadius: 10, paddingHorizontal: 10 }}>{budget.fps.toFixed(1)} fps · p95 {budget.p95.toFixed(1)} ms / 16.7 ms · {budget.ticks} fixed steps · {budget.dropped.toFixed(2)} s clamped</Copy></View>; }
